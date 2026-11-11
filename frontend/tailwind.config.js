/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FFFFFF",
        surface: {
          tint: "#F7F6FD",
          subtle: "#FDFDFE",
        },
        ink: {
          DEFAULT: "#2B2A3A",
          muted: "#686477",
          faint: "#A5A1B8",
        },
        primary: {
          DEFAULT: "#8B7FF5",
          hover: "#7B6FE5",
          light: "#EAE7FD",
        },
        pastel: {
          coral: "#FF9E9D",
          mint: "#95E1D3",
          amber: "#FCE38A",
          sky: "#A8D8EA",
          lilac: "#DDA0DD",
        },
        correct: "#4EBA87",
        wrong: "#F07178",
      },
      fontFamily: {
        sans: ["'Nunito Variable'", "system-ui", "-apple-system", "sans-serif"],
        urdu: ["'Noto Nastaliq Urdu'", "serif"],
      },
      borderRadius: {
        card: "20px",
        chip: "9999px",
        pill: "14px",
      },
      boxShadow: {
        soft: "0 8px 30px -4px rgba(139, 127, 245, 0.08), 0 2px 10px -2px rgba(43, 42, 58, 0.04)",
        modal: "0 24px 64px -12px rgba(43, 42, 58, 0.16)",
        float: "0 12px 36px -8px rgba(139, 127, 245, 0.18)",
      },
    },
  },
  plugins: [],
};
