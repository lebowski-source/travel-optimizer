/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#1a2332",
        panel: "#222e42",
        panel2: "#2a3850",
        teal: "#2d8b8b",
        tealbright: "#3aa8a8",
        seafoam: "#a8dadc",
        cream: "#f1faee",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["'Public Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
