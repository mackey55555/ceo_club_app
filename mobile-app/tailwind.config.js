/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#243266',
          light: '#3d4d8a',
          dark: '#1a2447',
        },
        secondary: {
          DEFAULT: '#a8895b',
          light: '#c4a87d',
          dark: '#8b6f3f',
        },
      },
    },
  },
  plugins: [],
};

