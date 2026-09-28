/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "var(--c-bg)",
        brown: "var(--c-primary)",
        caramel: "var(--c-secondary)",
        sand: "var(--c-cream)",
        ink: "var(--c-text)",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(90, 56, 37, 0.35)",
        card: "0 10px 30px -18px rgba(36, 26, 21, 0.25)",
      },
    },
  },
  plugins: [],
};
