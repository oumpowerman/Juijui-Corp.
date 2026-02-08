export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        fire: 'fire 0.8s infinite',
        wiggle: 'wiggle 0.4s infinite',
        'pulse-fast': 'pulse 0.6s infinite',
      },
      keyframes: {
        fire: {
          '0%, 100%': { transform: 'scale(1) rotate(-5deg)' },
          '50%': { transform: 'scale(1.15) rotate(5deg)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
};
