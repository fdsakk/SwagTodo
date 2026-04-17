import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        app: {
          bg: 'hsl(0 0% 5%)',
          titlebar: 'hsl(0 0 1.5%)',
          sidebar: 'hsl(0 0% 3%)',
          content: 'hsl(0 0% 5%)',
          card: 'hsl(0 0% 6%)',
          accent: 'hsl(0 0% 90%)'
        },
        priority: {
          p1: 'hsl(0 70% 60%)',
          p2: 'hsl(30 70% 60%)',
          p3: 'hsl(210 60% 60%)',
          p4: 'hsl(0 0% 40%)'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      transitionDuration: {
        150: '150ms',
        200: '200ms',
        300: '300ms'
      },
      boxShadow: {
        soft: '0 0 0 1px rgba(255,255,255,0.03), 0 8px 24px rgba(0,0,0,0.40)'
      }
    }
  },
  plugins: []
} satisfies Config
