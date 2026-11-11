import type { Meta, StoryObj } from '@storybook/html-vite';

type Args = { system: string; battery: string; savings: string; payback: string };
const meta: Meta<Args> = {
  title: 'Patterns/Proposal summary',
  args: { system: '8.4 kW', battery: '13.5 kWh', savings: '$142', payback: '7.2 years' },
  render: (a) => `<article class="card" style="max-width:560px" aria-labelledby="pp-h">
    <h3 class="t-item card-title" id="pp-h">Your solar and battery proposal</h3>
    <p class="card-sub">Prepared November 11 · valid for 30 days</p>
    <dl class="stats">
      <div><dt class="meta">System</dt><dd class="stat-value">${a.system}</dd><dd class="stat-note">plus a ${a.battery} battery</dd></div>
      <div><dt class="meta">Monthly savings</dt><dd class="stat-value stat-value--key">${a.savings}</dd><dd class="stat-note">estimated, first year</dd></div>
      <div><dt class="meta">Payback</dt><dd class="stat-value">${a.payback}</dd><dd class="stat-note">after incentives</dd></div>
    </dl>
    <div class="card-actions"><button type="button" class="btn btn--fill">Review Proposal</button><button type="button" class="btn btn--text">Ask a Question</button></div>
  </article>`,
  parameters: { docs: { description: { component: 'A screen-level pattern built only from the system: a card, the label style, serif numbers from the type scale and the three button kinds. The key number uses --accent-text at --text-title (28px), so it follows the theme. Made-up figures. In the demo video, a request to hand-style it in raw green at 28px was blocked by the MCP server\'s check_html; this is the version it accepted.' } } },
};
export default meta;
export const Default: StoryObj<Args> = {};
