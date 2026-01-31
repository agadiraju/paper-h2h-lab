import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Paper theme colors
        paper: {
          DEFAULT: "#FAF8F3",
          dark: "#F5F1E8",
          darker: "#EBE5D9"
        },
        ink: {
          DEFAULT: "#2C2416",
          light: "#3E3426",
          lighter: "#5A4E3D"
        },
        border: {
          DEFAULT: "#D4C5B0",
          dark: "#BFB4A1"
        },
        primary: "#6B8E4E",
        "primary-dark": "#5A7741",
        danger: "#B85C4F",
        warning: "#C49056"
      },
      fontFamily: {
        sans: ["Georgia", "ui-serif", "serif"],
        mono: ["Courier New", "Courier", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;

