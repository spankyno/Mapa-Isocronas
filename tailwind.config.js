/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'], display: ['"Instrument Serif"', 'Georgia', 'serif'] },
      colors: { ink: '#14213d', route: '#0f766e' },
    },
  },
  plugins: [],
}
