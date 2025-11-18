import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#000000",
          border: "#00ff7f",
          text: "#d7ffd7",
          warn: "#ffde59",
          danger: "#ff6b6b",
        },
      },
      fontFamily: {
        mono: ["var(--font-vt323)", "ui-monospace", "SFMono-Regular", "Menlo"],
      },
      animation: {
        blink: "blink 1s steps(2, start) infinite",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

