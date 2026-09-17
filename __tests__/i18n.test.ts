import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  MESSAGE_KEYS,
  createTranslator,
  dictionaries,
  resolveLanguage,
  selectPluralCategory,
} from '../src/i18n';
import type {MessageKey} from '../src/i18n';

describe('language resolution', () => {
  it('reads the platform locale in every shape Android and others report', () => {
    expect(resolveLanguage('ru_RU')).toBe('ru');
    expect(resolveLanguage('ru-RU')).toBe('ru');
    expect(resolveLanguage('ru_RU.UTF-8')).toBe('ru');
    expect(resolveLanguage('RU')).toBe('ru');
    expect(resolveLanguage('ru')).toBe('ru');
    expect(resolveLanguage('en_US')).toBe('en');
  });

  it('falls back instead of throwing on an unsupported or missing locale', () => {
    expect(resolveLanguage('uk_UA')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('')).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage(null)).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage(undefined)).toBe(DEFAULT_LANGUAGE);
    expect(resolveLanguage('uk_UA', 'ru')).toBe('ru');
  });
});

describe('dictionaries', () => {
  it('translates every key in every language', () => {
    LANGUAGES.forEach(language => {
      expect(Object.keys(dictionaries[language].messages).sort()).toEqual(
        [...MESSAGE_KEYS].sort(),
      );
    });
  });

  it('leaves no prose untranslated', () => {
    const prose: MessageKey[] = [
      'phase.chat',
      'status.reading',
      'bridge.connected',
      'failure.title',
      'action.retry',
      'row.device',
      'row.storage',
      'settings.interface',
      'settings.theme',
      'settings.language',
      'theme.dark',
      'theme.light',
      'chat.send',
      'chat.empty.ready',
      'chat.empty.unconfigured',
      'chat.waiting',
      'error.provider.unauthorized',
      'provider.apiKey.stored',
      'provider.hint',
      'system.environment',
    ];

    prose.forEach(key => {
      expect(dictionaries.ru.messages[key]).not.toBe(
        dictionaries.en.messages[key],
      );
    });
  });
});

describe('plural categories', () => {
  it('implements the three russian forms', () => {
    expect(selectPluralCategory('ru', 1)).toBe('one');
    expect(selectPluralCategory('ru', 21)).toBe('one');
    expect(selectPluralCategory('ru', 2)).toBe('few');
    expect(selectPluralCategory('ru', 104)).toBe('few');
    expect(selectPluralCategory('ru', 5)).toBe('many');
    expect(selectPluralCategory('ru', 11)).toBe('many');
    expect(selectPluralCategory('ru', 112)).toBe('many');
    expect(selectPluralCategory('ru', 0)).toBe('many');
  });

  it('implements the two english forms', () => {
    expect(selectPluralCategory('en', 1)).toBe('one');
    expect(selectPluralCategory('en', 0)).toBe('other');
    expect(selectPluralCategory('en', 8)).toBe('other');
  });
});

describe('translator', () => {
  it('counts cores in correct russian', () => {
    const {plural} = createTranslator('ru');

    expect(plural('cpu.cores', 1)).toBe('1 ядро');
    expect(plural('cpu.cores', 2)).toBe('2 ядра');
    expect(plural('cpu.cores', 8)).toBe('8 ядер');
  });

  it('counts cores in english', () => {
    const {plural} = createTranslator('en');

    expect(plural('cpu.cores', 1)).toBe('1 core');
    expect(plural('cpu.cores', 8)).toBe('8 cores');
  });

  it('keeps word order in the dictionary, not in the screen', () => {
    const params = {free: '41.2 GB', total: '128 GB'};

    expect(createTranslator('en').t('value.storage', params)).toBe(
      '41.2 GB free of 128 GB',
    );
    expect(createTranslator('ru').t('value.storage', params)).toBe(
      '41.2 GB свободно из 128 GB',
    );
  });

  it('leaves a missing parameter visible instead of printing undefined', () => {
    expect(createTranslator('en').t('value.android', {release: '16'})).toBe(
      '16 (API {sdk})',
    );
  });

  it('reports the language it was built for', () => {
    expect(createTranslator('ru').language).toBe('ru');
    expect(DEFAULT_LANGUAGE).toBe('en');
  });
});
