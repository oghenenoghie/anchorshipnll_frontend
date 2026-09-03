import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        hull: "#0E1621",
        steel: "#3B4A5A",
        fog: "#8A97A6",
        paper: "#F4F2EC",
        snow: "#FFFFFF",
        blueprint: "#2E6E9E",
        harbor: "#157A8C",
        signal: "#C6602B",
        patina: "#6E8B7B",
        rust: "#9B2C2C",
        border: "var(--border)",
        "border-strong": "var(--border-strong)",
        ring: "var(--ring)",
        "surface-0": "var(--surface-0)",
        "surface-1": "var(--surface-1)",
        "surface-2": "var(--surface-2)",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 6vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        "display-lg": ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.01em" }],
        label: ["0.8125rem", { letterSpacing: "0.08em" }],
        data: ["0.875rem", { lineHeight: "1.4" }],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
      backgroundImage: {
        "blueprint-grid":
          "linear-gradient(rgb(46 110 158 / .07) 1px, transparent 1px), linear-gradient(90deg, rgb(46 110 158 / .07) 1px, transparent 1px)",
      },
      backgroundSize: {
        "blueprint-grid": "32px 32px",
      },
    },
  },
  plugins: [],
};
export default config;
