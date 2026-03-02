import '../public/styles.css';
import '../stories/audit/audit.css';

/** @type { import('@storybook/html-vite').Preview } */
const preview = {
  parameters: {
    layout: 'padded',
    backgrounds: {
      default: 'lingualog',
      values: [
        { name: 'lingualog', value: 'var(--bg, #EDE8DF)' },
        { name: 'surface', value: 'var(--surface, #F7F4EF)' },
      ],
    },
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo"
    }
  },
};

export default preview;