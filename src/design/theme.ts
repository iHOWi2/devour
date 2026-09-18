/**
 * What a device can actually tell us about its appearance setting.
 *
 * React Native exports `ColorSchemeName` as `'light' | 'dark'`, but `useColorScheme()`
 * returns `ColorSchemeName | null`, and a device that has never expressed a preference
 * reports nothing at all. The theme layer therefore accepts the widest honest input and
 * decides for itself, instead of pushing a cast onto every caller.
 */
export type DeviceColorScheme = 'light' | 'dark' | null | undefined;

/**
 * Semantic colour tokens. A component asks for a role - `surface`, `muted`, `onInverse` -
 * and never for a hex value.
 *
 * Devour is monochrome on purpose (docs/DESIGN.md): black, white and the greys between
 * them, and not one hue anywhere. What a coloured dot usually carries - busy, failed,
 * degraded - is carried here by contrast, weight and position instead, which survives both
 * themes and does not depend on a user distinguishing red from amber on a phone in sunlight.
 * `inverse` is the maximum contrast fill; on it, text is `onInverse`.
 */
export type Palette = {
  /** The page itself. */
  background: string;
  /** A raised block: the user's own words, a code listing, an input. */
  surface: string;
  /** A raised block that is pressed or selected. */
  surfaceStrong: string;
  /** Hairlines and outlines. */
  edge: string;
  /** Primary text. */
  text: string;
  /** Secondary text: labels, values, anything supporting. */
  muted: string;
  /** Tertiary text: placeholders and disabled states. Still readable. */
  faint: string;
  /** Maximum contrast fill, for the one loud element on a screen. */
  inverse: string;
  /** Text and glyphs sitting on `inverse`. */
  onInverse: string;
};

export type ThemeName = 'dark' | 'light';

/** What the user chose. `system` follows the device setting. */
export type ThemePreference = 'system' | ThemeName;

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'dark',
  'light',
];

/**
 * Dark: near-black, deliberately not true black.
 *
 * The first build used #000000 with #FFFFFF text, which is 21:1 - the maximum a screen can
 * do, and more than a reader wants. White text on true black bleeds into its own
 * background on an OLED panel, and a long answer at that contrast is what "it tears my
 * eyes" means. Lifting the page to #141414 and taking the text down to #E8E8E8 lands at
 * about 15:1: still far above the 7:1 the strictest accessibility level asks for, and
 * readable for an hour instead of a minute.
 *
 * The greys still step far enough apart to be told apart at arm's length in daylight, and
 * the theme is still black and white: there is no hue in it anywhere.
 */
const darkPalette: Palette = {
  background: '#141414',
  surface: '#1F1F1F',
  surfaceStrong: '#2B2B2B',
  edge: '#3A3A3A',
  text: '#E8E8E8',
  muted: '#ABABAB',
  faint: '#949494',
  inverse: '#E8E8E8',
  onInverse: '#141414',
};

/**
 * Light: paper with ink, and for the same reason neither one is pure. A phone backlight
 * behind #FFFFFF is a lamp pointed at the reader, and ink on paper was never #000000.
 *
 * The mirror of the dark theme rather than an inversion of its greys: perceived contrast is
 * not symmetric, so the light greys are darker than the dark theme's greys are light.
 */
const lightPalette: Palette = {
  background: '#FAFAFA',
  surface: '#F0F0F0',
  surfaceStrong: '#E4E4E4',
  edge: '#D4D4D4',
  text: '#1A1A1A',
  muted: '#4F4F4F',
  faint: '#626262',
  inverse: '#1A1A1A',
  onInverse: '#FAFAFA',
};

export type Theme = {
  name: ThemeName;
  palette: Palette;
  statusBarStyle: 'light-content' | 'dark-content';
};

export const themes: Readonly<Record<ThemeName, Theme>> = {
  dark: {
    name: 'dark',
    palette: darkPalette,
    statusBarStyle: 'light-content',
  },
  light: {
    name: 'light',
    palette: lightPalette,
    statusBarStyle: 'dark-content',
  },
};

/** Devour is a dark instrument unless the device or the user says otherwise. */
export const DEFAULT_THEME_NAME: ThemeName = 'dark';

export function resolveThemeName(
  preference: ThemePreference,
  scheme: DeviceColorScheme,
): ThemeName {
  if (preference !== 'system') {
    return preference;
  }

  return scheme === 'light' ? 'light' : DEFAULT_THEME_NAME;
}

export function resolveTheme(
  preference: ThemePreference,
  scheme: DeviceColorScheme,
): Theme {
  return themes[resolveThemeName(preference, scheme)];
}
