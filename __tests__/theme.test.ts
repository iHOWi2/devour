import {
  DEFAULT_THEME_NAME,
  THEME_PREFERENCES,
  resolveTheme,
  resolveThemeName,
  themes,
} from '../src/design/theme';

import type {Palette} from '../src/design/theme';

const HEX = /^#[0-9A-F]{6}$/;

/** WCAG 2.1 relative luminance, from the hex values the components actually receive. */
function luminance(hex: string): number {
  const channels = [1, 3, 5].map(
    at => parseInt(hex.slice(at, at + 2), 16) / 255,
  );

  const [r, g, b] = channels.map(channel =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4),
  ) as [number, number, number];

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));

  return (light + 0.05) / (dark + 0.05);
}

const TEXT_ROLES: ReadonlyArray<keyof Palette> = ['text', 'muted', 'faint'];
const SURFACE_ROLES: ReadonlyArray<keyof Palette> = [
  'background',
  'surface',
  'surfaceStrong',
];

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

  it('carries no hue at all: every colour is a grey', () => {
    Object.values(themes).forEach(theme => {
      Object.values(theme.palette).forEach(value => {
        const [red, green, blue] = [1, 3, 5].map(at => value.slice(at, at + 2));

        expect(green).toBe(red);
        expect(blue).toBe(red);
      });
    });
  });

  /**
   * A monochrome interface has nowhere to hide: if a grey is too close to the surface under
   * it, the text is simply unreadable. Every text role is therefore measured against every
   * surface it can sit on, at the WCAG floor for body text.
   */
  it('keeps every text role readable on every surface', () => {
    Object.values(themes).forEach(theme => {
      TEXT_ROLES.forEach(role => {
        SURFACE_ROLES.forEach(surface => {
          expect(
            contrast(theme.palette[role], theme.palette[surface]),
          ).toBeGreaterThanOrEqual(4.5);
        });
      });
    });
  });

  /**
   * Primary text is the loudest thing in the palette, but not as loud as a screen can go.
   * #FFFFFF on #000000 is 21:1, and on a phone that is what makes a long answer painful to
   * read - white letters bleed into black on an OLED panel. The window below is "well past
   * the strictest accessibility level, and short of the glare": it is the assertion that
   * keeps someone from putting the pure extremes back.
   */
  it('keeps primary text loud, and short of the 21:1 glare', () => {
    Object.values(themes).forEach(theme => {
      [
        contrast(theme.palette.text, theme.palette.background),
        contrast(theme.palette.onInverse, theme.palette.inverse),
      ].forEach(ratio => {
        expect(ratio).toBeGreaterThan(12);
        expect(ratio).toBeLessThan(19);
      });
    });
  });

  it('uses neither pure black nor pure white anywhere', () => {
    Object.values(themes).forEach(theme => {
      Object.values(theme.palette).forEach(value => {
        expect(value).not.toBe('#000000');
        expect(value).not.toBe('#FFFFFF');
      });
    });
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
