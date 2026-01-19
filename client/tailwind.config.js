/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fffaf4",
          100: "#f8f1e7",
          200: "#ebddcf"
        },
        hlgreen: {
          600: "#2e7d32",
          700: "#256428"
        },
        hlblack: "#111111"
      }
    }
  },
  plugins: []
};
