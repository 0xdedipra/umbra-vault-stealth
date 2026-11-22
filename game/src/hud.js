// Everything that is not the world: the HUD (the great detection EYE, the alarm bar,
// loot, coins, the shadow readout), and the screens — a title over the museum facade
// at night, floor intro cards, pause, the caught flash, and the tally screens that
// grade each floor with stars and a GHOST bonus for a thief who was never truly seen.

import { COLORS, CONTROLS_TEXT, VIEW } from './config.js';
import { clamp } from './random.js';

const FONT = 'system-ui, -apple-system, sans-serif';

function money(v) {
  return '$' + v.toLocaleString('en-US');
}

export function drawEye(ctx, x, y, fill, alert) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(6,8,16,0.72)';
  ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = alert ? '#ff4040' : 'rgba(220,230,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  // The eye outline.
  ctx.beginPath();
  ctx.moveTo(-17, 0);
  ctx.quadraticCurveTo(0, -13, 17, 0);
  ctx.quadraticCurveTo(0, 13, -17, 0);
  ctx.closePath();
  ctx.fillStyle = 'rgba(230,238,255,0.92)';
  ctx.fill();
  // The iris fills with colour as the worst meter climbs.
  const r = 3 + fill * 5.5;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = fill >= 1 ? '#ff2020' : fill >= 0.34 ? '#ff9d2e' : '#7fb2d9';
  ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
  ctx.fillStyle = '#0a0d16';
  ctx.fill();
  ctx.restore();
}

export function drawHUD(ctx, game, level, player) {
  const W = VIEW.width;
  ctx.save();
  // Top-left: where you are, and what you came for.
  ctx.fillStyle = 'rgba(6,8,16,0.66)';
  ctx.fillRect(14, 12, 372, 64);
  ctx.strokeStyle = 'rgba(201,162,77,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 12, 372, 64);
  ctx.fillStyle = COLORS.gold;
  ctx.font = `bold 17px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(level.name, 26, 36);
  ctx.fillStyle = 'rgba(225,232,245,0.85)';
  ctx.font = `13px ${FONT}`;
  const target = level.cases.find((c) => c.target);
  ctx.fillText(target && !target.taken ? `Steal the ${target.name}` : 'Target secured — reach the EXIT', 26, 58);
  ctx.fillStyle = 'rgba(225,232,245,0.6)';
  ctx.font = `11px ${FONT}`;
  ctx.fillText(level.sub, 26, 72);

  // Top-centre: the EYE and the building alarm under it.
  drawEye(ctx, W / 2, 42, game.worstMeter, game.worstMeter >= 1);
  ctx.fillStyle = 'rgba(6,8,16,0.66)';
  ctx.fillRect(W / 2 - 90, 74, 180, 10);
  ctx.fillStyle = game.alarm > 0.66 ? '#ff4040' : game.alarm > 0.25 ? '#ffb84d' : '#5e7292';
  ctx.fillRect(W / 2 - 89, 75, 178 * clamp(game.alarm, 0, 1), 8);
  ctx.fillStyle = 'rgba(225,232,245,0.75)';
  ctx.font = `10px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('ALARM', W / 2, 96);

  // Top-right: the take, the tools, and whether the light betrays you.
  ctx.fillStyle = 'rgba(6,8,16,0.66)';
  ctx.fillRect(W - 246, 12, 232, 64);
  ctx.strokeStyle = 'rgba(201,162,77,0.5)';
  ctx.strokeRect(W - 246, 12, 232, 64);
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.gold;
  ctx.font = `bold 19px ${FONT}`;
  ctx.fillText(money(game.loot), W - 28, 39);
  ctx.font = `12px ${FONT}`;
  ctx.fillStyle = 'rgba(225,232,245,0.85)';
  ctx.fillText(`Coins: ${player.coins}`, W - 28, 58);
  ctx.fillStyle = player.exposed ? '#ffb84d' : '#7fd6a8';
  ctx.font = `bold 11px ${FONT}`;
  ctx.fillText(player.crouched ? 'CROUCHED — LOW' : player.exposed ? 'EXPOSED IN THE LIGHT' : 'IN SHADOW', W - 28, 72);

  // Bottom-centre: the contextual prompt.
  if (game.prompt) {
    ctx.font = `bold 15px ${FONT}`;
    const w = ctx.measureText(game.prompt).width + 34;
    ctx.fillStyle = 'rgba(6,8,16,0.78)';
    ctx.fillRect(W / 2 - w / 2, VIEW.height - 52, w, 32);
    ctx.strokeStyle = 'rgba(201,162,77,0.6)';
    ctx.strokeRect(W / 2 - w / 2, VIEW.height - 52, w, 32);
    ctx.fillStyle = '#ffe9a8';
    ctx.textAlign = 'center';
    ctx.fillText(game.prompt, W / 2, VIEW.height - 31);
  }

  // Camera-disabled countdown.
  if (game.camerasDisabled > 0) {
    ctx.fillStyle = '#7dffb0';
    ctx.font = `bold 13px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(`CAMERAS DARK — ${Math.ceil(game.camerasDisabled)}s`, W / 2, 122);
  }
  ctx.restore();
}

/* ----------------------------------- screens ----------------------------------- */

function veil(ctx, alpha) {
  ctx.fillStyle = `rgba(4,6,14,${alpha})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function centred(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, y);
}

export function drawTitle(ctx, time) {
  // The museum facade at night: columns, a pediment, lit windows, the moon.
  const g = ctx.createLinearGradient(0, 0, 0, VIEW.height);
  g.addColorStop(0, '#070b1c');
  g.addColorStop(0.7, '#0d1430');
  g.addColorStop(1, '#05070f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#e8eef7';
  ctx.beginPath(); ctx.arc(1090, 120, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#070b1c';
  ctx.beginPath(); ctx.arc(1078, 112, 30, 0, Math.PI * 2); ctx.fill();
  const fx = 340;
  const fw = 600;
  const fy = 300;
  ctx.fillStyle = '#1a2138';
  ctx.fillRect(fx, fy, fw, 300);
  ctx.beginPath();
  ctx.moveTo(fx - 30, fy);
  ctx.lineTo(fx + fw / 2, fy - 90);
  ctx.lineTo(fx + fw + 30, fy);
  ctx.closePath();
  ctx.fillStyle = '#232c4a';
  ctx.fill();
  ctx.fillStyle = '#131a2e';
  for (let i = 0; i < 6; i += 1) ctx.fillRect(fx + 36 + i * 96, fy + 20, 34, 280);
  ctx.fillStyle = `rgba(255,201,92,${0.75 + 0.2 * Math.sin(time * 1.7)})`;
  for (const [wx, wy] of [[430, 380], [620, 380], [810, 380]]) ctx.fillRect(wx, wy, 26, 38);
  ctx.fillStyle = '#0a0e1c';
  ctx.fillRect(0, 600, VIEW.width, 200);
  ctx.fillStyle = 'rgba(127,178,217,0.12)';
  ctx.fillRect(0, 600, VIEW.width, 3);

  centred(ctx, 'U M B R A   V A U L T', 158, `bold 64px ${FONT}`, '#e8b64c');
  centred(ctx, 'One night. Three floors. The Kartika collection.', 196, `17px ${FONT}`, 'rgba(225,232,245,0.9)');
  centred(ctx, 'Slip through the night museum unseen — take the mask, the orchid and the crown,', 440, `15px ${FONT}`, 'rgba(225,232,245,0.8)');
  centred(ctx, 'and never let the light, the lenses or the laser silk know your name.', 464, `15px ${FONT}`, 'rgba(225,232,245,0.8)');
  let y = 512;
  ctx.font = `13.5px ${FONT}`;
  for (const line of CONTROLS_TEXT) {
    centred(ctx, line, y, `13.5px ${FONT}`, 'rgba(200,212,235,0.75)');
    y += 21;
  }
  const pulse = 0.7 + 0.3 * Math.sin(time * 3);
  ctx.globalAlpha = pulse;
  centred(ctx, '— PRESS ENTER TO BEGIN THE NIGHT —', 688, `bold 17px ${FONT}`, '#ffe9a8');
  ctx.globalAlpha = 1;
}

export function drawIntro(ctx, level, floorIndex) {
  veil(ctx, 0.55);
  centred(ctx, `FLOOR ${floorIndex + 1} OF 3`, 320, `bold 15px ${FONT}`, 'rgba(201,162,77,0.9)');
  centred(ctx, level.name, 366, `bold 44px ${FONT}`, '#e8eef7');
  centred(ctx, level.sub, 396, `15px ${FONT}`, 'rgba(225,232,245,0.75)');
  const words = level.intro.split(' ');
  let line = '';
  let y = 448;
  ctx.font = `15px ${FONT}`;
  for (const word of words) {
    if (ctx.measureText(line + word).width > 640 && line) {
      centred(ctx, line, y, `15px ${FONT}`, 'rgba(225,232,245,0.88)');
      y += 24;
      line = '';
    }
    line += word + ' ';
  }
  centred(ctx, line, y, `15px ${FONT}`, 'rgba(225,232,245,0.88)');
}

export function drawPause(ctx) {
  veil(ctx, 0.72);
  centred(ctx, 'PAUSED', 330, `bold 40px ${FONT}`, '#e8eef7');
  centred(ctx, 'The museum holds its breath.', 372, `15px ${FONT}`, 'rgba(225,232,245,0.8)');
  centred(ctx, 'P — resume · R — restart floor · M — mute', 420, `14px ${FONT}`, 'rgba(200,212,235,0.7)');
}

export function drawCaught(ctx, time) {
  ctx.fillStyle = `rgba(160,10,10,${0.25 + 0.12 * Math.sin(time * 10)})`;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  centred(ctx, 'CAUGHT', 380, `bold 58px ${FONT}`, '#ff5a5a');
  centred(ctx, 'Hands close on your shoulders in the dark…', 424, `16px ${FONT}`, 'rgba(255,220,220,0.9)');
}

function stars(ctx, cx, cy, count) {
  ctx.font = '34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = i < count ? '#e8b64c' : 'rgba(220,228,245,0.25)';
    ctx.fillText('★', cx + (i - 1) * 46, cy);
  }
}

export function drawFloorClear(ctx, game, level, stats) {
  veil(ctx, 0.78);
  centred(ctx, `${level.name} — CLEANED OUT`, 250, `bold 32px ${FONT}`, '#e8eef7');
  stars(ctx, VIEW.width / 2, 312, stats.stars);
  ctx.font = `16px ${FONT}`;
  ctx.fillStyle = 'rgba(225,232,245,0.92)';
  ctx.textAlign = 'center';
  const lines = [
    `Loot taken: ${money(stats.floorLoot)}`,
    `Time: ${stats.time.toFixed(0)}s · Times fully spotted: ${stats.spotted}`,
    stats.ghost ? 'GHOST — never truly seen. Bonus star earned.' : 'The alarm remembers you, a little.',
  ];
  let y = 366;
  for (const line of lines) {
    ctx.fillText(line, VIEW.width / 2, y);
    y += 28;
  }
  centred(ctx, '— PRESS ENTER —', y + 26, `bold 15px ${FONT}`, '#ffe9a8');
}

export function drawGameClear(ctx, game, totals) {
  veil(ctx, 0.85);
  centred(ctx, 'THE NIGHT IS YOURS', 240, `bold 42px ${FONT}`, '#e8b64c');
  centred(ctx, 'Dawn finds the Kartika cases empty and the museum none the wiser.', 282, `16px ${FONT}`, 'rgba(225,232,245,0.9)');
  centred(ctx, `Total haul: ${money(totals.loot)}`, 348, `bold 22px ${FONT}`, '#ffe9a8');
  centred(ctx, `Total time: ${totals.time.toFixed(0)}s · Times fully spotted: ${totals.spotted}`, 384, `15px ${FONT}`, 'rgba(225,232,245,0.85)');
  centred(ctx, totals.spotted === 0 ? 'A perfect ghost. Not one guard can describe you.' : 'The city will whisper about the Umbra Vault.', 414, `15px ${FONT}`, 'rgba(225,232,245,0.85)');
  centred(ctx, '— PRESS ENTER TO PLAY AGAIN —', 486, `bold 15px ${FONT}`, '#ffe9a8');
}
