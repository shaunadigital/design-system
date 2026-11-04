// Renders every Harbor screen before and after the rebrand and finds the pieces that missed it.
// Groups:
//   system      : my system's builds (suite-teams/with-v4). The rebrand is new-tokens.css, nothing else.
//   design-md   : standard DESIGN.md builds (suite-teams/open-spec), rebranded by a fresh Claude session (runs/design-md).
//   brand-notes : brand-notes builds (suite-teams/without), rebranded by a fresh Claude session (runs/brand-notes).
// A piece "missed the rebrand" when it still shows an old-brand value: an old colour (fill, text, border or icon),
// an old font, or an old corner. "Off-brand" means a value in neither brand (invented during the rebrand).
// Writes out/<group>/<screen>-<n>-{before,after}.png and out/<group>/<screen>-<n>.json, plus out/summary.json.
// usage: node render.mjs [group ...]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const R = resolve(import.meta.dirname);
const brand = JSON.parse(readFileSync(join(R, 'new-brand.json'), 'utf8'));
const NEW_TOKENS = readFileSync(join(R, 'new-tokens.css'), 'utf8');
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700&family=Unbounded:wght@300;400;500;600&family=Fraunces:opsz,wght@9..144,300..700&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=block';
const screens = readdirSync(join(R, '../suite-teams/with-v4')).sort();
const groups = process.argv.slice(2).length ? process.argv.slice(2) : ['system', 'design-md', 'brand-notes'];

const hex2rgb = (h) => { h = h.replace('#', ''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(','); };
const OLD = [...new Set(brand.old.colors.map(hex2rgb))];
const NEW = [...new Set(Object.values(brand.colors).map(hex2rgb))];

function detect({ OLD, NEW, oldFonts, oldRadii }) {
  const root = document.querySelector('#component') || document.body;
  const rb = root.getBoundingClientRect();
  const rgbOf = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a === 0) return null; return p.slice(0, 3).join(','); };
  const kind = (rgb) => !rgb ? null : OLD.includes(rgb) && !NEW.includes(rgb) ? 'old' : NEW.includes(rgb) ? null
    // neutral greys and pure black/white shades that are close to a new colour are still off-brand; report them
    : 'off';
  const out = [];
  const seenValues = { old: new Set(), off: new Set() };
  for (const el of root.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < rb.top || r.top > rb.bottom) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const isSvg = el instanceof SVGElement && el.tagName !== 'svg';
    const hits = [];
    const bg = rgbOf(cs.backgroundColor); const k1 = kind(bg); if (k1) hits.push({ k: k1, what: 'fill', v: bg });
    const borders = ['Top', 'Right', 'Bottom', 'Left'].filter((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none');
    for (const s of borders) { const c = rgbOf(cs[`border${s}Color`]); const k = kind(c); if (k) { hits.push({ k, what: 'border', v: c }); break; } }
    if (hasText) {
      const c = rgbOf(cs.color); const k = kind(c); if (k) hits.push({ k, what: 'text', v: c });
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      if (oldFonts.includes(fam)) hits.push({ k: 'old', what: 'font', v: fam });
      else if (!['Fraunces', 'Instrument Sans', 'JetBrains Mono', 'monospace', 'ui-monospace'].includes(fam)) hits.push({ k: 'off', what: 'font', v: fam });
    }
    if (isSvg) {
      for (const p of ['fill', 'stroke']) { const c = rgbOf(cs[p]); const k = kind(c); if (k) { hits.push({ k, what: 'icon', v: c }); break; } }
    }
    const visibleBox = bg || borders.length;
    if (visibleBox) {
      const rad = parseFloat(cs.borderTopLeftRadius);
      if (!cs.borderTopLeftRadius.includes('%')) {
        const pill = rad >= Math.min(r.height, r.width) / 2 - 1 && rad >= 14;
        if (oldRadii.includes(rad) || (pill && rad > 6)) hits.push({ k: 'old', what: 'corner', v: pill ? 'pill' : rad + 'px' });
        else if (rad > 6) hits.push({ k: 'off', what: 'corner', v: rad + 'px' });
      }
    }
    if (!hits.length) continue;
    hits.forEach((h) => seenValues[h.k].add(`${h.what}:${h.v}`));
    out.push({ el, hits, box: { x: r.left - rb.left, y: r.top - rb.top, w: r.width, h: r.height }, tag: el.tagName.toLowerCase(), text: (el.textContent || '').trim().slice(0, 40) });
  }
  // A "piece" is a missed element with no missed ancestor (a stuck card counts once, not once per child).
  const set = new Set(out.map((o) => o.el));
  const pieces = out.filter((o) => { let p = o.el.parentElement; while (p && p !== root) { if (set.has(p)) return false; p = p.parentElement; } return true; });
  const strip = (o) => ({ tag: o.tag, text: o.text, box: o.box, hits: o.hits });
  return {
    size: { w: rb.width, h: rb.height },
    elements: out.length,
    oldElements: out.filter((o) => o.hits.some((h) => h.k === 'old')).length,
    offElements: out.filter((o) => o.hits.every((h) => h.k === 'off')).length,
    pieces: pieces.map(strip),
    oldPieces: pieces.filter((o) => o.hits.some((h) => h.k === 'old')).length,
    values: { old: [...seenValues.old], off: [...seenValues.off] },
    all: out.map(strip),
  };
}

const browser = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true, deviceScaleFactor: 1 });
const summary = existsSync(join(R, 'out/summary.json')) ? JSON.parse(readFileSync(join(R, 'out/summary.json'), 'utf8')) : {};

async function render(file, extraCss, shot) {
  const page = await ctx.newPage();
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.addStyleTag({ url: FONTS }).catch(() => {});
  if (extraCss) await page.addStyleTag({ content: extraCss });
  await page.evaluate(() => Promise.all(['400 16px Fraunces', '400 16px "Instrument Sans"', '600 16px "Instrument Sans"', '300 16px Unbounded', '400 16px Archivo', '600 16px Archivo'].map((f) => document.fonts.load(f)))).catch(() => {});
  await page.waitForTimeout(250);
  const res = await page.evaluate(detect, { OLD, NEW, oldFonts: brand.old.fonts, oldRadii: brand.old.radii });
  const el = (await page.$('#component')) || (await page.$('body'));
  await el.screenshot({ path: shot }).catch(() => {});
  await page.close();
  return res;
}

for (const g of groups) {
  mkdirSync(join(R, 'out', g), { recursive: true });
  summary[g] = { screens: {}, total: { pieces: 0, elements: 0, oldPieces: 0, screensClean: 0, of: 0 }, values: { old: [], off: [] } };
  const vals = { old: new Set(), off: new Set() };
  for (const s of screens) for (const n of [1, 2]) {
    let before, after, css = null;
    if (g === 'system') { before = after = join(R, '../suite-teams/with-v4', s, String(n), 'component.html'); css = NEW_TOKENS; }
    else {
      before = join(R, 'runs', g, s, `${n}.before.html`);
      after = join(R, 'runs', g, s, String(n), 'component.html');
      if (!existsSync(join(R, 'runs', g, s, String(n), 'done'))) { console.log('skip', g, s, n); continue; }
    }
    const id = `${s}-${n}`;
    await render(before, null, join(R, 'out', g, `${id}-before.png`));
    const res = await render(after, css, join(R, 'out', g, `${id}-after.png`));
    writeFileSync(join(R, 'out', g, `${id}.json`), JSON.stringify(res, null, 1));
    res.values.old.forEach((v) => vals.old.add(v)); res.values.off.forEach((v) => vals.off.add(v));
    summary[g].screens[id] = { pieces: res.pieces.length, oldPieces: res.oldPieces, elements: res.elements };
    const t = summary[g].total; t.pieces += res.pieces.length; t.elements += res.elements; t.oldPieces += res.oldPieces; t.of++; if (!res.pieces.length) t.screensClean++;
    console.log(g, id, 'pieces', res.pieces.length, 'old', res.oldPieces, 'elements', res.elements);
  }
  summary[g].values = { old: [...vals.old], off: [...vals.off] };
}
writeFileSync(join(R, 'out/summary.json'), JSON.stringify(summary, null, 1));
await browser.close();
