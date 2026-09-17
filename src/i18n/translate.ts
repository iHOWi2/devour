import {LANGUAGES} from './language';
import type {Language} from './language';
import {dictionaries} from './messages';
import type {MessageKey, PluralKey} from './messages';
import {selectPluralCategory} from './plural';
import type {PluralCategory} from './plural';

/** English is the fallback, not the preferred language: the device decides. */
export const DEFAULT_LANGUAGE: Language = 'en';

const PLURAL_FALLBACK: readonly PluralCategory[] = [
  'other',
  'many',
  'few',
  'one',
];

export type TranslationParams = Readonly<Record<string, string | number>>;

export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}

/**
 * Maps a platform locale identifier onto a supported language.
 *
 * Android reports `Locale.toString()` values such as `ru_RU`, other platforms use `ru-RU`,
 * and a region-less `ru` is legal too. Anything unsupported falls back instead of throwing,
 * so a Turkish phone gets English rather than a crash.
 */
export function resolveLanguage(
  locale: string | null | undefined,
  fallback: Language = DEFAULT_LANGUAGE,
): Language {
  if (typeof locale !== 'string') {
    return fallback;
  }

  const primary =
    locale
      .trim()
      .toLowerCase()
      .split(/[-_.@]/)[0] ?? '';

  return isLanguage(primary) ? primary : fallback;
}

function interpolate(template: string, params?: TranslationParams): string {
  if (params === undefined) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (token, name: string) => {
    const value = params[name];

    // A missing parameter stays visible as `{name}`. Printing "undefined" on screen would
    // hide the bug; a leftover placeholder is obvious in review and in a screenshot.
    return value === undefined ? token : String(value);
  });
}

export type Translator = {
  readonly language: Language;
  t(key: MessageKey, params?: TranslationParams): string;
  plural(key: PluralKey, count: number): string;
};

export function createTranslator(language: Language): Translator {
  const dictionary = dictionaries[language];

  return {
    language,

    t(key, params) {
      return interpolate(dictionary.messages[key], params);
    },

    plural(key, count) {
      const forms = dictionary.plurals[key];
      const category = selectPluralCategory(language, count);
      const template =
        forms[category] ??
        PLURAL_FALLBACK.map(fallback => forms[fallback]).find(
          form => form !== undefined,
        );

      return interpolate(template ?? key, {count});
    },
  };
}
