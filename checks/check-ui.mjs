#!/usr/bin/env node
// check-ui · runs after every build of a site that uses this system. Fails the build
// when a v2 page breaks a rule in DESIGN.md, whether a person or Claude wrote it.
//
//   design-system-check-ui [--root <site>] [--config <file.json>]
//
// --root is the site to check (default: the current directory). --config is a JSON file, read relative to the
// current directory, that can set any of the keys in DEFAULTS below. The tokens come from this package unless the
// config names a "tokens" file in the site.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve, relative, extname } from 'node:path';
import { createServer } from 'node:http';

const arg = (flag) => {
  const i = process.argv.indexOf(flag);
  if (i < 0) return null;
  const v = process.argv[i + 1];
  if (!v || v.startsWith('--')) { console.error(`check-ui: ${flag} needs a value`); process.exit(2); }
  return v;
};
// What a site checks by default: shauna.dev's v2 pages. A path ending in / means every file under it.
const DEFAULTS = {
  dist: 'dist',
  src: [
    'src/styles/v2.css', 'src/components/v2/', 'src/components/blog/', 'src/layouts/LayoutV2.astro',
    'src/pages/blog/index.astro', 'src/pages/blog/[slug].astro', 'src/pages/index.astro', 'src/pages/system.astro',
    'src/pages/resume.astro', 'src/pages/work/rescue-platform.astro', 'src/pages/work/ai-design-systems.astro',
    'src/pages/work/outreach-app.astro', 'src/pages/work/retail-brand-programs.astro',
  ],
  reducedMotionCss: 'src/styles/v2.css',
};
const root = resolve(arg('--root') ?? process.cwd());
const configPath = arg('--config');
const config = { ...DEFAULTS, ...(configPath ? JSON.parse(readFileSync(resolve(configPath), 'utf8')) : {}) };
const tokens = JSON.parse(readFileSync(config.tokens ? resolve(root, config.tokens) : new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const NAMES = Object.fromEntries(JSON.parse(readFileSync(new URL('./checks.json', import.meta.url), 'utf8')).map((c) => [c.id, c.name]));
const rel = (f) => relative(root, f);
const results = [];
const check = (id, problems) => {
  if (!NAMES[id]) throw new Error(`check-ui: no check "${id}" in checks/checks.json`);
  results.push({ name: NAMES[id], problems });
};

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const dist = resolve(root, config.dist);
if (!existsSync(dist)) { console.error(`check-ui: no built site at ${dist}. Build first, or pass --root.`); process.exit(1); }
// A listed path that doesn't exist fails, so a renamed page can't quietly drop out of the checks.
const missing = config.src.filter((s) => !existsSync(resolve(root, s)));
if (missing.length) { console.error(`check-ui: these source paths don't exist under ${root}:\n  ${missing.join('\n  ')}`); process.exit(1); }
// Pages built with the v2 system carry data-system="v2" on <html>.
const pages = walk(dist).filter((p) => p.endsWith('.html'))
  .map((p) => ({ p: '/' + relative(dist, p), html: readFileSync(p, 'utf8') }))
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
const srcFiles = [...new Set(config.src.flatMap((s) => { const p = resolve(root, s); return statSync(p).isDirectory() ? walk(p) : [p]; }))];
// --accent is for graphics only (logo mark, accent period, arrows); text uses --accent-text, which holds 4.5:1 in
// both themes. Mark graphic uses of --accent with `/* graphic */`.
const reefText = srcFiles.flatMap((f) => readFileSync(f, 'utf8').split('\n').map((l, i) => [l, i + 1])
  .filter(([l]) => /(^|[^-])color:\s*var\(--accent\)/.test(l) && !l.includes('/* graphic */'))
  .map(([, n]) => `${rel(f)}:${n} uses --accent for text (mark graphic uses with /* graphic */)`));
check('contrast', [...lowPairs, ...reefText]);

// 2. Tokens only: no raw colour literals in v2 style code
const raw = [];
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  const css = f.endsWith('.css') ? s : [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g)) raw.push(`${rel(f)}: ${m[0]}`);
}
// Type: every font-size is a --text-* token (print pt sizes and frame-scaled cqw sizes excepted).
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/font-size:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!v.startsWith('var(--text-') && !/pt\b|cqw/.test(v)) raw.push(`${rel(f)}:${i + 1} font-size ${v} is not on the type scale`);
    }
  });
}
// Letter-spacing: every value is a --tracking-* token or 0 (tokens.json "tracking"). Added 2026-10-18.
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  s.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/letter-spacing:\s*([^;}"]+)/g)) {
      const v = m[1].trim();
      if (!v.startsWith('var(--tracking-') && !/^(0|normal)$/.test(v)) raw.push(`${rel(f)}:${i + 1} letter-spacing ${v} is not a tracking token`);
    }
  });
}
// Serif for headlines only (2026-11-03, Shauna): DM Serif Display never pairs with a size under 28px. A rule that
// sets --font-display or --font-hero with a smaller text token fails. A documented exception (pull quote, ribbon)
// carries `/* serif-ok: why */` inside the rule.
const serifSmall = [];
const smallSizes = /font-size:\s*var\(--text-(step|lead|body-l|body|small|label)\)/;
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  const css = f.endsWith('.css') ? s : [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  for (const m of css.matchAll(/([^{}]*)\{([^{}]*)\}/g)) {
    if (/var\(--font-(display|hero)\)/.test(m[2]) && smallSizes.test(m[2]) && !m[2].includes('serif-ok')) {
      serifSmall.push(`${rel(f)}: "${m[1].trim().split('\n').pop()}" sets the serif under 28px (use LINE Seed 700, see DESIGN.md Type)`);
    }
  }
}
check('tokens', raw);
check('serif', serifSmall);

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
check('buttons', [...new Set(btnProblems)]);

// 4. Alt text and accessible names
const a11y = [];
for (const { p, html } of pages) {
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\balt(=|[\s>/])/.test(m[0])) a11y.push(`${p}: img without alt`); // a bare alt is an empty alt (decorative)
  for (const m of strip(html).matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    const name = m[3].replace(/<[^>]+>/g, '').trim();
    if (!name && !/aria-label="[^"]+"/.test(m[2])) a11y.push(`${p}: <${m[1]}> with no label`);
  }
}
check('labels', a11y);

// 5. Motion
const motion = [];
const css = readFileSync(resolve(root, config.reducedMotionCss), 'utf8');
if (!/prefers-reduced-motion:\s*reduce/.test(css)) motion.push(`${config.reducedMotionCss} has no reduced-motion rule`);
for (const { p, html } of pages) {
  if (/<video\b[^>]*autoplay/.test(html) && !/data-pause/.test(html)) motion.push(`${p}: autoplaying video without a pause button`);
  if (/transition:[^;]*\b\d+m?s\b/.test(html.match(/<style[\s\S]*?<\/style>/g)?.join('') ?? '')) motion.push(`${p}: a transition uses a raw duration`);
}
check('motion', motion);

// 6. Hover: only things you can click move on hover. The hovered element must be a link,
// a button or a .btn; anything else that lifts or slides on hover promises a click it can't keep.
const hover = [];
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)) {
    if (!/transform|translate/.test(m[2]) || /transform:\s*none/.test(m[2])) continue;
    for (const sel of m[1].split(',').filter((x) => x.includes(':hover'))) {
      const hovered = sel.split(':hover')[0].trim().split(/[\s>+~]+/).pop();
      if (!/^(a|button)\b|\.btn\b|\[href\]/.test(hovered)) hover.push(`${rel(f)}: "${sel.trim()}" moves on hover but is not a link or button`);
    }
  }
}
check('hover', [...new Set(hover)]);

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
check('phone-frame', frames);

// 8. Touch targets (2026-11-06, Shauna): every .btn, in every kind, is at least 44 x 44. Added after the Quiet button
// failed its own rule in Round 4b: padding 0 2px and no minimum width made "No" 28px wide.
// CSS rules are always checked, so a build with no browser still catches a kind that can't hold 44px. With Playwright
// (installed, or PLAYWRIGHT_MODULE set to its index.mjs) the built pages are also rendered at desktop and phone width:
// each real .btn is measured, with hidden parts and dialogs opened, plus a "No" in each kind, because a kind can be
// too small and still pass on a page where every label happens to be long.
const MIN_TARGET = 44;
const SHORTEST_LABEL = 16; // about what a two-letter label takes at --text-body
const targets = new Set();
for (const f of srcFiles) {
  const s = readFileSync(f, 'utf8');
  const css = f.endsWith('.css') ? s : [...s.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]*\.btn[^{}]*)\{([^{}]*)\}/g)) {
    const sel = m[1].split(',').map((x) => x.trim()).find((x) => /\.btn(--[\w-]+)?$/.test(x));
    if (!sel) continue;
    const px = (prop) => { const v = m[2].match(new RegExp(`(?:^|[;\\s])${prop}:\\s*([\\d.]+)(?:px)?\\s*(?:;|$)`)); return v ? Number(v[1]) : null; };
    const where = `${rel(f)}: "${sel}"`;
    for (const prop of ['height', 'min-height', 'width', 'min-width']) if (px(prop) !== null && px(prop) < MIN_TARGET) targets.add(`${where} sets ${prop} under ${MIN_TARGET}px`);
    const pad = m[2].match(/(?:^|[;\s])padding:\s*([^;]+)/)?.[1].trim().split(/\s+/);
    if (!pad || !pad.every((v) => /^[\d.]+(px)?$/.test(v)) || px('min-width') >= MIN_TARGET) continue;
    const [, right = pad[0], , left = right] = pad;
    const sides = parseFloat(left) + parseFloat(right);
    if (sides + SHORTEST_LABEL < MIN_TARGET) targets.add(`${where} has ${sides}px side padding and no min-width, so a short label is under ${MIN_TARGET}px wide`);
  }
}
const launch = async () => {
  for (const m of [process.env.PLAYWRIGHT_MODULE, 'playwright'].filter(Boolean)) {
    try { return await (await import(m)).chromium.launch(); } catch { /* try the next one */ }
  }
  return null;
};
const browser = pages.length ? await launch() : null;
let targetNote = 'CSS rules only: no browser here, so pages were not rendered.';
if (browser) {
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
  const server = createServer((req, res) => {
    let f = join(dist, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': types[extname(f)] ?? 'application/octet-stream' });
    res.end(readFileSync(f));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  let measured = 0;
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    await ctx.route('**/*', (r) => (r.request().url().startsWith(origin) ? r.continue() : r.abort()));
    const tab = await ctx.newPage();
    for (const { p } of pages) {
      await tab.goto(origin + p, { waitUntil: 'load' });
      const found = await tab.evaluate(async (min) => {
        document.querySelectorAll('[hidden]').forEach((e) => e.removeAttribute('hidden'));
        document.querySelectorAll('dialog:not([open])').forEach((d) => d.setAttribute('open', ''));
        const kinds = new Set(['']);
        for (const sheet of document.styleSheets) { let rules = []; try { rules = sheet.cssRules; } catch { /* another site's stylesheet */ } for (const rule of rules) for (const k of rule.selectorText?.match(/\.btn--[\w-]+/g) ?? []) kinds.add(k.slice(1)); }
        const box = document.createElement('div');
        box.style.cssText = 'position:absolute;top:0;left:0';
        box.dataset.probe = '';
        for (const k of kinds) for (const tag of ['button', 'a']) { const e = document.createElement(tag); e.className = `btn ${k}`.trim(); e.textContent = 'No'; box.append(e); }
        document.body.append(box);
        await document.fonts.ready;
        const all = [...document.querySelectorAll('.btn')].filter((e) => e.getClientRects().length);
        return { count: all.length, small: all.filter((e) => e.offsetWidth < min || e.offsetHeight < min).map((e) => ({ probe: !!e.closest('[data-probe]'), name: `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`, text: e.innerText.trim().slice(0, 40), w: e.offsetWidth, h: e.offsetHeight })) };
      }, MIN_TARGET);
      measured += found.count;
      for (const b of found.small) targets.add(b.probe ? `${b.name} is ${b.w}x${b.h} with the label "${b.text}"` : `${p} at ${width}px: ${b.name} "${b.text}" is ${b.w}x${b.h}`);
    }
    await ctx.close();
  }
  await browser.close();
  server.close();
  targetNote = `Rendered ${pages.length} pages at 1440px and 390px: ${measured} buttons measured, test labels included.`;
}
check('touch-targets', [...targets]);
console.log(`\n${targetNote}`);

console.log(`\n$ npm run check:ui   (${pages.length} pages)`);
let failed = 0;
for (const r of results) {
  console.log(`${r.problems.length ? '✗' : '✓'} ${r.name}`);
  for (const x of r.problems) console.log(`    ${x}`);
  failed += r.problems.length;
}
if (!pages.length) { console.log(`✗ No v2 pages found in ${rel(dist) || dist}`); process.exit(1); }
if (failed) { console.log(`\n${failed} problem(s). Build failed.`); process.exit(1); }
console.log('\nAll checks passed.');
