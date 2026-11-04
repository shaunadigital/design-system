// Counts distinct styles across a set of builds (2026-11-02). Reads each build's inventory.json and score.json.
// usage: node tally.mjs <group dir> [<group dir> ...]   e.g. node tally.mjs suite-teams/with-v4 round2/varied/open-spec
// Env N=k limits each screen to builds 1..k (to compare groups at the same number of builds).
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const N = process.env.N ? Number(process.env.N) : Infinity;
const uniq = (a) => new Set(a).size;
const out = {};
for (const g of process.argv.slice(2)) {
  const builds = [];
  for (const scr of readdirSync(g)) {
    const sd = join(g, scr); if (!statSync(sd).isDirectory()) continue;
    for (const n of readdirSync(sd)) {
      if (Number(n) > N) continue;
      const d = join(sd, n); if (!existsSync(join(d, 'inventory.json'))) continue;
      const inv = JSON.parse(readFileSync(join(d, 'inventory.json'), 'utf8'));
      const sc = existsSync(join(d, 'score.json')) ? JSON.parse(readFileSync(join(d, 'score.json'), 'utf8')) : null;
      builds.push({ scr, n, inv, pass: sc ? !!sc.pass : null });
    }
  }
  const all = (k) => builds.flatMap((b) => b.inv[k] ?? []);
  // Share of all buttons on all pages that use the group's three most common button styles.
  const counts = {}; for (const s of all('buttons')) counts[s] = (counts[s] || 0) + 1;
  const top3 = Object.values(counts).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
  out[g] = {
    builds: builds.length,
    passed: builds.filter((b) => b.pass).length,
    buttons: uniq(all('buttons')), fields: uniq(all('inputs')), textColors: uniq(all('text')),
    backgrounds: uniq(all('bg')), corners: uniq(all('radii')), fontSizes: uniq(all('sizes')),
    top3ButtonShare: all('buttons').length ? Math.round((top3 / all('buttons').length) * 100) : null,
  };
}
console.log(JSON.stringify(out, null, 1));
