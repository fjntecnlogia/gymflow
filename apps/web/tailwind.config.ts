import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan: { DEFAULT: '#00E5FF', light: '#66F0FF', dark: '#00B8CC' },
        orange: { DEFAULT: '#FF6B00', light: '#FF9540', dark: '#CC5500' },
        blue: { DEFAULT: '#0066FF', light: '#4D94FF', dark: '#0044CC' },
        green: { DEFAULT: '#00FF87', light: '#66FFBB', dark: '#00CC6A' },
        red: { DEFAULT: '#FF4466', light: '#FF8899', dark: '#CC2244' },
        dark: { DEFAULT: '#08080F', card: '#111119', card2: '#1A1A26', border: '#2A2A3A' },
        muted: '#8888AA',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px', '3xl': '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,229,255,0.25)',
        'glow-orange': '0 0 20px rgba(255,107,0,0.25)',
      },
    },
  },
  plugins: [],
}
export default config
