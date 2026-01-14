/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050505",
        surface: "rgba(20, 20, 20, 0.9)",
        primary: "#00ffaa", 
        secondary: "#555555",
      },
      fontFamily: {
        sans: ['"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['monospace'],
      }
    },
  },
  plugins: [],
}
