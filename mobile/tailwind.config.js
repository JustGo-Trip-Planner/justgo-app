/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Kanit_400Regular"],
        medium: ["Kanit_500Medium"],
        semibold: ["Kanit_600SemiBold"],
      },
    },
  },
  plugins: [],
}
