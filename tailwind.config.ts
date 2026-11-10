import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 深色酒吧主題：以「雪茄葉棕 + 威士忌琥珀」為主色
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        surface: {
          DEFAULT: '#141317',
          raised: '#1c1a20',
          border: '#2a2730',
        },
        brand: {
          50: '#fdf6e9',
          100: '#f9e9c8',
          200: '#f2d493',
          300: '#e9b85c',
          400: '#e0a13a',
          500: '#c8842a',
          600: '#a86820',
          700: '#85501d',
          800: '#613b18',
          900: '#3f2711',
        },
      },
      fontFamily: {
        sans: [
          '"Noto Sans HK"',
          '"PingFang HK"',
          '"Microsoft JhengHei"',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 8px 24px -12px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(ellipse at top, rgba(200, 132, 42, 0.18), transparent 60%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;

