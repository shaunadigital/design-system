// Renders each department build at 1280 wide with the site fonts. usage: node shoot.mjs
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700&family=Unbounded:wght@300;400;500&family=JetBrains+Mono:wght@500&display=block';
const b = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
for (const g of ['without', 'with-v4', 'with-v5', 'with-v6']) for (const d of ['sales', 'finance', 'people']) {
  const f = `${import.meta.dirname}/${g}/${d}/component.html`; if (!existsSync(f)) continue;
  const p = await ctx.newPage(); await p.goto('file://' + f);
  await p.addStyleTag({ url: FONTS }).catch(() => {});
  await p.evaluate(() => Promise.all(['300 16px Unbounded', '400 16px Archivo', '600 16px Archivo'].map((x) => document.fonts.load(x)))).catch(() => {});
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${import.meta.dirname}/${g}/${d}/shot.png`, fullPage: true });
  await p.close();
}
await b.close();
