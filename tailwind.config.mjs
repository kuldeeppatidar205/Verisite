export default {
  darkMode: ['selector', 'html.dark'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--color-brand-primary)",
          hover: "var(--color-brand-hover)",
          success: "var(--color-brand-success)",
          warning: "var(--color-brand-warning)",
        },
        surface: {
          main: "var(--color-surface-main)",
          card: "var(--color-surface-card)",
          input: "var(--color-surface-input)",
        },
        ui: {
          border: "var(--color-ui-border)",
        }
      },
      textColor: {
        brand: {
          base: "var(--color-text-brand-base)",
          secondary: "var(--color-text-brand-secondary)",
          muted: "var(--color-text-brand-muted)",
        }
      }
    },
  },
};
