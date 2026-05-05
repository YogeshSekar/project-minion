export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
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