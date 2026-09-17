/**
 * Devour design tokens: everything except colour.
 *
 * Colour lives in `theme.ts`, because Devour ships two themes and no component may reach
 * for a raw hex value. Scale, type and motion are deliberately theme independent: changing
 * the theme changes the palette, never the rhythm.
 *
 * The direction is documented in docs/DESIGN.md.
 */

/** Four pixel base scale. */
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
  xxl: 52,
} as const;

export const radius = {
  row: 6,
  sheet: 10,
  chip: 999,
} as const;

/** Smallest touch target that may ship, in density independent pixels. */
export const TOUCH_TARGET = 44;

/** Two families: platform sans for interface text, platform mono for machine truth. */
export const typography = {
  display: {
    fontSize: 44,
    lineHeight: 44,
    letterSpacing: -1.6,
    fontWeight: '700',
  },
  title: {
    fontSize: 21,
    lineHeight: 26,
    letterSpacing: -0.3,
    fontWeight: '600',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.2,
    fontWeight: '500',
  },
  mono: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
} as const;

export type TypographyRole = keyof typeof typography;

/** Milliseconds. One orchestrated moment per screen, nothing longer. */
export const motion = {
  state: 120,
  entrance: 200,
  orchestrated: 320,
} as const;
