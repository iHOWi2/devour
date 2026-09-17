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
 * Semantic colour tokens. A component asks for a role - `surface`, `danger`, `onAccent` -
 * and never for a hex value. That indirection is the whole reason a second theme costs
 * nothing: the palette changes, the components do not.
 */
export type Palette = {
  background: string;
  surface: string;
  edge: string;
  text: string;
  muted: string;
  accent: string;
  onAccent: string;
  ok: string;
  warn: string;
  danger: string;
};

export type ThemeName = 'dark' | 'light';

/** What the user chose. `system` follows the device setting. */
export type ThemePreference = 'system' | ThemeName;

export const THEME_PREFERENCES: readonly ThemePreference[] = [
  'system',
  'dark',
  'light',
];

/** Dark: warm off-white text on a cool chassis. This is Devour's identity. */
const darkPalette: Palette = {
  background: '#101519',
  surface: '#171E24',
  edge: '#25303A',
  text: '#ECE7DF',
  muted: '#8494A1',
  accent: '#FF4A17',
  onAccent: '#101519',
  ok: '#5FD3A3',
  warn: '#E8B34A',
  danger: '#F2645A',
};

/**
 * Light: the same tension mirrored - cool ink on warm paper. Not the dark theme with its
 * lightness inverted, which is how light themes end up grey and lifeless. The accent and
 * the state colours are darkened so they still carry 4.5:1 against paper.
 */
const lightPalette: Palette = {
  background: '#F4F1EC',
  surface: '#FBF9F6',
  edge: '#D8D1C6',
  text: '#14181B',
  muted: '#5E6976',
  accent: '#D53A0E',
  onAccent: '#FBF9F6',
  ok: '#0F7A55',
  warn: '#8A5D00',
  danger: '#B32D22',
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
