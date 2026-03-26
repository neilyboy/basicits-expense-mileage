/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#bcd2ff',
          300: '#8eb5ff',
          400: '#598dff',
          500: '#3366ff',
          600: '#1e3a5f',
          700: '#162d4a',
          800: '#0f2035',
          900: '#0a1628',
          950: '#060d18'
        }
      }
    }
  },
  plugins: []
};
