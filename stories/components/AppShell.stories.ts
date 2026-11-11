import type { Meta, StoryObj } from '@storybook/html-vite';
import { appShellHTML } from '../../components/app-shell/app-shell.html';
import { mountAppShell } from '../../components/app-shell/app-shell';
import { specBullet, fromDesignMd } from '../spec';

const meta: Meta = {
  title: 'Components/Sidebar, menu and dialog',
  parameters: { docs: { description: { component: fromDesignMd(specBullet('Sidebar, menu and dialog')) } } },
};
export default meta;

export const Interactive: StoryObj = {
  render: () => {
    const el = document.createElement('div');
    el.innerHTML = appShellHTML();
    requestAnimationFrame(() => mountAppShell(el));
    return el;
  },
  parameters: { docs: { description: { story: 'Open a chat\'s menu with the three dots (or Enter on them). Rename and Delete open a native dialog that traps focus and returns it on close; Pin moves the chat to the top; Restore Chats puts the list back. Try it all from the keyboard.' } } },
};
