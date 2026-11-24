import * as THREE from 'three';
import {
  M, W, fmt, slabRect, slabPoly, box, rail, dashed, label, zone, passage, CHAIR,
  chair, chairAt, table, seatedTable, screenAt, person, stair, spiral,
} from './engine.js';

const FLOOR = 4.0; // floor to floor, 23 risers of 175 mm
const PITCH_X = 0.5, PITCH_Z = 0.85;
const OUT = { x0: -0.84, x1: 28.99, y0: -2.72, y1: 16.82 };  // outer face of facades
const IN = { x0: -0.47, x1: 28.59, y0: -2.35, y1: 16.45 };   // inner face

// 1. sal geometry (red floor on drawing 221S015)
const PLAT = [[0, 0.11], [3.8, 0.11], [3.8, 11.66], [2.34, 11.66], [2.33, 11.95], [1.88, 12.6], [0.9, 11.66], [0, 11.66]];
const PL = { x0: 0, x1: 3.8, y0: 0.11, y1: 11.66 };
const GANG36 = [3.8, 7.3, 9.42, 8.69];
const FLEX = { x0: 9.42, x1: 24.07, y0: 5.79, y1: 11.45 };
const GANG33 = [24.07, 7.12, 28.64, 8.36];
const SPIRAL = { x: 1.93, y: 13.7, r: 1.05 };

const rectPts = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// ======================= PLATEAU (1. sal at height 0) =======================
function buildFirstFloor() {
  const b = new THREE.Group();
  const GF = -FLOOR;
  { const gp = slabRect(OUT.x0, OUT.y0, OUT.x1, OUT.y1, M.ground, 0.1, GF, false); gp.receiveShadow = false; b.add(gp); }
  b.add(dashed(rectPts(OUT.x0, OUT.y0, OUT.x1, OUT.y1), GF + 0.01, true));
  b.add(dashed(rectPts(OUT.x0, OUT.y0, OUT.x1, OUT.y1), 0, true));
  b.add(slabPoly(PLAT, M.floor));
  b.add(slabRect(...GANG36, M.floor));
  b.add(slabRect(FLEX.x0, FLEX.y0, FLEX.x1, FLEX.y1, M.floor));
  b.add(slabRect(...GANG33, M.floor));
  b.add(slabRect(9.31, 0.16, 24.22, 5.79, M.core));
  b.add(slabRect(9.47, 2.37, 16.65, 3.79, M.floor, 0.22, 0.004, false));
  b.add(slabRect(13.86, 3.79, 15.44, 5.79, M.floor, 0.22, 0.004, false));
  b.add(stair(7.21, 8.9, 0.9, 7.3, GF, 0, 22));
  b.add(spiral(SPIRAL.x, SPIRAL.y, SPIRAL.r, GF, 0, 18, Math.PI + 0.35));
  const rooms = [
    [9.49, 0.32, 12.14, 2.27, 'Puslerum'], [12.27, 0.32, 13.62, 2.27, 'WC'], [13.78, 0.32, 15.35, 2.13, 'Elevator'],
    [15.51, 0.32, 19.82, 2.40, 'Personale'], [19.95, 0.32, 24.04, 5.60, 'Teknik'], [15.59, 2.60, 19.82, 5.60, 'Depot<br>borde/stole'],
    [12.45, 3.82, 13.76, 5.50, 'WC'], [9.47, 3.79, 12.30, 5.65, 'Personale'],
  ];
  for (const [x0, y0, x1, y1, name] of rooms) { b.add(box(x0, y0, x1, y1, 2.5, M.core)); b.add(label(name, (x0 + x1) / 2, (y0 + y1) / 2, 2.55, 'room')); }
  b.add(box(9.31, 2.37, 9.47, 3.79, 2.5, M.core));
  const R = [
    [3.8, 0.11, 3.8, 7.3], [3.8, 8.69, 3.8, 11.66], [3.8, 11.66, 2.34, 11.66], [2.33, 11.95, 1.88, 12.6], [0.9, 11.66, 0, 11.66],
    [0, 0.11, 3.8, 0.11], [3.8, 7.3, 7.21, 7.3], [8.9, 7.3, 9.3, 7.3], [3.8, 8.69, 9.3, 8.69],
    [9.3, 5.79, 9.3, 7.3], [9.3, 8.69, 9.3, 11.45], [9.3, 11.45, 24.07, 11.45],
    [24.07, 5.79, 24.07, 7.12], [24.07, 8.36, 24.07, 11.45], [24.07, 7.12, 28.64, 7.12], [24.07, 8.36, 28.64, 8.36],
  ];
  for (const r of R) b.add(rail(...r));
  b.add(label('Gang', 5.5, 8.0, 0.05, 'small'));
  b.add(label('Trappe til stuen', 8.07, 3.2, -1.6, 'small'));
  b.add(label('Vindeltrappe', 1.2, 13.4, -1.6, 'small'));
  b.add(label('Udgang til<br>udvendig trappe', 27.4, 7.74, 0.05, 'small'));
  b.add(label('Gang · WC · elevator', 12.0, 3.08, 0.05, 'small'));
  b.add(label('Åbent ned til restauranten', 14.0, 14.2, GF + 0.05, 'void'));
  return b;
}

function plateauTheatre(six) {
  const g = new THREE.Group();
  const info = {};
  const firstFront = 1.71;
  const rows = six ? [6, 6, 6, 6, 6, 6, 5, 5, 5, 6] : [5, 5, 5, 5, 5, 5, 4, 4, 4, 5, 5, 5];
  rows.forEach((n, r) => {
    const yF = firstFront + r * PITCH_Z;
    for (let i = 0; i < n; i++) g.add(chairAt(PL.x0 + 0.25 + i * PITCH_X, yF, 'N'));
    g.add(label(`${n}`, PL.x0 - 0.45, yF + 0.25, 0.05, 'count'));
  });
  const seats = rows.reduce((a, b) => a + b, 0);
  const backFront = firstFront + (rows.length - 1) * PITCH_Z, backEdge = backFront + CHAIR.d;
  const screenY = PL.y0 + 0.35;
  g.add(screenAt(1.25, PL.y0, 'S'));
  g.add(label('Skærm', 1.25, PL.y0 + 0.35, 2.15, 'tag'));
  g.add(person(2.95, PL.y0 + 0.75));
  const nMax = six ? 6 : 5;
  const e5 = PL.x0 + 0.25 + (nMax - 1) * PITCH_X + CHAIR.w / 2, e4 = e5 - PITCH_X;
  const entF = firstFront + 6 * PITCH_Z, entB = firstFront + 8 * PITCH_Z + CHAIR.d;
  g.add(passage(e5, firstFront, PL.x1, backEdge));
  g.add(passage(e4, entF, e5, entB));
  const aisle = PL.x1 - e5, narrow = aisle < 1.3;
  g.add(label(`${fmt(aisle, 2)} m${narrow ? ' · under 1,3 m' : ''}`, (e5 + PL.x1) / 2, 4.2, 0.05, narrow ? 'warn' : 'pass'));
  g.add(label(`${fmt(PL.x1 - e4, 2)} m ved indgangen`, (e4 + PL.x1) / 2 - 0.2, (entF + entB) / 2, 0.05, 'pass'));
  if (six) { g.add(passage(0.2, backEdge, PL.x1, PL.y1)); g.add(label(`${fmt(PL.y1 - backEdge, 1)} m fri til vindeltrappen`, 1.9, (backEdge + PL.y1) / 2, 0.05, 'note3d')); }
  info.seats = seats; info.rows = rows.length; info.aisle = aisle;
  info.backDist = backFront + CHAIR.d / 2 - screenY;
  info.eye = { x: 1.8, y: 12.1, h: 1.6, look: [1.25, screenY, 1.0] };
  return { g, info };
}

function plateauWorkshop() {
  const g = new THREE.Group();
  const ys = [1.6, 4.2, 6.8, 9.4];
  let seats = 0;
  for (const y of ys) { const t = seatedTable(0.35, y, 2.15, y + 0.8); seats += t.userData.seats; g.add(t); }
  g.add(screenAt(1.25, PL.y0, 'S'));
  g.add(label('Skærm', 1.25, PL.y0 + 0.35, 2.15, 'tag'));
  g.add(person(2.95, PL.y0 + 0.75));
  g.add(passage(2.15, PL.y0 + 0.9, PL.x1, PL.y1));
  g.add(label(`Gang ${fmt(PL.x1 - 2.15, 2)} m`, 2.97, 4.6, 0.05, 'pass'));
  g.add(label('4 borde à 80 × 180 cm', 1.25, 11.0, 0.05, 'note3d'));
  return { g, info: { seats, tables: ys.length, aisle: PL.x1 - 2.15, eye: { x: 3.1, y: 11.4, h: 1.6, look: [1.2, 2.5, 0.8] } } };
}

function flexTheatre(kind) {
  const g = new THREE.Group();
  const info = {};
  if (kind === 'vaeg') {
    const cx = 18.85, firstFront = 8.0, rows = [14, 14, 14, 15];
    rows.forEach((n, r) => { const yF = firstFront + r * PITCH_Z; for (let i = 0; i < n; i++) g.add(chairAt(cx + (i - (n - 1) / 2) * PITCH_X, yF, 'N')); });
    const backFront = firstFront + (rows.length - 1) * PITCH_Z;
    g.add(screenAt(cx, FLEX.y0, 'S')); g.add(label('Skærm', cx, FLEX.y0 + 0.35, 2.15, 'tag')); g.add(person(cx + 1.25, FLEX.y0 + 0.6));
    const eE = cx + 7.5 * PITCH_X, eW = cx - 7.5 * PITCH_X;
    g.add(passage(FLEX.x0, firstFront - 1.3, FLEX.x1, firstFront)); g.add(passage(eE, firstFront, FLEX.x1, FLEX.y1)); g.add(passage(eW - 1.3, firstFront, eW, FLEX.y1));
    Object.assign(info, { seats: 57, rows: 4, backDist: backFront + CHAIR.d / 2 - (FLEX.y0 + 0.35), eye: { x: cx, y: Math.min(backFront + CHAIR.d + 0.25, FLEX.y1 - 0.1), h: 1.6, look: [cx, FLEX.y0 + 0.35, 1.0] } });
  } else {
    const cx = (FLEX.x0 + FLEX.x1) / 2, firstFront = FLEX.y1 - 1.8, rows = [19, 19, 19];
    rows.forEach((n, r) => { const yF = firstFront - r * PITCH_Z; for (let i = 0; i < n; i++) g.add(chairAt(cx + (i - (n - 1) / 2) * PITCH_X, yF, 'S')); });
    const backFront = firstFront - (rows.length - 1) * PITCH_Z, backEdge = backFront - CHAIR.d, half = 9.5 * PITCH_X;
    g.add(screenAt(cx, FLEX.y1, 'N')); g.add(label('Skærm', cx, FLEX.y1 - 0.35, 2.15, 'tag')); g.add(person(cx + 1.3, FLEX.y1 - 0.8));
    g.add(passage(FLEX.x0, FLEX.y0, FLEX.x1, backEdge)); g.add(passage(cx - half - 1.3, backEdge, cx - half, FLEX.y1)); g.add(passage(cx + half, backEdge, cx + half + 1.3, FLEX.y1));
    Object.assign(info, { seats: 57, rows: 3, backDist: (FLEX.y1 - 0.35) - (backFront - CHAIR.d / 2), eye: { x: cx, y: backEdge - 0.3, h: 1.6, look: [cx, FLEX.y1 - 0.35, 1.0] } });
  }
  g.add(label('PLATEAU<span>45 m²</span>', 1.9, 4.2, 0.05, 'zone'));
  return { g, info };
}

function plateauView(name, layout, info) {
  const flex = layout === 'flexVaeg' || layout === 'flexHal' || layout === 'tom';
  const P = (x, y, h) => { const [X, Z] = W(x, y); return [X, h, Z]; };
  if (name === 'eye') { const e = info.eye; return { pos: P(e.x, e.y, e.h), tgt: P(...e.look), fov: 58 }; }
  if (!flex) {
    if (name === 'top') return { pos: P(6.0, 6.31, 34), tgt: P(6.0, 6.3, 0), fov: 30 };
    if (name === 'side') return { pos: P(2.6, 25.5, 9.5), tgt: P(1.9, 5.2, 0.2), fov: 32 };
    return { pos: P(15.5, 21.5, 17.5), tgt: P(2.6, 6.4, -0.8), fov: 30 };
  }
  if (name === 'top') return { pos: P(14.1, 6.31, 52), tgt: P(14.1, 6.3, 0), fov: 30 };
  if (name === 'side') return { pos: P(39, 28, 21), tgt: P(15.5, 7.0, -1.0), fov: 30 };
  return { pos: P(7.7, 39, 35.5), tgt: P(14.3, 6.2, -1.0), fov: 30 };
}

const PLATEAU_NOTE = 'Fabula har godkendt oplæg for 57 på plateauet (24/11-2026). Ved 6 pr. række er gangen langs værnet 0,83 m; ved 5 pr. række er den 1,33 m. Hold vejen fri til trappen og vindeltrappen i sydspidsen.';

export const plateau = {
  name: 'Plateau', tab: 'Plateauet', floor: '1. sal',
  building: buildFirstFloor,
  view: plateauView,
  layouts: {
    oplaeg6: {
      chip: 'Oplæg · 6 pr. række', title: 'Oplæg for 57', cap: 'Oplæg for 57 · 6 pr. række',
      lead: 'Alle 57 sidder på plateauet i 10 rækker, og skærmen står ved nordenden. Der er 1,8 m fri bag sidste række ned til vindeltrappen. Gangen langs glasværnet bliver 0,83 m, og BR18-vejledningen siger mindst 1,3 m.',
      build: () => plateauTheatre(true),
      kpis: i => [[i.seats, 'stole'], [i.rows + ' rækker', '6 stole pr. række, 5 ved indgangen'], [fmt(i.backDist) + ' m', 'fra bageste række til skærmen'], [fmt(i.aisle, 2) + ' m', 'gang langs værnet (krav 1,3 m)']],
      short: i => `${i.seats} stole · ${i.rows} rækker · ${fmt(i.backDist)} m til skærmen`,
      note: PLATEAU_NOTE, rules: true,
    },
    oplaeg5: {
      chip: 'Oplæg · 5 pr. række', title: 'Oplæg for 57', cap: 'Oplæg for 57 · 5 pr. række',
      lead: 'Alle 57 sidder på plateauet i 12 rækker, og skærmen står ved nordenden. Gangen langs glasværnet er 1,33 m og fører ud til gangen mod trappen. Ved indgangen er rækkerne en stol kortere. Hold adgangen til vindeltrappen i sydspidsen fri.',
      build: () => plateauTheatre(false),
      kpis: i => [[i.seats, 'stole'], [i.rows + ' rækker', '5 stole pr. række, 4 ved indgangen'], [fmt(i.backDist) + ' m', 'fra bageste række til skærmen'], [fmt(i.aisle, 2) + ' m', 'gang langs værnet (krav 1,3 m)']],
      short: i => `${i.seats} stole · ${i.rows} rækker · ${fmt(i.backDist)} m til skærmen`,
      note: PLATEAU_NOTE, rules: true,
    },
    workshop: {
      chip: 'Workshop', title: 'Workshop for 24', cap: 'Workshop for 24',
      lead: 'Fire borde på 80 × 180 cm med seks pladser hver. Skærm og plads til underviseren i nordenden. Gangen langs glasværnet er 1,65 m og holder vejen fri til trappen og vindeltrappen.',
      build: plateauWorkshop,
      kpis: i => [[i.seats, 'pladser'], [i.tables + ' borde', '80 × 180 cm, 6 pladser pr. bord'], [fmt(i.aisle, 2) + ' m', 'gang langs værnet'], ['45 m²', 'plateau, 3,8 × 11,6 m']],
      short: i => `${i.seats} pladser · ${i.tables} borde à 80 × 180 cm`,
    },
    tom: {
      chip: 'Tomt', title: 'Plateauet', cap: 'Plateauet · 1. sal',
      lead: 'Plateauet på 1. sal: 45 m² langs vestfacaden med udsigt ned i restauranten. Trappe og elevator fra stuen, vindeltrappe i sydspidsen. Flex/Event på 86 m² ligger for enden af gangen.',
      build: () => ({ g: new THREE.Group().add(label('PLATEAU<span>45 m² · 3,8 × 11,6 m</span>', 1.9, 4.2, 0.05, 'zone'), label('FLEX / EVENT<span>86 m² · 14,6 × 5,7 m</span>', 16.7, 8.6, 0.05, 'zone')), info: { eye: { x: 3.1, y: 11.4, h: 1.6, look: [1.5, 0.5, 1.0] } } }),
      kpis: () => [['45 m²', 'plateau, 3,8 × 11,6 m'], ['86 m²', 'Flex/Event, 14,6 × 5,7 m'], ['2', 'veje ned: trappe og vindeltrappe'], ['1', 'elevator fra stuen']],
      short: () => 'Plateau 45 m² · Flex/Event 86 m² · trappe, vindeltrappe og elevator',
    },
  },
};

// Flex/Event til sammenligning: kun på 3D-siden, ikke i hjemmesidens embeds
export const plateauFlex = {
    flexVaeg: {
      chip: 'Flex · mod væggen', title: 'Flex/Event for 57', cap: 'Flex/Event · 57 mod væggen', group: 'flex',
      lead: 'Til sammenligning: 57 stole i Flex/Event med skærmen mod den faste væg ved depotet. Udgange i begge ender.',
      build: () => flexTheatre('vaeg'),
      kpis: i => [[i.seats, 'stole'], [i.rows + ' rækker', '14 · 14 · 14 · 15 stole'], [fmt(i.backDist) + ' m', 'fra bageste række til skærmen'], ['86 m²', 'Flex/Event']],
      short: i => `${i.seats} stole · ${i.rows} rækker · ${fmt(i.backDist)} m til skærmen`,
    },
    flexHal: {
      chip: 'Flex · mod hallen', title: 'Flex/Event for 57', cap: 'Flex/Event · 57 mod hallen', group: 'flex',
      lead: 'Til sammenligning: 57 stole i Flex/Event i tre lange rækker med skærmen ved glasværnet ud mod restauranten.',
      build: () => flexTheatre('hal'),
      kpis: i => [[i.seats, 'stole'], [i.rows + ' rækker', '19 · 19 · 19 stole'], [fmt(i.backDist) + ' m', 'fra bageste række til skærmen'], ['86 m²', 'Flex/Event']],
      short: i => `${i.seats} stole · ${i.rows} rækker · ${fmt(i.backDist)} m til skærmen`,
    },
};

// ======================= RESTAURANT (stue at height 0) =======================
const CORE = { x0: 9.07, x1: 24.29, y0: 0.11, y1: 11.9 };
const SOUTH = { x0: 8.9, x1: 24.4, y0: 11.9, y1: IN.y1 };     // spiseområde syd, 70 m²
const WEST = { x0: IN.x0, x1: 7.0, y0: IN.y0, y1: IN.y1 };    // spiseområde vest, 177 m²
const LOUNGE = { x0: 24.4, x1: IN.x1, y0: 8.9, y1: IN.y1 };   // lounge, 36 m²

function buildGround(upper = false) {
  const b = new THREE.Group();
  b.add(slabRect(OUT.x0, OUT.y0, OUT.x1, OUT.y1, M.ground, 0.2, 0, false));
  // facade cut at 1 m, door openings
  const H = 1.0, t = IN.x0 - OUT.x0;
  const doorsN = [[5.4, 6.4], [19.1, 20.1]], doorsS = [[5.0, 6.0], [21.7, 22.7]];
  const segs = (a, b, doors) => { const r = []; let s = a; for (const [d0, d1] of doors) { r.push([s, d0]); s = d1; } r.push([s, b]); return r; };
  for (const [a, c] of segs(OUT.x0, OUT.x1, doorsN)) b.add(box(a, OUT.y0, c, IN.y0, H, M.wall));
  for (const [a, c] of segs(OUT.x0, OUT.x1, doorsS)) b.add(box(a, IN.y1, c, OUT.y1, H, M.wall));
  b.add(box(OUT.x0, IN.y0, IN.x0, IN.y1, H, M.wall));
  b.add(box(IN.x1, IN.y0, OUT.x1, IN.y1, H, M.wall));
  // core: WC, elevator, storage, kitchen
  const CH = 1.4; // cut height, like the facades
  b.add(box(CORE.x0, CORE.y0, 13.62, 2.4, CH, M.core)); b.add(label('WC', 11.3, 1.25, CH + 0.05, 'room'));
  b.add(box(13.67, CORE.y0, 15.2, 2.4, CH, M.core)); b.add(label('Elevator', 14.44, 1.25, CH + 0.05, 'room'));
  b.add(box(15.2, CORE.y0, CORE.x1, 7.3, CH, M.core)); b.add(box(CORE.x0, 2.4, 15.2, 7.3, CH, M.core));
  b.add(label('Lager og opvask', 16.5, 4.6, CH + 0.05, 'room'));
  b.add(box(CORE.x0, 7.3, CORE.x1, CORE.y1, CH, M.core)); b.add(label('Køkken', 16.7, 9.6, CH + 0.05, 'room'));
  // stairs
  b.add(stair(7.21, 8.9, 0.9, 7.3, 0, FLOOR, 22));
  b.add(spiral(SPIRAL.x, SPIRAL.y, SPIRAL.r, 0, FLOOR, 18, Math.PI + 0.35));
  // first floor outline above
  if (!upper) {
    b.add(dashed(PLAT, FLOOR)); b.add(dashed(rectPts(3.8, 7.3, 9.3, 8.69), FLOOR));
    b.add(label('Plateauet ovenover', 1.9, 3.0, FLOOR, 'small'));
  }
  b.add(label('Trappe til plateauet', 8.0, 2.6, 1.2, 'small'));
  b.add(label('Vindeltrappe', SPIRAL.x, SPIRAL.y + 1.5, 0.05, 'small'));
  return b;
}

function samtalebord(g) {
  // long table in the middle of the west dining area: 4 tables of 80 x 180, 12 places per side
  g.add(zone(1.7, 2.1, 5.05, 10.8));
  const t = seatedTable(2.97, 2.5, 3.77, 9.7); g.add(t);
  g.add(label('SAMTALEBORDET<span>24 pladser</span>', 3.37, 11.6, 0.05, 'zone'));
  return t.userData.seats;
}
function langsiden(g) {
  // ét langbord på 18 m langs sydfacaden; stopper før østenden. Står foran branddøren (21,7-22,7), aftalt for nu (Gustav 24/11)
  g.add(zone(8.0, 12.55, 26.6, 15.85));
  const t = seatedTable(8.3, 13.8, 26.3, 14.6); g.add(t);
  g.add(label('Branddør', 22.2, 17.0, 0.05, 'small'));
  g.add(label(`LANGSIDEN<span>${t.userData.seats} pladser</span>`, 15.2, 11.4, 1.45, 'zone'));
  return t.userData.seats;
}
function restaurantLayout(kind) {
  const g = new THREE.Group();
  let seats = 0;
  if (kind === 'overblik') {
    g.add(label('SPISEOMRÅDE<span>177 m²</span>', 3.2, 6.0, 0.05, 'zone'));
    g.add(label('SPISEOMRÅDE SYD<span>70 m²</span>', 16.6, 14.2, 0.05, 'zone'));
    g.add(label('LOUNGE<span>36 m²</span>', 26.5, 12.6, 0.05, 'zone'));
  }
  if (kind === 'samtalebordet' || kind === 'begge') seats += samtalebord(g);
  if (kind === 'langsiden' || kind === 'begge') seats += langsiden(g);
  const eye = kind === 'langsiden'
    ? { x: 6.6, y: 14.2, h: 1.6, look: [26, 14.2, 0.6] }
    : kind === 'samtalebordet' || kind === 'begge' ? { x: 3.37, y: 12.6, h: 1.6, look: [3.37, 2, 0.6] } : { x: 26.5, y: 15.5, h: 1.6, look: [4, 6, 0.8] };
  return { g, info: { seats, eye } };
}
function restaurantView(name, layout, info) {
  const P = (x, y, h) => { const [X, Z] = W(x, y); return [X, h, Z]; };
  if (name === 'eye') { const e = info.eye; return { pos: P(e.x, e.y, e.h), tgt: P(...e.look), fov: 58 }; }
  if (name === 'top') return { pos: P(14.1, 7.01, 56), tgt: P(14.1, 7.0, 0), fov: 30 };
  if (name === 'side') return { pos: P(-14, 30, 24), tgt: P(10, 8, 0), fov: 30 };
  if (layout === 'samtalebordet') return { pos: P(18, 26, 20), tgt: P(4.5, 7.0, 0), fov: 30 };
  if (layout === 'langsiden') return { pos: P(13, 36, 23), tgt: P(17.3, 11.5, 0), fov: 30 };
  return { pos: P(8, 41, 36), tgt: P(14.2, 7.5, 0), fov: 30 };
}
const DRAFT = 'Udkast: placering og borde er gættet ud fra stueplanen fra 2019. Ret mig, så tegner jeg det, som det står i dag.';
export const restaurant = {
  name: 'Restaurant', tab: 'Restauranten', floor: 'Stuen',
  building: buildGround,
  view: restaurantView,
  layouts: {
    overblik: {
      chip: 'Overblik', title: 'Restauranten', cap: 'Restauranten · stuen',
      lead: 'Stueetagen i Kulturhuset Fabula. Spiseområdet mod vest ligger under plateauet, og langs sydfacaden ud for køkkenet ligger langsiden. Trappen og vindeltrappen fører op til plateauet.',
      build: () => restaurantLayout('overblik'),
      kpis: () => [['177 m²', 'spiseområde mod vest'], ['70 m²', 'spiseområde mod syd'], ['24 + 60', 'pladser: samtalebordet og langsiden'], ['36 m²', 'lounge']],
      short: () => 'Spiseområde 177 m² · langsiden 70 m² · lounge 36 m²',
      note: DRAFT,
    },
    langsiden: {
      chip: 'Langsiden · 60', title: 'Langsiden for 60', cap: 'Langsiden · 60 pladser',
      lead: 'Den mere private del af restauranten, langs sydfacaden ud for køkkenet. Ét langbord på 18 meter med 30 pladser på hver side.',
      build: () => restaurantLayout('langsiden'),
      kpis: i => [[i.seats, 'pladser'], ['18 m', 'langbord, 30 pladser pr. side'], ['70 m²', 'spiseområde mod syd'], [i.seats + 24, 'pladser sammen med samtalebordet']],
      short: i => `${i.seats} pladser ved langbordet langs sydfacaden`,
      note: DRAFT,
    },
    samtalebordet: {
      chip: 'Samtalebordet', title: 'Samtalebordet for 24', cap: 'Samtalebordet · 24 pladser',
      lead: 'Ét langt bord midt i restauranten med tolv pladser på hver side. Større selskaber sidder ved langsiden.',
      build: () => restaurantLayout('samtalebordet'),
      kpis: i => [[i.seats, 'pladser'], ['7,2 m', 'langt bord, 4 × 80 × 180 cm'], ['60', 'pladser ved langsiden, til større selskaber'], [i.seats + 60, 'pladser sammen med langsiden']],
      short: i => `${i.seats} pladser ved ét 7,2 m langt bord`,
      note: DRAFT,
    },
    begge: {
      chip: 'Begge · 84', title: 'Selskab for 84', cap: 'Samtalebordet og langsiden · 84 pladser',
      lead: 'Samtalebordet og langsiden kan bookes samtidig af ét selskab: 24 ved samtalebordet og 60 ved langsiden.',
      build: () => restaurantLayout('begge'),
      kpis: i => [[i.seats, 'pladser'], ['2 grupper', 'samtalebordet og langsiden'], ['24 + 60', 'pladser'], ['70 m²', 'spiseområde mod syd']],
      short: i => `${i.seats} pladser i to grupper`,
      note: DRAFT,
    },
  },
};

// ======================= PAKKER (both floors) =======================
function upperFloor() {
  const b = new THREE.Group();
  b.position.y = FLOOR;
  b.add(slabPoly(PLAT, M.floor));
  b.add(slabRect(...GANG36, M.floor));
  const R = [
    [3.8, 0.11, 3.8, 7.3], [3.8, 8.69, 3.8, 11.66], [3.8, 11.66, 2.34, 11.66], [2.33, 11.95, 1.88, 12.6], [0.9, 11.66, 0, 11.66],
    [0, 0.11, 3.8, 0.11], [0, 0.11, 0, 11.66], [3.8, 7.3, 7.21, 7.3], [8.9, 7.3, 9.3, 7.3], [3.8, 8.69, 9.3, 8.69],
  ];
  for (const r of R) b.add(rail(...r));
  return b;
}
function buildHouse() {
  const b = buildGround(true);
  b.add(upperFloor());
  return b;
}
const LIGHT = /\b(count|note3d|pass|warn)\b/;
function upstairs(r) {
  const w = new THREE.Group();
  w.position.y = FLOOR;
  w.add(r.g);
  const drop = [];
  w.traverse(o => { if (o.isCSS2DObject && LIGHT.test(o.element.className)) drop.push(o); });
  drop.forEach(o => o.parent.remove(o));
  return w;
}
const UP = {
  workshop: { name: 'Workshop', def: 'Workshoppen', build: plateauWorkshop, what: 'workshop' },
  oplaeg: { name: 'Oplæg', def: 'Oplægget', build: () => plateauTheatre(true), what: 'oplæg' },
};
const DOWN = {
  samtalebordet: { name: 'Samtalebordet', place: 'ved samtalebordet', add: g => samtalebord(g) },
  langsiden: { name: 'Langsiden', place: 'ved langsiden', add: g => langsiden(g) },
  begge: { name: 'Begge borde', place: 'ved samtalebordet og langsiden', add: g => samtalebord(g) + langsiden(g) },
};
function houseLayout(up, down) {
  const g = new THREE.Group();
  const u = UP[up].build();
  g.add(upstairs(u));
  const upSeats = u.info.seats;
  g.add(label(`${UP[up].name.toUpperCase()}<span>${upSeats} ${up === 'oplaeg' ? 'stole' : 'pladser'} · 1. sal</span>`, 1.9, -1.3, FLOOR + 0.05, 'zone'));
  const downSeats = DOWN[down].add(g);
  return { g, info: { up: upSeats, down: downSeats, guests: Math.min(upSeats, downSeats), eye: { x: 6.2, y: 15.9, h: 1.6, look: [3.2, 3.0, 2.6] } } };
}
function houseView(name, layout, info) {
  const P = (x, y, h) => { const [X, Z] = W(x, y); return [X, h, Z]; };
  if (name === 'eye') { const e = info.eye; return { pos: P(e.x, e.y, e.h), tgt: P(...e.look), fov: 58 }; }
  if (name === 'top') return { pos: P(14.1, 7.01, 60), tgt: P(14.1, 7.0, 0), fov: 30 };
  if (name === 'side') return { pos: P(34, 7.5, 16), tgt: P(5, 7, 1.5), fov: 30 };
  if (name === 'op') return { pos: P(16, 18, 19), tgt: P(2.2, 6.0, 4.4), fov: 30 };
  if (name === 'ned') return { pos: P(15, 21, 9), tgt: P(3.4, 6.0, 0.8), fov: 32 };
  return { pos: P(30, 32, 25), tgt: P(9.5, 7.5, 1.5), fov: 30 };
}
const PROGRAM = [
  ['09.00', 'Kaffe og surdejsbolle med ost og marmelade', 'Samtalebordet', 'ned'],
  ['09.30', 'Rundvisning: Grønttorvet, Kulturhuset Fabula og FAR', 'Huset', 'persp'],
  ['10.30', 'Jeres eget møde', 'Plateauet', 'op'],
  ['12.00', 'Frokost af sæsonens grøntsager, og vi fortæller om maden', 'Samtalebordet', 'ned'],
  ['13.00', 'Workshop del 1: introduktion til sankning', 'Plateauet', 'op'],
  ['14.30', 'Workshop del 2: smagning af urter og te', 'Plateauet', 'op'],
  ['16.00', 'Kaffe og kage', 'Samtalebordet', 'ned'],
  ['16.30', 'Farvel med en lille goodiebag', 'Huset', 'persp'],
];
const PRIMARY = 'workshop-samtalebordet';
const houseLayouts = {};
for (const up of Object.keys(UP)) for (const down of Object.keys(DOWN)) {
  const key = `${up}-${down}`, primary = key === PRIMARY;
  const U = UP[up], D = DOWN[down];
  houseLayouts[key] = {
    up, down, primary,
    chip: `${U.name} + ${D.name}`,
    title: primary ? 'En dag hos FAR' : `${U.name} og ${D.name.toLowerCase()}`,
    cap: primary ? 'En dag hos FAR · workshop på plateauet, forplejning ved samtalebordet' : `${U.name} på plateauet · ${D.name.toLowerCase()} i restauranten`,
    lead: primary
      ? 'Teambuilding i Kulturhuset Fabula. Møde og workshop foregår på plateauet. Morgenmad, frokost og kaffe står klar ved samtalebordet lige nedenunder, og trappen fører direkte ned til bordet.'
      : `${up === 'workshop' ? 'Workshop ved fire borde' : 'Oplæg med skærm'} på plateauet og forplejning ${D.place} nedenunder. Trappen og vindeltrappen fører direkte ned.`,
    build: () => houseLayout(up, down),
    kpis: i => {
      const rows = [[i.up, `pladser til ${U.what} på plateauet`], [i.down, `pladser ${D.place}`]];
      if (i.up > i.down) rows.push([i.up - i.down, 'gæster uden plads ved bordet']);
      else if (i.down > i.up) rows.push([i.down - i.up, 'ledige pladser ved bordet']);
      else rows.push(['Går op', 'samme antal ovenpå og ved bordet']);
      rows.push(primary ? ['09.00–16.30', 'en hel dag'] : (up === 'workshop' ? ['4 borde', '80 × 180 cm ovenpå'] : ['6 pr. række', 'gang langs værnet 0,83 m']));
      return rows;
    },
    short: i => primary ? `Workshop for ${i.up} ovenpå · forplejning for ${i.down} ved samtalebordet` : `${U.name} for ${i.up} ovenpå · ${i.down} pladser ${D.place}`,
    note: i => i.up > i.down ? `${U.def} har ${i.up} pladser og bordet ${i.down}. Med fuldt hus mangler ${i.up - i.down} en plads. Vælg langsiden (60 pladser), eller hold jer til højst ${i.down} gæster.` : '',
    program: primary ? PROGRAM : null,
  };
}
export const huset = {
  name: 'Pakker', tab: 'Hele huset', floor: 'Stuen og 1. sal',
  building: buildHouse,
  view: houseView,
  primary: PRIMARY,
  picker: [
    { key: 'up', label: 'Ovenpå', options: Object.entries(UP).map(([k, v]) => [k, v.name]) },
    { key: 'down', label: 'Nedenunder', options: Object.entries(DOWN).map(([k, v]) => [k, v.name]) },
  ],
  layouts: Object.fromEntries([[PRIMARY, houseLayouts[PRIMARY]], ...Object.entries(houseLayouts).filter(([k]) => k !== PRIMARY)]),
};


