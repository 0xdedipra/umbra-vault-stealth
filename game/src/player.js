// The thief: one quiet figure in a dark hood. Movement is the whole moveset — walk,
// run (fast, and your boots announce you in a visible ring of noise), crouch (slow,
// quiet, and low enough to vanish behind a display case). Everything she can touch is
// resolved here as "what is in reach", and the caller decides what it means.

import { COIN_RADIUS, PLAYER } from './config.js';
import { clamp, dist } from './random.js';
import { lightLevelAt, resolveCircle, segmentBlocked } from './lighting.js';
import { footstep } from './audio.js';

export function createPlayer(level) {
  return {
    x: level.start.x,
    y: level.start.y,
    angle: level.start.angle,
    radius: PLAYER.radius,
    crouched: false,
    running: false,
    moving: false,
    coins: 3,
    light: 0,
    exposed: false,
    stepAcc: 0,
    noiseAcc: 0,
    noiseRing: 0, // 0..1 progress of the latest footstep noise pulse, for rendering
    hidden: false,
  };
}

/**
 * Advance the thief one step. `input` is {x, y} unit intent plus run/crouch flags.
 * Returns events the caller cares about: { noise: bool } when a running footfall
 * should ripple out and turn heads.
 */
export function updatePlayer(player, dt, input, level, solids, game) {
  const events = { noise: false };
  player.crouched = input.crouch;
  const mag = Math.hypot(input.x, input.y);
  player.moving = mag > 0.01;
  player.running = player.moving && input.run && !player.crouched;
  if (player.moving) {
    const speed = player.crouched ? PLAYER.crouch : player.running ? PLAYER.run : PLAYER.walk;
    const nx = player.x + (input.x / (mag || 1)) * speed * dt;
    const ny = player.y + (input.y / (mag || 1)) * speed * dt;
    const resolved = resolveCircle(nx, ny, player.radius, solids);
    player.x = resolved.x;
    player.y = resolved.y;
    player.angle = Math.atan2(input.y, input.x);
    // Footsteps: distance per sound shrinks as she slows down.
    player.stepAcc += speed * dt;
    const stride = player.running ? 46 : player.crouched ? 26 : 36;
    if (player.stepAcc > stride) {
      player.stepAcc = 0;
      footstep(player.running ? 'run' : player.crouched ? 'crouch' : 'walk');
    }
    if (player.running) {
      player.noiseAcc += dt;
      if (player.noiseAcc >= 0.34) {
        player.noiseAcc = 0;
        player.noiseRing = 0.0001;
        events.noise = true;
      }
    }
  }
  if (player.noiseRing > 0) {
    player.noiseRing += dt / 0.55;
    if (player.noiseRing >= 1) player.noiseRing = 0;
  }
  player.light = lightLevelAt(level, player.x, player.y);
  player.exposed = player.light > 0.52 && !player.crouched;
  return events;
}

/** Is the thief's body hidden from `gx, gy` by low cover while crouched? (For prompts.) */
export function hiddenByLowCover(player, gx, gy, low) {
  if (!player.crouched) return false;
  return segmentBlocked(gx, gy, player.x, player.y, low);
}

/** The nearest thing E can mean here: a case to rob, a guard to silence, a panel. */
export function nearestInteract(player, level, guards, game) {
  let best = null;
  const consider = (kind, x, y, label, extra) => {
    const d = dist(player.x, player.y, x, y);
    if (d < PLAYER.interactRange + 14 && (!best || d < best.d)) best = { kind, x, y, label, d, ...extra };
  };
  for (const c of level.cases) {
    if (c.taken) continue;
    consider('steal', c.x + c.w / 2, c.y + c.h / 2, `E — steal the ${c.name}`, { target: c });
  }
  for (const g of guards) {
    if (g.asleep) continue;
    const d = dist(player.x, player.y, g.x, g.y);
    if (d < PLAYER.takedownRange) {
      // Behind him: he faces `g.angle`; the thief must be in his rear arc.
      const toPlayer = Math.atan2(player.y - g.y, player.x - g.x);
      let da = Math.atan2(Math.sin(toPlayer - g.angle), Math.cos(toPlayer - g.angle));
      if (Math.abs(da) > 2.2 && g.state !== 'alert') {
        consider('takedown', g.x, g.y, 'E — silent takedown', { target: g });
      }
    }
  }
  if (level.panel && game.camerasDisabled <= 0) {
    const p = level.panel;
    consider('panel', p.x + p.w / 2, p.y + p.h / 2, 'E — disable the cameras (20s)', { target: p });
  }
  const e = level.exit;
  if (player.x > e.x - 6 && player.x < e.x + e.w + 6 && player.y > e.y - 6 && player.y < e.y + e.h + 6) {
    const targetCase = level.cases.find((c) => c.target);
    best = {
      kind: 'exit',
      x: e.x + e.w / 2,
      y: e.y + e.h / 2,
      d: 0,
      label: targetCase && !targetCase.taken ? 'The target is still in its case…' : 'E — slip out into the night',
      ready: Boolean(targetCase && targetCase.taken),
    };
  }
  return best;
}

export { COIN_RADIUS, clamp };
