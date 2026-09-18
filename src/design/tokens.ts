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
  lg: 16,
  xl: 24,
  xxl: 40,
  xxxl: 64,
} as const;

/**
 * Two radii and a pill. A single radius on everything is one of the tells of a generated
 * interface, so the raised block the user's own words sit in is rounder than a control.
 */
export const radius = {
  control: 12,
  block: 20,
  pill: 999,
} as const;

/** Smallest touch target that may ship, in density independent pixels. */
export const TOUCH_TARGET = 44;

/**
 * Two families: the platform sans for interface text, the platform mono for machine truth -
 * paths, ABIs, code, what an endpoint said. Labels are sentence case; tracked-out capitals
 * are a template habit, not information.
 */
export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -1,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    fontWeight: '600',
  },
  heading: {
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  mono: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
} as const;

export type TypographyRole = keyof typeof typography;

/**
 * One motion identity for the whole application, in the terms the motion skill uses:
 * a single signature curve for most of the work, a three step duration palette, and one
 * entrance pattern - rise and fade - used everywhere something arrives.
 *
 * Durations are short because a phone interface is touched, not watched: the standard
 * transition has to be over before a thumb expects the next tap.
 */
export const motion = {
  duration: {
    /** Press feedback and anything that must feel instant. */
    instant: 90,
    /** A control changing state. */
    quick: 150,
    /** Something arriving or leaving. */
    standard: 240,
    /** A whole surface changing. */
    slow: 360,
  },
  /**
   * Cubic bezier control points. `signature` decelerates: fast start, gentle landing, which
   * is what an entrance needs. `exit` accelerates, because what leaves should not be
   * watched. `ambient` is symmetric for anything that loops.
   */
  easing: {
    signature: [0.2, 0, 0, 1],
    exit: [0.3, 0, 1, 1],
    ambient: [0.4, 0, 0.6, 1],
  },
  /** Travel distances. Nothing crosses a third of the screen without a reason. */
  distance: {
    rise: 10,
    slide: 20,
  },
} as const;
