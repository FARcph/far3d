import * as THREE from 'three';
import { M, V, W, fmt, slabRect, box, dashed, label, zone, passage, seatedTable, person } from './engine.js';

// Palmehuset = Orangeriet, Lendager 2(21O)011 + 2(21O)030 (2019). Plan metres: x vest→øst, y nord→syd.
const L = 31.82, D = 8.31;                 // udvendige mål
const G = 0.15;                            // glaslinje inde fra kanten
const IN = { x0: G, x1: L - G, y0: G, y1: D - G };
const HN = 4.0, HS = 5.96;                 // højde ved nordfacaden (B-4) og sydfacaden (B-1), tag 14°
const hAt = y => HN + (y - IN.y0) / (IN.y1 - IN.y0) * (HS - HN);
const GRID_X = [0.25, 4.35, 8.45, 13.86, 17.96, 23.37, 27.47, 31.57];
const GRID_Y = [0.25, 2.13, 4.83, 8.06];
const DOOR_H = 2.3;
const DOORS = { n: [[15.3, 16.7], [20.9, 22.1]], s: [[15.3, 16.7]], w: [[2.98, 4.09]], e: [[2.98, 4.09]] };
const DEPOT = { x0: 8.47, x1: 13.97, y0: IN.y0, y1: 2.95 };
const AFFALD = { x0: 18.18, x1: 23.59, y0: IN.y0, y1: 2.59 };
const KITCHEN = { x0: 28.0, x1: L - G - 0.05, y0: IN.y0 + 0.05, y1: 0.8 };
const COLS = [[2.1, -1.2], [2.1, 9.0], [19.4, -1.2], [19.4, 9.0]];
const COL_H = 8.45;                        // kote 14,75 − 6,30

const roofGlass = new THREE.MeshStandardMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.09, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide });
const frame = new THREE.LineBasicMaterial({ color: 0x2f2f2f, transparent: true, opacity: 0.6 });
const frameFaint = new THREE.LineBasicMaterial({ color: 0x8f8f8f, transparent: true, opacity: 0.45 });
const steel = new THREE.MeshStandardMaterial({ color: 0x9a9a96, roughness: 0.7 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x9bb5d7, roughness: 0.92 });

function quad(pts, mat) { // pts: four [x, y, h] in plan coords
  const v = pts.map(p => V(...p));
  const g = new THREE.BufferGeometry().setFromPoints([v[0], v[1], v[2], v[0], v[2], v[3]]);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}
function lines(segs, mat) { // segs: [[x,y,h],[x,y,h]]
  const g = new THREE.BufferGeometry().setFromPoints(segs.flatMap(([a, b]) => [V(...a), V(...b)]));
  return new THREE.LineSegments(g, mat);
}
const divide = (grid, n) => grid.slice(0, -1).flatMap((a, i) => Array.from({ length: n }, (_, k) => a + (grid[i + 1] - a) * k / n)).concat(grid.at(-1));
const gaps = (a, b, doors) => { const r = []; let s = a; for (const [d0, d1] of doors) { r.push([s, d0, false]); r.push([d0, d1, true]); s = d1; } r.push([s, b, false]); return r; };

function buildPalm() {
  const b = new THREE.Group();
  { const s = slabRect(-4, -4, L + 4, D + 4, M.ground, 0.06, -0.1, false); s.receiveShadow = true; b.add(s); }
  b.add(slabRect(0, 0, L, D, floorMat, 0.12, 0));
  // glass facades, door openings keep the glass above 2,3 m
  const g = M.glass;
  for (const [a, c, door] of gaps(IN.x0, IN.x1, DOORS.n)) b.add(quad([[a, IN.y0, door ? DOOR_H : 0], [c, IN.y0, door ? DOOR_H : 0], [c, IN.y0, HN], [a, IN.y0, HN]], g));
  for (const [a, c, door] of gaps(IN.x0, IN.x1, DOORS.s)) b.add(quad([[a, IN.y1, door ? DOOR_H : 0], [c, IN.y1, door ? DOOR_H : 0], [c, IN.y1, HS], [a, IN.y1, HS]], g));
  for (const [x, doors] of [[IN.x0, DOORS.w], [IN.x1, DOORS.e]])
    for (const [a, c, door] of gaps(IN.y0, IN.y1, doors)) b.add(quad([[x, a, door ? DOOR_H : 0], [x, c, door ? DOOR_H : 0], [x, c, hAt(c)], [x, a, hAt(a)]], g));
  b.add(quad([[IN.x0, IN.y0, HN], [IN.x1, IN.y0, HN], [IN.x1, IN.y1, HS], [IN.x0, IN.y1, HS]], roofGlass));
  // frames: posts, sill, transom, eaves; roof grid fainter
  const xs = divide(GRID_X, 3).map(x => Math.min(IN.x1, Math.max(IN.x0, x)));
  const ys = divide(GRID_Y, 2).map(y => Math.min(IN.y1, Math.max(IN.y0, y)));
  const seg = [];
  for (const x of xs) { seg.push([[x, IN.y0, 0], [x, IN.y0, HN]], [[x, IN.y1, 0], [x, IN.y1, HS]]); }
  for (const y of ys) { seg.push([[IN.x0, y, 0], [IN.x0, y, hAt(y)]], [[IN.x1, y, 0], [IN.x1, y, hAt(y)]]); }
  for (const [y, h] of [[IN.y0, HN], [IN.y1, HS]]) for (const z of [0.02, DOOR_H, h]) seg.push([[IN.x0, y, z], [IN.x1, y, z]]);
  for (const x of [IN.x0, IN.x1]) for (const z of [0.02, DOOR_H]) seg.push([[x, IN.y0, z], [x, IN.y1, z]]);
  for (const x of [IN.x0, IN.x1]) seg.push([[x, IN.y0, HN], [x, IN.y1, HS]]);
  b.add(lines(seg, frame));
  const roof = [];
  for (const x of xs) roof.push([[x, IN.y0, HN], [x, IN.y1, HS]]);
  for (const y of ys) roof.push([[IN.x0, y, hAt(y)], [IN.x1, y, hAt(y)]]);
  b.add(lines(roof, frameFaint));
  // door marks on the floor
  for (const [a, c] of DOORS.n) b.add(slabRect(a, -0.6, c, IN.y0, M.wall, 0.02, 0.01, false));
  for (const [a, c] of DOORS.s) b.add(slabRect(a, IN.y1, c, D + 0.6, M.wall, 0.02, 0.01, false));
  b.add(slabRect(-0.6, DOORS.w[0][0], IN.x0, DOORS.w[0][1], M.wall, 0.02, 0.01, false));
  b.add(slabRect(IN.x1, DOORS.e[0][0], L + 0.6, DOORS.e[0][1], M.wall, 0.02, 0.01, false));
  // closed rooms on the north side and the kitchen counter
  b.add(box(DEPOT.x0, DEPOT.y0, DEPOT.x1, DEPOT.y1, 3.0, M.core)); b.add(label('Depot', (DEPOT.x0 + DEPOT.x1) / 2, 1.5, 3.05, 'room'));
  b.add(box(AFFALD.x0, AFFALD.y0, AFFALD.x1, AFFALD.y1, 3.0, M.core)); b.add(label('Affald', (AFFALD.x0 + AFFALD.x1) / 2, 1.35, 3.05, 'room'));
  b.add(box(KITCHEN.x0, KITCHEN.y0, KITCHEN.x1, KITCHEN.y1, 0.9, M.core)); b.add(label('Køkkenbord og vask', 29.8, 1.4, 0.95, 'small'));
  // columns from the old market hall roof, outside the glass
  for (const [x, y] of COLS) b.add(box(x - 0.12, y - 0.12, x + 0.12, y + 0.12, COL_H, steel));
  b.add(label('Søjle fra torvehallen', 19.4, 9.9, 0.05, 'small'));
  // overall dimensions
  b.add(dashed([[0, D + 1.9], [L, D + 1.9]], 0.02, false)); b.add(label(`${fmt(L)} m`, L / 2 - 5, D + 1.9, 0.05, 'small'));
  b.add(dashed([[-1.9, 0], [-1.9, D]], 0.02, false)); b.add(label(`${fmt(D)} m`, -1.9, D / 2, 0.05, 'small'));
  b.add(label('Dør', 16.0, -1.0, 0.05, 'small')); b.add(label('Dør', 16.0, D + 1.0, 0.05, 'small'));
  b.add(label('Dør', -1.0, 3.5, 0.05, 'small')); b.add(label('Dør', L + 1.0, 3.5, 0.05, 'small'));
  return b;
}

// ståbord: round top 70 cm at 1,1 m
function highTable(x, y) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.03, 24), M.table);
  top.position.y = 1.1; top.castShadow = true; g.add(top);
  const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 8), M.chair);
  leg.position.y = 0.55; g.add(leg);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.02, 16), M.chair);
  foot.position.y = 0.01; g.add(foot);
  g.position.copy(V(x, y, 0));
  return g;
}

const TY0 = 5.15, TY1 = 5.95;          // langbordets placering på tværs
const RUNS = [[3.2, 14.0], [17.8, 28.6]];   // to borde à 10,8 m, åbning ud for dørene

function palmLayout(kind) {
  const g = new THREE.Group();
  let seats = 0, standing = 0, extra = {};
  if (kind === 'langbord') {
    for (const [a, c] of RUNS) { const t = seatedTable(a, TY0, c, TY1); g.add(t); seats += t.userData.seats; }
    g.add(passage(14.75, IN.y0, 17.25, IN.y1, 0.02));
    g.add(label('Fri vej mellem dørene', 16.0, 7.4, 0.05, 'pass'));
    g.add(label(`LANGBORD<span>${seats} pladser · 2 × 10,8 m</span>`, 4.6, 1.7, 0.05, 'zone'));
  }
  if (kind === 'reception') {
    const spots = [[3.0, 2.0], [3.0, 6.2], [6.2, 4.2], [9.6, 4.6], [11.6, 7.0], [7.4, 7.0], [20.2, 4.4], [22.6, 6.8], [25.2, 4.2], [27.2, 6.8], [30.0, 4.6], [25.6, 1.8]];
    const ring = [[0.62, 0], [-0.31, 0.54], [-0.31, -0.54]];
    for (const [x, y] of spots) {
      g.add(highTable(x, y));
      for (const [dx, dy] of ring) g.add(person(x + dx, y + dy));
    }
    standing = 100;
    g.add(passage(14.75, IN.y0, 17.25, IN.y1, 0.02));
    g.add(label('Fri vej mellem dørene', 16.0, 7.4, 0.05, 'pass'));
    g.add(label(`RECEPTION<span>op til ${standing} stående · ${spots.length} ståborde</span>`, 6.8, -0.9, 0.05, 'zone'));
    extra = { tables: spots.length };
  }
  if (kind === 'tom') {
    g.add(label(`PALMEHUSET<span>219 m² gulv · ${fmt(L)} × ${fmt(D)} m</span>`, 16.0, 5.4, 0.05, 'zone'));
    g.add(lines([[[-0.7, IN.y0, 0], [-0.7, IN.y0, HN]], [[-0.7, IN.y1, 0], [-0.7, IN.y1, HS]]], frame));
    g.add(label('4,0 m til loft', -0.7, IN.y0, HN / 2, 'small'));
    g.add(label('6,0 m til loft', -0.7, IN.y1, HS / 2, 'small'));
  }
  const eye = kind === 'langbord' ? { x: 1.2, y: 5.55, h: 1.6, look: [28, 5.4, 0.8] }
    : kind === 'reception' ? { x: 16.0, y: 7.9, h: 1.6, look: [30, 3.4, 1.0] } : { x: 1.2, y: 6.6, h: 1.6, look: [28, 3.6, 1.2] };
  return { g, info: { seats, standing, eye, ...extra } };
}

function palmView(name, layout, i) {
  const P = (x, y, h) => { const [X, Z] = W(x, y); return [X, h, Z]; };
  if (name === 'eye') { const e = i.eye; return { pos: P(e.x, e.y, e.h), tgt: P(...e.look), fov: 62 }; }
  if (name === 'top') return { pos: P(15.9, 4.16, 52), tgt: P(15.9, 4.15, 0), fov: 30, fit: 1.7 };
  if (name === 'side') return { pos: P(42, -14, 20), tgt: P(15.0, 4.2, 1.2), fov: 30 };
  return { pos: P(3, 43, 29), tgt: P(15.9, 4.0, 1.2), fov: 30, fit: 1.35 };
}

const NOTE = 'Glas, døre, søjler og mål er fra Lendagers tegninger fra 2019 (2(21O)011 og 030). Planter, møbler og køkkenbordet er ikke tjekket mod, hvordan huset ser ud i dag.';
export const palmehus = {
  name: 'Palmehuset', tab: 'Palmehuset', floor: 'Drivhuset',
  // november-marts: drivhuset er uopvarmet (Gustav 24/11)
  notice: () => { const m = new Date().getMonth(); return m >= 10 || m <= 2 ? 'Uopvarmet om vinteren' : ''; },
  building: buildPalm,
  view: palmView,
  src: 'Mål fra Lendagers tegninger af orangeriet, 2(21O)011 og 2(21O)030 (Revit, 2019), skala 1:50. Vejledende, ikke opmålt. Kapacitet og regler fra Fabulas udlejningstekst.',
  layouts: {
    langbord: {
      chip: 'Langbord · 72', title: 'Langbord for 72', cap: 'Langbord for 72 gæster',
      lead: 'Bryllup, konfirmation eller fest ved ét langt bord gennem drivhuset. Bordet er delt ud for dørene, så der er fri vej på tværs, og der er plads til velkomst i den ene ende og køkken i den anden.',
      build: () => palmLayout('langbord'),
      kpis: i => [[i.seats, 'pladser ved langbordet'], ['2 × 10,8 m', 'borde, 18 pladser pr. side'], ['70-75', 'siddende højst'], ['1,8 m', 'fri gang bag stolene på begge sider']],
      short: i => `${i.seats} pladser ved ét langbord delt ud for dørene`,
      note: NOTE,
    },
    reception: {
      chip: 'Reception · 100', title: 'Reception for 100', cap: 'Reception for 100 stående',
      lead: 'Stående velkomst, reception eller fest med ståborde. Op til 100 gæster kan være i drivhuset på én gang.',
      build: () => palmLayout('reception'),
      kpis: i => [['100', 'stående højst'], [i.tables, 'ståborde i modellen'], ['219 m²', 'gulv'], ['8.30-22', 'adgang til huset']],
      short: () => 'Op til 100 stående med ståborde',
      note: NOTE,
    },
    tom: {
      chip: 'Tomt drivhus', title: 'Palmehuset', cap: 'Tomt drivhus · 219 m²',
      lead: 'Et uopvarmet drivhus af glas ved siden af Kulturhuset Fabula, som FAR står for. På hverdage til virksomheder, i weekenden til fester, mest i dagtimerne. FAR sørger for booking, mad og servering; I stiller selv op og rydder lokalet.',
      build: () => palmLayout('tom'),
      kpis: () => [['219 m²', 'gulv i drivhuset'], [`${fmt(L)} × ${fmt(D)} m`, 'udvendige mål'], ['4-6 m', 'til loftet, lavest mod nord'], ['4', 'døre: to i gavlene, to midt på langsiderne']],
      short: () => `219 m² glashus · ${fmt(L)} × ${fmt(D)} m · 4 døre`,
      note: NOTE,
    },
  },
};
