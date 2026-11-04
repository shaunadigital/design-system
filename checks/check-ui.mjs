// npm run check:ui · runs after every build (see package.json). Fails the build
// when a v2 page breaks a rule in DESIGN.md, whether a person or Claude wrote it.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const tokens = JSON.parse(readFileSync(join(root, 'tokens/tokens.json')));
const results = [];
const check = (name, problems) => results.push({ name, problems });

// Pages built with the v2 system carry data-system="v2" on <html>.
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const pages = walk(join(root, 'dist')).filter((p) => p.endsWith('.html'))
  .map((p) => ({ p: p.replace(join(root, 'dist'), ''), html: readFileSync(p, 'utf8') }))
  .filter((x) => x.html.includes('data-system="v2"'));
const strip = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
const text = (h) => strip(h).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');

// 1. Contrast
const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
// Every pair is checked in both themes: day, and dusk (day values with the dusk overrides on top).
const themes = { day: { ...tokens.color, ...tokens.art }, dusk: { ...tokens.color, ...tokens.art, ...tokens.dusk.color, ...tokens.dusk.art } };
const lowPairs = Object.entries(themes).flatMap(([name, all]) => tokens.contrast.pairs.map(([f, b]) => [f, b, ratio(all[f], all[b])])
  .filter(([, , r]) => r < 4.5).map(([f, b, r]) => `${name}: ${f} on ${b} is ${r.toFixed(2)}:1`));
const srcFiles = walk(join(root, 'src')).filter((p) => /src\/(styles\/v2\.css|components\/v2\/|components\/blog\/|layouts\/LayoutV2|pages\/(blog\/index|blog\/\[slug\]|index|system|resume|work\/rescue-platform|work\/ai-design-systems|work\/outreach-app|work\/retail-brand-programs)\.astro)/.test(p));
// --accent (3.73:1) is for graphics only: logo mark, accent period, arrows. Mark those lines `/* graphic */`.
const reefText = srcFiles.flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => [l, i + 1])
  .filter(([l]) => /(^|[^-])color:\s*var\(--accent\)/.test(l) && !l.includes('/* graphic */'))
  .map(([, n]) => `${f.replace(root, '')}:${n} uses --accent for text (mark graphic uses with /* graphic */)`));
check('Text contrast stays at or above 4.5:1 in day and dusk, including interactive states', [...lowPairs, ...reefText]);

// 2. Tokens only: no raw colour literals in v2 style code
const raw = [];
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  const css = f.endsWith('.css') ? s : [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g)) raw.push(`${f.replace(root, '')}: ${m[0]}`);
}
// Type: every font-size is a --text-* token (print pt sizes and frame-scaled cqw sizes excepted).
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/font-size:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!v.startsWith('var(--text-') && !/pt\b|cqw/.test(v)) raw.push(`${f.replace(root, '')}:${i + 1} font-size ${v} is not on the type scale`);
    }
  });
}
// Letter-spacing: every value is a --tracking-* token or 0 (tokens.json "tracking"). Added 2026-10-18.
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/letter-spacing:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!v.startsWith('var(--tracking-') && !/^(0|normal)$/.test(v)) raw.push(`${f.replace(root, '')}:${i + 1} letter-spacing ${v} is not a tracking token`);
    }
  });
}
check('Colour, typography, and spacing come from shared tokens', raw);

// 3. Buttons: Title Case, no em dashes in any copy
const small = new Set(['a', 'an', 'and', 'the', 'of', 'to', 'with', 'for', 'in', 'on', 'at', 'by', 'or', 'nor', 'but', 'as', 'per', 'via', 'vs']);
const btnProblems = [];
for (const { p, html } of pages) {
  for (const m of html.matchAll(/<(a|button|span)\b[^>]*class="[^"]*\bbtn\b[^"]*"[^>]*>([\s\S]*?)<\/\1>/g)) {
    // Text a person wrote keeps its own case (DESIGN.md, Buttons): skip anything marked data-user-content.
    if (/data-user-content/.test(m[0].slice(0, m[0].indexOf('>') + 1))) continue;
    const label = m[2].replace(/<(\w+)\b[^>]*data-user-content[^>]*>[\s\S]*?<\/\1>/g, ' ').replace(/<span class="sr-only"[\s\S]*?<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = label.split(' ').filter((w) => /[a-zA-Zé]/.test(w));
    words.forEach((w, i) => { if ((i === 0 || !small.has(w.toLowerCase())) && w[0] !== w[0].toUpperCase()) btnProblems.push(`${p}: "${label}"`); });
  }
  if (text(html).includes('—')) btnProblems.push(`${p}: contains an em dash`);
}
check('Buttons use consistent casing and language', [...new Set(btnProblems)]);

// 4. Alt text and accessible names
const a11y = [];
for (const { p, html } of pages) {
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt(=|[\s>/])/.test(m[0])) a11y.push(`${p}: img without alt`); // a bare alt is an empty alt (decorative)
  for (const m of strip(html).matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const name = m[3].replace(/<[^>]+>/g, '').trim();
    if (!name && !/aria-label="[^"]+"/.test(m[2])) a11y.push(`${p}: <${m[1]}> with no label`);
  }
}
check('Images include alternative text and controls have accessible labels', a11y);

// 5. Motion
const motion = [];
const css = readFileSync(join(root, 'src/styles/v2.css'), 'utf8');
if (!/prefers-reduced-motion:\s*reduce/.test(css)) motion.push('v2.css has no reduced-motion rule');
for (const { p, html } of pages) {
  if (/<video\b[^>]*autoplay/.test(html) && !/data-pause/.test(html)) motion.push(`${p}: autoplaying video without a pause button`);
  if (/transition:[^;]*\b\d+m?s\b/.test(html.match(/<style[\s\S]*?<\/style>/g)?.join('') ?? '')) motion.push(`${p}: a transition uses a raw duration`);
}
check('Motion follows one system and respects reduced-motion preferences', motion);

// 6. Hover: only things you can click move on hover. The hovered element must be a link,
// a button or a .btn; anything else that lifts or slides on hover promises a click it can't keep.
const hover = [];
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)) {
    if (!/transform|translate/.test(m[2]) || /transform:\s*none/.test(m[2])) continue;
    for (const sel of m[1].split(',').filter((x) => x.includes(':hover'))) {
      const hovered = sel.split(':hover')[0].trim().split(/[\s>+~]+/).pop();
      if (!/^(a|button)\b|\.btn\b|\[href\]/.test(hovered)) hover.push(`${f.replace(root, '')}: "${sel.trim()}" moves on hover but is not a link or button`);
    }
  }
}
check('Only links and buttons move on hover', [...new Set(hover)]);

// 7. Phone frames (2026-10-24): every phone screen (a 390 x 844 or 780 x 1688 image or video) sits inside the
// one PhoneFrame component, so every phone on the site has the same bezel and corners. List thumbnails that crop a
// phone screen are marked data-thumb.
const frames = [];
for (const { p, html } of pages) {
  for (const m of html.matchAll(/<(img|video)\b[^>]*>/g)) {
    const tag = m[0];
    if (!/width="(390|780)"/.test(tag) || !/height="(844|1688)"/.test(tag) || /data-thumb/.test(tag)) continue;
    const before = html.slice(Math.max(0, m.index - 400), m.index);
    if (!/class="phone-screen/.test(before)) frames.push(`${p}: a phone screen outside PhoneFrame (${(tag.match(/(src|poster)="([^"]+)"/) || [])[2] || tag.slice(0, 60)})`);
  }
}
check('Phone screens use the one phone frame', frames);

console.log(`\n$ npm run check:ui   (${pages.length} pages)`);
let failed = 0;
for (const r of results) {
  console.log(`${r.problems.length ? '✗' : '✓'} ${r.name}`);
  for (const x of r.problems) console.log(`    ${x}`);
  failed += r.problems.length;
}
if (!pages.length) { console.log('✗ No v2 pages found in dist/'); process.exit(1); }
if (failed) { console.log(`\n${failed} problem(s). Build failed.`); process.exit(1); }
console.log('\nAll checks passed.');
