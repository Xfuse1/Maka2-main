/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-hex)",
        secondary: "var(--primary-hex)",
        background: "var(--background-hex)",
        foreground: "var(--foreground-hex)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
