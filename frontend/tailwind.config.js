/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#7c3aed', // violet-600
          accent: '#8b5cf6',  // violet-500
          indigoLight: '#a78bfa',
        },
        dark: {
          bg: '#020617',       // Deep navy
          surface: '#0a0e1a',  // Card surface
          border: '#1e293b',   // Subtle border
        },
        navy: {
          950: '#020617',
          900: '#0a0e1a',
          800: '#0f1629',
          700: '#151d35',
          600: '#1e293b',
        },
        neon: {
          purple: '#a855f7',
          blue: '#38bdf8',
          violet: '#8b5cf6',
          indigo: '#6366f1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.15), 0 0 60px rgba(139, 92, 246, 0.05)',
        'glow-purple-sm': '0 0 10px rgba(139, 92, 246, 0.12)',
        'glow-purple-lg': '0 0 40px rgba(139, 92, 246, 0.2), 0 0 80px rgba(139, 92, 246, 0.08)',
        'glow-blue': '0 0 20px rgba(56, 189, 248, 0.15)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4)',
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #3b82f6 100%)',
        'gradient-purple-soft': 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(15, 22, 41, 0.8) 0%, rgba(10, 14, 26, 0.9) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-up': 'scaleUp 0.25s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}