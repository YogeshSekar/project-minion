export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        accent: {
          50: 'rgb(var(--accent-50) / <alpha-value>)',
          100: 'rgb(var(--accent-100) / <alpha-value>)',
          200: 'rgb(var(--accent-200) / <alpha-value>)',
          300: 'rgb(var(--accent-300) / <alpha-value>)',
          400: 'rgb(var(--accent-400) / <alpha-value>)',
          500: 'rgb(var(--accent-500) / <alpha-value>)',
          600: 'rgb(var(--accent-600) / <alpha-value>)',
          700: 'rgb(var(--accent-700) / <alpha-value>)',
          800: 'rgb(var(--accent-800) / <alpha-value>)',
          900: 'rgb(var(--accent-900) / <alpha-value>)',
          950: 'rgb(var(--accent-950) / <alpha-value>)',
          surface: 'rgb(var(--accent-surface) / <alpha-value>)',
          'surface-hover': 'rgb(var(--accent-surface-hover) / <alpha-value>)',
          muted: 'rgb(var(--accent-muted) / <alpha-value>)',
          border: 'rgb(var(--accent-border) / <alpha-value>)',
          text: 'rgb(var(--accent-text) / <alpha-value>)',
          solid: 'rgb(var(--accent-solid) / <alpha-value>)',
          'solid-hover': 'rgb(var(--accent-solid-hover) / <alpha-value>)',
          focus: 'rgb(var(--accent-focus) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        todoist: {
          red: '#db4c3f',
          'red-hover': '#c0392b',
          'red-light': '#ffefe8',
          'sidebar-bg': '#fcfaf8',
          'sidebar-hover': '#f5f0ec',
          'text-primary': '#202020',
          'text-secondary': '#666',
          'border': '#e6e1dc',
          'priority-1': '#d1453b', // P1 - Red
          'priority-2': '#eb8909', // P2 - Orange  
          'priority-3': '#246fe0', // P3 - Blue
          'priority-4': '#666',    // P4 - Gray (no priority)
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar'),
  ],
}