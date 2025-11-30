/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{jsx,js}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8', 800: '#1e40af', 900: '#1e3a8a'
        },
        brandBlue: {
          DEFAULT: '#2874F0', // Flipkart blue
          dark: '#1F5FCC'
        },
        brandAmber: {
          DEFAULT: '#FF9900', // Amazon orange
          dark: '#CC7A00'
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#111827'
        }
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 1px 3px 0 rgb(0 0 0 / 0.08)'
      }
    }
  },
  plugins: []
};