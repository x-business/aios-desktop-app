import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          dark: '#020207', // Dark mode interface
          DEFAULT: '#D7D7D7', // White
          gradient: {
            dark: '#0D0E12',
            light: '#607880',
          },
        },
        secondary: {
          DEFAULT: '#4ECDC4', // Soft teal accent
        },
        accent: {
          DEFAULT: '#E0E0E0', // Light gray for text
        },
        text: {
          DEFAULT: '#FFFFFF', // White
          light: '#E0E0E0', // Light gray
        },
      },
      fontFamily: {
        sora: ['var(--font-sora)'],
        montserrat: ['var(--font-montserrat)'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'gradient': 'gradient 8s ease infinite',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
        'orbit': 'orbit 25s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg) translateX(10px) rotate(0deg)' },
          '100%': { transform: 'rotate(360deg) translateX(10px) rotate(-360deg)' },
        },
      },
      backgroundSize: {
        'gradient-size': '200% 200%',
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities }) {
      const newUtilities: Record<string, Record<string, string>> = {}
      // Add animation delay utilities
      for (let i = 1; i <= 10; i++) {
        newUtilities[`.animation-delay-${i * 1000}`] = {
          'animation-delay': `${i}s`,
        }
      }
      addUtilities(newUtilities)
    })
  ],
  darkMode: 'class', // Enable dark mode variant
};

export default config; 