/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
	],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
        'tall': { 'raw': '(min-height: 825px)' },
      },
    },
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
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
        primary: {
          50: '#ebfbf4',
          100: '#d6f6e9',
          200: '#adedd3',
          300: '#84e4bd',
          400: '#5bdba7',
          500: '#32d291',
          600: '#2dbd83',
          700: '#28a874',
          800: '#239366',
          900: '#1e7e57',
        },
        gray: {
          50: '#FFFFFF',
          100: '#FAFAFA',
          200: '#F5F5F5',
          300: '#F0F0F0',
          400: '#D9D9D9',
          500: '#BFBFBF',
          600: '#8C8C8C',
          700: '#595959',
          800: '#434343',
          900: '#262626',
        },
        secondary: {
          50: '#e6eaee',
          100: '#b3c1cd',
          200: '#9aadbc',
          300: '#68839b',
          400: '#355a79',
          500: '#033158',
          600: '#032c4f',
          700: '#022746',
          800: '#02223e',
          900: '#021d35',
        },
      },
      fontFamily: {
        Inter: ['Inter', 'sans-serif']
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backgroundImage: {
        timestamp:
          'linear-gradient(90deg, rgb(154, 164, 178) 0px, rgb(154, 164, 178) 2%, transparent 2%), linear-gradient(rgb(255, 255, 255) 40%, transparent 40%), linear-gradient(90deg, transparent 20%, rgb(154, 164, 178) 20%, rgb(154, 164, 178) 22%, transparent 22%, transparent 40%, rgb(154, 164, 178) 40%, rgb(154, 164, 178) 42%, transparent 42%, transparent 60%, rgb(154, 164, 178) 60%, rgb(154, 164, 178) 62%, transparent 62%, transparent 80%, rgb(154, 164, 178) 80%, rgb(154, 164, 178) 82%, transparent 82%)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}