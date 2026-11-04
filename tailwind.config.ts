import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EBF3FC',
          100: '#C7DFFA',
          200: '#90BFF5',
          300: '#5899EA',
          400: '#3578C8',
          500: '#1B4F91',
          600: '#0E3568',
          700: '#0A2349',
          800: '#071830',
          900: '#04101F',
          950: '#020A14',
        },
        navy: {
          950: '#040714',
          900: '#070A24',
          800: '#0D1035',
          700: '#131847',
          600: '#1B2260',
          500: '#253480',
          400: '#3A50AA',
          300: '#6070C8',
          200: '#9BA8DC',
          100: '#CDD2EE',
          50:  '#ECEEF8',
        },
        gold: {
          50:  '#FDFBE6',
          100: '#FAF5C0',
          200: '#F5EC82',
          300: '#EFE048',
          400: '#E5D330',
          500: '#C8B820',
          600: '#9E9010',
          700: '#736600',
          800: '#3E3700',
          900: '#1C1900',
        },
      },
      fontFamily: {
        sans:        ['var(--font-inter)',        'system-ui', 'sans-serif'],
        mono:        ['var(--font-jetbrains)',    'ui-monospace', 'monospace'],
        display:     ['var(--font-playfair)',     'Georgia', '"Times New Roman"', 'serif'],
        condensed:   ['var(--font-barlow)',       '"Arial Narrow"', 'Helvetica Neue', 'sans-serif'],
        montserrat:  ['var(--font-montserrat)',   'Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm':      '0 1px 2px rgba(7,10,36,.05)',
        'card':    '0 1px 3px rgba(7,10,36,.07), 0 1px 2px rgba(7,10,36,.04)',
        'card-md': '0 4px 20px rgba(7,10,36,.10), 0 2px 6px rgba(7,10,36,.06)',
        'card-lg': '0 12px 40px rgba(7,10,36,.14), 0 4px 12px rgba(7,10,36,.08)',
        'ent':     '0 0 0 1px rgba(7,10,36,.06), 0 2px 8px rgba(7,10,36,.08)',
        'ent-md':  '0 0 0 1px rgba(7,10,36,.08), 0 4px 20px rgba(7,10,36,.12)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(5px) scale(.98)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in':  'fadeIn .16s cubic-bezier(.22,1,.36,1)',
        'slide-up': 'slideUp .22s cubic-bezier(.22,1,.36,1)',
      },
      zIndex: { '60': '60' },
    },
  },
  plugins: [],
}

export default config
