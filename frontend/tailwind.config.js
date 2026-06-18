/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0edff', 100: '#e4deff', 200: '#cdbeff', 300: '#b09aff',
          400: '#9070ff', 500: '#6C63FF', 600: '#5a4de6', 700: '#4a3dcc',
          800: '#3b2fb0', 900: '#2d2490',
        },
        dark: {
          900: '#0a0a0f', 800: '#111118', 700: '#1a1a26',
          600: '#22222f', 500: '#2a2a3a', 400: '#3a3a50',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(16px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
