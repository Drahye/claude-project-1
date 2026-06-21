import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      colors: {
        indigo: {
          DEFAULT: "oklch(46% 0.22 264)",
          hover:   "oklch(42% 0.22 264)",
          light:   "oklch(96% 0.015 264)",
        },
        navy: {
          DEFAULT: "oklch(11% 0.025 264)",
          mid:     "oklch(17% 0.025 264)",
        },
        gold: {
          DEFAULT: "oklch(62% 0.15 65)",
          light:   "oklch(97% 0.015 65)",
        },
        emerald: {
          DEFAULT: "oklch(52% 0.17 162)",
          light:   "oklch(95% 0.015 162)",
        },
        danger: {
          DEFAULT: "oklch(47% 0.22 27)",
          light:   "oklch(97% 0.01 27)",
        },
      },
      borderRadius: {
        card: "18px",
        btn:  "100px",
        badge: "100px",
      },
      boxShadow: {
        sm:     "0 1px 2px rgba(0,0,0,0.04)",
        md:     "0 8px 24px rgba(15,23,42,0.08)",
        lg:     "0 20px 48px rgba(15,23,42,0.12)",
        modal:  "0 30px 60px rgba(15,23,42,0.20)",
        indigo: "0 8px 32px rgba(79,70,229,0.25)",
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.23,1,0.32,1) both",
        "slide-in": "slide-in 0.4s cubic-bezier(0.23,1,0.32,1) both",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
