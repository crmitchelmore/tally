/**
 * Tally Design Tokens
 *
 * OKLCH-based color system with light/dark themes.
 * Typography, spacing, motion, and radius tokens.
 */

// Color tokens in OKLCH (lightness, chroma, hue)
export const colors = {
  // Base colors
  paper: {
    light: "oklch(97.5% 0.006 85)",    // warm off-white
    dark: "oklch(18% 0.015 85)",        // warm near-black
  },
  ink: {
    light: "oklch(18% 0.015 85)",       // warm black
    dark: "oklch(92% 0.008 85)",        // warm off-white
  },
  muted: {
    light: "oklch(55% 0.012 85)",       // mid-tone for secondary text
    dark: "oklch(65% 0.012 85)",
  },
  border: {
    light: "oklch(90% 0.008 85)",       // subtle borders
    dark: "oklch(28% 0.012 85)",
  },
  surface: {
    light: "oklch(99% 0.003 85)",       // card backgrounds
    dark: "oklch(22% 0.015 85)",
  },
  // Accent: the signature red slash
  accent: {
    light: "oklch(52% 0.18 25)",        // warm red
    dark: "oklch(62% 0.18 25)",         // slightly brighter for dark mode
  },
  // Tally mark colors (C1, C2, C3)
  tally: {
    c1: { light: "oklch(18% 0.015 85)", dark: "oklch(92% 0.008 85)" }, // base strokes
    c2: { light: "oklch(52% 0.18 25)", dark: "oklch(62% 0.18 25)" },   // 25-cap X (accent)
    c3: { light: "oklch(45% 0.08 85)", dark: "oklch(55% 0.08 85)" },   // 100-cap box
  },
  // Functional colors
  success: { light: "oklch(55% 0.15 145)", dark: "oklch(65% 0.15 145)" },
  warning: { light: "oklch(65% 0.15 85)", dark: "oklch(75% 0.15 85)" },
  error: { light: "oklch(52% 0.18 25)", dark: "oklch(62% 0.18 25)" },
} as const;

// Typography scale (based on Inter)
export const typography = {
  fontFamily: {
    sans: '"Inter", "SF Pro Text", "Segoe UI", system-ui, -apple-system, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
  },
  fontSize: {
    xs: "0.75rem",     // 12px
    sm: "0.875rem",    // 14px
    base: "1rem",      // 16px
    lg: "1.125rem",    // 18px
    xl: "1.25rem",     // 20px
    "2xl": "1.5rem",   // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem",  // 36px
    "5xl": "3rem",     // 48px
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: "1.15",
    snug: "1.3",
    normal: "1.5",
    relaxed: "1.625",
  },
  letterSpacing: {
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.2em",
  },
} as const;

// Spacing scale (4px base)
export const spacing = {
  0: "0",
  1: "0.25rem",   // 4px
  2: "0.5rem",    // 8px
  3: "0.75rem",   // 12px
  4: "1rem",      // 16px
  5: "1.25rem",   // 20px
  6: "1.5rem",    // 24px
  8: "2rem",      // 32px
  10: "2.5rem",   // 40px
  12: "3rem",     // 48px
  16: "4rem",     // 64px
  20: "5rem",     // 80px
  24: "6rem",     // 96px
} as const;

// Border radius
export const radius = {
  none: "0",
  sm: "0.25rem",   // 4px
  md: "0.5rem",    // 8px
  lg: "0.75rem",   // 12px
  xl: "1rem",      // 16px
  "2xl": "1.5rem", // 24px
  full: "9999px",
} as const;

// Motion tokens
export const motion = {
  duration: {
    instant: "0ms",
    fast: "120ms",
    normal: "200ms",
    slow: "300ms",
    hero: "400ms",
  },
  easing: {
    default: "cubic-bezier(0.4, 0, 0.2, 1)",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
} as const;

// Shadow tokens
export const shadows = {
  none: "none",
  sm: "0 1px 2px oklch(0% 0 0 / 0.05)",
  md: "0 4px 6px oklch(0% 0 0 / 0.07)",
  lg: "0 10px 15px oklch(0% 0 0 / 0.1)",
  xl: "0 20px 25px oklch(0% 0 0 / 0.1)",
  soft: "0 24px 60px oklch(18% 0.015 85 / 0.08)",
} as const;

// Breakpoints (desktop-first)
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modalBackdrop: 1300,
  modal: 1400,
  popover: 1500,
  tooltip: 1600,
} as const;
