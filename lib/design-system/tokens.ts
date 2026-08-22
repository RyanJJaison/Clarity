/**
 * Clarity design system — JS-side reference.
 *
 * The actual source of truth for color/shadow/radius/typography is
 * app/globals.css (Tailwind v4 `@theme` + CSS custom properties) — this
 * file exists only for the values JS logic legitimately needs as plain
 * numbers/strings (z-index for portals, breakpoints for matchMedia,
 * Tailwind class-name lookups for dynamic className construction).
 * Don't duplicate raw color hex here; reference the CSS variables/utility
 * classes instead so there is exactly one place each value can change.
 *
 * Motion tokens (duration/ease/spring) live in lib/motion/tokens.ts.
 */

// ---------------------------------------------------------------------------
// Color roles → Tailwind utility class names.
// A few roles are named differently from the CSS variable to avoid
// colliding with existing shadcn conventions — see app/globals.css for why.
// ---------------------------------------------------------------------------
export const colorRole = {
  background: "background",
  surface: "surface",
  surfaceElevated: "surface-elevated",
  surfaceGlass: "surface-glass",
  textPrimary: "foreground", // --text-primary CSS var, "foreground" Tailwind slot
  textSecondary: "subtle", // --text-secondary CSS var, "subtle" Tailwind slot (avoids colliding with brand `secondary`)
  textMuted: "muted-foreground", // --text-muted CSS var
  border: "border",
  accent: "accent",
  primary: "primary",
  secondary: "secondary",
  success: "success",
  warning: "warning",
  error: "error",
} as const;

// ---------------------------------------------------------------------------
// Spacing — Tailwind's default 4px-based scale is the system; not
// reinvented. Documented here for reference only.
// ---------------------------------------------------------------------------
export const spacing = {
  scaleBasis: 4, // px, Tailwind's default spacing unit
  page: {
    x: "px-6", // standard page horizontal padding
    y: "py-10", // standard page vertical padding
  },
} as const;

// ---------------------------------------------------------------------------
// Shape — mirrors the --radius-* scale in globals.css.
// ---------------------------------------------------------------------------
export const radius = {
  sm: "rounded-sm", // calc(radius * 0.6)
  md: "rounded-md", // calc(radius * 0.8)
  lg: "rounded-lg", // base --radius (0.75rem)
  xl: "rounded-xl", // calc(radius * 1.4)
  "2xl": "rounded-2xl", // calc(radius * 1.8)
  "3xl": "rounded-3xl", // calc(radius * 2.2) — hero surfaces
  "4xl": "rounded-4xl", // calc(radius * 2.6) — hero surfaces
} as const;

// ---------------------------------------------------------------------------
// Elevation — mirrors the --shadow-* scale in globals.css.
// ---------------------------------------------------------------------------
export const shadow = {
  xs: "shadow-xs",
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  glass: "shadow-glass",
} as const;

// ---------------------------------------------------------------------------
// Typography — mirrors the --text-* scale in globals.css.
// ---------------------------------------------------------------------------
export const typography = {
  display: "text-display font-heading font-semibold tracking-tight",
  h1: "text-h1 font-heading font-semibold tracking-tight",
  h2: "text-h2 font-heading font-semibold tracking-tight",
  h3: "text-h3 font-heading font-semibold",
  h4: "text-h4 font-heading font-semibold",
  body: "text-body font-sans",
  bodySmall: "text-body-small font-sans",
  caption: "text-caption font-sans",
  label: "text-label font-sans font-medium tracking-wide",
} as const;

// ---------------------------------------------------------------------------
// Breakpoints — Tailwind's default scale (px). For JS logic (matchMedia)
// only; components should use sm:/md:/lg:/xl:/2xl: classes directly.
// ---------------------------------------------------------------------------
export const breakpoint = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// ---------------------------------------------------------------------------
// Z-index — numeric mirror of the --z-* CSS custom properties in
// globals.css. Use the CSS vars in className (z-[var(--z-modal)]); use
// these constants only where JS needs a plain number (portals, inline
// style calculations).
// ---------------------------------------------------------------------------
export const zIndex = {
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
  toast: 60,
  tooltip: 70,
} as const;

// ---------------------------------------------------------------------------
// Glass — the one controlled blur value every Glass* component shares.
// ---------------------------------------------------------------------------
export const glass = {
  blurClassName: "backdrop-blur-[var(--glass-blur)]",
  borderClassName: "border border-[var(--glass-border)]",
  surfaceClassName: "bg-surface-glass",
  shadowClassName: shadow.glass,
} as const;
