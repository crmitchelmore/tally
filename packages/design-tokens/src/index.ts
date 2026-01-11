/**
 * Tally Design Tokens
 * 
 * Cross-platform design tokens for consistent styling across web, iOS, and Android.
 * These TypeScript types match the tokens defined in tokens.json.
 */

export interface ColorToken {
  light: string;
  dark: string;
  description?: string;
}

export interface SingleColorToken {
  value: string;
  description?: string;
}

export const brandColors = {
  ink: 'oklch(0.25 0.02 30)',
  slash: 'oklch(0.55 0.22 25)',
  focus: 'oklch(0.5 0.2 240)',
} as const;

export const statusColors = {
  ahead: {
    light: 'oklch(0.45 0.18 145)',
    dark: 'oklch(0.55 0.18 145)',
  },
  onPace: {
    light: 'oklch(0.55 0.15 90)',
    dark: 'oklch(0.65 0.15 90)',
  },
  behind: {
    light: 'oklch(0.55 0.22 25)',
    dark: 'oklch(0.65 0.22 25)',
  },
  streak: {
    light: 'oklch(0.6 0.2 50)',
    dark: 'oklch(0.65 0.2 50)',
  },
} as const;

export const chartColors = {
  grid: {
    light: 'oklch(0.85 0.01 50)',
    dark: 'oklch(0.35 0.01 50)',
  },
  axis: {
    light: 'oklch(0.5 0.01 30)',
    dark: 'oklch(0.6 0.01 30)',
  },
  tooltipBg: {
    light: 'oklch(0.99 0.002 50)',
    dark: 'oklch(0.25 0.002 50)',
  },
  tooltipBorder: {
    light: 'oklch(0.85 0.01 50)',
    dark: 'oklch(0.35 0.01 50)',
  },
  targetLine: {
    light: 'oklch(0.7 0.01 30)',
    dark: 'oklch(0.5 0.01 30)',
  },
} as const;

export const heatmapColors = {
  level0: {
    light: 'oklch(0.94 0.006 50)',
    dark: 'oklch(0.25 0.006 50)',
  },
  level1: {
    light: 'oklch(0.75 0.08 35)',
    dark: 'oklch(0.35 0.08 35)',
  },
  level2: {
    light: 'oklch(0.6 0.12 35)',
    dark: 'oklch(0.45 0.12 35)',
  },
  level3: {
    light: 'oklch(0.45 0.15 35)',
    dark: 'oklch(0.55 0.15 35)',
  },
  level4: {
    light: 'oklch(0.3 0.18 35)',
    dark: 'oklch(0.65 0.18 35)',
  },
} as const;

export const recordColors = {
  bestDay: 'oklch(0.65 0.24 60)',
  streak: 'oklch(0.55 0.22 25)',
  average: 'oklch(0.45 0.18 145)',
  active: 'oklch(0.5 0.2 260)',
  entry: 'oklch(0.55 0.25 280)',
  milestone: 'oklch(0.6 0.22 40)',
  maxReps: 'oklch(0.58 0.26 30)',
} as const;

export const spacing = {
  unit: 8,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 24,
  full: 9999,
} as const;

export const motion = {
  duration: {
    fast: 120,
    normal: 220,
    slow: 320,
    hero: 420,
  },
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
} as const;

export type StatusType = 'ahead' | 'onPace' | 'behind';
export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Get status color for a given pace status
 */
export function getStatusColor(status: StatusType, isDark = false): string {
  const mode = isDark ? 'dark' : 'light';
  return statusColors[status][mode];
}

/**
 * Get heatmap color for a given level (0-4)
 */
export function getHeatmapColor(level: HeatmapLevel, isDark = false): string {
  const mode = isDark ? 'dark' : 'light';
  const key = `level${level}` as keyof typeof heatmapColors;
  return heatmapColors[key][mode];
}
