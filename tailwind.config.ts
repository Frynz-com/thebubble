import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#f9f9ff",
        "surface-container": "#e9edff",
        "surface-container-low": "#f1f3ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-high": "#e1e8fd",
        "surface-container-highest": "#dce2f7",
        "on-surface": "#141b2b",
        "on-surface-variant": "#424754",
        outline: "#727785",
        "outline-variant": "#c2c6d6",
        primary: "#0058be",
        "primary-container": "#2170e4",
        "on-primary": "#ffffff",
        "on-primary-container": "#fefcff",
        secondary: "#b61722",
        "on-secondary": "#ffffff",
        tertiary: "#924700",
        "tertiary-container": "#b75b00",
        "tertiary-fixed": "#ffdcc6",
        "on-tertiary-fixed": "#311400",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      boxShadow: {
        ambient: "0 10px 30px rgba(17, 24, 39, 0.04)",
        active: "0 15px 40px rgba(59, 130, 246, 0.15)",
        cta: "0 15px 40px rgba(59, 130, 246, 0.30)",
      },
      borderRadius: {
        lg: "1.5rem",
        xl: "2rem",
        "2xl": "3rem",
      },
      keyframes: {
        pulseLive: {
          "0%": { transform: "scale(1)", opacity: "0.8" },
          "70%": { transform: "scale(2.4)", opacity: "0" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
        floatSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        popIn: {
          "0%": { transform: "translateY(16px) scale(0.98)", opacity: "0" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
      },
      animation: {
        "pulse-live": "pulseLive 1.8s cubic-bezier(0, 0, 0.2, 1) infinite",
        "float-soft": "floatSoft 5s ease-in-out infinite",
        "pop-in": "popIn 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
