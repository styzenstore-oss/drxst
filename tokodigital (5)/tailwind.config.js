/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#151322",
        surface: "#1C1930",
        surface2: "#252140",
        line: "#332D54",
        brand: {
          DEFAULT: "#6C5CE7",
          light: "#8B7CF6",
          dark: "#4E3FC7",
        },
        amber: {
          DEFAULT: "#F5A524",
        },
        mist: "#EFEDF9",
      },
      fontFamily: {
        display: ["var(--font-space)", "sans-serif"],
        body: ["var(--font-manrope)", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};
