/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        ink: "var(--color-ink)",
        muted: "var(--color-muted)",
        border: "var(--color-border)",
        surface: "var(--color-surface)",
        accent: "var(--color-accent)",
        "tally-c1": "var(--color-tally-c1)",
        "tally-c2": "var(--color-tally-c2)",
        "tally-c3": "var(--color-tally-c3)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        error: "var(--color-error)",
      },
      boxShadow: {
        soft: "0 24px 60px rgba(27, 26, 23, 0.08)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "SF Pro Text", "Segoe UI", "system-ui", "sans-serif"],
      },
      animation: {
        "stroke-draw": "stroke-draw 200ms ease-out forwards",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        "stroke-draw": {
          "0%": { transform: "scaleY(0)", opacity: "0" },
          "100%": { transform: "scaleY(1)", opacity: "1" },
        },
      },
    },
  },
  darkMode: "class",
  plugins: [],
};

