// UMBRA VAULT — shared constants: field size, palette, tuning numbers and control labels.
// Everything else imports from here so the game's feel can be retuned in one place.

export const VIEW = { width: 1280, height: 800 };

/** Fixed simulation step (seconds); the loop accumulates real time into these. */
export const STEP = 1 / 120;

export const PLAYER = {
  radius: 13,
  walk: 152,
  run: 238,
  crouch: 84,
  noiseRadius: 118,
  noiseEvery: 0.34,
  interactRange: 42,
  takedownRange: 38,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  investigateSpeed: 98,
  chaseSpeed: 150,
  coneHalfAngle: 0.44,
  coneRange: 252,
  peripheralRange: 74,
  catchRange: 30,
  pauseAtWaypoint: 1.7,
  lookSweep: 0.85,
};

export const DETECTION = {
  suspiciousAt: 0.34,
  alertAt: 1,
  decayPerSecond: 0.22,
  investigateMemory: 3.2,
  huntSeconds: 6,
};

export const ALARM = {
  fromGuardSight: 0.20,
  fromCamera: 0.30,
  laserTrip: 0.45,
  decayPerSecond: 0.055,
};

export const CAMERA = { range: 265, halfAngle: 0.36, disableSeconds: 20 };
export const COINS_PER_FLOOR = 3;
export const COIN_RADIUS = 135;

export const COLORS = {
  night: '#05070f',
  marbleA: '#2b3040',
  marbleB: '#262b39',
  grout: '#1a1e2a',
  carpet: '#5d2138',
  carpetTrim: '#c9a24d',
  stoneA: '#27352c',
  stoneB: '#232f27',
  steelA: '#26272f',
  steelB: '#22232b',
  wall: '#3d4358',
  wallTop: '#565f7a',
  glass: 'rgba(150,200,235,0.20)',
  glassEdge: 'rgba(190,225,250,0.75)',
  gold: '#e8b64c',
  guardBody: '#2e4d7d',
  guardCap: '#1d3355',
  playerBody: '#14423c',
  playerTrim: '#39d0b4',
  coneWarm: 'rgba(255,196,92,',
  coneRed: 'rgba(255,64,64,',
  exit: '#3dff8e',
};

export const CONTROLS_TEXT = [
  'WASD / Arrows — move',
  'SHIFT — run (fast, but your footsteps carry)',
  'C / CTRL — crouch (quiet; hides behind low cover)',
  'E — steal · silent takedown · use the camera panel',
  'F — throw a coin toward the mouse to draw a guard away',
  'R — restart floor · P — pause · M — mute',
];
