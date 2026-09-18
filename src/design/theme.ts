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
 * Dark: true black, not a tinted near-black. Devour runs on OLED phones where black is the
 * screen being off, which is both the deepest contrast available and the cheapest to draw.
 * The greys step far enough apart to be told apart at arm's length in daylight.
 */
const darkPalette: Palette = {
  background: '#000000',
  surface: '#141414',
  surfaceStrong: '#1F1F1F',
  edge: '#2E2E2E',
  text: '#FFFFFF',
  muted: '#A8A8A8',
  faint: '#8A8A8A',
  inverse: '#FFFFFF',
  onInverse: '#000000',
};

/**
 * Light: paper white with ink. The mirror of the dark theme rather than an inversion of its
 * greys - perceived contrast is not symmetric, so the light greys are darker than the dark
 * theme's greys are light.
 */
const lightPalette: Palette = {
  background: '#FFFFFF',
  surface: '#F2F2F2',
  surfaceStrong: '#E6E6E6',
  edge: '#D6D6D6',
  text: '#000000',
  muted: '#4A4A4A',
  faint: '#666666',
  inverse: '#000000',
  onInverse: '#FFFFFF',
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
