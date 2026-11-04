// Generates build/tokens.css from tokens/tokens.json (on shauna.dev it writes src/styles/tokens.css before every build),
// so the CSS can never disagree with the token file Claude and people read.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const t = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url)));
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ');
// Base and roles (2026-11-02): every role's Day value must be its base colour, so the palette stays small.
const g = t.$colorGroups;
for (const [role, base] of Object.entries(g.roles)) {
  if (t.color[role]?.toUpperCase() !== g.base[base]?.toUpperCase()) throw new Error(`tokens.json: role ${role} (${t.color[role]}) does not match base ${base} (${g.base[base]})`);
}
for (const k of Object.keys(t.color)) if (!g.roles[k] && !g.component.includes(k)) throw new Error(`tokens.json: colour ${k} is not a role or a component colour`);
const lines = ['/* GENERATED from tokens/tokens.json by scripts/tokens.mjs. Do not edit by hand. */', ':root {'];
for (const [k, v] of Object.entries(t.color)) lines.push(`  --${k}: ${v};`, `  --${k}-rgb: ${rgb(v)};`);
for (const [k, v] of Object.entries(t.art)) lines.push(`  --${k}: ${v};`, `  --${k}-rgb: ${rgb(v)};`);
for (const [k, v] of Object.entries(t.font)) lines.push(`  --font-${k}: ${v};`);
t.space.forEach((v, i) => lines.push(`  --space-${i + 1}: ${v}px;`));
for (const [k, v] of Object.entries(t.radius)) lines.push(`  --radius-${k}: ${v}px;`);
// Device frames: % of the frame's own width, so a phone looks the same at 88px or 400px.
for (const [k, v] of Object.entries(t.device)) if (!k.startsWith('$')) lines.push(`  --${k}: ${v}cqw;`);
for (const [k, v] of Object.entries(t.tracking)) if (!k.startsWith('$')) lines.push(`  --tracking-${k}: ${v};`);
lines.push(`  --wordmark-weight: ${t.wordmark.weight};`, `  --wordmark-stretch: ${t.wordmark.width}%;`, `  --wordmark-wdth: ${t.wordmark.width};`,
  `  --wordmark-weight-2: ${t.wordmark['weight-2']};`, `  --wordmark-mark: ${t.wordmark.mark};`, `  --wordmark-gap: ${t.wordmark.gap};`, `  --wordmark-dot-pull: ${t.wordmark['dot-pull']};`,
  `  --wordmark-min: ${t.wordmark.min};`, `  --wordmark-clear: ${t.wordmark.clear};`);
for (const [k, v] of Object.entries(t.type)) if (!k.startsWith('$')) lines.push(`  --text-${k}: ${v.size};`);
lines.push(`  --ease: ${t.motion.ease};`, `  --dur-fast: ${t.motion.fast};`, `  --dur-base: ${t.motion.base};`, `  --dur-slow: ${t.motion.slow};`, '}');
// Dusk: the same roles at night. Only the overridden colours are re-declared.
lines.push('', ':root { color-scheme: light; }', ':root[data-theme="dusk"] {', '  color-scheme: dark;');
for (const [k, v] of Object.entries({ ...t.dusk.color, ...t.dusk.art })) lines.push(`  --${k}: ${v};`, `  --${k}-rgb: ${rgb(v)};`);
lines.push('}');
mkdirSync(new URL('../build/', import.meta.url), { recursive: true });
writeFileSync(new URL('../build/tokens.css', import.meta.url), lines.join('\n') + '\n');
console.log(`tokens.css: ${Object.keys(t.color).length + Object.keys(t.art).length} colours (${Object.keys(t.dusk.color).length + Object.keys(t.dusk.art).length} re-set for dusk), ${t.space.length} spaces`);
