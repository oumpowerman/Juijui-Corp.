export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Kanit', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        fire: 'fire 0.8s infinite',
        wiggle: 'wiggle 0.4s infinite',
        'pulse-fast': 'pulse 0.6s infinite',
        breathe: 'breathe 1.6s ease-in-out infinite',
        pastel: 'pastelGlow 6s ease-in-out infinite',
        shimmer: 'shimmer 3s linear infinite',
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
        breathe: {
          '0%,100%': { 
          transform: 'translateY(0px) scale(1)',
          },
          '50%': { 
          transform: 'translateY(-8px) scale(1.035)',
          },
        },
        pastelGlow: {
          '0%,100%': {
            background: 'linear-gradient(135deg,#fef3c7,#fde68a,#fbcfe8)',
          },
          '50%': {
            background: 'linear-gradient(135deg,#e0f2fe,#bae6fd,#ddd6fe)',
          },
        },
        shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
