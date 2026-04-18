/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 0 0 1px rgba(16, 185, 129, 0.2), 0 10px 35px rgba(16, 185, 129, 0.15)"
      }
    },
  },
  plugins: [],
}

