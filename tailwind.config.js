module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#245C4A',
        leaf: '#36795D',
        cream: '#F8F6EF',
        sage: '#E4EEE5',
        terracotta: '#C77957',
        charcoal: '#26352E',
        muted: '#64736A',
        line: '#D5E3D8',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'Noto Sans', 'Noto Sans Ethiopic', 'Droid Sans Fallback', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Noto Serif Ethiopic', 'Noto Sans Ethiopic', 'Droid Sans Fallback', 'Georgia', 'serif'],
      },
    },
  },
  plugins: []
}
