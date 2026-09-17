import React, {createContext, useContext, useMemo, useState} from 'react';
import {useColorScheme} from 'react-native';

import {resolveTheme} from './theme';
import type {Theme, ThemePreference} from './theme';

export type ThemeControl = {
  theme: Theme;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeControl | undefined>(undefined);

type Props = {
  children: React.ReactNode;
  /** Tests and, later, persisted settings start from an explicit choice. */
  initialPreference?: ThemePreference;
};

/**
 * Owns the theme choice and re-resolves it whenever the device scheme changes.
 *
 * The choice is not persisted yet: there is no settings store before Phase 3, and a fake
 * one would be a lie. It lives for the session, and the device setting is the default.
 */
export function ThemeProvider({children, initialPreference = 'system'}: Props) {
  const [preference, setPreference] =
    useState<ThemePreference>(initialPreference);
  const scheme = useColorScheme();

  const value = useMemo<ThemeControl>(
    () => ({
      theme: resolveTheme(preference, scheme),
      preference,
      setPreference,
    }),
    [preference, scheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useThemeControl(): ThemeControl {
  const control = useContext(ThemeContext);

  if (control === undefined) {
    throw new Error('useThemeControl must be used inside a ThemeProvider');
  }

  return control;
}

export function useTheme(): Theme {
  return useThemeControl().theme;
}
