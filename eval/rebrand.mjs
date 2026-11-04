// The real rebrand test: re-render each actual build with the New Brand's token values swapped in.
// Builds that use the tokens follow; builds with typed values stay put. Writes shot-new.png per run.
// usage: node rebrand.mjs <run dir> [...]
import { chromium } from 'playwright';
import { resolve, join } from 'node:path';
import { existsSync } from 'node:fs';

const NEW_BRAND = `html:root {
  --paper: #0B1416; --paper-rgb: 11, 20, 22; --sand: #0B1416; --sand-rgb: 11, 20, 22;
  --card: #13242A; --card-rgb: 19, 36, 42; --ink: #F3EBDD; --ink-rgb: 243, 235, 221;
  --muted: #BFB6A6; --muted-rgb: 191, 182, 166; --accent: #FF8A65; --accent-rgb: 255, 138, 101;
  --accent-text: #FF8A65; --accent-text-rgb: 255, 138, 101; --on-ink: #0B1416; --on-ink-rgb: 11, 20, 22;
  --accent-tint: #1E3238; --accent-tint-rgb: 30, 50, 56; --accent-line: #2A3E44; --accent-line-rgb: 42, 62, 68;
  --plate-hover: #1E3238; --deep: #050A0B; --shadow-rgb: 0, 0, 0;
  --font-display: 'Fraunces', Georgia, serif; --font-hero: 'Fraunces', Georgia, serif;
  --text-hero: 3.25rem; --text-display-xl: 3.5rem; --text-heading: 3rem; --text-statement: 2.25rem;
  --text-step: 2.25rem; --text-title: 2.375rem; --text-lead: 1.5rem; --text-body-l: 1.25rem;
  --text-body: 1.125rem; --text-small: 1rem; --text-label: 0.8125rem;
  --radius-sm: 0px; --radius-md: 0px; --radius-card: 0px; --radius-pill: 0px;
}
html, body { background: #0B1416 !important; }`;

const browser = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, ignoreHTTPSErrors: true });
for (const dir of process.argv.slice(2)) {
  const file = resolve(dir, 'component.html');
  if (!existsSync(file)) continue;
  const page = await ctx.newPage();
  await page.goto('file://' + file, { waitUntil: 'load', timeout: 20000 }).catch(() => {});
  await page.addStyleTag({ url: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100,400;100,500;100,600;100,700;112,800&family=Unbounded:wght@300;500&family=Fraunces:opsz,wght@9..144,300..600&family=JetBrains+Mono:wght@500&display=block' }).catch(() => {});
  await page.addStyleTag({ content: NEW_BRAND });
  await page.evaluate(() => Promise.all(['400 16px Fraunces', '300 16px Fraunces', '500 16px Fraunces', '400 16px Archivo', '600 16px Archivo'].map((f) => document.fonts.load(f)))).catch(() => {});
  await page.waitForTimeout(200);
  const el = (await page.$('#component')) || (await page.$('body'));
  await el.screenshot({ path: join(dir, 'shot-new.png') }).catch(() => {});
  await page.close();
}
await browser.close();
