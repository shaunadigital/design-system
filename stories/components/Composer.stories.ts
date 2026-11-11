import type { Meta, StoryObj } from '@storybook/html-vite';
import { composerHTML } from '../../components/composer/composer.html';
import { mountComposer } from '../../components/composer/composer';
import { specBullet, fromDesignMd } from '../spec';

const meta: Meta = {
  title: 'Components/Chat composer',
  parameters: { layout: 'fullscreen', docs: { description: { component: fromDesignMd(specBullet('Chat composer')) } } },
};
export default meta;

export const Interactive: StoryObj = {
  render: () => {
    const el = document.createElement('div');
    el.style.padding = 'var(--space-6)';
    el.innerHTML = composerHTML();
    // Mount after the element is in the page, so focus and live regions behave as they do on shauna.dev.
    requestAnimationFrame(() => mountComposer(el));
    return el;
  },
  parameters: { docs: { description: { story: 'Every state is reachable here: type to get Ready, send to stream a scripted reply, Stop or Esc mid-reply, set the next reply to Fail to see the error and Try Again, attach files over 10 MB to see the limit, and open Context for the menu. No AI is connected; replies are scripted.' } } },
};
