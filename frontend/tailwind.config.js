// File: tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          rust:    "#7C3A2D",
          dark:    "#0D0D0D",
          charcoal:"#1A1A1A",
          muted:   "#6B6B6B",
          border:  "#E8E8E8",
          light:   "#F7F5F2",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        sans:    ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
      },
      animation: {
        "fade-up":   "fadeUp 0.6s ease forwards",
        "fade-up-2": "fadeUp 0.6s 0.15s ease forwards",
        "fade-up-3": "fadeUp 0.6s 0.3s ease forwards",
        shimmer:     "shimmer 2s infinite linear",
      },
    },
  },
  plugins: [],
};