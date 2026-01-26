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
        primary: "#22c55e",
        danger: "#ef4444",
        warning: "#f97316"
      }
    }
  },
  plugins: []
};

export default config;

