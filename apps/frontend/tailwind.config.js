/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Sentinel Blue — primary palette
        primary: "#0052CC",
        "primary-dark": "#003B9A",
        "primary-light": "#D6E4FF",

        // Secondary
        secondary: "#42526E",
        "secondary-light": "#DFE1E6",

        // Tertiary / error / alert
        tertiary: "#DE350B",
        "tertiary-light": "#FFEBE6",

        // Neutral surface
        neutral: "#F4F5F7",
        "neutral-dark": "#EBECF0",

        // Semantic
        success: "#00875A",
        "success-light": "#E3FCEF",
        warning: "#FF991F",
        "warning-light": "#FFFAE6",
        danger: "#DE350B",
        "danger-light": "#FFEBE6",

        // Material design token aliases (for reference HTML compat)
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F4F5F7",
        "surface-container": "#EBECF0",
        "surface-container-high": "#DFE1E6",
        "surface-container-highest": "#C1C7D0",
        "on-surface": "#172B4D",
        "on-surface-variant": "#42526E",
        "outline-variant": "#DFE1E6",
        background: "#F4F5F7",
        "error-container": "#FFEBE6",
        "on-error-container": "#BF2600",
        "primary-container": "#003B9A",
        "primary-fixed": "#D6E4FF",
        "secondary-container": "#DFE1E6",
        "tertiary-fixed": "#FFEBE6",
        "on-tertiary-fixed": "#BF2600",
        error: "#DE350B",
        "surface-bright": "#FFFFFF",
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(9,30,66,0.13), 0 0 0 1px rgba(9,30,66,0.08)",
        "card-hover": "0 4px 12px rgba(9,30,66,0.15), 0 0 0 1px rgba(9,30,66,0.08)",
        overlay: "0 8px 32px rgba(9,30,66,0.2)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { opacity: "0", transform: "translateX(-12px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "count-up": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "slide-in": "slide-in 0.3s ease-out both",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
