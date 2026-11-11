import type { Meta, StoryObj } from '@storybook/html-vite';
import tokens from '../../tokens/tokens.json';

const type = (tokens as Record<string, any>).type as Record<string, any>;
const sizes = Object.entries(type).filter(([k]) => !k.startsWith('$'));
const serif = new Set(['hero', 'display-xl', 'heading', 'statement', 'step', 'title']);

const meta: Meta = {
  title: 'Foundations/Type',
  parameters: { docs: { description: { component: type.$description } } },
};
export default meta;

export const Scale: StoryObj = {
  render: () => {
    const el = document.createElement('div');
    el.innerHTML = `<ol style="display:flex;flex-direction:column;gap:var(--space-5)">
      ${sizes.filter(([k]) => k !== 'pins').map(([k, v]) => `<li style="display:grid;grid-template-columns:220px 1fr;gap:var(--space-5);align-items:baseline;padding-bottom:var(--space-4);border-bottom:1px solid rgba(var(--ink-rgb),0.14)">
        <div><p class="t-item">--text-${k}</p><p class="muted" style="font-size:var(--text-small)">${v.px}px at full width</p></div>
        <div><p style="font-size:var(--text-${k});${serif.has(k) ? 'font-family:var(--font-display);line-height:1.1' : ''}">Design systems for people and AI</p>
        <p class="muted" style="font-size:var(--text-small);margin-top:var(--space-1)">${v.use ?? ''}</p></div>
      </li>`).join('')}
    </ol>`;
    return el;
  },
};
