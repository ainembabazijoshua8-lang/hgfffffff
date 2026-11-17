/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand palette extracted from logo image
        savanna: {
          50:  '#F5F0E6',
          100: '#E8E0D0',
          200: '#D6C8AE',
          300: '#B9A582',
          400: '#96835F',
          500: '#756343',
        },
        teal: {
          900: '#16352F',
          800: '#1A3D35',
          700: '#21483D',
          600: '#356055',
          500: '#648176',
        },
        terracotta: {
          50:  '#FAF0E9',
          100: '#F2D7C8',
          200: '#E6AE91',
          300: '#D98462',
          400: '#C9683D',
          500: '#A84D2D',
          600: '#843B25',
        },
        cream: {
          50:  '#FFFFFF',
          100: '#F5F0E6',
          200: '#E2ECE6',
        },
        gold: {
          400: '#D6A84F',
          500: '#B88A32',
        },
        sage: {
          50: '#F0F4EE',
          100: '#DCE7DA',
          200: '#BFD0BC',
          600: '#55735B',
          700: '#3F5D46',
        },
        mist: '#E2ECE6',
        ink: '#26332F',
        linen: '#FAF7F2',
        acacia: '#152E28',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['Outfit', 'system-ui', 'sans-serif'],
        accent: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      // Tailwind's default scale jumps 14 -> 16, so `sm:py-18` in BookingPage
      // compiled to nothing: no rule, no warning, and the intended extra
      // desktop padding silently never applied. Adding the step makes the
      // existing call sites behave as authored. 4.5rem sits naturally between
      // py-14 (3.5rem) and py-20 (5rem).
      spacing: {
        18: '4.5rem',
      },
      boxShadow: {
        card: '0 8px 24px -12px rgba(40, 51, 54, 0.18)',
        cardHover: '0 18px 40px -16px rgba(40, 51, 54, 0.30)',
        glow: '0 0 20px rgba(201, 104, 61, 0.4)',
        'inner-warm': 'inset 0 2px 10px rgba(201, 104, 61, 0.05)',
      },
      backgroundImage: {
        'hero-overlay': 'linear-gradient(180deg, rgba(22,53,47,0.30) 0%, rgba(22,53,47,0.82) 100%)',
        'hero-vignette': 'radial-gradient(circle at center, transparent 0%, rgba(22,53,47,0.8) 100%)',
        'warm-glass': 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,247,242,0.6) 100%)',
        'sunrise': 'linear-gradient(135deg, #D6A84F 0%, #D98462 48%, #C9683D 100%)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'kenburns': 'kenburns 14s ease-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'glow-pulse': 'glowPulse 3s infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        kenburns: {
          '0%': { transform: 'scale(1) translate(0,0)' },
          '100%': { transform: 'scale(1.12) translate(-2%, -1%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(201, 104, 61, 0.2)' },
          '50%': { boxShadow: '0 0 25px rgba(201, 104, 61, 0.6)' },
        },
      },
    },
  },
  plugins: [],
};
