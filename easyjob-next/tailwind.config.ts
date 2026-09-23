import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System "Connexions"
        noir: '#0A0A0A',
        'gris-fonce': '#3A3A3A',
        'gris-moyen': '#7A7A7A',
        'gris-clair': '#D4D4D4',
        'gris-tres-clair': '#E5E5E5',
        'blanc-casse': '#FAFAFA',
        'rose-tbs': '#EA5256',
        'rose-hover': '#D14448',
        'violet-rare': '#8b5cf6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
