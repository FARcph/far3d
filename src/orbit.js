import { Vector3, Spherical } from 'three';

// Small orbit control: drag to rotate, right-drag/shift/two fingers to pan, wheel or pinch to zoom.
export class Orbit {
  constructor(camera, el, { wheelModifier = false } = {}) {
    Object.assign(this, { camera, el, target: new Vector3(), minDistance: 2, maxDistance: 220, minPolarAngle: 0.02, maxPolarAngle: Math.PI * 0.495, damping: 0.14 });
    this._dt = 0; this._dp = 0; this._scale = 1; this._pan = new Vector3(); this._s = new Spherical(); this._o = new Vector3();
    const ptrs = new Map();
    let last = null;
    const centre = () => { let x = 0, y = 0; for (const p of ptrs.values()) { x += p.x; y += p.y; } return { x: x / ptrs.size, y: y / ptrs.size }; };
    const spread = () => { const a = [...ptrs.values()]; return a.length < 2 ? 0 : Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y); };
    const snap = pan => ({ c: centre(), d: spread(), pan });
    el.addEventListener('pointerdown', e => {
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      last = snap(e.button === 2 || e.shiftKey);
    });
    el.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId) || !last) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = centre(), d = spread(), h = el.clientHeight || 1, dx = c.x - last.c.x, dy = c.y - last.c.y;
      if (ptrs.size > 1) { if (last.d > 0 && d > 0) this._scale *= last.d / d; this.pan(dx, dy); }
      else if (last.pan) this.pan(dx, dy);
      else { this._dt -= 2 * Math.PI * dx / h; this._dp -= 2 * Math.PI * dy / h; }
      last = snap(last.pan);
    });
    const up = e => { ptrs.delete(e.pointerId); last = ptrs.size ? snap(last && last.pan) : null; };
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('wheel', e => {
      if (wheelModifier && !(e.ctrlKey || e.metaKey)) return;
      e.preventDefault();
      this._scale *= Math.pow(1.0015, e.deltaY * (e.ctrlKey ? 4 : 1));
    }, { passive: false });
  }
  pan(dx, dy) {
    const cam = this.camera, h = this.el.clientHeight || 1;
    cam.updateMatrix();
    const dist = this._o.copy(cam.position).sub(this.target).length() * Math.tan(cam.fov * Math.PI / 360);
    this._pan.add(new Vector3().setFromMatrixColumn(cam.matrix, 0).multiplyScalar(-2 * dx * dist / h));
    this._pan.add(new Vector3().setFromMatrixColumn(cam.matrix, 1).multiplyScalar(2 * dy * dist / h));
  }
  update() {
    const k = this.damping, s = this._s.setFromVector3(this._o.copy(this.camera.position).sub(this.target));
    s.theta += this._dt * k;
    s.phi = Math.min(this.maxPolarAngle, Math.max(this.minPolarAngle, s.phi + this._dp * k));
    s.radius = Math.min(this.maxDistance, Math.max(this.minDistance, s.radius * this._scale));
    s.makeSafe();
    this._scale = 1;
    this.target.addScaledVector(this._pan, k);
    this.camera.position.copy(this.target).add(this._o.setFromSpherical(s));
    this.camera.lookAt(this.target);
    this._dt *= 1 - k; this._dp *= 1 - k; this._pan.multiplyScalar(1 - k);
  }
}
