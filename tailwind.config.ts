import type { Config } from "tailwindcss";

// Design-Token-System uebernommen von Doewe (Referenz-Setup) und fuer
// Kassenbuch angepasst: gleiche Semantik (bg/surface/ink/income/expense/...),
// eigene Markenfarbe. Feinschliff ist Teil der spaeteren UI-Implementierung,
// nicht des Scaffolds.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          2: "rgb(var(--surface-2) / <alpha-value>)"
        },
        line: {
          DEFAULT: "rgb(var(--line) / <alpha-value>)",
          strong: "rgb(var(--line-strong) / <alpha-value>)"
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)"
        },
        brand: {
          DEFAULT: "rgb(var(--brand) / <alpha-value>)",
          hover: "rgb(var(--brand-hover) / <alpha-value>)",
          soft: "rgb(var(--brand-soft) / <alpha-value>)",
          on: "rgb(var(--brand-on) / <alpha-value>)"
        },
        income: {
          DEFAULT: "rgb(var(--income) / <alpha-value>)",
          soft: "rgb(var(--income-soft) / <alpha-value>)"
        },
        expense: {
          DEFAULT: "rgb(var(--expense) / <alpha-value>)",
          soft: "rgb(var(--expense-soft) / <alpha-value>)"
        },
        warning: {
          DEFAULT: "rgb(var(--warning) / <alpha-value>)",
          soft: "rgb(var(--warning-soft) / <alpha-value>)"
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          soft: "rgb(var(--danger-soft) / <alpha-value>)"
        }
      },
      fontFamily: {
        sans: ["system-ui", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"]
      },
      // Zahlen-/Betrags-Skala, immer mit .tabular-nums kombinieren.
      fontSize: {
        "amount-sm": ["0.9375rem", { lineHeight: "1.2" }],
        amount: ["1.125rem", { lineHeight: "1.2" }],
        "amount-lg": ["1.375rem", { lineHeight: "1.15" }],
        "amount-hero": ["2.25rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }]
      },
      borderRadius: {
        card: "0.75rem",
        field: "0.5rem"
      },
      // Z-Leiter: Content < Header < Bottom-Nav/FAB < Dialog < Toast
      zIndex: {
        header: "40",
        nav: "50",
        modal: "70",
        toast: "100"
      }
    }
  },
  plugins: []
};

export default config;
