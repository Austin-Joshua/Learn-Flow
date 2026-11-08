/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
        },
        border: 'var(--border)',
        ink: {
          DEFAULT: 'var(--ink)',
          muted: 'var(--ink-muted)',
        },
        navy: {
          50: '#edf2f7',
          100: '#b8d0eb',
          200: '#7aa3d9',
          300: '#3d7bbd',
          400: '#1e5a99',
          500: '#163d6e',
          600: '#112d52',
          700: '#0d1f3c',
          800: '#0056b3',
          900: '#004085',
          950: '#020308',
        },
        gold: {
          50: '#faf6e3',
          100: '#f5ecc6',
          200: '#ead899',
          300: '#dfc673',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
        },
        sky: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7', // Primary Accent
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        proeduvate: {
          black: '#020308',
          surface: '#06080c',
          'surface-2': '#0b0f16',
          border: 'rgba(255, 255, 255, 0.08)',
          accent: '#0082fb',
          'accent-2': '#3aa0ff',
          'accent-glow': '#7cc2ff',
          chalk: '#f2f5f9',
          enterprise: '#8457f5',
          muted: '#8a94a6',
        },
      },
      fontSize: {
        label: ['11px', { lineHeight: '1rem' }],
        meta: ['10px', { lineHeight: '0.875rem' }],
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        DEFAULT: '8px',
        'md': '10px',
        'lg': '12px',
        'xl': '14px',
        '2xl': '16px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
        'elevated': '0 2px 4px -1px rgba(15, 23, 42, 0.04), 0 4px 6px -1px rgba(15, 23, 42, 0.06)',
        'modal': '0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
      }
    },
  },
  plugins: [],
}
