// Sight and light: the geometry every other system leans on (raycasts, segment tests,
// circle-vs-room collision), the flashlight cone polygons cut by real occluders, the
// light level at any point (which decides how visible the thief is), and the darkness
// overlay that turns those numbers into the night itself.

import { COLORS, GUARD, VIEW } from './config.js';
import { clamp } from './random.js';

/* ---------------------------------- geometry ---------------------------------- */

/** Distance from point to segment (for laser trips and case proximity). */
export function pointSegDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / len2;
  t = clamp(t, 0, 1);
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function segHitsRect(x1, y1, x2, y2, r) {
  // Liang–Barsky clip: true when the segment touches the rect at all.
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - r.x, r.x + r.w - x1, y1 - r.y, r.y + r.h - y1];
  for (let i = 0; i < 4; i += 1) {
    if (Math.abs(p[i]) < 1e-9) {
      if (q[i] < 0) return false;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > t1) return false;
        if (t > t0) t0 = t;
      } else {
        if (t < t0) return false;
        if (t < t1) t1 = t;
      }
    }
  }
  return true;
}

/** True when the straight line between two points crosses any rect in `rects`. */
export function segmentBlocked(x1, y1, x2, y2, rects) {
  for (let i = 0; i < rects.length; i += 1) {
    if (segHitsRect(x1, y1, x2, y2, rects[i])) return true;
  }
  return false;
}

/** Distance along a ray until it meets a rect (Infinity when it never does). Slab method. */
function rayRect(ox, oy, dx, dy, r) {
  let tmin = 0;
  let tmax = Infinity;
  if (Math.abs(dx) < 1e-9) {
    if (ox < r.x || ox > r.x + r.w) return Infinity;
  } else {
    let t1 = (r.x - ox) / dx;
    let t2 = (r.x + r.w - ox) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  if (Math.abs(dy) < 1e-9) {
    if (oy < r.y || oy > r.y + r.h) return Infinity;
  } else {
    let t1 = (r.y - oy) / dy;
    let t2 = (r.y + r.h - oy) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return Infinity;
  }
  return tmin;
}

/** Push a circle out of every rect it overlaps; returns the corrected position. */
export function resolveCircle(x, y, radius, rects) {
  for (let i = 0; i < rects.length; i += 1) {
    const r = rects[i];
    const cx = clamp(x, r.x, r.x + r.w);
    const cy = clamp(y, r.y, r.y + r.h);
    let dx = x - cx;
    let dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= radius * radius) continue;
    if (d2 < 1e-6) {
      // Centre inside the rect: leave by the shallowest face.
      const left = x - r.x;
      const right = r.x + r.w - x;
      const top = y - r.y;
      const bottom = r.y + r.h - y;
      const m = Math.min(left, right, top, bottom);
      if (m === left) x = r.x - radius;
      else if (m === right) x = r.x + r.w + radius;
      else if (m === top) y = r.y - radius;
      else y = r.y + r.h + radius;
    } else {
      const d = Math.sqrt(d2);
      x = cx + (dx / d) * radius;
      y = cy + (dy / d) * radius;
    }
  }
  return { x, y };
}

/* --------------------------------- vision cones -------------------------------- */

/**
 * The visible polygon of a cone from (x, y) facing `angle`: rays fanned across the arc,
 * each stopped by the nearest occluder, so cones bend around pillars and cases exactly
 * the way a player's eye expects. `step` trades smoothness for speed.
 */
export function conePolygon(x, y, angle, halfAngle, range, occluders, step = 0.045) {
  const points = [{ x, y }];
  for (let a = -halfAngle; a <= halfAngle + 1e-4; a += step) {
    const dir = angle + a;
    const dx = Math.cos(dir);
    const dy = Math.sin(dir);
    let best = range;
    for (let i = 0; i < occluders.length; i += 1) {
      const t = rayRect(x, y, dx, dy, occluders[i]);
      if (t < best) best = t;
    }
    points.push({ x: x + dx * best, y: y + dy * best });
  }
  return points;
}

export function pointInCone(px, py, x, y, angle, halfAngle, range) {
  const dx = px - x;
  const dy = py - y;
  const d = Math.hypot(dx, dy);
  if (d > range) return 0;
  let da = Math.atan2(dy, dx) - angle;
  da = Math.atan2(Math.sin(da), Math.cos(da));
  if (Math.abs(da) > halfAngle) return 0;
  return 1 - d / range; // 0 at the rim, 1 at the lamp
}

/* ------------------------------------ light ------------------------------------ */

/** How lit a point is, 0 (pitch) to 1 (spotlit): floor ambient plus every light pool. */
export function lightLevelAt(level, x, y) {
  let v = level.ambient;
  for (let i = 0; i < level.lights.length; i += 1) {
    const L = level.lights[i];
    const d = Math.hypot(x - L.x, y - L.y);
    if (d < L.r) {
      const f = 1 - d / L.r;
      v += L.i * f * f;
    }
  }
  return clamp(v, 0, 1);
}

/* ------------------------------- darkness overlay ------------------------------ */

const darkCanvas = document.createElement('canvas');
darkCanvas.width = VIEW.width;
darkCanvas.height = VIEW.height;
const darkCtx = darkCanvas.getContext('2d');

/**
 * Paint the night over the world: a deep blue-black sheet cut away by lamp pools,
 * moonlight and every live flashlight cone, then laid over the scene. The world was
 * drawn first; guards and the thief are drawn after this, so they stay readable while
 * the floor itself tells you where it is safe to stand.
 */
export function drawDarkness(ctx, level, guardCones, cameraCones, time) {
  const d = darkCtx;
  d.save();
  d.clearRect(0, 0, VIEW.width, VIEW.height);
  d.fillStyle = 'rgba(5,8,20,0.52)';
  d.fillRect(0, 0, VIEW.width, VIEW.height);
  d.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < level.lights.length; i += 1) {
    const L = level.lights[i];
    const flicker = 0.94 + 0.06 * Math.sin(time * 7 + L.x * 0.37);
    const g = d.createRadialGradient(L.x, L.y, 0, L.x, L.y, L.r);
    g.addColorStop(0, `rgba(0,0,0,${0.85 * L.i * flicker})`);
    g.addColorStop(0.6, `rgba(0,0,0,${0.45 * L.i * flicker})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.beginPath();
    d.arc(L.x, L.y, L.r, 0, Math.PI * 2);
    d.fill();
  }
  const cutCone = (poly, strength) => {
    if (poly.length < 3) return;
    const origin = poly[0];
    const far = poly[poly.length - 1];
    const mid = poly[Math.floor(poly.length / 2)];
    const g = d.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, Math.hypot(mid.x - origin.x, mid.y - origin.y) || GUARD.coneRange);
    g.addColorStop(0, `rgba(0,0,0,${strength})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    d.fillStyle = g;
    d.beginPath();
    d.moveTo(origin.x, origin.y);
    for (let i = 1; i < poly.length; i += 1) d.lineTo(poly[i].x, poly[i].y);
    d.closePath();
    d.fill();
    void far;
  };
  for (let i = 0; i < guardCones.length; i += 1) cutCone(guardCones[i], 0.75);
  for (let i = 0; i < cameraCones.length; i += 1) cutCone(cameraCones[i], 0.4);
  d.restore();
  ctx.drawImage(darkCanvas, 0, 0);
}

/** The warm (or alarm-red) wash inside a cone, drawn over the world so danger reads. */
export function drawConeTint(ctx, poly, base, alpha) {
  if (poly.length < 3) return;
  const origin = poly[0];
  const mid = poly[Math.floor(poly.length / 2)];
  const reach = Math.hypot(mid.x - origin.x, mid.y - origin.y) || GUARD.coneRange;
  const g = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, reach);
  g.addColorStop(0, `${base}${alpha})`);
  g.addColorStop(0.7, `${base}${alpha * 0.55})`);
  g.addColorStop(1, `${base}0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(origin.x, origin.y);
  for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i].x, poly[i].y);
  ctx.closePath();
  ctx.fill();
}

export { COLORS };
