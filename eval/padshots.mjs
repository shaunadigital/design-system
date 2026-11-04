import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const NEW = readFileSync('rebrand.mjs','utf8').match(/const NEW_BRAND = `([\s\S]*?)`;/)[1];
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700;112,800&family=Unbounded:wght@300;500&family=Fraunces:opsz,wght@9..144,300..600&family=JetBrains+Mono:wght@500&display=block';
const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true, deviceScaleFactor: 2 });
for (const [dir, out] of process.argv.slice(2).map((a) => a.split('='))) {
  for (const brand of ['original', 'new']) {
    const p = await ctx.newPage();
    await p.goto('file://' + process.cwd() + '/' + dir + '/component.html');
    await p.addStyleTag({ url: FONTS }).catch(() => {});
    await p.addStyleTag({ content: 'html, body { background: #EEF4FA !important; }' + (brand === 'new' ? NEW : '') });
    await p.evaluate(() => Promise.all(['400 16px Fraunces', '500 16px Fraunces', '300 16px Unbounded', '400 16px Archivo', '600 16px Archivo'].map((f) => document.fonts.load(f))));
    await p.waitForTimeout(300);
    const r = await p.$eval('#component', (e) => { const x = e.getBoundingClientRect(); return { x: x.x, y: x.y, w: x.width, h: x.height }; });
    const pad = 40;
    await p.screenshot({ path: `out/${out}-${brand}.png`, clip: { x: r.x - pad, y: r.y - pad, width: r.w + pad * 2, height: Math.max(r.h, 600) + pad * 2 } });
    await p.close();
  }
}
await b.close();
