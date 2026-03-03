/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./store.html",
    "./register.html",
    "./success.html",
    "./admin.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#D4A017',
          dark: '#1A1A1A',
          charcoal: '#252525'
        }
      },
      fontFamily: {
        'cairo': ['Cairo', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
