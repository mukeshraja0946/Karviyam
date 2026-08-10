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
        karviyam: {
          dark: '#0d0f12',
          card: '#161920',
          primary: '#e10600',
          hover: '#c00500',
          gold: '#dfb15b',
          accent: '#7c3aed'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Montserrat', 'sans-serif']
      }
    },
  },
  plugins: [],
}
