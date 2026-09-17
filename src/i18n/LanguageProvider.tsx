import React, {createContext, useContext, useMemo, useState} from 'react';

import {readDeviceLanguage} from './device';
import type {Language} from './language';
import {createTranslator} from './translate';
import type {Translator} from './translate';

/** What the user chose. `system` follows the device language. */
export type LanguagePreference = 'system' | Language;

export const LANGUAGE_PREFERENCES: readonly LanguagePreference[] = [
  'system',
  'en',
  'ru',
];

export type LanguageControl = Translator & {
  preference: LanguagePreference;
  deviceLanguage: Language;
  setPreference: (preference: LanguagePreference) => void;
};

const LanguageContext = createContext<LanguageControl | undefined>(undefined);

type Props = {
  children: React.ReactNode;
  initialPreference?: LanguagePreference;
  /** Injected by tests; the app reads the device locale once at startup. */
  deviceLanguage?: Language;
};

/**
 * Owns the language choice and hands the rest of the app a translator.
 *
 * Resolution order: explicit choice, then the device language, then English. Like the
 * theme, the choice lives for the session until there is a real settings store.
 */
export function LanguageProvider({
  children,
  initialPreference = 'system',
  deviceLanguage,
}: Props) {
  const [preference, setPreference] =
    useState<LanguagePreference>(initialPreference);
  // Read once: the device language cannot change without the process restarting.
  const [resolvedDeviceLanguage] = useState<Language>(
    () => deviceLanguage ?? readDeviceLanguage(),
  );

  const value = useMemo<LanguageControl>(() => {
    const language =
      preference === 'system' ? resolvedDeviceLanguage : preference;

    return {
      ...createTranslator(language),
      preference,
      deviceLanguage: resolvedDeviceLanguage,
      setPreference,
    };
  }, [preference, resolvedDeviceLanguage]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n(): LanguageControl {
  const control = useContext(LanguageContext);

  if (control === undefined) {
    throw new Error('useI18n must be used inside a LanguageProvider');
  }

  return control;
}
