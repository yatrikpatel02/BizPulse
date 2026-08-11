/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4f46e5', // indigo-600
          accent: '#06b6d4',  // cyan-500
          indigoLight: '#818cf8',
        },
        dark: {
          bg: '#090d16',      // Premium Glass-Midnight Blue
          surface: '#111827', // Card surface
          border: '#1f2937'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}