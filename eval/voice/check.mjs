// The spoken-answer check (DESIGN.md, Voice and sound). Shared by eval/voice/score.mjs and the design-system server.
import { readFileSync } from 'node:fs';
const tokens = JSON.parse(readFileSync(new URL('../../tokens/tokens.json', import.meta.url), 'utf8'));
const MAX_WORDS = tokens.voice.maxWords, MAX_SENT = tokens.voice.maxSentenceWords;

const words = (t) => t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
const sentences = (t) => t.replace(/\b(e\.g|i\.e|etc|vs|Mr|Ms|Dr)\./gi, '$1').split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export function check(text) {
  const t = text.trim();
  const w = words(t).length;
  const longest = Math.max(0, ...sentences(t).map((s) => words(s).length));
  const issues = {
    length: w > MAX_WORDS ? [`${w} words (limit ${MAX_WORDS})`] : [],
    sentences: longest > MAX_SENT ? [`longest sentence ${longest} words (limit ${MAX_SENT})`] : [],
    markdown: [
      /^\s*([-*•+]|\d+[.)])\s+/m.test(t) && 'list item',
      /\*\*|__|`/.test(t) && 'bold or code',
      /^#{1,6}\s/m.test(t) && 'heading',
      /\|.*\|/.test(t) && 'table',
    ].filter(Boolean),
    links: [...t.matchAll(/https?:\/\/\S+|www\.\S+|\b[\w-]+\.(?:com|dev|digital|org|io|json|md|astro|css|ts|js|pdf)\b|(?:^|\s)\/[\w./#-]+|[\w.+-]+@[\w-]+\.\w+/gi)].map((m) => m[0].trim()),
    shorthand: [...t.matchAll(/\be\.g\.|\bi\.e\.|\betc\.|\bvs\.?(?=\s)|&|[A-Za-z]\/[A-Za-z]/gi)].map((m) => m[0]),
    emoji: [...t.matchAll(/\p{Extended_Pictographic}/gu)].map((m) => m[0]),
  };
  const pass = Object.values(issues).every((v) => v.length === 0);
  return { pass, words: w, longestSentence: longest, issues };
}

export const RULES = ['length', 'sentences', 'markdown', 'links', 'shorthand', 'emoji'];
