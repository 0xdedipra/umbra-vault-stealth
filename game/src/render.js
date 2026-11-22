// The museum itself, drawn to be read at a glance: marble with a sheen and speckled
// veins, carpets with woven borders, glass cases whose artefacts are little paintings
// in their own right, palms, benches, rope barriers, the green breathing glow of the
// EXIT. The static layer is painted once per floor onto an offscreen canvas; every
// frame then adds only what moves — lasers, cones, people, light.

import { COLORS, VIEW } from './config.js';
import { mulberry32, range } from './random.js';
import { laserState } from './cameras.js';

/* ------------------------------ artefact miniatures ----------------------------- */

function drawArtefact(ctx, kind, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 40, s / 40);
  ctx.lineWidth = 2;
  switch (kind) {
    case 'mask':
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 16, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#7a5210';
      ctx.beginPath(); ctx.ellipse(-5, -3, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.ellipse(5, -3, 2.6, 1.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#7a5210'; ctx.beginPath(); ctx.arc(0, 5, 5, 0.3, Math.PI - 0.3); ctx.stroke();
      break;
    case 'crown':
      ctx.fillStyle = '#f2c14e';
      ctx.beginPath();
      ctx.moveTo(-14, 8); ctx.lineTo(-14, -6); ctx.lineTo(-7, 2); ctx.lineTo(0, -10); ctx.lineTo(7, 2); ctx.lineTo(14, -6); ctx.lineTo(14, 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#c22f4e';
      ctx.beginPath(); ctx.arc(0, 3, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f7fc2';
      ctx.beginPath(); ctx.arc(-9, 3, 2.2, 0, Math.PI * 2); ctx.arc(9, 3, 2.2, 0, Math.PI * 2); ctx.fill();
      break;
    case 'emerald':
    case 'gem':
      ctx.fillStyle = kind === 'emerald' ? '#2fd67a' : '#e2543e';
      ctx.beginPath();
      ctx.moveTo(0, -13); ctx.lineTo(10, -4); ctx.lineTo(6, 12); ctx.lineTo(-6, 12); ctx.lineTo(-10, -4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(0, 12); ctx.moveTo(-10, -4); ctx.lineTo(10, -4); ctx.stroke();
      break;
    case 'diamond':
      ctx.fillStyle = '#bfe8ff';
      ctx.beginPath();
      ctx.moveTo(-12, -4); ctx.lineTo(-5, -11); ctx.lineTo(5, -11); ctx.lineTo(12, -4); ctx.lineTo(0, 13); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,130,190,0.9)'; ctx.beginPath(); ctx.moveTo(-12, -4); ctx.lineTo(12, -4); ctx.moveTo(0, 13); ctx.lineTo(-5, -4); ctx.moveTo(0, 13); ctx.lineTo(5, -4); ctx.stroke();
      break;
    case 'vase':
      ctx.fillStyle = '#7fb2d9';
      ctx.beginPath();
      ctx.moveTo(-4, -13); ctx.lineTo(4, -13); ctx.lineTo(5, -6); ctx.quadraticCurveTo(12, 2, 7, 10); ctx.quadraticCurveTo(0, 15, -7, 10); ctx.quadraticCurveTo(-12, 2, -5, -6); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#e8b64c'; ctx.beginPath(); ctx.moveTo(-9, 2); ctx.quadraticCurveTo(0, 6, 9, 2); ctx.stroke();
      break;
    case 'coins':
    case 'goldbars':
      ctx.fillStyle = '#d9a53a';
      if (kind === 'coins') {
        for (const [cx, cy] of [[-7, 6], [0, 8], [7, 6], [-4, 0], [4, 0], [0, -6]]) {
          ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#8a6414'; ctx.stroke();
        }
      } else {
        for (const [bx, by] of [[-9, 4], [3, 4], [-3, -5]]) {
          ctx.fillRect(bx, by, 13, 7);
          ctx.strokeStyle = '#8a6414'; ctx.strokeRect(bx, by, 13, 7);
        }
      }
      break;
    case 'orchid':
      ctx.strokeStyle = '#3f9e4d'; ctx.beginPath(); ctx.moveTo(0, 14); ctx.quadraticCurveTo(2, 0, 0, -8); ctx.stroke();
      ctx.fillStyle = '#22182e';
      for (let i = 0; i < 5; i += 1) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath(); ctx.ellipse(Math.cos(a) * 6, -8 + Math.sin(a) * 6, 5, 3, a, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = '#e8b64c'; ctx.beginPath(); ctx.arc(0, -8, 2.4, 0, Math.PI * 2); ctx.fill();
      break;
    case 'butterfly':
      ctx.fillStyle = '#e8b64c';
      ctx.beginPath(); ctx.ellipse(-7, -3, 7, 5, -0.5, 0, Math.PI * 2); ctx.ellipse(7, -3, 7, 5, 0.5, 0, Math.PI * 2);
      ctx.ellipse(-6, 5, 5, 3.4, 0.5, 0, Math.PI * 2); ctx.ellipse(6, 5, 5, 3.4, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#3a2a12'; ctx.fillRect(-1.4, -9, 2.8, 18);
      break;
    case 'seeds':
      ctx.fillStyle = '#8a5a2a';
      ctx.beginPath(); ctx.ellipse(0, 2, 10, 12, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#c99a54';
      for (const [sx, sy] of [[-4, -3], [4, -3], [0, 3], [-4, 8], [4, 8]]) { ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill(); }
      break;
    case 'leaf':
      ctx.fillStyle = '#57b96a';
      ctx.beginPath(); ctx.moveTo(0, -14); ctx.quadraticCurveTo(13, -2, 0, 14); ctx.quadraticCurveTo(-13, -2, 0, -14); ctx.fill();
      ctx.strokeStyle = '#2c6e3c'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 14); ctx.stroke();
      break;
    default:
      ctx.fillStyle = COLORS.gold;
      ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* --------------------------------- static layer -------------------------------- */

function drawPainting(ctx, p) {
  const horizontal = p.w > p.h;
  ctx.save();
  ctx.fillStyle = '#191d29';
  ctx.fillRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6);
  const ix = p.x + 3;
  const iy = p.y + 3;
  const iw = p.w - 6;
  const ih = p.h - 6;
  const grad = ctx.createLinearGradient(ix, iy, horizontal ? ix : ix, horizontal ? iy : iy + ih);
  if (p.art === 'sea') { grad.addColorStop(0, '#7fb2d9'); grad.addColorStop(1, '#274b73'); }
  else if (p.art === 'hills') { grad.addColorStop(0, '#c9d67a'); grad.addColorStop(1, '#3d6e35'); }
  else { grad.addColorStop(0, '#8a4a5e'); grad.addColorStop(1, '#33222e'); }
  ctx.fillStyle = grad;
  ctx.fillRect(ix, iy, iw, ih);
  ctx.fillStyle = 'rgba(20,16,10,0.55)';
  if (p.art === 'portrait') {
    const cx = ix + iw / 2;
    const cy = iy + ih / 2;
    ctx.beginPath(); ctx.arc(cx, cy - ih * 0.12, Math.min(iw, ih) * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy + ih * 0.42, Math.min(iw, ih) * 0.34, ih * 0.3, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(ix, iy + ih);
    ctx.lineTo(ix + iw * 0.4, iy + ih * 0.3);
    ctx.lineTo(ix + iw * 0.7, iy + ih * 0.6);
    ctx.lineTo(ix + iw, iy + ih * 0.25);
    ctx.lineTo(ix + iw, iy + ih);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function buildStaticLayer(level, floorIndex) {
  const canvas = document.createElement('canvas');
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  const ctx = canvas.getContext('2d');
  const rng = mulberry32(9000 + floorIndex * 131);

  // Floor: tiles with a soft sheen, speckled veins, grout lines.
  const tile = 64;
  const [colA, colB] = level.style === 'glass'
    ? [COLORS.stoneA, COLORS.stoneB]
    : level.style === 'vault' ? [COLORS.steelA, COLORS.steelB] : [COLORS.marbleA, COLORS.marbleB];
  for (let ty = 0; ty < VIEW.height / tile; ty += 1) {
    for (let tx = 0; tx < VIEW.width / tile; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? colA : colB;
      ctx.fillRect(tx * tile, ty * tile, tile, tile);
      ctx.fillStyle = `rgba(255,255,255,${range(rng, 0.008, 0.03)})`;
      ctx.fillRect(tx * tile, ty * tile, tile, tile * 0.4);
      for (let s = 0; s < 5; s += 1) {
        ctx.fillStyle = `rgba(0,0,0,${range(rng, 0.03, 0.09)})`;
        ctx.fillRect(tx * tile + rng() * tile, ty * tile + rng() * tile, range(rng, 1, 3), 1);
      }
    }
  }
  ctx.strokeStyle = COLORS.grout;
  ctx.lineWidth = 2;
  for (let x = 0; x <= VIEW.width; x += tile) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW.height); ctx.stroke(); }
  for (let y = 0; y <= VIEW.height; y += tile) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.width, y); ctx.stroke(); }
  if (level.style === 'vault') {
    ctx.fillStyle = 'rgba(232,182,76,0.16)';
    for (let x = 1000; x < 1252; x += 44) { ctx.save(); ctx.translate(x, 300); ctx.rotate(0.6); ctx.fillRect(-4, -60, 8, 120); ctx.restore(); }
  }

  // Carpets: deep red weave, gold border, a diamond lattice.
  for (const c of level.carpets) {
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = COLORS.carpetTrim;
    ctx.lineWidth = 3;
    ctx.strokeRect(c.x + 6, c.y + 6, c.w - 12, c.h - 12);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(201,162,77,0.4)';
    for (let dx = 22; dx < c.w - 10; dx += 30) {
      for (let dy = 22; dy < c.h - 10; dy += 30) {
        ctx.beginPath();
        ctx.moveTo(c.x + dx, c.y + dy - 8);
        ctx.lineTo(c.x + dx + 8, c.y + dy);
        ctx.lineTo(c.x + dx, c.y + dy + 8);
        ctx.lineTo(c.x + dx - 8, c.y + dy);
        ctx.closePath(); ctx.stroke();
      }
    }
  }

  // Rope barriers: brass posts and a sagging velvet rope.
  for (const r of level.ropes) {
    ctx.strokeStyle = '#7a1f2e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + 4);
    ctx.quadraticCurveTo(r.x + r.w / 2, r.y + 14, r.x + r.w, r.y + 4);
    ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    for (const px of [r.x, r.x + r.w]) { ctx.beginPath(); ctx.arc(px, r.y + 3, 4, 0, Math.PI * 2); ctx.fill(); }
  }

  // Planters: soil, shrub mounds, palm fronds where the court is green.
  for (const p of level.planters) {
    ctx.fillStyle = '#4a3826';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.strokeStyle = '#6e5636';
    ctx.lineWidth = 3;
    ctx.strokeRect(p.x, p.y, p.w, p.h);
    const blobs = Math.max(2, Math.floor((p.w + p.h) / 34));
    for (let i = 0; i < blobs; i += 1) {
      const bx = p.x + 8 + rng() * (p.w - 16);
      const by = p.y + 8 + rng() * (p.h - 16);
      ctx.fillStyle = `rgba(${40 + rng() * 30},${110 + rng() * 40},${50},0.9)`;
      ctx.beginPath(); ctx.arc(bx, by, range(rng, 7, 12), 0, Math.PI * 2); ctx.fill();
    }
  }

  // Benches: warm slatted wood.
  for (const b of level.benches) {
    ctx.fillStyle = '#6e4a26';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = '#3f2a12';
    ctx.lineWidth = 1;
    for (let sy = 5; sy < b.h; sy += 7) { ctx.beginPath(); ctx.moveTo(b.x + 3, b.y + sy); ctx.lineTo(b.x + b.w - 3, b.y + sy); ctx.stroke(); }
    ctx.strokeStyle = '#2c1c0a';
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x, b.y, b.w, b.h);
  }

  // Paintings hang on the walls.
  for (const p of level.paintings) drawPainting(ctx, p);

  // Display cases: brass base, the artefact on velvet, glass with a shine slash.
  for (const c of level.cases) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);
    ctx.fillStyle = '#241a10';
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.fillStyle = c.target ? '#5d2138' : '#2c3550';
    ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
    drawArtefact(ctx, c.art, c.x + c.w / 2, c.y + c.h / 2, Math.min(c.w, c.h) - 14);
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = c.target ? COLORS.gold : COLORS.glassEdge;
    ctx.lineWidth = c.target ? 2.5 : 1.5;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(c.x + c.w * 0.18, c.y + c.h - 4);
    ctx.lineTo(c.x + c.w * 0.45, c.y + 4);
    ctx.stroke();
  }

  // The great vault door, for the floor that has one.
  if (level.vaultDoor) {
    const v = level.vaultDoor;
    ctx.fillStyle = '#31333f';
    ctx.beginPath(); ctx.arc(v.x, v.y, 44, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a8fa3'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = '#565b70'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(v.x, v.y, 30, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(v.x, v.y);
      ctx.lineTo(v.x + Math.cos(a) * 28, v.y + Math.sin(a) * 28);
      ctx.stroke();
    }
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(v.x, v.y, 7, 0, Math.PI * 2); ctx.fill();
  }

  // Walls and pillars, drawn last among statics: a lit top edge, a dropped shadow.
  const drawSolid = (r, pillar) => {
    ctx.fillStyle = COLORS.wallShadow;
    ctx.fillRect(r.x + 5, r.y + 6, r.w, r.h);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(r.x, r.y, r.w, 4);
    ctx.fillRect(r.x, r.y, 4, r.h);
    if (pillar) {
      ctx.strokeStyle = COLORS.carpetTrim;
      ctx.lineWidth = 2;
      ctx.strokeRect(r.x + 6, r.y + 6, r.w - 12, r.h - 12);
    }
  };
  for (const w of level.walls) drawSolid(w, false);
  for (const p of level.pillars) drawSolid(p, true);
  // Border walls.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW.width, 28);
  ctx.fillRect(0, VIEW.height - 28, VIEW.width, 28);
  ctx.fillRect(0, 0, 28, VIEW.height);
  ctx.fillRect(VIEW.width - 28, 0, 28, VIEW.height);
  ctx.fillStyle = COLORS.wallTop;
  ctx.fillRect(0, 24, VIEW.width, 4);
  ctx.fillRect(0, VIEW.height - 28, VIEW.width, 4);
  ctx.fillRect(24, 0, 4, VIEW.height);
  ctx.fillRect(VIEW.width - 28, 0, 4, VIEW.height);

  // Palms: a trunk knot and long fronds.
  for (const p of level.palms || []) {
    const cx = p.x + p.w / 2;
    const cy = p.y + p.h / 2;
    ctx.strokeStyle = 'rgba(46,120,60,0.95)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 7; i += 1) {
      const a = (i / 7) * Math.PI * 2 + rng() * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16, cx + Math.cos(a) * 27, cy + Math.sin(a) * 27);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a4028';
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.fill();
  }

  // The camera panel: a small steel box with a sleeping screen (it wakes when used).
  if (level.panel) {
    const p = level.panel;
    ctx.fillStyle = '#39415a';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#7dffb0';
    ctx.fillRect(p.x + 5, p.y + 6, p.w - 10, 10);
    ctx.fillStyle = '#20242f';
    ctx.fillRect(p.x + 5, p.y + 20, p.w - 10, 4);
    ctx.fillRect(p.x + 5, p.y + 27, p.w - 10, 4);
  }

  return canvas;
}

/* -------------------------------- dynamic pieces ------------------------------- */

export function drawExit(ctx, level, time) {
  const e = level.exit;
  const pulse = 0.6 + 0.4 * Math.sin(time * 2.4);
  ctx.save();
  ctx.fillStyle = '#0d2b1a';
  ctx.fillRect(e.x, e.y, e.w, e.h);
  ctx.strokeStyle = COLORS.exit;
  ctx.globalAlpha = 0.55 + 0.45 * pulse;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(e.x + 2, e.y + 2, e.w - 4, e.h - 4);
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.exit;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const vertical = e.h > e.w;
  if (vertical) {
    ctx.save();
    ctx.translate(e.x + e.w / 2, e.y + e.h / 2);
    ctx.rotate(Math.PI / 2);
    ctx.fillText('EXIT', 0, 0);
    ctx.restore();
  } else {
    ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2);
  }
  // A breathing halo on the floor in front of the door.
  const gx = e.x + e.w / 2;
  const gy = e.y + e.h / 2;
  const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 60);
  g.addColorStop(0, `rgba(61,255,142,${0.13 * pulse})`);
  g.addColorStop(1, 'rgba(61,255,142,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(gx, gy, 60, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawLasers(ctx, lasers, time) {
  for (const laser of lasers) {
    const state = laserState(laser, time);
    // Emitters.
    ctx.fillStyle = '#39415a';
    for (const [ex, ey] of [[laser.x1, laser.y1], [laser.x2, laser.y2]]) {
      ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = state === 'off' ? '#3a3f4d' : '#ff4040';
      ctx.beginPath(); ctx.arc(ex, ey, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#39415a';
    }
    if (state === 'off') continue;
    const alpha = state === 'warn' ? (Math.sin(time * 26) > 0 ? 0.85 : 0.15) : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = 'rgba(255,40,40,0.38)';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
    ctx.strokeStyle = '#ff5a5a';
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(laser.x1, laser.y1); ctx.lineTo(laser.x2, laser.y2); ctx.stroke();
    ctx.restore();
  }
}

export function drawCameras(ctx, cams, disabled, time) {
  for (const cam of cams) {
    ctx.save();
    ctx.translate(cam.x, cam.y);
    // Mount.
    ctx.fillStyle = '#39415a';
    ctx.fillRect(-10, -6, 20, 10);
    ctx.rotate(cam.angle);
    ctx.fillStyle = disabled ? '#2c303c' : '#4a546e';
    ctx.fillRect(-4, -5, 16, 10);
    ctx.fillStyle = disabled ? '#555c' : (Math.sin(time * 4) > -0.6 ? '#ff4040' : '#7a2020');
    ctx.beginPath(); ctx.arc(13, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawFigure(ctx, x, y, angle, bodyColor, trimColor, crouched, isGuard) {
  ctx.save();
  ctx.translate(x, y);
  // Soft contact shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(2, 3, 14, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.rotate(angle);
  // Shoulders / torso.
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, crouched ? 12 : 13, crouched ? 10 : 11.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = trimColor;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, crouched ? 11 : 12, -0.9, 0.9); ctx.stroke();
  if (isGuard) {
    // Flashlight in the right hand, and its bright little lamp.
    ctx.fillStyle = '#22242c';
    ctx.fillRect(9, 7, 8, 4);
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(18, 9, 2.4, 0, Math.PI * 2); ctx.fill();
    // Cap.
    ctx.fillStyle = '#1d3355';
    ctx.beginPath(); ctx.arc(0, 0, 7.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(2, -7.6, 7, 15.2);
  }
  // Head.
  ctx.fillStyle = '#d9a066';
  ctx.beginPath(); ctx.arc(1, 0, 6.4, 0, Math.PI * 2); ctx.fill();
  if (!isGuard) {
    ctx.fillStyle = trimColor;
    ctx.beginPath(); ctx.arc(-1, 0, 6.8, Math.PI * 0.4, Math.PI * 1.6); ctx.fill();
  }
  ctx.restore();
}

export function drawPlayer(ctx, player, time) {
  drawFigure(ctx, player.x, player.y, player.angle, COLORS.playerBody, COLORS.playerTrim, player.crouched, false);
  if (player.noiseRing > 0) {
    const r = player.noiseRing * 118;
    ctx.save();
    ctx.strokeStyle = `rgba(200,220,255,${0.4 * (1 - player.noiseRing)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  void time;
}

export function drawGuard(ctx, guard, time) {
  if (guard.asleep) {
    ctx.save();
    ctx.translate(guard.x, guard.y);
    ctx.rotate(guard.angle + 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath(); ctx.ellipse(2, 3, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.guardBody;
    ctx.beginPath(); ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d9a066';
    ctx.beginPath(); ctx.arc(11, 0, 6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Floating Zzz, drifting up.
    ctx.save();
    ctx.fillStyle = 'rgba(190,215,255,0.9)';
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 3; i += 1) {
      const ph = (time * 0.5 + i * 0.33) % 1;
      ctx.globalAlpha = 1 - ph;
      ctx.font = `bold ${10 + ph * 7}px system-ui, sans-serif`;
      ctx.fillText('Z', guard.x + 12 + ph * 10, guard.y - 12 - ph * 16);
    }
    ctx.restore();
    return;
  }
  drawFigure(ctx, guard.x, guard.y, guard.angle, COLORS.guardBody, '#9db8dd', false, true);
  // State marker: a filling pip over the head, then ? and ! as the meter climbs.
  const m = guard.meter;
  if (m > 0.03) {
    ctx.save();
    ctx.translate(guard.x, guard.y - 26);
    ctx.fillStyle = 'rgba(6,8,16,0.75)';
    ctx.fillRect(-13, -3, 26, 6);
    ctx.fillStyle = m >= 1 ? '#ff4040' : m >= 0.34 ? '#ffb84d' : '#ffe9a8';
    ctx.fillRect(-12, -2, 24 * Math.min(1, m), 4);
    ctx.font = 'bold 17px system-ui, sans-serif';
    ctx.textAlign = 'center';
    if (guard.state === 'alert') {
      ctx.fillStyle = '#ff4040';
      ctx.fillText('!', 0, -8);
    } else if (guard.state === 'suspicious') {
      ctx.fillStyle = '#ffb84d';
      ctx.fillText('?', 0, -8);
    }
    ctx.restore();
  }
}

/** A thrown coin: a glinting arc, then a resting disc with expanding clink rings. */
export function drawCoin(ctx, coin, time) {
  if (!coin) return;
  if (coin.flying) {
    const t = coin.t;
    const x = coin.x + (coin.tx - coin.x) * t;
    const y = coin.y + (coin.ty - coin.y) * t - Math.sin(t * Math.PI) * 26;
    ctx.fillStyle = '#ffe9a8';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  } else {
    const age = time - coin.landedAt;
    ctx.fillStyle = '#e8b64c';
    ctx.beginPath(); ctx.arc(coin.tx, coin.ty, 4, 0, Math.PI * 2); ctx.fill();
    if (age < 0.9) {
      ctx.strokeStyle = `rgba(255,233,168,${0.55 * (1 - age / 0.9)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(coin.tx, coin.ty, 8 + age * 60, 0, Math.PI * 2); ctx.stroke();
    }
  }
}

/** Cases change once robbed: the glass stays, the velvet is bare. Overdrawn per frame. */
export function drawTakenCases(ctx, level) {
  for (const c of level.cases) {
    if (!c.taken) continue;
    ctx.fillStyle = '#20242f';
    ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, c.h - 10);
    ctx.fillStyle = COLORS.glass;
    ctx.fillRect(c.x, c.y, c.w, c.h);
    ctx.strokeStyle = 'rgba(160,170,190,0.5)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(c.x, c.y, c.w, c.h);
  }
}
