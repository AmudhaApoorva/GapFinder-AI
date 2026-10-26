import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#f3eee4",
        ink: "#161311",
        muted: "#6b6258",
        rule: "#d8cfc1",
        terracotta: "#c45c26",
        forest: "#2f5d50",
        gold: "#b8892d",
        clay: "#8c4a32",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Fraunces", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 10px 30px -10px rgba(22, 19, 17, 0.08), 0 4px 12px -4px rgba(22, 19, 17, 0.04)",
        elevated: "0 20px 40px -15px rgba(22, 19, 17, 0.12), 0 0 1px 1px rgba(216, 207, 193, 0.6)",
        glow: "0 0 24px -4px rgba(196, 92, 38, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
