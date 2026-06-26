/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          base: '#f4efe7',
          muted: '#efe7db',
          surface: '#fffaf2',
          line: '#d3c6b4',
        },
        clinical: {
          blue: '#1d5f91',
          deep: '#0e4b76',
          teal: '#2f7d65',
          amber: '#bf7a2b',
          red: '#b44836',
          ink: '#16202c',
          muted: '#506073',
        },
        emergency: {
          critical: '#b44836',
          urgent: '#d27b33',
          warning: '#efd6a6',
          stable: '#77a7c7',
          normal: '#b8d4c7',
        },
      },
      fontFamily: {
        display: ['Heebo', 'IBM Plex Sans Hebrew', 'sans-serif'],
        body: ['IBM Plex Sans Hebrew', 'Heebo', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 18px 48px rgba(26, 43, 58, 0.08)',
        strong: '0 24px 60px rgba(17, 35, 51, 0.14)',
      },
      backgroundImage: {
        'clinical-shell':
          'radial-gradient(circle at 12% 16%, rgba(191, 122, 43, 0.12), transparent 24%), radial-gradient(circle at 88% 8%, rgba(29, 95, 145, 0.14), transparent 28%), linear-gradient(180deg, rgba(255, 252, 247, 0.62) 0%, rgba(244, 239, 231, 0.9) 100%)',
        'clinical-header':
          'linear-gradient(135deg, rgba(14, 75, 118, 0.96) 0%, rgba(22, 32, 44, 0.94) 60%, rgba(47, 125, 101, 0.94) 100%)',
      },
      transitionTimingFunction: {
        clinical: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
