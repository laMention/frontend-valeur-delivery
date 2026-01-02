/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          red: '#a70000',
        },
        black: '#000000',
        white: '#ffffff',
      },
      backgroundColor: {
        primary: '#a70000',
        secondary: '#000000',
        danger: '#a70000',
        outline: '#a70000',
        dark: '#a70000',
      },
      textColor: {
        primary: '#a70000',
        secondary: '#000000',
      },
    },
  },
  plugins: [],
}

