/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#070B14',
        surface: '#0D1117',
        'surface-2': '#111827',
        'surface-3': '#1a2035',
        border: '#1e2a3a',
        'border-2': '#263045',
        primary: '#7c3aed',
        'primary-dark': '#6d28d9',
        'primary-light': '#8b5cf6',
        'accent-blue': '#3b82f6',
        'risk-low': '#10b981',
        'risk-medium': '#f59e0b',
        'risk-high': '#ef4444',
        'risk-critical': '#dc2626',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #7c3aed, #3b82f6)',
      },
      boxShadow: {
        glow: '0 0 20px rgba(124, 58, 237, 0.15)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.15)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.15)',
      },
    },
  },
  plugins: [],
};
