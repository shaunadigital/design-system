import type { Meta, StoryObj } from '@storybook/html-vite';
import { specBullet, fromDesignMd } from '../spec';

type Args = { label: string; placeholder: string; value: string; disabled: boolean };
let n = 0;
const field = ({ label, placeholder, value, disabled }: Args) => {
  const id = `f${++n}`;
  return `<div class="field" style="max-width:420px"><label class="field-label" for="${id}">${label}</label>
    <input class="field-input" id="${id}" placeholder="${placeholder}" value="${value}"${disabled ? ' disabled' : ''} /></div>`;
};

const meta: Meta<Args> = {
  title: 'Components/Form field',
  args: { label: 'Email', placeholder: 'you@example.com', value: '', disabled: false },
  render: field,
  parameters: { docs: { description: { component: fromDesignMd(specBullet('Form fields')) } } },
};
export default meta;
type Story = StoryObj<Args>;

export const Empty: Story = {};
export const Filled: Story = { args: { value: 'hello@shauna.digital' } };
export const Disabled: Story = { args: { value: 'Locked after sending', disabled: true } };
export const Form: Story = {
  name: 'A short form',
  render: () => `<form style="max-width:420px" onsubmit="return false">
    <div class="field"><label class="field-label" for="ff-name">Name</label><input class="field-input" id="ff-name" autocomplete="name" /></div>
    <div class="field"><label class="field-label" for="ff-size">System size</label>
      <select class="field-input" id="ff-size"><option>Solar only</option><option selected>Solar and battery</option><option>Battery only</option></select></div>
    <div class="field"><label class="field-label" for="ff-note">Anything we should know?</label><textarea class="field-input" id="ff-note" placeholder="Roof age, shade, a pool pump..."></textarea></div>
    <div class="card-actions"><button class="btn btn--fill" type="submit">Get My Proposal</button><button class="btn btn--text" type="button">Cancel</button></div>
  </form>`,
  parameters: { docs: { description: { story: 'Fields stack 24px apart, labels sit 8px above, and the form ends with one main action and a quiet cancel.' } } },
};
