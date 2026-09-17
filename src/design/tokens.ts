/**
 * Devour design tokens.
 *
 * The direction is documented in docs/DESIGN.md: a cool instrument chassis, warm off-white
 * text, and exactly one molten accent for whatever is happening right now.
 *
 * Components must not hard-code colour, spacing or type. Everything comes from here, so the
 * design language stays reviewable in one file.
 */

export const palette = {
  chassis: '#101519',
  surface: '#171E24',
  edge: '#25303A',
  bone: '#ECE7DF',
  muted: '#8494A1',
  molten: '#FF4A17',
  ok: '#5FD3A3',
  warn: '#E8B34A',
  danger: '#F2645A',
} as const;

export type ColourToken = keyof typeof palette;

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
