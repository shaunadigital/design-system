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
  await p.waitForTimeout(300);
  const m = await p.evaluate(() => {
    const r = document.getElementById('component') || document.body; const cs = getComputedStyle(r); const box = r.getBoundingClientRect();
    let head = 0; for (const el of r.querySelectorAll('*')) { if ([...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) head = Math.max(head, parseFloat(getComputedStyle(el).fontSize)); }
    const btn = r.querySelector('button, [role="button"], a[class*="btn"], a[class*="button"]');
    return { w: Math.round(box.width), h: Math.round(box.height), radius: parseFloat(cs.borderTopLeftRadius) || 0, pad: parseFloat(cs.paddingTop) || 0, head, btnH: btn ? Math.round(btn.getBoundingClientRect().height) : null };
  });
  writeFileSync(join(dir, 'measure.json'), JSON.stringify(m)); await p.close();
}
await b.close();
