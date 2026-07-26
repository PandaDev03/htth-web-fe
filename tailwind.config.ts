import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: 'var(--primary)',
        accent: 'var(--accent)',
        muted: { DEFAULT: 'var(--muted)', foreground: 'var(--muted-foreground)' },
        gold: { DEFAULT: 'var(--gold-mid)', light: 'var(--gold-light)', dark: 'var(--gold-dark)' },
        navy: { deep: 'var(--navy-deep)', mid: 'var(--navy-mid)', light: 'var(--navy-light)', border: 'var(--navy-border)' },
        'red-light': 'var(--red-light)',
        'teal-accent': 'var(--teal-accent)',
      },
      fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      fontWeight: { 500: '500', 600: '600', 700: '700', 800: '800' },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      animation: { 'fade-in': 'fadeIn .4s ease forwards', 'slide-up': 'slideUp .3s ease forwards' },
      keyframes: {
        fadeIn: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
