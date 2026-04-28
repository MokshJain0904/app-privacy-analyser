import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // Enable dark mode with class strategy
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark mode color palette
        dark: {
          bg: "#0f172a",     // Slate-950
          surface: "#1e293b", // Slate-900
          border: "#334155",  // Slate-700
          text: "#f1f5f9",    // Slate-100
          "text-secondary": "#cbd5e1", // Slate-300
        }
      }
    },
  },
  plugins: [],
};
export default config;
