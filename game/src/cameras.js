// The museum's electronic eyes: sweeping security cameras, the laser silk across the
// vault approaches, and the wall panel that blinds the cameras for twenty seconds.
// These raise the shared alarm rather than catching the thief themselves.

import { ALARM, CAMERA } from './config.js';
import { clamp } from './random.js';
import { conePolygon, pointInCone, pointSegDist, segmentBlocked } from './lighting.js';
import { laserBuzz } from './audio.js';

export function createCameras(level, tall) {
  return level.cameras.map((c) => ({
    x: c.x,
    y: c.y,
    base: c.base,
    sweep: c.sweep,
    speed: c.speed,
    angle: c.base,
    poly: null,
    seesPlayer: false,
  }));
}

export function updateCameras(cams, dt, time, player, tall, disabled, game) {
  let anySee = false;
  for (const cam of cams) {
    cam.angle = cam.base + Math.sin(time * cam.speed) * cam.sweep;
    cam.poly = conePolygon(cam.x, cam.y, cam.angle, CAMERA.halfAngle, CAMERA.range, tall, 0.06);
    cam.seesPlayer = false;
    if (!disabled && !player.hidden) {
      const inside = pointInCone(player.x, player.y, cam.x, cam.y, cam.angle, CAMERA.halfAngle, CAMERA.range);
      if (inside > 0 && !segmentBlocked(cam.x, cam.y, player.x, player.y, tall)) {
        cam.seesPlayer = true;
        anySee = true;
        game.alarm = clamp(game.alarm + ALARM.fromCamera * dt * (0.5 + inside), 0, 1);
        game.cameraHeat = 1;
      }
    }
  }
  return anySee;
}

export function createLasers(level) {
  return level.lasers.map((l) => ({ ...l, live: false, tripped: false }));
}

/** Lasers cycle on a readable beat: on for `on` seconds of every `period`, with a
 *  half-second warning flicker before the beam returns. */
export function laserState(laser, time) {
  const t = (time + laser.phase) % laser.period;
  if (t < laser.on) return 'on';
  if (t > laser.period - 0.5) return 'warn';
  return 'off';
}

export function updateLasers(lasers, time, player, game) {
  for (const laser of lasers) {
    laser.live = laserState(laser, time) === 'on';
    if (laser.live && !player.hidden) {
      const d = pointSegDist(player.x, player.y, laser.x1, laser.y1, laser.x2, laser.y2);
      if (d < player.radius + 3 && !laser.tripped) {
        laser.tripped = true;
        game.alarm = clamp(game.alarm + ALARM.laserTrip, 0, 1);
        game.laserTripAt = { x: player.x, y: player.y };
        laserBuzz();
      } else if (d >= player.radius + 6) {
        laser.tripped = false;
      }
    }
  }
}
