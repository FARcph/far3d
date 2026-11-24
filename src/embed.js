import { createViewer } from './engine.js';

// Webflow embeds
//   ét rum:    <div class="far3d" data-venue="palmehus" data-layouts="langbord,reception,tom"></div>
//   flere rum: <div class="far3d" data-venues="palmehus:langbord,reception,tom;plateau;restaurant" data-form="#forespoergsel"></div>
// Med data-form (eller flere rum) får modellen en knap, der udfylder forespørgselsformularen på siden.
const FIELD = 'Rum og opstilling';
const btn = (text, data, onclick) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = text; Object.assign(b.dataset, data); b.onclick = onclick; return b; };

function mount(el, VENUES) {
  if (el.dataset.ready) return;
  el.dataset.ready = '1';
  const multi = el.dataset.venues;
  // Start-opstilling: den første på listen, hvis listen er skrevet ud (fx huset:oplaeg-langsiden,...); ellers rummets pakke
  const startOf = {};
  const entries = (multi ? multi.split(';') : [`${el.dataset.venue}:${el.dataset.layouts || ''}`]).map(s => {
    const [v, l = ''] = s.split(':').map(x => x.trim());
    const V = VENUES[v];
    if (!V) return null;
    const keys = l.split(',').map(x => x.trim()).filter(k => V.layouts[k]);
    if (keys.length) startOf[v] = keys[0];
    return [v, keys.length ? keys : Object.keys(V.layouts)];
  }).filter(Boolean);
  if (!entries.length) return;
  const keysOf = Object.fromEntries(entries);
  const start = v => startOf[v] || (VENUES[v].primary && keysOf[v].includes(VENUES[v].primary) ? VENUES[v].primary : keysOf[v][0]);
  const formSel = el.dataset.form || (multi ? '#forespoergsel' : '');

  let box = el, tabs = null;
  if (multi) {
    el.className = 'far3d-multi';
    tabs = document.createElement('div'); tabs.className = 'far3d-tabs'; tabs.setAttribute('role', 'tablist'); el.appendChild(tabs);
    box = document.createElement('div'); box.className = 'far3d'; box.dataset.ready = '1'; el.appendChild(box);
  }
  const mk = (cls, parent = box) => { const d = document.createElement('div'); d.className = cls; parent.appendChild(d); return d; };
  const cap = mk('far3d-cap'), stage = mk('far3d-stage'), bar = mk('far3d-bar'), views = mk('far3d-views', stage);
  const cta = formSel ? mk('far3d-cta') : null;
  if (cta) box.classList.add('has-cta');
  let viewer, cur = {}, touched = false;

  const show = (venue, layout) => { touched = true; viewer.show(venue, layout); };
  const drawTabs = venue => {
    if (!tabs) return;
    tabs.innerHTML = '';
    for (const [v] of entries) {
      const b = btn(VENUES[v].tab || VENUES[v].name, {}, () => v !== venue && show(v, start(v)));
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', v === venue);
      tabs.appendChild(b);
    }
  };
  const drawBar = (venue, layout) => {
    bar.innerHTML = '';
    const v = VENUES[venue], keys = keysOf[venue], def = v.layouts[layout];
    if (v.picker && keys.length > 1) {
      for (const row of v.picker) {
        const opts = row.options.filter(([k]) => keys.some(key => v.layouts[key][row.key] === k));
        if (opts.length < 2) continue;
        const g = document.createElement('div'); g.className = 'far3d-row';
        g.innerHTML = `<span>${row.label}</span>`;
        for (const [k, name] of opts) {
          const b = btn(name, {}, () => {
            const want = { up: def.up, down: def.down, [row.key]: k };
            show(venue, keys.find(x => v.layouts[x].up === want.up && v.layouts[x].down === want.down) || keys.find(x => v.layouts[x][row.key] === k));
          });
          b.setAttribute('aria-pressed', def[row.key] === k);
          g.appendChild(b);
        }
        bar.appendChild(g);
      }
    } else if (keys.length > 1) {
      for (const k of keys) { const b = btn(v.layouts[k].chip, {}, () => show(venue, k)); b.setAttribute('aria-pressed', k === layout); bar.appendChild(b); }
    }
  };
  const drawViews = venue => {
    views.innerHTML = '';
    const vs = [['persp', '3D'], ['top', 'Plan'], ['side', 'Fra øst'], ['eye', 'Indefra']].filter(([k]) => venue === 'huset' ? k !== 'top' : k !== 'side');
    for (const [k, t] of vs) views.appendChild(btn(t, { v: k }, () => viewer.setView(k)));
  };

  function inquire() {
    const { venue, layout, def, info } = cur;
    const choice = `${VENUES[venue].tab || VENUES[venue].name} · ${def.title}`;
    const guests = info.guests || info.seats || info.standing || 0;
    try { (window.dataLayer = window.dataLayer || []).push({ event: 'far3d_forespoerg', far3d_valg: choice }); } catch (e) { /* ingen sporing */ }
    const host = document.querySelector(formSel);
    const form = host && (host.tagName === 'FORM' ? host : host.querySelector('form'));
    if (!form) { location.href = `/lej-stedet#${venue}-${layout}`; return; }
    let h = form.querySelector(`input[name="${FIELD}"]`);
    if (!h) { h = document.createElement('input'); h.type = 'hidden'; h.name = FIELD; form.insertBefore(h, form.firstChild); }
    h.value = choice;
    const hvor = form.querySelector('select[name="Hvor"]');
    if (hvor) for (const o of hvor.options) if (/fabula/i.test(o.text)) { hvor.value = o.value; hvor.dispatchEvent(new Event('change', { bubbles: true })); }
    const antal = form.querySelector('[name="Antal gaester"]');
    if (antal && guests) antal.placeholder = `Op til ${guests}`;
    let chip = form.parentNode.querySelector('.far3d-valg');
    if (!chip) { chip = document.createElement('div'); chip.className = 'far3d-valg'; form.parentNode.insertBefore(chip, form); }
    chip.innerHTML = '<span>Valgt rum</span><b></b><button type="button">Skift</button>';
    chip.querySelector('b').textContent = choice;
    chip.querySelector('button').onclick = () => el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const first = [...form.querySelectorAll('input:not([type=hidden]):not([type=submit]),textarea')].find(x => !x.value);
    if (first) setTimeout(() => first.focus({ preventScroll: true }), 800);
  }

  viewer = createViewer(stage, {
    venues: VENUES, touchAction: 'pan-y', wheelModifier: true,
    onChange: ({ venue, layout, info, def }) => {
      const venueChanged = venue !== cur.venue;
      cur = { venue, layout, info, def };
      box.dataset.venue = venue;
      const notice = VENUES[venue].notice ? VENUES[venue].notice() : '';
      cap.innerHTML = `${notice ? `<em>${notice}</em>` : ''}${def.primary ? '<i>Vores pakke</i>' : ''}<b>${def.title}</b><span>${def.short(info)}</span>`;
      drawBar(venue, layout);
      if (venueChanged) { drawTabs(venue); drawViews(venue); }
      if (cta && !cta.firstChild) cta.appendChild(btn('Forespørg på denne opstilling →', {}, inquire));
      if (multi && touched && history.replaceState) history.replaceState(null, '', `#${venue}-${layout}`);
    },
    onView: name => views.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === name)),
  });
  // deep link: /lej-stedet#palmehus-langbord
  const [hv, ...hl] = decodeURIComponent((location.hash || '').slice(1)).split('-');
  const deep = multi && keysOf[hv];
  const venue = deep ? hv : entries[0][0];
  const want = deep && keysOf[hv].includes(hl.join('-')) ? hl.join('-') : null;
  viewer.show(venue, want || start(venue), true);
  if (deep) setTimeout(() => el.scrollIntoView({ block: 'start' }), 300);
}
export function boot(VENUES) {
  document.querySelectorAll('.far3d,.far3d-multi').forEach(el => {
    const first = (el.dataset.venues || el.dataset.venue || '').split(/[;:]/)[0].trim();
    if (VENUES[first]) mount(el, VENUES);
  });
}
