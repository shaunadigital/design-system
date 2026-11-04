// Scores every spoken reply in eval/voice/runs against the Spoken replies rules (DESIGN.md, Voice and sound).
// Limits come from tokens.json "voice", the same values the site uses.
// usage: node eval/voice/score.mjs            writes runs/<g>/<q>/<n>/score.json and eval/voice/summary.json
//        node eval/voice/score.mjs --test     checks the checker on hand-written examples
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const E = new URL('.', import.meta.url).pathname;
import { check, RULES } from './check.mjs';


if (process.argv.includes('--test')) {
  const cases = [
    [true, 'Shauna is a product designer in Honolulu. She builds the design system and ships the product on top of it. Want to hear about her case studies?'],
    [false, 'Here are the checks:\n1. Contrast\n2. Tokens'],
    [false, 'You can find them at https://shauna.dev/system/ today.'],
    [false, 'Open tokens/tokens.json to see them.'],
    [false, 'Email hello@example.com to reach her.'],
    [false, 'She uses Claude Code, Figma, Astro & React.'],
    [false, 'Only links/buttons move on hover.'],
    [false, 'It works **really** well.'],
    [false, 'Great question! 🎉 She builds systems.'],
    [false, 'Her tools include Figma, e.g. for libraries.'],
    [false, 'One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five twenty-six.'],
    [false, Array(61).fill('word').join(' ') + '.'],
    [true, 'Her system passed all 120 pages, with 7 button styles instead of 30. Want the details?'],
    [true, 'It covers the System page and the tokens file, nothing more.'],
  ];
  let bad = 0;
  for (const [want, text] of cases) { const r = check(text); if (r.pass !== want) { bad++; console.log('WRONG', want, JSON.stringify(r.issues), text.slice(0, 60)); } }
  console.log(bad ? `${bad} of ${cases.length} checker cases wrong` : `checker ok: ${cases.length} cases`);
  process.exit(bad ? 1 : 0);
}

// RUNS=run2 node eval/voice/score.mjs scores a repeat run kept in its own folder (summary-run2.json).
const RUNS = process.env.RUNS || 'runs';
const R = join(E, RUNS);
if (!existsSync(R)) { console.log('No runs yet. Run: bash eval/voice/run.sh'); process.exit(0); }
const summary = { run: '', groups: {} };
for (const g of readdirSync(R)) {
  const s = { replies: 0, passed: 0, byRule: Object.fromEntries(RULES.map((r) => [r, 0])), medianWords: 0, byQuestion: {} };
  const wl = [];
  for (const q of readdirSync(join(R, g))) for (const n of readdirSync(join(R, g, q))) {
    const dir = join(R, g, q, n), f = join(dir, 'reply.txt');
    if (!existsSync(f)) continue;
    const r = check(readFileSync(f, 'utf8'));
    writeFileSync(join(dir, 'score.json'), JSON.stringify(r, null, 1));
    s.replies++; if (r.pass) s.passed++; wl.push(r.words);
    for (const k of RULES) if (r.issues[k].length) s.byRule[k]++;
    s.byQuestion[q] ??= { replies: 0, passed: 0 }; s.byQuestion[q].replies++; if (r.pass) s.byQuestion[q].passed++;
    if (!summary.run) { try { const ss = JSON.parse(readFileSync(join(dir, 'session.json'), 'utf8')); summary.run = `Claude Code, models: ${Object.keys(ss.modelUsage ?? {}).join(', ')}`; } catch {} }
  }
  wl.sort((a, b) => a - b); s.medianWords = wl[Math.floor(wl.length / 2)] ?? 0;
  summary.groups[g] = s;
}
summary.note = 'byRule counts replies that broke that rule. A reply passes only if it breaks none.';
writeFileSync(join(E, RUNS === 'runs' ? 'summary.json' : `summary-${RUNS}.json`), JSON.stringify(summary, null, 1));
for (const [g, s] of Object.entries(summary.groups)) console.log(`${g}: ${s.passed}/${s.replies} passed, median ${s.medianWords} words, broke: ${RULES.map((r) => `${r} ${s.byRule[r]}`).join(', ')}`);
