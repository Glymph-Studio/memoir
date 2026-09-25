/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        memoir: {
          50: '#fdf8f0',
          100: '#f9eddb',
          200: '#f2d7b0',
          300: '#e9bc7e',
          400: '#df9a4b',
          500: '#d6832c',
          600: '#c76b22',
          700: '#a5521f',
          800: '#854220',
          900: '#6c371d',
          950: '#3a1a0d',
        },
        canvas: {
          cream: '#f5f0e8',
          kraft: '#c4a882',
          white: '#ffffff',
          vintage: '#e8dcc8',
          dark: '#2a2a2a',
          rose: '#f5e0e0',
          sage: '#dce8dc',
          sky: '#d8e8f0',
        }
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
}
