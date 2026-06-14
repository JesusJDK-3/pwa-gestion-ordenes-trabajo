/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        kabj: {
          primary:        '#CC1111',
          'primary-hover':'#AA0E0E',
          'primary-light':'#FDECEA',
          navbar:         '#1A2535',
          login:          '#1E2D40',
          body:           '#EEF1F5',
          success:        '#22C55E',
          'success-light':'#DCFCE7',
          warning:        '#F59E0B',
          info:           '#3B82F6',
          'info-light':   '#EFF6FF',
          'icon-blue':    '#2563EB',
          'icon-orange':  '#EA580C',
          'icon-purple':  '#9333EA',
          'icon-green':   '#16A34A',
        },
      },
      fontFamily: {
        sans: ['Source Sans 3', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '16px' }],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        card:       '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover':'0 4px 12px rgba(0,0,0,0.10)',
        'cta-up':   '0 -2px 8px rgba(0,0,0,0.10)',
        login:      '0 20px 60px rgba(0,0,0,0.30)',
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '15%':     { transform: 'translateX(-8px)' },
          '30%':     { transform: 'translateX(8px)' },
          '45%':     { transform: 'translateX(-6px)' },
          '60%':     { transform: 'translateX(6px)' },
          '75%':     { transform: 'translateX(-3px)' },
          '90%':     { transform: 'translateX(3px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-800px 0' },
          '100%': { backgroundPosition: '800px 0' },
        },
        'check-draw': {
          '0%':   { strokeDashoffset: '30', opacity: '0' },
          '100%': { strokeDashoffset: '0',  opacity: '1' },
        },
        'banner-in': {
          '0%':   { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'spin-slow': {
          '0%':   { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'fade-in-up':   'fade-in-up 0.4s ease-out both',
        'fade-in-down': 'fade-in-down 0.2s ease-out both',
        'scale-in':     'scale-in 0.35s ease-out both',
        'shake':        'shake 0.4s ease-in-out',
        'shimmer':      'shimmer 1.2s infinite linear',
        'check-draw':   'check-draw 0.5s ease-out both',
        'banner-in':    'banner-in 0.3s ease-out both',
        'spin-slow':    'spin-slow 1s linear infinite',
      },
    },
  },
  plugins: [],
}
