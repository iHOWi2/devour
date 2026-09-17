import type {Language} from './language';

/** The CLDR plural categories the supported languages need. */
export type PluralCategory = 'one' | 'few' | 'many' | 'other';

/**
 * Russian needs three forms (1 ядро, 2 ядра, 5 ядер), English needs two. The rules are
 * written out here on purpose: `Intl.PluralRules` is not guaranteed in every Hermes build,
 * and pulling in a localisation library for two languages would be weight without value.
 */
export function selectPluralCategory(
  language: Language,
  count: number,
): PluralCategory {
  const value = Math.abs(Math.trunc(count));

  if (language === 'ru') {
    const mod10 = value % 10;
    const mod100 = value % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return 'one';
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
      return 'few';
    }

    return 'many';
  }

  return value === 1 ? 'one' : 'other';
}
