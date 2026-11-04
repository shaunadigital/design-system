// Scores each run's component.html against the rules in DESIGN.md, and screenshots it.
// usage: node score.mjs <run dir> [<run dir> ...]
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const E = new URL('.', import.meta.url).pathname;
const tokensCss = readFileSync(join(E, 'fixtures/with-v1/tokens.css'), 'utf8');

const browser = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });

// Token sets, resolved in a real page at the same viewport as the runs.
async function tokenSets() {
  const page = await ctx.newPage();
  await page.setContent(`<style>${tokensCss}</style><div id="p"></div>`);
  const sets = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const names = [];
    for (const sheet of document.styleSheets) for (const r of sheet.cssRules) if (r.selectorText === ':root') for (const n of r.style) if (n.startsWith('--')) names.push(n);
    const p = document.getElementById('p');
    const sizes = [], colors = [], radii = [], tracking = [];
    for (const n of new Set(names)) {
      const v = cs.getPropertyValue(n).trim();
      if (n.startsWith('--text-')) { p.style.fontSize = `var(${n})`; sizes.push(parseFloat(getComputedStyle(p).fontSize)); }
      else if (n.startsWith('--radius')) radii.push(parseFloat(v));
      else if (n.startsWith('--tracking')) tracking.push(parseFloat(v));
      else if (/^#[0-9a-f]{3,8}$/i.test(v)) { p.style.color = v; colors.push(getComputedStyle(p).color); }
      else if (/^\d+,\s*\d+,\s*\d+$/.test(v)) colors.push(`rgb(${v.replace(/\s/g, '').split(',').join(', ')})`);
    }
    return { sizes, colors, radii, tracking };
  });
  await page.close();
  return sets;
}
const T = await tokenSets();

async function score(dir) {
  const file = resolve(dir, 'component.html');
  if (!existsSync(file)) { writeFileSync(join(dir, 'score.json'), JSON.stringify({ missing: true, pass: false })); return; }
  const page = await ctx.newPage();
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700;112,800&family=Unbounded:wght@300;500&family=JetBrains+Mono:wght@500&display=block' }).catch(() => {});
  await page.evaluate(() => Promise.all(['300 16px Unbounded', '500 16px Unbounded', '400 16px Archivo', '500 16px Archivo', '600 16px Archivo', '700 16px Archivo'].map((f) => document.fonts.load(f)))).catch(() => {});
  await page.waitForTimeout(400);
  const res = await page.evaluate((T) => {
    const issues = { type: [], color: [], radius: [], tracking: [], fonts: [], contrast: [], hover: [], motion: [], copy: [], labels: [], targets: [] };
    const root = document.getElementById('component') || document.body;
    const all = [root, ...root.querySelectorAll('*')].filter((el) => {
      const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('svg, head, style, script');
    });
    const rgb = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }; };
    const key = (c) => `${c.r},${c.g},${c.b}`;
    const palette = new Set(T.colors.map((s) => key(rgb(s))));
    const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const bgOf = (el) => { // composite backgrounds up the tree; null if an image or gradient is in the way
      const layers = [];
      for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.backgroundImage !== 'none') return null; const c = rgb(cs.backgroundColor); if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; } }
      let out = { r: 255, g: 255, b: 255 };
      for (const c of layers.reverse()) out = { r: c.r * c.a + out.r * (1 - c.a), g: c.g * c.a + out.g * (1 - c.a), b: c.b * c.a + out.b * (1 - c.a) };
      return out;
    };
    const name = (el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.classList[0] ? '.' + el.classList[0] : '');
    const ownText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    const isField = (el) => /^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === 'INPUT' && !/^(checkbox|radio|range|hidden|color|file|submit|button|image|reset)$/i.test(el.type));
    const allowedFonts = ['unbounded', 'archivo', 'jetbrains mono'];
    for (const el of all) {
      const cs = getComputedStyle(el);
      const textual = ownText(el) || isField(el);
      // Colors: text, backgrounds, visible borders must be palette colors (alpha variants allowed)
      const used = [];
      if (textual) used.push(['text', cs.color]);
      if (rgb(cs.backgroundColor)?.a > 0) used.push(['background', cs.backgroundColor]);
      for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== 'none' && rgb(cs[`border${s}Color`])?.a > 0) used.push(['border', cs[`border${s}Color`]]);
      if (isField(el)) { const ph = getComputedStyle(el, '::placeholder').color; if (ph) used.push(['placeholder', ph]); }
      for (const [k, v] of used) { const c = rgb(v); if (c && !palette.has(key(c))) issues.color.push(`${name(el)} ${k} ${v}`); }
      if (textual) {
        const fs = parseFloat(cs.fontSize);
        if (!T.sizes.some((s) => Math.abs(s - fs) < 0.6)) issues.type.push(`${name(el)} font-size ${fs}px`);
        const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim().toLowerCase();
        if (!allowedFonts.includes(fam)) issues.fonts.push(`${name(el)} ${fam}`);
        if (cs.letterSpacing !== 'normal' && parseFloat(cs.letterSpacing) !== 0) {
          const ls = parseFloat(cs.letterSpacing);
          if (!T.tracking.some((t) => Math.abs(t * fs - ls) < 0.15)) issues.tracking.push(`${name(el)} letter-spacing ${ls}px`);
        }
        const bg = bgOf(el); const fg = rgb(cs.color);
        if (bg && fg) { const big = fs >= 24 || (fs >= 18.66 && parseInt(cs.fontWeight) >= 700); const r = ratio(fg, bg); if (r < (big ? 3 : 4.5)) issues.contrast.push(`${name(el)} ${r.toFixed(2)}:1`); }
        if (isField(el)) { const ph = rgb(getComputedStyle(el, '::placeholder').color); if (bg && ph) { const r = ratio(ph, bg); if (r < 4.5) issues.contrast.push(`${name(el)} placeholder ${r.toFixed(2)}:1`); } }
      }
      // Radii: tokens only (8, 12, 16) or a full pill
      const rect = el.getBoundingClientRect();
      for (const c of ['TopLeft', 'TopRight', 'BottomRight', 'BottomLeft']) {
        const v = cs[`border${c}Radius`]; if (!v || v === '0px') continue;
        const px = v.endsWith('%') ? (parseFloat(v) >= 50 ? Infinity : NaN) : parseFloat(v);
        const pill = px >= Math.min(rect.width, rect.height) / 2 - 0.5;
        if (!pill && !T.radii.some((r) => Math.abs(r - px) < 0.5)) { issues.radius.push(`${name(el)} radius ${v}`); break; }
      }
    }
    // Hover: only links and buttons may move
    const moves = (st) => ['transform', 'translate', 'top', 'margin-top', 'bottom'].some((p) => st.getPropertyValue(p) && st.getPropertyValue(p) !== 'none');
    let hasMotion = false, hasReduced = false;
    const walk = (rules) => { for (const r of rules) {
      if (r.media) { if (/prefers-reduced-motion/.test(r.media.mediaText)) hasReduced = true; walk(r.cssRules); continue; }
      if (r.cssRules && r.cssRules.length && !r.style) { walk(r.cssRules); continue; }
      if (!r.style) continue;
      const tr = r.style.getPropertyValue('transition') || r.style.getPropertyValue('transition-duration'); const an = r.style.getPropertyValue('animation') || r.style.getPropertyValue('animation-name');
      // Site rule (check-ui 5): transitions use the duration tokens, never raw times; loops stop under reduced motion.
      const trv = (r.style.getPropertyValue('transition') || '') + ' ' + (r.style.getPropertyValue('transition-duration') || '');
      { const raw = [...trv.replace(/var\([^)]*\)/g, '').matchAll(/(\d*\.?\d+)(m?s)\b/g)].map((m) => (m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1]))); if (raw.some((v) => v !== 0 && ![120, 180, 320].includes(Math.round(v)))) issues.motion.push(`transition uses an off-system duration: ${r.selectorText}`); }
      if (an && an !== 'none' && !/^none/.test(an)) hasMotion = true;
      if (r.selectorText && r.selectorText.includes(':hover') && moves(r.style)) {
        for (const part of r.selectorText.split(',')) {
          const idx = part.indexOf(':hover'); if (idx < 0) continue;
          let target = part.slice(0, idx).replace(/:(focus|focus-visible|active|not\([^)]*\))/g, '').trim();
          if (!target) continue;
          try { for (const el of document.querySelectorAll(target)) if (!el.matches('a, button, [role="button"], [role="menuitem"], input, label, summary')) issues.hover.push(`${part.trim()} moves on hover but ${name(el)} is not a link or button`); } catch (e) {}
        }
      }
    } };
    for (const s of document.styleSheets) { try { walk(s.cssRules); } catch (e) {} }
    if (hasMotion && !hasReduced) issues.motion.push('has an animation but no prefers-reduced-motion rule');
    // Copy: no em or en dashes; button labels in Title Case
    if (/[—–]/.test(root.innerText)) issues.copy.push('em or en dash in copy');
    const minor = new Set(['a', 'an', 'the', 'and', 'or', 'nor', 'but', 'of', 'to', 'in', 'on', 'for', 'at', 'by', 'with', 'as', 'per', 'via', 'vs']);
    const btnLike = [...root.querySelectorAll('button, [role="button"], input[type="submit"], [role="menuitem"]'), ...[...root.querySelectorAll('a')].filter((a) => { const cs = getComputedStyle(a); return cs.display !== 'inline' && ((rgb(cs.backgroundColor)?.a > 0) || parseFloat(cs.borderTopWidth) > 0); })];
    for (const b of btnLike) {
      if (b.closest('[data-user-content]') || b.querySelector('[data-user-content]') && !(b.innerText || '').replace((b.querySelector('[data-user-content]').innerText || ''), '').trim()) continue;
      const label = (b.innerText || b.value || '').trim(); if (!label) continue;
      const words = label.split(/\s+/).filter((w) => /^[a-z]/i.test(w));
      if (words.some((w, i) => /^[a-z]/.test(w) && (i === 0 || !minor.has(w.toLowerCase())))) issues.copy.push(`button "${label}" is not Title Case`);
    }
    // Labels: images have alt, controls have a name
    for (const img of root.querySelectorAll('img')) if (!img.hasAttribute('alt')) issues.labels.push(`img without alt`);
    for (const b of root.querySelectorAll('a, button, [role="button"], [role="menuitem"]')) if (!(b.innerText.trim() || b.getAttribute('aria-label') || b.getAttribute('aria-labelledby') || b.getAttribute('title'))) issues.labels.push(`${name(b)} has no label`);
    for (const f of root.querySelectorAll('input:not([type="hidden"]), textarea, select')) {
      const lab = f.getAttribute('aria-label') || f.getAttribute('aria-labelledby') || f.closest('label') || (f.id && document.querySelector(`label[for="${f.id}"]`));
      if (!lab) issues.labels.push(`${name(f)} has no label`);
    }
    // Touch targets: 44px
    for (const b of btnLike) { const r = b.getBoundingClientRect(); if (r.width && (r.height < 43.5 || r.width < 43.5)) issues.targets.push(`${name(b)} ${Math.round(r.width)}x${Math.round(r.height)}`); }
    const r = root.getBoundingClientRect();
    return { issues, hasRoot: !!document.getElementById('component'), box: { x: r.x, y: r.y, w: r.width, h: r.height } };
  }, T);
  const checks = Object.fromEntries(Object.entries(res.issues).map(([k, v]) => [k, { pass: v.length === 0, issues: [...new Set(v)].slice(0, 12) }]));
  const pass = res.hasRoot && Object.values(checks).every((c) => c.pass);
  const el = (await page.$('#component')) || (await page.$('body'));
  await el.screenshot({ path: join(dir, 'shot.png') }).catch(() => {});
  await page.close();
  writeFileSync(join(dir, 'score.json'), JSON.stringify({ pass, hasRoot: res.hasRoot, box: res.box, checks }, null, 1));
}

for (const d of process.argv.slice(2)) { try { await score(d); } catch (e) { writeFileSync(join(d, 'score.json'), JSON.stringify({ error: String(e), pass: false })); } }
await browser.close();
