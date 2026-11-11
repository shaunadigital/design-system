import type { StorybookConfig } from '@storybook/html-vite';

// Storybook for the design system: every component, its states, both themes, and an accessibility check on each story.
const config: StorybookConfig = {
  framework: '@storybook/html-vite',
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  staticDirs: [{ from: '../components/fonts', to: '/fonts' }, { from: '../stories/assets', to: '/assets' }],
};
export default config;
