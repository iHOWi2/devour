import {I18nManager} from 'react-native';

import type {Language} from './language';
import {DEFAULT_LANGUAGE, resolveLanguage} from './translate';

type LocaleConstants = {
  localeIdentifier?: string | null;
};

/**
 * The device locale, as the platform reports it.
 *
 * React Native's `I18nManager` exposes it among its constants; on Android the value comes
 * from `ConfigurationCompat.getLocales(...)[0].toString()`, so it looks like `ru_RU`. The
 * constant is optional in the type and the module may be absent in a test renderer, hence
 * the guard: an unknown locale is a fallback, never a crash.
 */
export function readDeviceLocale(): string | null {
  try {
    const constants: LocaleConstants = I18nManager.getConstants();

    return typeof constants.localeIdentifier === 'string'
      ? constants.localeIdentifier
      : null;
  } catch {
    return null;
  }
}

export function readDeviceLanguage(): Language {
  return resolveLanguage(readDeviceLocale(), DEFAULT_LANGUAGE);
}
