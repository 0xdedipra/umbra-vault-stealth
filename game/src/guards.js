// The night staff. Each guard walks a learnable patrol with pauses and look-arounds,
// carries a flashlight cone that real walls cut, and thinks in three states:
// PATROL (the route), SUSPICIOUS (something glinted — stop, mark it, go and look),
// ALERT (the thief, there — chase, and feed the building alarm while eyes stay on).
// Detection is a meter, not a switch: distance, the light on the thief, crouching and
// running all change how fast it fills, and breaking line of sight lets it drain —
// a near miss is a scare, not a sentence.

import { ALARM, DETECTION, GUARD } from './config.js';
import { angleDelta, clamp, dist } from './random.js';
import { conePolygon, lightLevelAt, pointInCone, resolveCircle, segmentBlocked } from './lighting.js';
import { guardStep, suspicionSting, spottedSting } from './audio.js';

export const STATE_PATROL = 'patrol';
export const STATE_SUSPICIOUS = 'suspicious';
export const STATE_ALERT = 'alert';

export function createGuards(level) {
  return level.guards.map((g, i) => ({
    x: g.path[0][0],
    y: g.path[0][1],
    angle: Math.atan2(g.path[1][1] - g.path[0][1], g.path[1][0] - g.path[0][0]),
    path: g.path,
    wp: 1,
    pauseFor: g.pause,
    pauseTimer: 0,
    state: STATE_PATROL,
    meter: 0,
    lastSeen: null,
    memory: 0,
    investigate: null,
    lookPhase: i * 1.37,
    asleep: false,
    stepAcc: 0,
    cone: null,
    seesPlayer: false,
    frozen: false,
  }));
}

function moveToward(guard, tx, ty, speed, dt, solids) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 4) return true;
  const want = Math.atan2(dy, dx);
  guard.angle += clamp(angleDelta(guard.angle, want), -3.4 * dt, 3.4 * dt);
  const step = Math.min(d, speed * dt);
  const nx = guard.x + Math.cos(guard.angle) * step;
  const ny = guard.y + Math.sin(guard.angle) * step;
  const resolved = resolveCircle(nx, ny, GUARD.radius, solids);
  guard.x = resolved.x;
  guard.y = resolved.y;
  guard.stepAcc += step;
  if (guard.stepAcc > 34) {
    guard.stepAcc = 0;
    guard.footDist = true; // main turns this into a footstep sound, distance-graded
  }
  return d < 12;
}

/** How visible the player is to this guard right now: 0 unseen, else a fill rate. */
function sightRate(guard, player, level, tall, low) {
  const d = dist(guard.x, guard.y, player.x, player.y);
  if (d > GUARD.coneRange && d > GUARD.peripheralRange) return 0;
  // Tall cover always blocks; low cover blocks only a crouched thief.
  if (segmentBlocked(guard.x, guard.y, player.x, player.y, tall)) return 0;
  if (player.crouched && segmentBlocked(guard.x, guard.y, player.x, player.y, low)) return 0;
  const light = lightLevelAt(level, player.x, player.y);
  const stance = player.crouched ? 0.45 : player.running ? 1.5 : 1;
  const lightFactor = 0.35 + light * 1.25;
  const inCone = pointInCone(player.x, player.y, guard.x, guard.y, guard.angle, GUARD.coneHalfAngle, GUARD.coneRange);
  if (inCone > 0) {
    const distFactor = 1.5 - (d / GUARD.coneRange) * 1.1;
    return Math.max(0.12, distFactor) * lightFactor * stance;
  }
  if (d < GUARD.peripheralRange) return 0.35 * lightFactor * stance; // brushed past his elbow
  return 0;
}

export function updateGuards(guards, dt, time, player, level, tall, low, solids, game) {
  let worst = 0;
  let anyAlertSight = false;

  for (const guard of guards) {
    if (guard.asleep) {
      guard.cone = null;
      guard.seesPlayer = false;
      continue;
    }
    if (guard.frozen) {
      guard.cone = conePolygon(guard.x, guard.y, guard.angle, GUARD.coneHalfAngle, GUARD.coneRange, tall.concat(low));
      continue;
    }

    /* ------------------------------- detection ------------------------------- */
    const rate = sightRate(guard, player, level, tall, low);
    guard.seesPlayer = rate > 0;
    if (rate > 0) {
      const was = guard.meter;
      guard.meter = clamp(guard.meter + rate * dt, 0, 1);
      guard.lastSeen = { x: player.x, y: player.y };
      guard.memory = DETECTION.investigateMemory;
      if (was < DETECTION.suspiciousAt && guard.meter >= DETECTION.suspiciousAt && guard.state === STATE_PATROL) {
        guard.state = STATE_SUSPICIOUS;
        guard.investigate = { x: player.x, y: player.y };
        suspicionSting();
      }
      if (guard.meter >= DETECTION.alertAt && guard.state !== STATE_ALERT) {
        guard.state = STATE_ALERT;
        spottedSting();
      }
      if (guard.state === STATE_ALERT) {
        anyAlertSight = true;
        game.alarm = clamp(game.alarm + ALARM.fromGuardSight * dt, 0, 1);
      }
    } else {
      guard.meter = clamp(guard.meter - DETECTION.decayPerSecond * dt, 0, 1);
      if (guard.memory > 0) guard.memory -= dt;
      if (guard.state === STATE_ALERT && guard.memory <= 0) {
        guard.state = STATE_SUSPICIOUS;
        guard.investigate = guard.lastSeen ? { ...guard.lastSeen } : null;
      } else if (guard.state === STATE_SUSPICIOUS && guard.meter <= 0.02 && !guard.investigate) {
        guard.state = STATE_PATROL;
      }
    }
    worst = Math.max(worst, guard.meter);

    /* ------------------------- bodies on the floor --------------------------- */
    if (guard.state === STATE_PATROL && !guard.bodyChecked) {
      for (const other of guards) {
        if (other === guard || !other.asleep || other.reported) continue;
        const d = dist(guard.x, guard.y, other.x, other.y);
        if (d < 190 && !segmentBlocked(guard.x, guard.y, other.x, other.y, tall)) {
          other.reported = true;
          guard.bodyChecked = true;
          guard.state = STATE_SUSPICIOUS;
          guard.meter = Math.max(guard.meter, 0.5);
          guard.investigate = { x: other.x, y: other.y };
          suspicionSting();
        }
      }
    }

    /* -------------------------------- movement ------------------------------- */
    if (guard.state === STATE_ALERT) {
      const target = guard.seesPlayer ? player : guard.lastSeen;
      if (target) {
        moveToward(guard, target.x, target.y, GUARD.chaseSpeed, dt, solids);
        if (dist(guard.x, guard.y, player.x, player.y) < GUARD.catchRange) game.caught = true;
      }
    } else if (guard.state === STATE_SUSPICIOUS) {
      if (guard.investigate) {
        if (moveToward(guard, guard.investigate.x, guard.investigate.y, GUARD.investigateSpeed, dt, solids)) {
          guard.investigate = null;
          guard.lookTimer = 1.6;
        }
      } else if (guard.lookTimer > 0) {
        guard.lookTimer -= dt;
        guard.angle += Math.sin(time * 2.1 + guard.lookPhase) * 1.5 * dt;
        if (guard.lookTimer <= 0 && guard.meter < DETECTION.suspiciousAt) guard.state = STATE_PATROL;
      } else {
        guard.angle += Math.sin(time * 1.4 + guard.lookPhase) * 1.2 * dt;
        if (guard.meter < 0.05) guard.state = STATE_PATROL;
      }
    } else {
      // PATROL: walk the loop, pause at each corner and look around.
      if (guard.pauseTimer > 0) {
        guard.pauseTimer -= dt;
        guard.angle += Math.sin(time * 1.1 + guard.lookPhase) * GUARD.lookSweep * dt;
      } else {
        const [tx, ty] = guard.path[guard.wp];
        if (moveToward(guard, tx, ty, GUARD.patrolSpeed, dt, solids)) {
          guard.wp = (guard.wp + 1) % guard.path.length;
          guard.pauseTimer = guard.pauseFor;
        }
      }
    }

    guard.cone = conePolygon(guard.x, guard.y, guard.angle, GUARD.coneHalfAngle, GUARD.coneRange, tall.concat(low));
  }

  game.worstMeter = worst;
  game.anyAlertSight = anyAlertSight;
  return guards;
}

/** A noise — running feet, a thrown coin — turns heads toward a point. */
export function attractGuards(guards, x, y, radius) {
  for (const guard of guards) {
    if (guard.asleep || guard.state === STATE_ALERT) continue;
    if (dist(guard.x, guard.y, x, y) < radius) {
      guard.state = STATE_SUSPICIOUS;
      guard.meter = Math.max(guard.meter, 0.45);
      guard.investigate = { x, y };
      guard.pauseTimer = 0;
    }
  }
}

export { guardStep };
