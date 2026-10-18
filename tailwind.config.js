module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
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
        sans: ['var(--font-dm-sans)', 'Noto Sans', 'Noto Sans CJK SC', 'Noto Sans KR', 'Noto Sans Ethiopic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-dm-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: []
}
