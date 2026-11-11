import type { Meta, StoryObj } from '@storybook/html-vite';
import tokens from '../../tokens/tokens.json';

const groups = (tokens as Record<string, any>)['$colorGroups'];
const roles = Object.entries(groups.roles as Record<string, string>);

// WCAG contrast of a CSS colour against the page, measured in the browser so it follows the current theme.
function luminance(rgb: number[]): number {
  const [r, g, b] = rgb.map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const parse = (c: string) => (c.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
function ratio(a: string, b: string) { const [x, y] = [luminance(parse(a)), luminance(parse(b))].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); }

const meta: Meta = {
  title: 'Foundations/Colour',
  parameters: { docs: { description: { component: (tokens as any).color?.$description ?? 'Colour roles from tokens.json.' } } },
};
export default meta;

export const Roles: StoryObj = {
  render: () => {
    const el = document.createElement('div');
    el.innerHTML = `<p class="muted" style="max-width:60ch;margin-bottom:var(--space-5)">Each role names the base colour it uses by Day. Switch to Dusk in the toolbar: the roles split apart, and the contrast figures are measured again against the page.</p>
      <ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:var(--space-4)">
        ${roles.map(([role, base]) => `<li class="card" style="padding:var(--space-4)">
          <div style="height:64px;border-radius:var(--radius-sm);border:1px solid rgba(var(--ink-rgb),0.14);background:var(--${role})"></div>
          <p class="t-item" style="margin-top:var(--space-3)">--${role}</p>
          <p class="muted" style="font-size:var(--text-small)">Day base: ${base}</p>
          <p class="muted" style="font-size:var(--text-small)" data-contrast="${role}"></p>
        </li>`).join('')}
      </ul>`;
    requestAnimationFrame(() => {
      const page = getComputedStyle(document.documentElement).getPropertyValue('--paper').trim();
      const probe = document.createElement('span'); document.body.append(probe);
      const rgbOf = (v: string) => { probe.style.color = v; return getComputedStyle(probe).color; };
      for (const p of el.querySelectorAll<HTMLElement>('[data-contrast]')) {
        const v = getComputedStyle(document.documentElement).getPropertyValue(`--${p.dataset.contrast}`).trim();
        p.textContent = `${v} · ${ratio(rgbOf(v), rgbOf(page)).toFixed(1)}:1 on the page`;
      }
      probe.remove();
    });
    return el;
  },
};
