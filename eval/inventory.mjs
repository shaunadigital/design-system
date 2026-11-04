import { chromium } from 'playwright';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
for (const dir of process.argv.slice(2)) {
  const f = resolve(dir, 'component.html'); if (!existsSync(f)) continue;
  const p = await ctx.newPage();
  await p.goto('file://' + f).catch(() => {});
  await p.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700;112,800&family=Unbounded:wght@300;500&family=JetBrains+Mono:wght@500&display=block' }).catch(() => {});
  await p.waitForTimeout(250);
  const inv = await p.evaluate(() => {
    const root = document.getElementById('component') || document.body;
    const vis = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0; };
    const out = { sizes: [], text: [], bg: [], radii: [], buttons: [], inputs: [] };
    for (const el of [root, ...root.querySelectorAll('*')]) {
      if (!vis(el) || el.closest('svg')) continue;
      const cs = getComputedStyle(el);
      const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (own) { out.sizes.push(cs.fontSize); out.text.push(cs.color); }
      if (!/rgba\(0, 0, 0, 0\)/.test(cs.backgroundColor)) out.bg.push(cs.backgroundColor);
      if (cs.borderTopLeftRadius !== '0px') out.radii.push(cs.borderTopLeftRadius);
    }
    const sig = (el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); return [cs.backgroundColor, cs.color, cs.borderTopWidth + ' ' + cs.borderTopColor, cs.borderTopLeftRadius, Math.round(r.height) + 'px', cs.fontSize, cs.fontWeight, cs.fontFamily.split(',')[0]].join('|'); };
    const btns = [...root.querySelectorAll('button, [role="button"], input[type="submit"], a')].filter((a) => vis(a) && (a.tagName !== 'A' || (getComputedStyle(a).display !== 'inline' && (!/rgba\(0, 0, 0, 0\)/.test(getComputedStyle(a).backgroundColor) || parseFloat(getComputedStyle(a).borderTopWidth) > 0))));
    out.buttons = btns.map(sig);
    out.inputs = [...root.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=hidden]), select, textarea')].filter(vis).map(sig);
    return out;
  });
  writeFileSync(join(dir, 'inventory.json'), JSON.stringify(inv)); await p.close();
}
await b.close();
