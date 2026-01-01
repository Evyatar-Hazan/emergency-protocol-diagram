/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        emergency: {
          critical: '#ff0000',
          urgent: '#ff6666',
          warning: '#ffaa66',
          stable: '#66aaff',
          normal: '#6f6',
        },
      },
    },
  },
  plugins: [],
}
