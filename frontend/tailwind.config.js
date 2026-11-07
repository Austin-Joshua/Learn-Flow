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
        // Restrained institutional paper-white / graphite neutral ramps
        canvas: {
          ground: '#ffffff',
          deep: '#f8fafc',
          subtle: '#f1f5f9',
          border: 'rgba(15, 23, 42, 0.08)',
          'border-subtle': 'rgba(15, 23, 42, 0.05)',
          'border-strong': 'rgba(15, 23, 42, 0.16)',
        },
        darkcanvas: {
          ground: '#111317',
          deep: '#0b0d10',
          card: '#171a20',
          raised: '#20242c',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        // Accent token: Sky 600 (#0284c7)
        accent: {
          DEFAULT: '#0284c7', // Sky 600
          hover: '#0369a1',   // Sky 700
          subtle: '#f0f9ff',  // Sky 50
          border: '#bae6fd',  // Sky 200
          text: '#0369a1',
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
        // Backward-compatible brand alias mapped strictly to Sky palette
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        }
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
