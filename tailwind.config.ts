import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          500: "#98908b",
          100: "#f8f4f0",
          200: "#f2f3f7",
        },
        grey: {
          900: "#201f24",
          500: "#696868",
          300: "#b3b3b3",
          100: "#f2f2f2",
        },
        secondary: {
          green: "#277c78",
          yellow: "#f2cdac",
          cyan: "#82c9d7",
          navy: "#626070",
          red: "#c94736",
          purple: "#826cb0",
          lightPurple: "#af81ba",
          turquoise: "#597c7c",
          brown: "#93674f",
          magenta: "#934f6f",
          blue: "#3f82b2",
          navyGrey: "#97a0ac",
          amyGreen: "#7f9161",
          gold: "#cab361",
          orange: "#b36c49",
          white: "#ffffff",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(32, 31, 36, 0.04), 0 4px 16px -4px rgba(32, 31, 36, 0.06)",
        "card-hover":
          "0 2px 4px rgba(32, 31, 36, 0.05), 0 12px 32px -8px rgba(32, 31, 36, 0.12)",
        pop: "0 16px 48px -12px rgba(32, 31, 36, 0.28)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96) translateY(8px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-up": "fade-up 400ms cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in": "scale-in 250ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
export default config;
