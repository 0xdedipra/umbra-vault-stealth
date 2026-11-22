// UMBRA VAULT — boot, the loop, and every rule that lives between systems: loading a
// floor, reading the keyboard, stealing, takedowns, the camera panel, coins, the
// alarm's hunt, being caught, and the tally at each door. The simulation runs in
// fixed steps; rendering paints whatever the last step left behind.
//
// ?shot=title|cover|vault|alert stages a deterministic scene for screenshots.

import { ALARM, CAMERA, COINS_PER_FLOOR, COIN_RADIUS, COLORS, PLAYER, STEP, VIEW } from './config.js';
import { LEVELS, allSolids, lowCover, tallSolids } from './levels.js';
import { conePolygon, drawConeTint, drawDarkness } from './lighting.js';
import { attractGuards, createGuards, guardStep, updateGuards } from './guards.js';
import { createPlayer, nearestInteract, updatePlayer } from './player.js';
import { createCameras, createLasers, updateCameras, updateLasers } from './cameras.js';
import * as sfx from './audio.js';
import { buildStaticLayer, drawCameras, drawCoin, drawExit, drawGuard, drawLasers, drawPlayer, drawTakenCases } from './render.js';
import { drawCaught, drawFloorClear, drawGameClear, drawHUD, drawIntro, drawPause, drawTitle } from './hud.js';
import { GUARD } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');

/* ---------------------------------- game state --------------------------------- */

const game = {
  screen: 'title', // title | intro | play | pause | caught | floorclear | gameclear
  floorIndex: 0,
  level: null,
  staticLayer: null,
  player: null,
  guards: [],
  cameras: [],
  lasers: [],
  tall: [],
  low: [],
  solids: [],
  time: 0,
  floorTime: 0,
  introTimer: 0,
  caughtTimer: 0,
  alarm: 0,
  worstMeter: 0,
  anyAlertSight: false,
  caught: false,
  loot: 0,
  floorLoot: 0,
  spotted: 0,
  floorSpotted: 0,
  wasAlert: false,
  camerasDisabled: 0,
  cameraHeat: 0,
  laserTripAt: null,
  coin: null,
  prompt: '',
  heartbeatAcc: 0,
  totals: { loot: 0, time: 0, spotted: 0 },
  lastStats: null,
};

function loadFloor(index) {
  game.floorIndex = index;
  game.level = JSON.parse(JSON.stringify(LEVELS[index]));
  game.staticLayer = buildStaticLayer(game.level, index);
  game.player = createPlayer(game.level);
  game.player.coins = COINS_PER_FLOOR;
  game.guards = createGuards(game.level);
  game.cameras = createCameras(game.level, tallSolids(game.level));
  game.lasers = createLasers(game.level);
  game.tall = tallSolids(game.level);
  game.low = lowCover(game.level);
  game.solids = allSolids(game.level);
  game.alarm = 0;
  game.worstMeter = 0;
  game.caught = false;
  game.floorLoot = 0;
  game.floorSpotted = 0;
  game.floorTime = 0;
  game.camerasDisabled = 0;
  game.coin = null;
  game.wasAlert = false;
  game.screen = 'intro';
  game.introTimer = 3.0;
}

function completeFloor() {
  const level = game.level;
  const target = level.cases.find((c) => c.target);
  const allLoot = level.cases.every((c) => c.taken);
  const ghost = game.floorSpotted === 0;
  const stars = (target && target.taken ? 1 : 0) + (allLoot ? 1 : 0) + (ghost ? 1 : 0);
  game.lastStats = {
    stars,
    floorLoot: game.floorLoot,
    time: game.floorTime,
    spotted: game.floorSpotted,
    ghost,
  };
  game.totals.loot = game.loot;
  game.totals.time += game.floorTime;
  game.totals.spotted += game.floorSpotted;
  game.screen = 'floorclear';
  sfx.setAlarmTone(false);
}

function restartFloor() {
  game.loot -= game.floorLoot;
  loadFloor(game.floorIndex);
}

/* ------------------------------------ input ------------------------------------ */

const keys = new Set();
const pressed = new Set();
let mouse = { x: VIEW.width / 2, y: VIEW.height / 2 };

addEventListener('keydown', (e) => {
  sfx.unlockAudio();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
});
addEventListener('keyup', (e) => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse = {
    x: ((e.clientX - rect.left) / rect.width) * VIEW.width,
    y: ((e.clientY - rect.top) / rect.height) * VIEW.height,
  };
});
canvas.addEventListener('mousedown', () => sfx.unlockAudio());

function inputVector() {
  let x = 0;
  let y = 0;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  return {
    x,
    y,
    run: keys.has('ShiftLeft') || keys.has('ShiftRight'),
    crouch: keys.has('KeyC') || keys.has('ControlLeft') || keys.has('ControlRight'),
  };
}

/* ---------------------------------- simulation --------------------------------- */

function stepPlay(dt) {
  game.time += dt;
  game.floorTime += dt;
  const player = game.player;
  const level = game.level;

  const events = updatePlayer(player, dt, inputVector(), level, game.solids, game);
  if (events.noise) attractGuards(game.guards, player.x, player.y, PLAYER.noiseRadius);

  updateGuards(game.guards, dt, game.time, player, level, game.tall, game.low, game.solids, game);
  for (const g of game.guards) {
    if (g.footDist) {
      g.footDist = false;
      guardStep(Math.hypot(g.x - player.x, g.y - player.y));
    }
  }

  if (game.camerasDisabled > 0) game.camerasDisabled -= dt;
  updateCameras(game.cameras, dt, game.time, player, game.tall, game.camerasDisabled > 0, game);
  updateLasers(game.lasers, game.time, player, game);
  if (game.laserTripAt) {
    attractGuards(game.guards, game.laserTripAt.x, game.laserTripAt.y, 200);
    game.laserTripAt = null;
  }

  // The alarm, once full, sends every awake guard to the thief's last position.
  if (game.alarm >= 1) {
    game.alarm = 0.82;
    for (const g of game.guards) {
      if (g.asleep) continue;
      g.state = 'alert';
      g.meter = 1;
      g.lastSeen = { x: player.x, y: player.y };
      g.memory = 6;
    }
  } else if (!game.anyAlertSight && game.cameraHeat <= 0) {
    game.alarm = Math.max(0, game.alarm - ALARM.decayPerSecond * dt);
  }
  game.cameraHeat = Math.max(0, game.cameraHeat - dt);

  const anyAlert = game.guards.some((g) => g.state === 'alert' && !g.asleep);
  if (anyAlert && !game.wasAlert) {
    game.floorSpotted += 1;
    game.wasAlert = true;
  } else if (!anyAlert) {
    game.wasAlert = false;
  }
  sfx.setAlarmTone(game.alarm > 0.4 || anyAlert);

  if (game.worstMeter > 0.55) {
    game.heartbeatAcc += dt;
    if (game.heartbeatAcc > 0.85) {
      game.heartbeatAcc = 0;
      sfx.heartbeat(game.worstMeter);
    }
  }

  // The thrown coin.
  if (game.coin) {
    const coin = game.coin;
    if (coin.flying) {
      coin.t += dt / 0.45;
      if (coin.t >= 1) {
        coin.flying = false;
        coin.landedAt = game.time;
        sfx.coinClink();
        attractGuards(game.guards, coin.tx, coin.ty, COIN_RADIUS);
      }
    } else if (game.time - coin.landedAt > 4) {
      game.coin = null;
    }
  }

  // What E would do right now (also drives the prompt).
  const act = nearestInteract(player, level, game.guards, game);
  game.prompt = act ? act.label : '';
  if (pressed.has('KeyE') && act) {
    if (act.kind === 'steal') {
      act.target.taken = true;
      game.loot += act.target.value;
      game.floorLoot += act.target.value;
      sfx.caseChime();
    } else if (act.kind === 'takedown') {
      act.target.asleep = true;
      act.target.cone = null;
      sfx.takedownThud();
    } else if (act.kind === 'panel') {
      game.camerasDisabled = CAMERA.disableSeconds;
      sfx.panelBeep(true);
    } else if (act.kind === 'exit') {
      completeFloor();
      return;
    }
  }
  if (pressed.has('KeyF') && player.coins > 0 && !game.coin) {
    player.coins -= 1;
    game.coin = { x: player.x, y: player.y, tx: mouse.x, ty: mouse.y, t: 0, flying: true, landedAt: 0 };
  }
  if (pressed.has('KeyR')) restartFloor();
  if (game.caught) {
    game.screen = 'caught';
    game.caughtTimer = 1.6;
    sfx.setAlarmTone(false);
  }
}

function step(dt) {
  switch (game.screen) {
    case 'title':
      game.time += dt;
      if (pressed.has('Enter')) {
        game.loot = 0;
        game.totals = { loot: 0, time: 0, spotted: 0 };
        loadFloor(0);
      }
      break;
    case 'intro':
      game.time += dt;
      game.introTimer -= dt;
      if (game.introTimer <= 0 || pressed.has('Enter')) game.screen = 'play';
      break;
    case 'play':
      if (pressed.has('KeyP')) { game.screen = 'pause'; break; }
      stepPlay(dt);
      break;
    case 'pause':
      if (pressed.has('KeyP') || pressed.has('Enter')) game.screen = 'play';
      if (pressed.has('KeyR')) restartFloor();
      break;
    case 'caught':
      game.time += dt;
      game.caughtTimer -= dt;
      if (game.caughtTimer <= 0) restartFloor();
      break;
    case 'floorclear':
      if (pressed.has('Enter')) {
        if (game.floorIndex + 1 < LEVELS.length) loadFloor(game.floorIndex + 1);
        else game.screen = 'gameclear';
      }
      break;
    case 'gameclear':
      if (pressed.has('Enter')) game.screen = 'title';
      break;
    default:
      break;
  }
  if (pressed.has('KeyM')) sfx.setMuted(!sfx.isMuted());
  pressed.clear();
}

/* ----------------------------------- rendering ---------------------------------- */

function render() {
  const level = game.level;
  if (game.screen === 'title' || !level) {
    drawTitle(ctx, game.time);
    return;
  }
  ctx.drawImage(game.staticLayer, 0, 0);
  drawTakenCases(ctx, level);

  const guardCones = game.guards.filter((g) => !g.asleep && g.cone).map((g) => g.cone);
  const camCones = game.camerasDisabled > 0 ? [] : game.cameras.filter((c) => c.poly).map((c) => c.poly);
  drawDarkness(ctx, level, guardCones, camCones, game.time);

  drawExit(ctx, level, game.time);
  drawLasers(ctx, game.lasers, game.time);
  if (game.camerasDisabled <= 0) {
    for (const cam of game.cameras) {
      if (cam.poly) drawConeTint(ctx, cam.poly, COLORS.coneRed, cam.seesPlayer ? 0.22 : 0.10);
    }
  }
  for (const g of game.guards) {
    if (!g.asleep && g.cone) {
      const alpha = g.state === 'alert' ? 0.25 : g.state === 'suspicious' ? 0.21 : 0.16;
      drawConeTint(ctx, g.cone, COLORS.coneWarm, alpha);
    }
  }
  drawCameras(ctx, game.cameras, game.camerasDisabled > 0, game.time);
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  drawCoin(ctx, game.coin, game.time);
  drawPlayer(ctx, game.player, game.time);
  drawHUD(ctx, game, level, game.player);

  if (game.screen === 'intro') drawIntro(ctx, level, game.floorIndex);
  else if (game.screen === 'pause') drawPause(ctx);
  else if (game.screen === 'caught') drawCaught(ctx, game.time);
  else if (game.screen === 'floorclear') drawFloorClear(ctx, game, level, game.lastStats);
  else if (game.screen === 'gameclear') drawGameClear(ctx, game, game.totals);
}

/* ------------------------------- screenshot staging ----------------------------- */

function stageShot(name) {
  game.time = 0.5;
  if (name === 'title') {
    game.screen = 'title';
    return;
  }
  if (name === 'vault') {
    loadFloor(2);
    game.screen = 'play';
    const p = game.player;
    p.x = 905; p.y = 272; p.angle = 0.4; p.crouched = false;
    const [g1, g2, g3] = game.guards;
    g1.x = 430; g1.y = 470; g1.angle = Math.PI;
    g2.x = 700; g2.y = 330; g2.angle = Math.PI / 2;
    g3.x = 1090; g3.y = 480; g3.angle = Math.PI;
    for (const g of game.guards) {
      g.frozen = true;
      g.cone = conePolygon(g.x, g.y, g.angle, GUARD.coneHalfAngle, GUARD.coneRange, game.tall.concat(game.low));
    }
    for (const cam of game.cameras) {
      cam.angle = cam.base + Math.sin(0.5 * cam.speed) * cam.sweep;
      cam.poly = conePolygon(cam.x, cam.y, cam.angle, CAMERA.halfAngle, CAMERA.range, game.tall, 0.06);
    }
    game.loot = 2400;
    game.level.cases[4].taken = true;
    game.level.cases[3].taken = true;
    game.floorLoot = 2400;
    return;
  }
  if (name === 'alert') {
    loadFloor(0);
    game.screen = 'play';
    const p = game.player;
    p.x = 716; p.y = 346; p.angle = Math.PI; p.crouched = true;
    const [g1, g2] = game.guards;
    g2.x = 500; g2.y = 300; g2.angle = 0.6; g2.asleep = true;
    g1.x = 428; g1.y = 336; g1.angle = Math.atan2(300 - 336, 500 - 428);
    g1.state = 'suspicious';
    g1.meter = 0.8;
    g1.frozen = true;
    g1.cone = conePolygon(g1.x, g1.y, g1.angle, GUARD.coneHalfAngle, GUARD.coneRange, game.tall.concat(game.low));
    game.worstMeter = 0.8;
    game.alarm = 0.3;
    game.prompt = '';
    return;
  }
  // cover (default): Floor 1, centre frame — the thief crouched in the gold mask
  // case's shadow on its own carpet while a flashlight sweeps the carpet and
  // breaks on the case; the second guard works the far corner, EXIT in frame.
  loadFloor(0);
  game.screen = 'play';
  const p = game.player;
  p.x = 688; p.y = 384; p.angle = Math.atan2(346 - 384, 640 - 688); p.crouched = true;
  const [g1, g2] = game.guards;
  g1.x = 470; g1.y = 250; g1.angle = Math.atan2(346 - 250, 640 - 470);
  g1.meter = 0.55;
  g1.frozen = true;
  g1.cone = conePolygon(g1.x, g1.y, g1.angle, GUARD.coneHalfAngle, GUARD.coneRange, game.tall.concat(game.low));
  g2.x = 452; g2.y = 636; g2.angle = Math.atan2(700 - 636, 92 - 452);
  g2.frozen = true;
  g2.cone = conePolygon(g2.x, g2.y, g2.angle, GUARD.coneHalfAngle, GUARD.coneRange, game.tall.concat(game.low));
  game.worstMeter = 0.55;
  game.level.cases[1].taken = true; // the emerald is already hers
  game.loot = 2200;
  game.floorLoot = 2200;
  game.prompt = 'E — steal the Topeng Emas Kartika';
}

/* -------------------------------------- loop ------------------------------------ */

let last = performance.now();
let acc = 0;

function frame(now) {
  let delta = (now - last) / 1000;
  last = now;
  if (delta > 0.25) delta = 0.25;
  acc += delta;
  while (acc >= STEP) {
    step(STEP);
    acc -= STEP;
  }
  render();
  requestAnimationFrame(frame);
}

if (shotName) {
  stageShot(shotName);
  render();
  requestAnimationFrame(() => {
    render();
    window.__shotReady = true;
  });
} else {
  loadFloor(0);
  game.screen = 'title';
  requestAnimationFrame(frame);
}
