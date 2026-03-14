import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./actions/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        // Modern SaaS color palette
        border: "hsl(214.3 31.8% 91.4%)",
        input: "hsl(214.3 31.8% 91.4%)",
        ring: "hsl(222.2 84% 61.8%)",
        background: "hsl(210 40% 98.5%)",
        foreground: "hsl(222.2 84% 4.9%)",
        primary: {
          DEFAULT: "hsl(231.4 61.8% 56.5%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(231.4 61.8% 97%)",
          100: "hsl(231.4 61.8% 94%)",
          200: "hsl(231.4 61.8% 86%)",
          300: "hsl(231.4 61.8% 78%)",
          400: "hsl(231.4 61.8% 65%)",
          500: "hsl(231.4 61.8% 56.5%)",
          600: "hsl(231.4 61.8% 48%)",
          700: "hsl(231.4 61.8% 40%)",
          800: "hsl(231.4 61.8% 32%)",
          900: "hsl(231.4 61.8% 24%)",
          950: "hsl(231.4 61.8% 16%)",
        },
        secondary: {
          DEFAULT: "hsl(210 40% 96.5%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
          50: "hsl(210 40% 98%)",
          100: "hsl(210 40% 95%)",
          200: "hsl(210 40% 90%)",
          300: "hsl(210 40% 80%)",
          400: "hsl(210 40% 70%)",
          500: "hsl(210 40% 96.5%)",
          600: "hsl(210 40% 65%)",
          700: "hsl(210 40% 55%)",
          800: "hsl(210 40% 45%)",
          900: "hsl(210 40% 35%)",
          950: "hsl(210 40% 25%)",
        },
        muted: {
          DEFAULT: "hsl(210 40% 96.5%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        accent: {
          DEFAULT: "hsl(210 40% 96.5%)",
          foreground: "hsl(222.2 47.4% 11.2%)",
        },
        destructive: {
          DEFAULT: "hsl(0 84.2% 60.2%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(0 84.2% 97%)",
          100: "hsl(0 84.2% 94%)",
          200: "hsl(0 84.2% 86%)",
          300: "hsl(0 84.2% 78%)",
          400: "hsl(0 84.2% 65%)",
          500: "hsl(0 84.2% 60.2%)",
          600: "hsl(0 84.2% 52%)",
          700: "hsl(0 84.2% 44%)",
          800: "hsl(0 84.2% 36%)",
          900: "hsl(0 84.2% 28%)",
          950: "hsl(0 84.2% 20%)",
        },
        card: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
        popover: {
          DEFAULT: "hsl(0 0% 100%)",
          foreground: "hsl(222.2 84% 4.9%)",
        },
        // Custom semantic colors
        success: {
          DEFAULT: "hsl(142.1 76.2% 36.3%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(142.1 76.2% 96%)",
          100: "hsl(142.1 76.2% 92%)",
          500: "hsl(142.1 76.2% 36.3%)",
        },
        warning: {
          DEFAULT: "hsl(32.6 94.6% 43.7%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(32.6 94.6% 96%)",
          100: "hsl(32.6 94.6% 92%)",
          500: "hsl(32.6 94.6% 43.7%)",
        },
        info: {
          DEFAULT: "hsl(221.2 83.2% 53.3%)",
          foreground: "hsl(210 40% 98%)",
          50: "hsl(221.2 83.2% 96%)",
          100: "hsl(221.2 83.2% 92%)",
          500: "hsl(221.2 83.2% 53.3%)",
        },
        // Kanban column colors
        kanban: {
          todo: "hsl(0 74% 94%)",
          inprogress: "hsl(38 92% 96%)",
          review: "hsl(221 83% 97%)",
          done: "hsl(142 76% 97%)",
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
        xl: "1rem"
      },
      boxShadow: {
        'soft': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'soft-lg': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'soft-xl': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'dark-soft': '0 1px 3px 0 rgb(0 0 0 / 0.3), 0 1px 2px -1px rgb(0 0 0 / 0.3)',
        'dark-soft-lg': '0 4px 6px -1px rgb(0 0 0 / 0.3), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
        'dark-soft-xl': '0 10px 15px -3px rgb(0 0 0 / 0.3), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        "hover-lift": "hoverLift 0.2s ease-out",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "fadeIn": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        "slideUp": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        "scaleIn": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        "hoverLift": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-2px)" }
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;

