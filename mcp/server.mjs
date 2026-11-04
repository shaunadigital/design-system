#!/usr/bin/env node
// Design system server: lets Claude (or any MCP client) read the system and check its own work against it.
// It reads the same tokens/tokens.json and DESIGN.md the site is built from, so it can't drift from them.
// Run: node mcp/server.mjs   (stdio). Claude Code: claude mcp add design-system -- node /path/to/mcp/server.mjs
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { check as checkSpoken } from '../eval/voice/check.mjs';

const tokens = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const designMd = readFileSync(new URL('../DESIGN.md', import.meta.url), 'utf8');

// DESIGN.md split into its "## " sections.
const sections = {};
let cur = null;
for (const line of designMd.split('\n')) {
  const m = line.match(/^## (.+)$/);
  if (m) { cur = m[1].replace(/\s*\(.*\)$/, '').trim(); sections[cur] = []; continue; }
  if (cur) sections[cur].push(line);
}
const sectionText = (name) => sections[name].join('\n').trim();

// Components: each top-level bullet in the Components section, plus Buttons as its own entry.
function components() {
  const out = {};
  let name = null;
  for (const line of sections.Components ?? []) {
    const m = line.match(/^- ([A-Z][^:(]*?)\s*(\([^)]*\))?:/);
    if (m) { name = m[1].trim(); out[name] = [line]; continue; }
    if (/^- /.test(line)) { name = null; continue; }
    if (name) out[name].push(line);
  }
  out.Button = sectionText('Buttons').split('\n');
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.join('\n').trim()]));
}

const text = (s) => ({ content: [{ type: 'text', text: typeof s === 'string' ? s : JSON.stringify(s, null, 2) }] });

// Static checks for a snippet of HTML and CSS, the same rules the site's build enforces (checks/check-ui.mjs).
export function checkHtml(html) {
  const failures = [];
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    + '\n' + [...html.matchAll(/style="([^"]*)"/g)].map((m) => m[1]).join(';\n');
  const add = (rule, detail) => failures.push({ rule, detail });
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b|rgba?\(\s*\d/g)) add('Tokens only', `raw colour ${m[0]}: use a colour token`);
  for (const m of css.matchAll(/font-size:\s*([^;}"]+)/g)) if (!m[1].trim().startsWith('var(--text-')) add('Type scale', `font-size ${m[1].trim()}: use a --text-* token`);
  for (const m of css.matchAll(/letter-spacing:\s*([^;}"]+)/g)) { const v = m[1].trim(); if (!v.startsWith('var(--tracking-') && !/^(0|normal)$/.test(v)) add('Letter-spacing', `${v}: use a --tracking-* token`); }
  for (const m of css.matchAll(/transition:[^;}]*?(?<![\w.-])(\d*\.?\d+m?s)\b/g)) add('Motion', `raw duration ${m[1]}: use --dur-fast, --dur-base or --dur-slow`);
  if (/animation:[^;}]*infinite/.test(css) && !/prefers-reduced-motion:\s*reduce/.test(css)) add('Motion', 'a looping animation with no prefers-reduced-motion rule');
  for (const m of css.matchAll(/([^{}]*:hover[^{}]*)\{([^}]*)\}/g)) {
    if (!/transform|translate/.test(m[2]) || /transform:\s*none/.test(m[2])) continue;
    for (const sel of m[1].split(',').filter((x) => x.includes(':hover'))) {
      const hovered = sel.split(':hover')[0].trim().split(/[\s>+~]+/).pop();
      if (!/^(a|button)\b|\.btn\b|\[href\]/.test(hovered)) add('Hover', `"${sel.trim()}" moves on hover but is not a link or button`);
    }
  }
  const body = html.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<script[\s\S]*?<\/script>/g, '');
  if (/—/.test(body.replace(/<[^>]+>/g, ' '))) add('Copy', 'contains an em dash');
  for (const m of body.matchAll(/<img\b[^>]*>/g)) if (!/\balt(=|[\s>/])/.test(m[0])) add('Labels', 'an <img> with no alt text');
  for (const m of body.matchAll(/<(a|button)\b([^>]*)>([\s\S]*?)<\/\1>/g)) {
    if (!m[3].replace(/<[^>]+>/g, '').trim() && !/aria-label="[^"]+"/.test(m[2])) add('Labels', `a <${m[1]}> with no visible label or aria-label`);
  }
  const small = new Set(['a', 'an', 'and', 'the', 'of', 'to', 'with', 'for', 'in', 'on', 'at', 'by', 'or', 'nor', 'but', 'as', 'per', 'via', 'vs']);
  for (const m of body.matchAll(/<(a|button|span)\b([^>]*class="[^"]*\bbtn\b[^"]*"[^>]*)>([\s\S]*?)<\/\1>/g)) {
    if (/data-user-content/.test(m[2])) continue;
    const label = m[3].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const bad = label.split(' ').filter((w) => /[a-zA-Z]/.test(w)).some((w, i) => (i === 0 || !small.has(w.toLowerCase())) && w[0] !== w[0].toUpperCase());
    if (bad) add('Buttons', `"${label}" is not in Title Case`);
  }
  return { pass: failures.length === 0, failures, note: 'Static checks only. Contrast in both themes and 44px touch targets need a rendered page (the site build checks those).' };
}

const server = new McpServer({ name: 'design-system', version: '1.0.0' });

server.registerTool('get_tokens', {
  title: 'Get tokens',
  description: 'Design tokens from tokens/tokens.json. Call with no group to list the groups, or with a group (color, type, space, radius, motion, voice, sound, haptic, dusk...) to get its values.',
  inputSchema: { group: z.string().optional() },
}, async ({ group }) => {
  if (!group) return text(Object.keys(tokens).filter((k) => !k.startsWith('$')).map((k) => ({ group: k, about: tokens[k]?.$description ?? '' })));
  if (!(group in tokens)) return text(`No token group "${group}". Groups: ${Object.keys(tokens).filter((k) => !k.startsWith('$')).join(', ')}`);
  return text(tokens[group]);
});

server.registerTool('list_rules', {
  title: 'List rules',
  description: 'The rules in DESIGN.md. Call with no section to list the sections, or with a section name (Colour, Type, Buttons, Components, Motion, Accessibility, Voice and sound...) to read it.',
  inputSchema: { section: z.string().optional() },
}, async ({ section }) => {
  if (!section) return text(Object.keys(sections));
  const key = Object.keys(sections).find((k) => k.toLowerCase() === section.toLowerCase()) ?? Object.keys(sections).find((k) => k.toLowerCase().includes(section.toLowerCase()));
  return text(key ? `## ${key}\n${sectionText(key)}` : `No section "${section}". Sections: ${Object.keys(sections).join(', ')}`);
});

server.registerTool('get_component', {
  title: 'Get component',
  description: 'The spec for one component from DESIGN.md: its parts, sizes, states and rules. Call with no name to list components.',
  inputSchema: { name: z.string().optional() },
}, async ({ name }) => {
  const all = components();
  if (!name) return text(Object.keys(all));
  const key = Object.keys(all).find((k) => k.toLowerCase().includes(name.toLowerCase()));
  return text(key ? all[key] : `No component "${name}". Components: ${Object.keys(all).join(', ')}`);
});

server.registerTool('check_html', {
  title: 'Check HTML',
  description: 'Checks a snippet of HTML and CSS against the system before you hand it over: tokens only, the type scale, letter-spacing tokens, motion tokens, hover, labels and alt text, Title Case buttons, no em dashes. Returns each failure with the rule it broke.',
  inputSchema: { html: z.string() },
}, async ({ html }) => text(checkHtml(html)));

server.registerTool('check_spoken', {
  title: 'Check spoken answer',
  description: 'Checks text that will be read aloud against the spoken-reply rules (DESIGN.md, Voice and sound): length, sentence length, no markdown, no links or file names, no shorthand, no emoji.',
  inputSchema: { text: z.string() },
}, async ({ text: t }) => text(checkSpoken(t)));

if (import.meta.url === `file://${process.argv[1]}`) await server.connect(new StdioServerTransport());
