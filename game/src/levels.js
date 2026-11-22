// The three floors of the Kartika Museum as pure data: geometry, cover, cases, patrols,
// cameras, lasers and light pools. Rendering and rules read this; nothing here draws.
// Coordinates are logical pixels in the 1280x800 field. Walls and pillars are TALL cover
// (they block sight completely); cases, planters and benches are LOW cover (a crouched
// thief behind them cannot be seen).

import { VIEW } from './config.js';

const B = 28; // border wall thickness

/** The four border walls, as tall solids. Exit doors sit inside the room, so no gaps. */
export function borderWalls() {
  return [
    { x: 0, y: 0, w: VIEW.width, h: B },
    { x: 0, y: VIEW.height - B, w: VIEW.width, h: B },
    { x: 0, y: 0, w: B, h: VIEW.height },
    { x: VIEW.width - B, y: 0, w: B, h: VIEW.height },
  ];
}

/** Tall occluders: borders + partitions + pillars (+ palms where a floor has them). */
export function tallSolids(level) {
  return borderWalls().concat(level.walls, level.pillars, level.palms || []);
}

/** Low cover: display cases, planters, benches. Blocks movement; hides a crouched player. */
export function lowCover(level) {
  return level.cases.concat(level.planters, level.benches);
}

/** Everything a body cannot walk through. */
export function allSolids(level) {
  return tallSolids(level).concat(lowCover(level));
}

export const LEVELS = [
  {
    name: 'GALERI KARTIKA',
    sub: 'Floor 1 — the painting wing',
    intro: 'The Kartika collection sleeps under glass. Take the golden mask, help yourself to what else glitters, and leave by the east door.',
    style: 'marble',
    ambient: 0.3,
    start: { x: 92, y: 700, angle: -0.6 },
    exit: { x: 1218, y: 350, w: 34, h: 100 },
    walls: [
      { x: 300, y: 28, w: 16, h: 250 },
      { x: 300, y: 470, w: 16, h: 200 },
      { x: 760, y: 120, w: 16, h: 260 },
      { x: 470, y: 420, w: 330, h: 16 },
      { x: 980, y: 470, w: 16, h: 210 },
    ],
    pillars: [
      { x: 540, y: 160, w: 44, h: 44 },
      { x: 660, y: 560, w: 44, h: 44 },
      { x: 170, y: 540, w: 44, h: 44 },
      { x: 1010, y: 170, w: 44, h: 44 },
    ],
    palms: [],
    cases: [
      { x: 600, y: 318, w: 80, h: 56, art: 'mask', name: 'Topeng Emas Kartika', value: 5000, target: true },
      { x: 150, y: 150, w: 64, h: 64, art: 'emerald', name: 'Zamrud Borneo', value: 2200, target: false },
      { x: 1050, y: 600, w: 64, h: 64, art: 'vase', name: 'Vas Pusaka', value: 1800, target: false },
      { x: 520, y: 630, w: 64, h: 48, art: 'gem', name: 'Permata Surya', value: 1500, target: false },
      { x: 1090, y: 130, w: 56, h: 56, art: 'coins', name: 'Koin Kuno', value: 1200, target: false },
    ],
    planters: [
      { x: 80, y: 330, w: 120, h: 36 },
      { x: 1150, y: 470, w: 34, h: 120 },
    ],
    benches: [
      { x: 400, y: 540, w: 100, h: 30 },
      { x: 840, y: 640, w: 110, h: 30 },
    ],
    paintings: [
      { x: 380, y: 32, w: 96, h: 14, art: 'sea' },
      { x: 700, y: 32, w: 96, h: 14, art: 'portrait' },
      { x: 930, y: 32, w: 96, h: 14, art: 'hills' },
      { x: 32, y: 470, w: 14, h: 96, art: 'portrait' },
    ],
    carpets: [
      { x: 545, y: 285, w: 190, h: 125 },
      { x: 55, y: 630, w: 190, h: 120 },
    ],
    ropes: [{ x: 584, y: 386, w: 112, h: 8 }],
    lights: [
      { x: 200, y: 200, r: 150, i: 0.55 },
      { x: 640, y: 140, r: 175, i: 0.6 },
      { x: 1080, y: 210, r: 150, i: 0.55 },
      { x: 340, y: 620, r: 150, i: 0.5 },
      { x: 920, y: 620, r: 165, i: 0.55 },
      { x: 640, y: 470, r: 190, i: 0.35 },
    ],
    guards: [
      { path: [[860, 300], [1080, 300], [1080, 540], [860, 540]], pause: 1.6 },
      { path: [[150, 430], [150, 700], [520, 700], [520, 470]], pause: 2.0 },
    ],
    cameras: [],
    panel: null,
    lasers: [],
    vaultDoor: null,
  },
  {
    name: 'RUMAH KACA',
    sub: 'Floor 2 — the botanical court',
    intro: 'Moonlight pours through the glass roof and the cameras sweep the court. The black orchid blooms at its heart — mind the light, use the leaves.',
    style: 'glass',
    ambient: 0.34,
    start: { x: 90, y: 700, angle: -0.6 },
    exit: { x: 1120, y: 28, w: 110, h: 34 },
    walls: [
      { x: 420, y: 28, w: 14, h: 240 },
      { x: 420, y: 420, w: 14, h: 260 },
      { x: 850, y: 110, w: 14, h: 250 },
      { x: 850, y: 480, w: 14, h: 200 },
    ],
    pillars: [],
    palms: [
      { x: 100, y: 140, w: 34, h: 34 },
      { x: 1146, y: 140, w: 34, h: 34 },
      { x: 100, y: 626, w: 34, h: 34 },
      { x: 1146, y: 626, w: 34, h: 34 },
      { x: 640, y: 110, w: 34, h: 34 },
      { x: 640, y: 656, w: 34, h: 34 },
    ],
    cases: [
      { x: 604, y: 352, w: 72, h: 52, art: 'orchid', name: 'Anggrek Hitam', value: 4000, target: true },
      { x: 150, y: 150, w: 60, h: 60, art: 'butterfly', name: 'Kupu Emas', value: 2000, target: false },
      { x: 1060, y: 600, w: 60, h: 52, art: 'seeds', name: 'Benih Pusaka', value: 1600, target: false },
      { x: 1060, y: 160, w: 60, h: 52, art: 'leaf', name: 'Daun Giok', value: 1400, target: false },
    ],
    planters: [
      { x: 60, y: 470, w: 100, h: 34 },
      { x: 230, y: 120, w: 34, h: 110 },
      { x: 520, y: 352, w: 34, h: 120 },
      { x: 720, y: 352, w: 30, h: 120 },
      { x: 1010, y: 420, w: 130, h: 34 },
      { x: 600, y: 600, w: 90, h: 34 },
      { x: 90, y: 250, w: 110, h: 34 },
    ],
    benches: [
      { x: 240, y: 660, w: 100, h: 28 },
      { x: 940, y: 120, w: 100, h: 28 },
    ],
    paintings: [],
    carpets: [],
    ropes: [],
    lights: [
      { x: 400, y: 300, r: 250, i: 0.5 },
      { x: 880, y: 430, r: 250, i: 0.5 },
      { x: 640, y: 640, r: 185, i: 0.35 },
      { x: 140, y: 660, r: 130, i: 0.45 },
      { x: 1140, y: 660, r: 130, i: 0.45 },
    ],
    guards: [
      { path: [[185, 300], [185, 620], [360, 620], [360, 300]], pause: 1.5 },
      { path: [[500, 640], [500, 200], [775, 200], [775, 640]], pause: 1.8 },
      { path: [[930, 620], [1180, 620], [1180, 300], [930, 300]], pause: 1.6 },
    ],
    cameras: [{ x: 640, y: 46, base: Math.PI / 2, sweep: 0.75, speed: 0.5 }],
    panel: { x: 1184, y: 96, w: 26, h: 38 },
    lasers: [],
    vaultDoor: null,
  },
  {
    name: 'BRANKAS BAWAH',
    sub: 'Floor 3 — the vault',
    intro: 'Below the museum, the Kartika Crown waits behind laser silk and patient men. Cross on the dark beats. Do not touch the light.',
    style: 'vault',
    ambient: 0.22,
    start: { x: 84, y: 400, angle: 0 },
    exit: { x: 1218, y: 350, w: 34, h: 100 },
    walls: [
      { x: 300, y: 200, w: 16, h: 420 },
      { x: 300, y: 28, w: 16, h: 90 },
      { x: 560, y: 120, w: 16, h: 430 },
      { x: 820, y: 280, w: 16, h: 420 },
      { x: 820, y: 28, w: 16, h: 150 },
      { x: 980, y: 28, w: 16, h: 240 },
      { x: 980, y: 470, w: 16, h: 302 },
    ],
    pillars: [{ x: 690, y: 390, w: 36, h: 36 }],
    palms: [],
    cases: [
      { x: 1050, y: 372, w: 80, h: 56, art: 'crown', name: 'Mahkota Kartika', value: 9000, target: true },
      { x: 1000, y: 150, w: 56, h: 48, art: 'diamond', name: 'Berlian Nagari', value: 3000, target: false },
      { x: 1150, y: 640, w: 64, h: 48, art: 'goldbars', name: 'Emas Batangan', value: 2600, target: false },
      { x: 352, y: 520, w: 48, h: 44, art: 'gem', name: 'Perak Segara', value: 1300, target: false },
      { x: 700, y: 430, w: 52, h: 44, art: 'coins', name: 'Duit VOC', value: 1100, target: false },
    ],
    planters: [],
    benches: [],
    paintings: [{ x: 1080, y: 32, w: 120, h: 14, art: 'hills' }],
    carpets: [{ x: 1010, y: 330, w: 160, h: 140 }],
    ropes: [],
    lights: [
      { x: 430, y: 400, r: 130, i: 0.42 },
      { x: 700, y: 200, r: 120, i: 0.38 },
      { x: 1090, y: 400, r: 185, i: 0.5 },
      { x: 150, y: 400, r: 110, i: 0.32 },
    ],
    guards: [
      { path: [[430, 650], [430, 470], [430, 300], [430, 140]], pause: 1.4 },
      { path: [[650, 620], [650, 180], [770, 180], [770, 620]], pause: 1.7 },
      { path: [[1010, 300], [1180, 300], [1180, 560], [1010, 560]], pause: 1.9 },
    ],
    cameras: [
      { x: 438, y: 46, base: Math.PI / 2, sweep: 0.6, speed: 0.45 },
      { x: 1090, y: 46, base: Math.PI / 2, sweep: 0.8, speed: 0.4 },
    ],
    panel: { x: 44, y: 120, w: 26, h: 38 },
    lasers: [
      { x1: 322, y1: 320, x2: 554, y2: 320, period: 3.2, on: 2.0, phase: 0 },
      { x1: 566, y1: 640, x2: 814, y2: 640, period: 3.8, on: 2.4, phase: 1.2 },
      { x1: 836, y1: 240, x2: 974, y2: 240, period: 3.0, on: 1.8, phase: 0.6 },
    ],
    vaultDoor: { x: 1090, y: 66 },
  },
];
