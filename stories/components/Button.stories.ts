import type { Meta, StoryObj } from '@storybook/html-vite';
import { specBullet, specSection, fromDesignMd } from '../spec';

type Args = { label: string; kind: 'primary' | 'secondary' | 'quiet'; disabled: boolean };
const cls = { primary: 'btn btn--fill', secondary: 'btn', quiet: 'btn btn--text' };

const meta: Meta<Args> = {
  title: 'Components/Button',
  args: { label: 'Review Proposal', kind: 'primary', disabled: false },
  argTypes: { kind: { control: 'inline-radio', options: ['primary', 'secondary', 'quiet'] } },
  render: ({ label, kind, disabled }) => `<button type="button" class="${cls[kind]}"${disabled ? ' disabled' : ''}>${label}</button>`,
  parameters: { docs: { description: { component: fromDesignMd(specBullet('Buttons: three kinds, one size') + '\n\n' + specSection('Buttons')) } } },
};
export default meta;
type Story = StoryObj<Args>;

export const Primary: Story = {};
export const Secondary: Story = { args: { kind: 'secondary', label: 'Download PDF' } };
export const Quiet: Story = { args: { kind: 'quiet', label: 'Ask a Question' } };
export const ShortQuietLabel: Story = {
  name: 'Quiet, short label',
  args: { kind: 'quiet', label: 'No' },
  parameters: { docs: { description: { story: 'The quiet button is at least 44px wide, so a two-letter label still meets the touch target. This was a real bug the eval caught: "No" used to render 28px wide.' } } },
};
export const Disabled: Story = { args: { disabled: true } };
export const AllKinds: Story = {
  name: 'All three, in one area',
  render: () => `<div style="display:flex;align-items:center;gap:var(--space-5)">
    <button type="button" class="btn btn--fill">Email Me</button>
    <button type="button" class="btn btn--text">Résumé</button>
  </div>
  <div style="margin-top:var(--space-6)"><button type="button" class="btn">Download PDF</button></div>`,
  parameters: { docs: { description: { story: 'One main action per area. The second action is quiet. A standalone action is secondary.' } } },
};
