#!/usr/bin/env node
// Call the design-system MCP server from a terminal: ds <tool> [argument] [file]. For demos and quick checks.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const server = fileURLToPath(new URL('../mcp/server.mjs', import.meta.url));
const [tool, a] = process.argv.slice(2);
const args = tool === 'check_html' ? { html: readFileSync(a, 'utf8') } : tool === 'list_rules' ? (a ? { section: a } : {}) : tool === 'get_component' ? (a ? { name: a } : {}) : tool === 'get_tokens' ? (a ? { group: a } : {}) : {};
const client = new Client({ name: 'ds-cli', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: 'node', args: [server] }));
const res = await client.callTool({ name: tool, arguments: args });
const out = res.content.map((c) => c.text).join('\n');
let shown = out;
try {
  const j = JSON.parse(out);
  if (tool === 'check_html') {
    const g = '\x1b[1;32m', r = '\x1b[1;31m', d = '\x1b[0m';
    shown = j.pass ? `${g}PASS${d}  no rule broken` : `${r}FAIL${d}  ${j.failures.length} rule${j.failures.length > 1 ? 's' : ''} broken\n` + j.failures.map((f) => `  ${r}x${d} ${f.rule}: ${f.detail}`).join('\n');
  } else shown = JSON.stringify(j, null, 1);
} catch {}
console.log(shown);
await client.close();
