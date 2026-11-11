import type { Meta, StoryObj } from '@storybook/html-vite';
import { specBullet, fromDesignMd } from '../spec';

type Args = { title: string; body: string; withActions: boolean };
const meta: Meta<Args> = {
  title: 'Components/Card',
  args: { title: 'Foster orientation', body: 'Thursday at 3:00. New fosters meet the team and pick up a starter kit.', withActions: true },
  render: ({ title, body, withActions }) => `<article class="card" style="max-width:480px">
    <h3 class="t-item card-title">${title}</h3><p class="card-sub">${body}</p>
    ${withActions ? '<div class="card-actions"><button type="button" class="btn btn--fill">Save a Spot</button><button type="button" class="btn btn--text">Details</button></div>' : ''}
  </article>`,
  parameters: { docs: { description: { component: fromDesignMd(specBullet('Page layout')) } } },
};
export default meta;
export const WithActions: StoryObj<Args> = {};
export const Plain: StoryObj<Args> = { args: { withActions: false } };
