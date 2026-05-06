/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Default platform brand. Studios get to override per-public-page via
        // CSS variable (--studio-brand) — see src/components/StudioBrand.tsx.
        brand: {
          50:      '#f5f3ff',
          100:     '#ede9fe',
          200:     '#ddd6fe',
          300:     '#c4b5fd',
          400:     '#a78bfa',
          500:     '#8b5cf6',
          primary: '#7c3aed',
          600:     '#6d28d9',
          700:     '#5b21b6',
          dark:    '#4c1d95',
          800:     '#4c1d95',
          900:     '#2e1065',
        },
      },
      boxShadow: {
        card:        '0 1px 3px rgba(15, 23, 42, 0.04), 0 2px 8px rgba(124, 58, 237, 0.06)',
        'card-hover':'0 4px 12px rgba(15, 23, 42, 0.06), 0 8px 24px rgba(124, 58, 237, 0.10)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)',
      },
    },
  },
  plugins: [],
};
