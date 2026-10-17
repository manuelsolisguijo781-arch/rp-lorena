/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        genshin: {
          dark: '#0c1022',
          card: '#161d36',
          panel: '#1f2746',
          border: '#3b4568',
          gold: '#e6c888',
          goldLight: '#fbe2a7',
          goldDark: '#a17f41',
          cyan: '#58d3d9',
          purple: '#9d6ff5',
          rose: '#f06292',
          crimson: '#e05353',
        },
      },
      fontFamily: {
        genshin: ['HYWenHei', 'Cinzel', 'Trajan Pro', 'serif', 'sans-serif'],
      },
      backgroundImage: {
        'genshin-gradient': 'linear-gradient(135deg, #10162f 0%, #1a2244 50%, #131830 100%)',
        'gold-border': 'linear-gradient(90deg, transparent, #e6c888, transparent)',
      },
      boxShadow: {
        'genshin-gold': '0 0 15px rgba(230, 200, 136, 0.35)',
        'genshin-glow': '0 0 25px rgba(88, 211, 217, 0.25)',
      },
    },
  },
  plugins: [],
};
