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
 * The ceiling on the device's own font scale, for the two roles that cannot absorb it.
 *
 * Prose has no ceiling: someone who set their phone to the largest text wants the largest
 * text, and a paragraph reflows to fit. Code does not reflow - it scrolls sideways - so at
 * 1.6x a listing becomes a column of three words, and a 32 dp display line at 1.6x pushes
 * everything under it off the screen. Those two are capped just above the comfortable
 * range rather than pinned, which keeps the setting working without letting it break the
 * layout. This was found on a device with a large system font, not in a simulator.
 */
export const MAX_FONT_SCALE = 1.2;

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
 * transition has to be over before a thumb expects the next tap. They are not as short as
 * they were - the first pass ran everything at 240 ms on a curve that lands hard, which
 * reads as a jump rather than a movement. A longer tail on a gentler curve is what "smooth"
 * actually means; the numbers below are the ceiling of what still feels immediate.
 */
export const motion = {
  duration: {
    /** Press feedback and anything that must feel instant. */
    instant: 90,
    /** A control changing state. */
    quick: 160,
    /** Something arriving or leaving. */
    standard: 260,
    /** A whole surface changing. */
    slow: 400,
  },
  /**
   * Ambient motion loops, so it is measured in whole cycles rather than in transitions, and
   * it is slower than anything the user started: a pulse that keeps pace with a press reads
   * as impatience.
   */
  loop: {
    /** One breath of the caret that says the model is writing. */
    pulse: 1040,
    /** One pass of the wave over the placeholder lines before the first token. */
    ghost: 1400,
  },
  /**
   * Cubic bezier control points.
   *
   * `glide` is the one most things use: it leaves immediately and spends the whole second
   * half of its time settling, which is the curve that reads as a physical movement rather
   * than a cut. `signature` is the firmer version of the same character, for controls that
   * should feel answered rather than eased. `exit` accelerates, because what leaves should
   * not be watched, and `ambient` is symmetric for anything that loops.
   */
  easing: {
    glide: [0.22, 1, 0.36, 1],
    signature: [0.2, 0, 0, 1],
    exit: [0.3, 0, 1, 1],
    ambient: [0.4, 0, 0.6, 1],
  },
  /** Travel distances. Nothing crosses a third of the screen without a reason. */
  distance: {
    rise: 14,
    slide: 20,
  },
  /**
   * Scale, for the two things that change size: a control answering a press, and something
   * appearing in place rather than arriving from somewhere.
   */
  scale: {
    press: 0.97,
    appear: 0.92,
  },
} as const;
