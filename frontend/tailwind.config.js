/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: { DEFAULT: '#2563eb', 50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd', 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
        sidebar: { DEFAULT: '#0f172a', hover: '#1e293b', active: '#1e3a5f', text: '#94a3b8', 'text-active': '#f1f5f9' },
        surface: '#ffffff',
        border: '#e2e8f0',
        bg: '#f8fafc',
        accent: '#2563eb',
        success: '#059669',
        warning: '#d97706',
        danger: '#dc2626',
        info: '#0284c7',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
        dropdown: '0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        sidebar: 'inset -1px 0 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out both',
        'slide-up': 'slideUp 0.25s ease-out both',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [],
}
