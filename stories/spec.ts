// Pulls a component's written spec out of DESIGN.md, so each Storybook page quotes the same text Claude reads.
import design from '../DESIGN.md?raw';

/** The bullet in DESIGN.md that starts with `starts` (and its indented lines), as plain text. */
export function specBullet(starts: string): string {
  const lines = design.split('\n');
  const i = lines.findIndex((l) => l.startsWith(`- ${starts}`) || l.startsWith(`- **${starts}`));
  if (i < 0) return '';
  const out = [lines[i]];
  for (let j = i + 1; j < lines.length && /^\s{2,}/.test(lines[j]); j++) out.push(lines[j]);
  return out.join('\n');
}

/** A whole "## Section" of DESIGN.md. */
export function specSection(name: string): string {
  const m = design.match(new RegExp(`## ${name}\\n([\\s\\S]*?)(?=\\n## |$)`));
  return m ? m[1].trim() : '';
}

export const fromDesignMd = (text: string) => `From DESIGN.md:\n\n${text}`;
