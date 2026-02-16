import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#059669',
          dark: '#047857',
          light: '#10B981',
        },
        walnut: {
          DEFAULT: '#475569',
          dark: '#1E293B',
          light: '#64748B',
        },
        gold: {
          DEFAULT: '#CA8A04',
          light: '#EAB308',
          muted: '#A16207',
        },
        cream: {
          DEFAULT: '#F8FAFC',
          dark: '#F1F5F9',
        },
        ivory: '#FFFFFF',
        charcoal: {
          DEFAULT: '#0F172A',
          light: '#334155',
        },
        parchment: '#F1F5F9',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 1px 3px rgba(15, 23, 42, 0.04), 0 4px 6px rgba(15, 23, 42, 0.06)',
        'premium-lg': '0 4px 6px rgba(15, 23, 42, 0.06), 0 10px 15px rgba(15, 23, 42, 0.08)',
        'inner-premium': 'inset 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;
