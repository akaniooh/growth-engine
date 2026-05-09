/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: '#0c0c0e',
          raised: '#111114',
          overlay: '#17171b',
          border: '#1f1f24',
          muted: '#2a2a30',
        },
        ink: {
          DEFAULT: '#f0f0f4',
          secondary: '#8a8a9a',
          tertiary: '#55555f',
        },
        brand: {
          DEFAULT: '#4f6ef7',
          dim: 'rgba(79,110,247,0.12)',
          border: 'rgba(79,110,247,0.3)',
        },
        positive: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34,197,94,0.1)',
        },
        negative: {
          DEFAULT: '#ef4444',
          dim: 'rgba(239,68,68,0.1)',
        },
        warn: {
          DEFAULT: '#f59e0b',
          dim: 'rgba(245,158,11,0.1)',
        },
      },
    },
  },
  plugins: [],
}
