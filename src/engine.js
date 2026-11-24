import * as THREE from 'three';
import { Orbit } from './orbit.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

// FAR tokens
export const C = {
  sort: 0x2f2f2f, hvid: 0xf5f5f5, card: 0xededed, blaa: 0x9bb5d7, blaaMork: 0x86a2c7,
  accent: 0xcae474, groen: 0x74744d,
};

// Plan coordinates in metres from drawings 221S010/221S015 (x east, y south).
// World: X = x - CX, Z = y - CY, Y = height.
const CX = 14.0, CY = 7.0;
export const W = (x, y) => [x - CX, y - CY];
export const V = (x, y, h = 0) => { const [X, Z] = W(x, y); return new THREE.Vector3(X, h, Z); };
export const fmt = (v, d = 1) => v.toFixed(d).replace('.', ',');

const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0, ...extra });
export const M = {
  floor: mat(C.blaa), stair: mat(C.blaaMork), core: mat(C.card), ground: mat(0xe9e9e6), wall: mat(0xe2e2df),
  chair: mat(C.sort, { roughness: 0.7 }), table: mat(0xe4ddd0, { roughness: 0.8 }), screen: mat(0x1d1d1d, { roughness: 0.35 }),
  person: mat(C.groen, { roughness: 0.8 }),
  glass: new THREE.MeshStandardMaterial({ color: 0xdfe8f2, transparent: true, opacity: 0.22, roughness: 0.1, depthWrite: false, side: THREE.DoubleSide }),
  pass: new THREE.MeshBasicMaterial({ color: C.accent, transparent: true, opacity: 0.85, depthWrite: false }),
  zone: new THREE.MeshBasicMaterial({ color: C.blaa, transparent: true, opacity: 0.75, depthWrite: false }),
};
const edgeMat = new THREE.LineBasicMaterial({ color: C.sort, transparent: true, opacity: 0.55 });
const faintEdge = new THREE.LineBasicMaterial({ color: 0xa9a9a9, transparent: true, opacity: 0.7 });
const dashMat = new THREE.LineDashedMaterial({ color: 0x8a8a8a, dashSize: 0.35, gapSize: 0.25 });
const lineMat = new THREE.LineBasicMaterial({ color: C.sort });

function withEdges(mesh, m = edgeMat) { mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), m)); return mesh; }

export function slabRect(x0, y0, x1, y1, material, t = 0.22, top = 0, edges = true) {
  const [ax, az] = W(x0, y0), [bx, bz] = W(x1, y1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(bx - ax, t, bz - az), material);
  m.position.set((ax + bx) / 2, top - t / 2, (az + bz) / 2);
  m.receiveShadow = true;
  if (edges) withEdges(m);
  return m;
}
export function slabPoly(pts, material, t = 0.22, top = 0) {
  const s = new THREE.Shape(pts.map(([x, y]) => { const [X, Z] = W(x, y); return new THREE.Vector2(X, -Z); }));
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, material);
  m.position.y = top - t; m.receiveShadow = true;
  return withEdges(m);
}
export function box(x0, y0, x1, y1, h, material, base = 0) {
  const [ax, az] = W(x0, y0), [bx, bz] = W(x1, y1);
  const m = new THREE.Mesh(new THREE.BoxGeometry(bx - ax, h, bz - az), material);
  m.position.set((ax + bx) / 2, base + h / 2, (az + bz) / 2);
  m.castShadow = true; m.receiveShadow = true;
  return withEdges(m, faintEdge);
}
export function rail(x0, y0, x1, y1, base0 = 0, base1 = base0, h = 1.1) {
  const a = V(x0, y0), b = V(x1, y1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
    a.x, base0, a.z, b.x, base1, b.z, b.x, base1 + h, b.z, a.x, base0, a.z, b.x, base1 + h, b.z, a.x, base0 + h, a.z]), 3));
  g.computeVertexNormals();
  const grp = new THREE.Group();
  grp.add(new THREE.Mesh(g, M.glass));
  grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x0, y0, base0 + h), V(x1, y1, base1 + h)]), lineMat));
  grp.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([V(x0, y0, base0 + 0.02), V(x1, y1, base1 + 0.02)]), faintEdge));
  return grp;
}
export function dashed(pts, h = 0, closed = true) {
  const p = pts.map(([x, y]) => V(x, y, h));
  if (closed) p.push(p[0].clone());
  const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), dashMat);
  l.computeLineDistances();
  return l;
}
export function label(text, x, y, h = 0.05, cls = '') {
  const d = document.createElement('div');
  d.className = 'lbl ' + cls;
  d.innerHTML = text;
  const o = new CSS2DObject(d);
  o.position.copy(V(x, y, h));
  return o;
}
export function zone(x0, y0, x1, y1, h = 0, material = M.zone) {
  const [ax, az] = W(x0, y0), [bx, bz] = W(x1, y1);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(bx - ax, bz - az), material);
  m.rotation.x = -Math.PI / 2;
  m.position.set((ax + bx) / 2, h + 0.006, (az + bz) / 2);
  m.renderOrder = 1;
  return m;
}
export const passage = (x0, y0, x1, y1, h = 0) => zone(x0, y0, x1, y1, h, M.pass);

// Folding chair 44 x 51 cm, seat 46 cm, back 77 cm
export const CHAIR = { w: 0.44, d: 0.51 };
function makeChair() {
  const g = new THREE.Group();
  const add = (w, h, d, x, y, z, rx = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.chair);
    m.position.set(x, y, z); m.rotation.x = rx; m.castShadow = true; g.add(m);
  };
  add(0.38, 0.025, 0.34, 0, 0.46, -0.04);
  add(0.43, 0.11, 0.02, 0, 0.71, 0.215, -0.12);
  add(0.03, 0.80, 0.03, -0.20, 0.39, 0.20, -0.12);
  add(0.03, 0.80, 0.03, 0.20, 0.39, 0.20, -0.12);
  add(0.03, 0.50, 0.03, -0.20, 0.24, -0.17, 0.32);
  add(0.03, 0.50, 0.03, 0.20, 0.24, -0.17, 0.32);
  add(0.40, 0.02, 0.02, 0, 0.13, 0.02);
  return g;
}
let chairProto = null;
const ROT = { N: 0, S: Math.PI, E: -Math.PI / 2, W: Math.PI / 2 };
// Chair centred at (x, y), the sitter looking toward `facing`
export function chair(x, y, facing = 'N', base = 0) {
  if (!chairProto) chairProto = makeChair();
  const c = chairProto.clone();
  c.position.copy(V(x, y, base));
  c.rotation.y = ROT[facing];
  return c;
}
// Chair placed by its front edge (rows of theatre seating)
export function chairAt(x, yFront, facing, base = 0) {
  return chair(x, facing === 'N' ? yFront + CHAIR.d / 2 : yFront - CHAIR.d / 2, facing, base);
}
export function table(x0, y0, x1, y1, base = 0) {
  const g = new THREE.Group();
  const [ax, az] = W(x0, y0), [bx, bz] = W(x1, y1);
  const top = new THREE.Mesh(new THREE.BoxGeometry(bx - ax, 0.035, bz - az), M.table);
  top.position.set((ax + bx) / 2, base + 0.74, (az + bz) / 2);
  top.castShadow = true; top.receiveShadow = true;
  g.add(withEdges(top, faintEdge));
  const lg = new THREE.BoxGeometry(0.04, 0.72, 0.04);
  for (const [lx, lz] of [[ax + 0.06, az + 0.06], [bx - 0.06, az + 0.06], [ax + 0.06, bz - 0.06], [bx - 0.06, bz - 0.06]]) {
    const l = new THREE.Mesh(lg, M.chair); l.position.set(lx, base + 0.36, lz); g.add(l);
  }
  return g;
}
// Table with chairs on both long sides; seats per side computed from 60 cm per place
export function seatedTable(x0, y0, x1, y1, base = 0, ends = false) {
  const g = new THREE.Group();
  g.add(table(x0, y0, x1, y1, base));
  const alongX = (x1 - x0) >= (y1 - y0);
  const len = alongX ? x1 - x0 : y1 - y0;
  const n = Math.max(1, Math.floor(len / 0.6 + 1e-6));
  const pitch = len / n;
  let seats = 0;
  for (let i = 0; i < n; i++) {
    const t = (alongX ? x0 : y0) + pitch * (i + 0.5);
    if (alongX) { g.add(chair(t, y0 - 0.12, 'S', base)); g.add(chair(t, y1 + 0.12, 'N', base)); }
    else { g.add(chair(x0 - 0.12, t, 'E', base)); g.add(chair(x1 + 0.12, t, 'W', base)); }
    seats += 2;
  }
  if (ends) {
    if (alongX) { const yc = (y0 + y1) / 2; g.add(chair(x0 - 0.12, yc, 'E', base)); g.add(chair(x1 + 0.12, yc, 'W', base)); }
    else { const xc = (x0 + x1) / 2; g.add(chair(xc, y0 - 0.12, 'S', base)); g.add(chair(xc, y1 + 0.12, 'N', base)); }
    seats += 2;
  }
  g.userData.seats = seats;
  return g;
}
export function screenAt(x, yWall, facing, base = 0) {
  const g = new THREE.Group();
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.84, 0.06), M.screen);
  panel.position.set(0, 1.55, 0); panel.castShadow = true; g.add(panel);
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.08), M.chair);
  pole.position.set(0, 0.6, 0.05); g.add(pole);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 0.6), M.chair);
  foot.position.set(0, 0.02, 0.05); foot.castShadow = true; g.add(foot);
  const yc = facing === 'S' ? yWall + 0.35 : yWall - 0.35;
  g.position.copy(V(x, yc, base));
  g.rotation.y = facing === 'S' ? Math.PI : 0;
  return g;
}
export function person(x, y, base = 0) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.19, 1.1, 6, 12), M.person);
  body.position.y = 0.74; body.castShadow = true; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 12), M.person);
  head.position.y = 1.62; head.castShadow = true; g.add(head);
  g.position.copy(V(x, y, base));
  return g;
}
// Straight stair: runs along y from yLow (at hLow) to yHigh (at hHigh)
export function stair(x0, x1, yLow, yHigh, hLow, hHigh, n = 22) {
  const g = new THREE.Group();
  const run = (yHigh - yLow) / n, rise = (hHigh - hLow) / n;
  for (let i = 0; i < n; i++) {
    const ya = yLow + i * run, yb = ya + run;
    g.add(slabRect(x0, Math.min(ya, yb), x1, Math.max(ya, yb), M.stair, rise + 0.05, hLow + (i + 1) * rise));
  }
  g.add(rail(x0, yLow, x0, yHigh, hLow, hHigh, 1.0));
  g.add(rail(x1, yLow, x1, yHigh, hLow, hHigh, 1.0));
  return g;
}
// Spiral stair centred at (x, y), radius r, from h0 to h1, exit toward angle a1
export function spiral(x, y, r, h0, h1, n = 18, a1 = -Math.PI / 2) {
  const g = new THREE.Group();
  const c = V(x, y, 0);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, h1 - h0 + 1.0, 12), M.chair);
  pole.position.set(c.x, (h0 + h1) / 2 + 0.5, c.z); pole.castShadow = true; g.add(pole);
  const sweep = Math.PI * 1.75, step = sweep / n, rise = (h1 - h0) / n;
  for (let i = 0; i < n; i++) {
    const a = a1 - sweep + i * step;
    const geo = new THREE.CylinderGeometry(r, r, 0.05, 16, 1, false, 0, step * 1.05);
    const m = new THREE.Mesh(geo, M.stair);
    // CylinderGeometry thetaStart measured from +Z toward +X
    m.rotation.y = a;
    m.position.set(c.x, h0 + (i + 1) * rise, c.z);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

// ---------- viewer ----------
export function createViewer(host, opts = {}) {
  const { venues, offset = () => ({ sx: 0, sy: 0 }), onChange = () => {}, onView = () => {}, touchAction = 'none', wheelModifier = false } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(C.hvid);
  host.appendChild(renderer.domElement);
  const labels = new CSS2DRenderer();
  labels.domElement.className = 'far3d-labels';
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);
  const controls = new Orbit(camera, renderer.domElement, { wheelModifier });
  renderer.domElement.style.touchAction = touchAction;

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d8d0, 2.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(-14, 26, 18); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 18, bottom: -18, near: 1, far: 90 });
  sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
  scene.add(sun);

  const st = { venue: null, layout: null, view: 'persp', info: null };
  let building = null, content = null, anim = null, visible = true;
  const drop = o => { scene.remove(o); o.traverse(c => { if (c.isCSS2DObject && c.element.parentNode) c.element.parentNode.removeChild(c.element); }); };

  function show(venue, layout, instant = false) {
    const v = venues[venue];
    if (!v) return;
    if (!v.layouts[layout]) layout = Object.keys(v.layouts)[0];
    if (venue !== st.venue) { if (building) drop(building); building = v.building(); scene.add(building); st.venue = venue; }
    if (content) drop(content);
    const r = v.layouts[layout].build();
    content = r.g; st.info = r.info || {}; st.layout = layout;
    scene.add(content);
    onChange({ venue, layout, info: st.info, def: v.layouts[layout] });
    setView(st.view, instant);
  }
  function setView(name, instant = false) {
    st.view = name;
    const p = venues[st.venue].view(name, st.layout, st.info);
    if (name !== 'eye') {
      const k = Math.max(1, (p.fit || 1.3) / camera.aspect);
      for (let i = 0; i < 3; i++) p.pos[i] = p.tgt[i] + (p.pos[i] - p.tgt[i]) * k;
    }
    labels.domElement.classList.toggle('eye', name === 'eye');
    onView(name);
    if (instant) {
      camera.position.set(...p.pos); controls.target.set(...p.tgt); camera.fov = p.fov; camera.updateProjectionMatrix(); controls.update(); anim = null; return;
    }
    anim = { t: 0, fromP: camera.position.clone(), fromT: controls.target.clone(), fromF: camera.fov, toP: new THREE.Vector3(...p.pos), toT: new THREE.Vector3(...p.tgt), toF: p.fov };
  }
  function dolly(f) { const d = camera.position.clone().sub(controls.target).multiplyScalar(f); camera.position.copy(controls.target).add(d); controls.update(); }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); labels.setSize(w, h);
    camera.aspect = w / h;
    const { sx, sy } = offset(w, h);
    camera.setViewOffset(w, h, -sx, sy, w, h);
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver) new ResizeObserver(resize).observe(host); else window.addEventListener('resize', resize);
  if (window.IntersectionObserver) new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(host);
  const clock = new THREE.Clock();
  (function tick() {
    const dt = clock.getDelta();
    if (anim) {
      anim.t = Math.min(1, anim.t + dt / 0.9);
      const k = anim.t < 0.5 ? 2 * anim.t * anim.t : 1 - Math.pow(-2 * anim.t + 2, 2) / 2;
      camera.position.lerpVectors(anim.fromP, anim.toP, k);
      controls.target.lerpVectors(anim.fromT, anim.toT, k);
      camera.fov = anim.fromF + (anim.toF - anim.fromF) * k; camera.updateProjectionMatrix();
      if (anim.t >= 1) anim = null;
    }
    if (visible) { controls.update(); renderer.render(scene, camera); labels.render(scene, camera); }
    requestAnimationFrame(tick);
  })();
  resize();
  return { show, setView, dolly, resize, state: st };
}
