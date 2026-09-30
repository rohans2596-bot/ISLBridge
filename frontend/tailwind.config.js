/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#F0F6FC',
          100: '#C9D1D9',
          200: '#8B949E',
          300: '#484F58',
          400: '#30363D',
          500: '#21262D',
          600: '#161B22',
          700: '#0D1522',
          800: '#080E18',
          900: '#050910',
          950: '#02050A',
        },
        skyblue: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49',
        },
        ochre: {
          50: '#FEFCE8',
          100: '#FEF9C3',
          200: '#FEF08A',
          300: '#FDE047',
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207',
          800: '#854D0E',
          900: '#713F12',
          950: '#422006',
        },
        linen: {
          50: '#FAF8F5',
          100: '#F5EFE6',
          200: '#EBDDC9',
          300: '#E1CBAC',
          400: '#D4B68E',
          500: '#C29F5D',
          600: '#A68446',
          700: '#806434',
          800: '#5C4724',
          900: '#3A2B14',
        },
        primary: {
          DEFAULT: '#38BDF8',
          hover: '#0284C7',
          glow: 'rgba(56, 189, 248, 0.45)',
        },
        secondary: {
          DEFAULT: '#C29F5D',
          hover: '#D4A359',
          glow: 'rgba(194, 159, 93, 0.4)',
        },
        accent: {
          DEFAULT: '#7DD3FC',
          sand: '#E5D4BF',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)',
        'glass-skyblue': '0 8px 32px 0 rgba(56, 189, 248, 0.2), inset 0 1px 0 0 rgba(56, 189, 248, 0.25)',
        'glass-gold': '0 8px 32px 0 rgba(194, 159, 93, 0.2), inset 0 1px 0 0 rgba(194, 159, 93, 0.25)',
        'glow-skyblue': '0 0 25px rgba(56, 189, 248, 0.45)',
        'glow-gold': '0 0 25px rgba(194, 159, 93, 0.4)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        }
      }
    },
  },
  plugins: [],
}
