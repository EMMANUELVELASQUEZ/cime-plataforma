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
        gold: {
          300: '#FDE68A',
          400: '#F5C842',
          500: '#E8B84B',
          600: '#C89B2A',
          700: '#906012',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(15,27,45,.07), 0 1px 2px rgba(15,27,45,.04)',
        'card-md': '0 4px 20px rgba(15,27,45,.10), 0 2px 6px rgba(15,27,45,.06)',
        'card-lg': '0 12px 40px rgba(15,27,45,.14), 0 4px 12px rgba(15,27,45,.08)',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(5px) scale(.98)' },
          to:   { opacity: '1', transform: 'translateY(0)   scale(1)'   },
        },
      },
      animation: {
        'fade-in': 'fadeIn .16s cubic-bezier(.22,1,.36,1)',
      },
      zIndex: { '60': '60' },
    },
  },
  plugins: [],
}

export default config
