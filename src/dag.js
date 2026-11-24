import { createViewer } from './engine.js';
import { huset } from './venues.js';
import { palmehus } from './palmehus.js';

// Dagbygger til virksomheder: vælg antal, sted, varighed, indhold og mad -> program med tider + 3D.
// Indholdet kommer fra "Teambuilding til virksomheder" (Thor og Anders) og "FAR services". Ret teksterne her.
export const INDHOLD = {
  sankning: { navn: 'Sankning', tekst: 'Introduktion til sankning: udstyr, bøger, biotoper, og hvad man må og ikke må.', bord: true },
  smagning: { navn: 'Smagning af urter og te', tekst: 'Smag på urtehaven, te-ceremoni, fun facts og quiz.', bord: true },
  syltning: { navn: 'Syltning og fermentering', tekst: 'Holdet laver mad sammen med vores kokke og tager glas med hjem.', bord: true },
  vin: { navn: 'Vinsmagning', tekst: 'Sådan smager, dufter og beskriver man vin, med FARs sommelier.', bord: true },
  moede: { navn: 'Jeres eget møde', tekst: 'Plateauet med stor skærm til oplæg eller møde.', bord: false },
};
export const MAD = {
  morgenmad: { navn: 'Morgenmad', tekst: 'Kaffe og surdejsbolle med ost og hjemmelavet marmelade.' },
  frokost: { navn: 'Frokost', tekst: 'Sæsonens grøntsager, og vi fortæller om maden.' },
  kage: { navn: 'Kaffe og kage', tekst: 'Hjemmebagt kage og kaffe.' },
  aften: { navn: 'Aftensmad', tekst: '4-5 retter til deling af sæsonens grøntsager.' },
};
// Skabeloner: tidspunkt, type. 'w' fyldes med det valgte indhold i rækkefølge; tomme pladser falder væk.
export const FORMATER = {
  formiddag: { navn: 'Formiddag', tid: '09.00-13.00', maks: 2, mad: ['morgenmad', 'frokost'],
    slots: [['09.00', 'mad:morgenmad'], ['09.30', 'rundvisning'], ['10.00', 'w'], ['11.15', 'w'], ['12.15', 'mad:frokost'], ['13.00', 'farvel']] },
  hel: { navn: 'Hel dag', tid: '09.00-16.30', maks: 3, mad: ['morgenmad', 'frokost', 'kage'],
    slots: [['09.00', 'mad:morgenmad'], ['09.30', 'rundvisning'], ['10.30', 'w'], ['12.00', 'mad:frokost'], ['13.00', 'w'], ['14.30', 'w'], ['16.00', 'mad:kage'], ['16.30', 'farvel']] },
  aften: { navn: 'Eftermiddag og aften', tid: '13.00-20.00', maks: 2, mad: ['kage', 'aften'],
    slots: [['13.00', 'mad:kage'], ['13.30', 'rundvisning'], ['14.00', 'w'], ['15.30', 'w'], ['17.30', 'mad:aften'], ['20.00', 'farvel']] },
};
const MAKS = { huset: { bord: 24, moede: 57, spise: 60 }, palmehus: { bord: 72, moede: 72, spise: 72 } };

// Hvilket rum og hvilken opstilling programmet giver
function opstilling(s) {
  const bord = s.indhold.some(k => INDHOLD[k].bord);
  if (s.sted === 'palmehus') return { venue: 'palmehus', layout: 'langbord', navn: 'Palmehuset · Langbord for 72', maks: MAKS.palmehus.bord };
  const up = !bord && s.indhold.includes('moede') && s.antal > 24 ? 'oplaeg' : 'workshop';
  const down = s.antal > 24 ? 'langsiden' : 'samtalebordet';
  const maks = Math.min(up === 'workshop' ? MAKS.huset.bord : MAKS.huset.moede, MAKS.huset.spise);
  const def = huset.layouts[`${up}-${down}`];
  return { venue: 'huset', layout: `${up}-${down}`, navn: `Hele huset · ${def.title}`, maks };
}
const STED = {
  huset: { navn: 'Kulturhuset Fabula', kort: 'Plateauet på 1. sal og bordet nedenunder' },
  palmehus: { navn: 'Palmehuset', kort: 'Drivhuset for jer selv, hverdage' },
};

export function program(s) {
  const f = FORMATER[s.format], valgt = s.indhold.slice(0, f.maks), out = [];
  let w = 0;
  const op = s.sted === 'huset' ? 'Plateauet' : 'Palmehuset', ned = s.sted === 'huset' ? (s.antal > 24 ? 'Langsiden' : 'Samtalebordet') : 'Palmehuset';
  for (const [tid, type] of f.slots) {
    if (type === 'w') {
      const k = valgt[w++];
      if (k) out.push({ tid, navn: INDHOLD[k].navn, tekst: INDHOLD[k].tekst, sted: op, view: s.sted === 'huset' ? 'op' : 'persp' });
      else out.push({ tid, navn: 'Jeres egen tid', tekst: 'Til et møde, en pause eller en tur rundt på Grønttorvet.', sted: op, view: s.sted === 'huset' ? 'op' : 'persp', fri: true });
    } else if (type.startsWith('mad:')) {
      const k = type.slice(4);
      if (s.mad[k]) out.push({ tid, navn: MAD[k].navn, tekst: MAD[k].tekst, sted: ned, view: s.sted === 'huset' ? 'ned' : 'eye' });
    } else if (type === 'rundvisning') {
      if (s.rundvisning) out.push({ tid, navn: 'Rundvisning', tekst: 'Grønttorvet, Kulturhuset Fabula og FAR.', sted: 'Huset', view: 'persp' });
    } else if (type === 'farvel') {
      out.push({ tid, navn: 'Farvel', tekst: s.goodiebag ? 'En lille goodiebag med smagsprøver og en sankehåndbog.' : 'Tak for i dag.', sted: s.sted === 'huset' ? 'Huset' : 'Palmehuset', view: 'persp' });
    }
  }
  return out;
}
function advarsler(s, o) {
  const a = [];
  if (s.antal > o.maks) {
    if (s.sted === 'huset' && s.indhold.some(k => INDHOLD[k].bord)) a.push(`Workshop ved bord på plateauet er til højst 24. Til ${s.antal} passer Palmehuset bedre.`);
    else a.push(`${STED[s.sted].navn} er til højst ${o.maks} i denne opstilling.`);
  }
  if (s.sted === 'palmehus' && palmehus.notice && palmehus.notice()) a.push('Palmehuset er uopvarmet om vinteren.');
  if (s.indhold.length > FORMATER[s.format].maks) a.push(`${FORMATER[s.format].navn} har plads til ${FORMATER[s.format].maks} programpunkter.`);
  return a;
}

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const knap = (tekst, valgt, onclick) => { const b = el('button'); b.type = 'button'; b.textContent = tekst; b.setAttribute('aria-pressed', valgt); b.onclick = onclick; return b; };

export function mountDag(root) {
  if (root.dataset.ready) return;
  root.dataset.ready = '1';
  const s = { antal: 20, sted: 'huset', format: 'hel', indhold: ['sankning', 'smagning'], mad: { morgenmad: true, frokost: true, kage: true, aften: true }, rundvisning: true, goodiebag: true };
  const formSel = root.dataset.form || '#forespoergsel';
  root.innerHTML = '';
  const valg = el('div', 'dag-valg'), vis = el('div', 'dag-vis');
  root.append(valg, vis);
  const box = el('div', 'far3d'); box.dataset.ready = '1'; vis.append(box);
  const cap = el('div', 'far3d-cap'), stage = el('div', 'far3d-stage'), views = el('div', 'far3d-views');
  box.append(cap, stage); stage.append(views);
  const prog = el('ol', 'dag-program'), adv = el('div', 'dag-advarsel'), cta = el('div', 'dag-cta');
  vis.append(adv, prog, cta);
  const viewer = createViewer(stage, {
    venues: { huset, palmehus }, touchAction: 'pan-y', wheelModifier: true,
    onChange: ({ info, def }) => { cap.innerHTML = `<b>${def.title}</b><span>${def.short(info)}</span>`; },
    onView: name => views.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b.dataset.v === name)),
  });
  let shown = '';

  function gruppe(titel, ...born) { const g = el('div', 'dag-gruppe'); g.append(el('div', 'dag-titel', titel), ...born); return g; }
  function tegn() {
    const o = opstilling(s), p = program(s), a = advarsler(s, o), f = FORMATER[s.format];
    // valg
    valg.innerHTML = '';
    const antal = el('div', 'dag-antal');
    const minus = knap('−', false, () => { s.antal = Math.max(4, s.antal - 2); tegn(); });
    const plus = knap('+', false, () => { s.antal = Math.min(100, s.antal + 2); tegn(); });
    const inp = el('input'); inp.type = 'number'; inp.min = 4; inp.max = 100; inp.value = s.antal; inp.setAttribute('aria-label', 'Antal deltagere');
    inp.onchange = () => { s.antal = Math.max(4, Math.min(100, +inp.value || 4)); tegn(); };
    antal.append(minus, inp, plus, el('span', '', 'personer'));
    valg.append(gruppe('Hvor mange er I?', antal));
    const sted = el('div', 'dag-chips');
    for (const [k, v] of Object.entries(STED)) { const b = knap(v.navn, s.sted === k, () => { s.sted = k; tegn(); }); b.title = v.kort; sted.append(b); }
    valg.append(gruppe('Hvor', sted));
    const fmt = el('div', 'dag-chips');
    for (const [k, v] of Object.entries(FORMATER)) fmt.append(knap(`${v.navn} · ${v.tid}`, s.format === k, () => { s.format = k; tegn(); }));
    valg.append(gruppe('Hvor lang tid', fmt));
    const ind = el('div', 'dag-chips');
    for (const [k, v] of Object.entries(INDHOLD)) {
      const nr = s.indhold.indexOf(k);
      const b = knap(nr >= 0 ? `${nr + 1}. ${v.navn}` : v.navn, nr >= 0, () => {
        if (nr >= 0) s.indhold.splice(nr, 1); else s.indhold.push(k);
        tegn();
      });
      b.title = v.tekst; ind.append(b);
    }
    valg.append(gruppe(`Indhold · vælg op til ${f.maks}`, ind));
    const mad = el('div', 'dag-chips');
    for (const k of f.mad) mad.append(knap(MAD[k].navn, s.mad[k], () => { s.mad[k] = !s.mad[k]; tegn(); }));
    mad.append(knap('Rundvisning', s.rundvisning, () => { s.rundvisning = !s.rundvisning; tegn(); }));
    valg.append(gruppe('Mad og mere', mad));
    // 3D
    const key = `${o.venue}:${o.layout}`;
    if (key !== shown) {
      const first = !shown; shown = key;
      viewer.show(o.venue, o.layout, first);
      views.innerHTML = '';
      const vs = o.venue === 'huset' ? [['persp', 'Hele dagen'], ['op', 'Ovenpå'], ['ned', 'Nedenunder']] : [['persp', '3D'], ['eye', 'Indefra']];
      for (const [v, t] of vs) { const b = knap(t, false, () => viewer.setView(v)); b.dataset.v = v; views.append(b); }
    }
    // advarsler og program
    adv.innerHTML = a.map(t => `<p>${t}</p>`).join(''); adv.hidden = !a.length;
    prog.innerHTML = '';
    for (const x of p) {
      const li = el('li', x.fri ? 'fri' : '', `<time>${x.tid}</time><span><b>${x.navn}</b>${x.tekst}</span><em>${x.sted}</em>`);
      li.tabIndex = 0; li.onclick = () => viewer.setView(x.view); li.onkeydown = e => { if (e.key === 'Enter') viewer.setView(x.view); };
      prog.append(li);
    }
    cta.innerHTML = '';
    cta.append(knap('Forespørg på denne dag →', false, () => send(o, p)));
  }
  function send(o, p) {
    const f = FORMATER[s.format];
    const resume = `${f.navn} · ${s.antal} personer · ${STED[s.sted].navn}`;
    const tekst = [resume, ...p.map(x => `${x.tid} ${x.navn} (${x.sted})`)].join('\n');
    try { (window.dataLayer = window.dataLayer || []).push({ event: 'far3d_dag', far3d_valg: resume }); } catch (e) { /* ingen sporing */ }
    const host = document.querySelector(formSel), form = host && (host.tagName === 'FORM' ? host : host.querySelector('form'));
    if (!form) return;
    const skjult = (navn, v) => { let h = form.querySelector(`input[name="${navn}"]`); if (!h) { h = el('input'); h.type = 'hidden'; h.name = navn; form.insertBefore(h, form.firstChild); } h.value = v; };
    skjult('Program', tekst);
    skjult('Rum og opstilling', o.navn);
    const antal = form.querySelector('[name="Antal gaester"]'); if (antal) antal.value = s.antal;
    const hvor = form.querySelector('select[name="Hvor"]');
    if (hvor) for (const op of hvor.options) if (/fabula/i.test(op.text)) { hvor.value = op.value; hvor.dispatchEvent(new Event('change', { bubbles: true })); }
    let chip = form.parentNode.querySelector('.far3d-valg');
    if (!chip) { chip = el('div', 'far3d-valg'); form.parentNode.insertBefore(chip, form); }
    chip.innerHTML = '<span>Jeres dag</span><b></b><button type="button">Skift</button>';
    chip.querySelector('b').textContent = `${resume} · ${s.indhold.slice(0, f.maks).map(k => INDHOLD[k].navn).join(', ') || 'uden workshop'}`;
    chip.querySelector('button').onclick = () => root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    host.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  tegn();
}
export function bootDag() { document.querySelectorAll('.far3d-dag').forEach(mountDag); }
