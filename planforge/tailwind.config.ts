import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50:  '#FAFAF8',
          100: '#F5F4F0',
          200: '#EDE9E3',
          300: '#E0DAD2',
        },
        teal: {
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'Nunito', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease-in-out',
        'slide-up':   'slideUp 0.35s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'card-lift':  'cardLift 0.2s ease',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        cardLift: {
          '0%':   { transform: 'translateY(0)',    boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
          '100%': { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
        },
      },
      boxShadow: {
        'card':      '0 1px 4px rgba(0,0,0,0.06)',
        'card-hover':'0 8px 28px rgba(0,0,0,0.08)',
        'soft':      '0 2px 12px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
}
export default config
