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
        'primary-dark': '#020207',
        'primary': '#D7D7D7',
        'primary-gradient-dark': '#0D0E12',
        'primary-gradient-light': '#607880',
        'secondary': '#4ECDC4',
        'accent': '#E0E0E0',
        'text-default': '#FFFFFF',
        'text-light': '#E0E0E0',
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
        'gradient-x': 'gradient-x 15s ease infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-position': '0% 50%',
            'background-size': '200% 200%',
          },
          '50%': {
            'background-position': '100% 50%',
            'background-size': '200% 200%',
          },
        },
      },
    },
  },
  plugins: [],
}; 