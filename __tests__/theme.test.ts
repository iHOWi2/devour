import {
  DEFAULT_THEME_NAME,
  THEME_PREFERENCES,
  resolveTheme,
  resolveThemeName,
  themes,
} from '../src/design/theme';

const HEX = /^#[0-9A-F]{6}$/;

describe('themes', () => {
  it('declares every colour as a six digit uppercase hex value', () => {
    Object.values(themes).forEach(theme => {
      Object.values(theme.palette).forEach(value => {
        expect(value).toMatch(HEX);
      });
    });
  });

  it('gives both themes the same token set, so no component can be theme specific', () => {
    expect(Object.keys(themes.light.palette).sort()).toEqual(
      Object.keys(themes.dark.palette).sort(),
    );
  });

  it('is not one theme with its lightness inverted', () => {
    expect(themes.light.palette.background).not.toBe(themes.dark.palette.text);
    expect(themes.light.palette.text).not.toBe(themes.dark.palette.background);
    expect(themes.light.palette.accent).not.toBe(themes.dark.palette.accent);
  });

  it('follows the device only when the user asked for it', () => {
    expect(resolveThemeName('system', 'light')).toBe('light');
    expect(resolveThemeName('system', 'dark')).toBe('dark');
    expect(resolveThemeName('light', 'dark')).toBe('light');
    expect(resolveThemeName('dark', 'light')).toBe('dark');
  });

  it('falls back to the dark instrument when the device says nothing', () => {
    expect(resolveThemeName('system', null)).toBe(DEFAULT_THEME_NAME);
    expect(resolveThemeName('system', undefined)).toBe('dark');
  });

  it('pairs each theme with a readable status bar', () => {
    expect(resolveTheme('dark', null).statusBarStyle).toBe('light-content');
    expect(resolveTheme('light', null).statusBarStyle).toBe('dark-content');
  });

  it('offers exactly the choices the settings control renders', () => {
    expect([...THEME_PREFERENCES]).toEqual(['system', 'dark', 'light']);
  });
});
