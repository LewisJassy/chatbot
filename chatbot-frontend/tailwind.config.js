/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'chat-bg': '#343541',
        'chat-sidebar': '#202123',
        'chat-hover': '#2A2B32',
        'chat-border': 'rgba(255,255,255,0.1)',
        'chat-input': '#40414f',
        'chat-user': '#1a7f64',
        'chat-assistant': '#444654',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        slideIn: 'slideIn 0.3s ease-out',
        fadeIn: 'fadeIn 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

