/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './electron/**/*.{ts,tsx}', './landing-src/**/*.tsx', './landing-src/**/*.ts', './landing-src/**/*.css'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ReachAI Design System
        'bg-primary': '#0F1117',
        'bg-secondary': '#161922',
        'bg-tertiary': '#1E2130',
        'bg-elevated': '#252A3A',
        'border-subtle': '#2A2F3F',
        'border-default': '#3A4060',
        'border-strong': '#4A5280',
        'accent-blue': '#0EA5E9',
        'accent-cyan': '#22D3EE',
        'accent-blue-dim': '#0EA5E920',
        'accent-cyan-dim': '#22D3EE20',
        'status-new': '#3B82F6',
        'status-reached': '#8B5CF6',
        'status-warm': '#F59E0B',
        'status-hot': '#EF4444',
        'status-cold': '#6B7280',
        'status-sent': '#10B981',
        'status-failed': '#EF4444',
        'status-pending': '#F59E0B',
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'text-inverse': '#0F1117',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
        'card': '10px',
        'modal': '14px',
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        'card': '0 4px 16px rgba(0,0,0,0.2)',
        'modal': '0 16px 48px rgba(0,0,0,0.5)',
        'toast': '0 8px 24px rgba(0,0,0,0.4)',
        'glow-blue': '0 4px 12px rgba(14,165,233,0.25)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
        'pulse-glow': 'pulse-glow 1.5s ease-out infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
        'pulse-glow': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
