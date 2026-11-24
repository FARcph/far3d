// Bygger hjemmesidens 3D-modeller: node build.mjs  ->  dist/far3d-*.js og dist/far3d.css
import * as esbuild from 'esbuild';
import fs from 'node:fs/promises';

const CDN = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';
const cdnThree = { name: 'cdn-three', setup(b) { b.onResolve({ filter: /^three$/ }, () => ({ path: CDN, external: true })); } };

// Hjemmesiden viser kun titel, kort tekst og knapper: drop felter, som kun 3D-siden bruger
const PANEL = /^\s+(lead|kpis|note|cap|program|rules):/;
function stripPanel(src) {
  const out = [], lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!PANEL.test(lines[i])) { out.push(lines[i]); continue; }
    let depth = 0, j = i;
    for (; j < lines.length; j++) {
      const s = lines[j].replace(/'(?:[^'\\]|\\.)*'/g, "''");
      for (const ch of s) { if ('([{'.includes(ch)) depth++; else if (')]}'.includes(ch)) depth--; }
      if (depth <= 0 && /,\s*$/.test(lines[j])) break;
    }
    i = j;
  }
  return out.join('\n');
}
const slim = { name: 'slim', setup(b) { b.onLoad({ filter: /src[\\/](venues|palmehus)\.js$/ }, async a => ({ contents: stripPanel(await fs.readFile(a.path, 'utf8')), loader: 'js', resolveDir: 'src' })); } };

// Én fil pr. embed, så hver kun indeholder sine egne rum
const entries = {
  alle: "import { huset, plateau, restaurant } from './venues.js'; import { palmehus } from './palmehus.js'; boot({ palmehus, plateau, restaurant, huset });",
  huset: "import { huset } from './venues.js'; boot({ huset });",
  plateau: "import { plateau } from './venues.js'; boot({ plateau });",
  restaurant: "import { restaurant } from './venues.js'; boot({ restaurant });",
  palmehus: "import { palmehus } from './palmehus.js'; boot({ palmehus });",
  // Dagbygger til Virksomheder (egen fil, se src/dag.js)
  dag: "import { bootDag } from './dag.js'; bootDag();",
};
await fs.mkdir('dist', { recursive: true });
for (const [name, code] of Object.entries(entries)) {
  const head = name === 'dag' ? '' : "import { boot } from './embed.js'; ";
  await esbuild.build({ stdin: { contents: head + code, resolveDir: 'src', loader: 'js' }, bundle: true, minify: true, format: 'esm', outfile: `dist/far3d-${name}.js`, plugins: [cdnThree, slim], logLevel: 'warning', legalComments: 'none' });
}
const css = (await fs.readFile('src/style.css', 'utf8')).replace(/\s*\n\s*/g, '');
await fs.writeFile('dist/far3d.css', css + '\n');
for (const f of await fs.readdir('dist')) console.log(f, (await fs.stat('dist/' + f)).size);
