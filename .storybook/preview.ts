import type { Preview } from '@storybook/html-vite';
import '../build/tokens.css';
import '../components/fonts.css';
import '../components/base.css';
import '../components/field.css';
import '../components/card.css';
import '../components/composer/composer.css';
import '../components/app-shell/app-shell.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Day or Dusk, from tokens.json',
      toolbar: { title: 'Theme', icon: 'mirror', items: [{ value: 'day', title: 'Day' }, { value: 'dusk', title: 'Dusk' }], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'day' },
  decorators: [
    (story, ctx) => {
      // Themes switch the same way as on shauna.dev: one attribute on <html>, every colour follows from the tokens.
      if (ctx.globals.theme === 'dusk') document.documentElement.dataset.theme = 'dusk';
      else delete document.documentElement.dataset.theme;
      return story();
    },
  ],
  parameters: {
    layout: 'padded',
    backgrounds: { disable: true },
    a11y: { test: 'error' },
    options: { storySort: { order: ['Start Here', 'Demo Video', 'Foundations', 'Components', 'Patterns'] } },
  },
};
export default preview;
