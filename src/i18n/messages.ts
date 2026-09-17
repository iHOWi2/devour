import type {Language} from './language';
import type {PluralCategory} from './plural';

/**
 * Every string the interface can show.
 *
 * Two rules keep this file honest:
 *
 *  - `dictionaries` is typed as a complete record per language, so a missing translation is
 *    a typecheck failure instead of an English word leaking onto a Russian screen.
 *  - sentences are never assembled from fragments in the UI. Word order differs between
 *    languages, so a whole sentence with placeholders is the unit of translation.
 */
export const MESSAGE_KEYS = [
  'phase.foundation',
  'status.reading',
  'bridge.connected',
  'bridge.connecting',
  'bridge.missing',
  'failure.title',
  'action.retry',
  'row.android',
  'row.device',
  'row.abi',
  'row.cpu',
  'row.storage',
  'row.files',
  'row.runtimeHost',
  'value.android',
  'value.storage',
  'runtimeHost.installed',
  'runtimeHost.missing',
  'runtimeHost.version',
  'settings.open',
  'settings.theme',
  'settings.language',
  'settings.auto',
  'theme.dark',
  'theme.light',
  'language.en',
  'language.en.short',
  'language.ru',
  'language.ru.short',
] as const;

export type MessageKey = (typeof MESSAGE_KEYS)[number];

export const PLURAL_KEYS = ['cpu.cores'] as const;

export type PluralKey = (typeof PLURAL_KEYS)[number];

export type Dictionary = {
  readonly messages: Readonly<Record<MessageKey, string>>;
  readonly plurals: Readonly<
    Record<PluralKey, Readonly<Partial<Record<PluralCategory, string>>>>
  >;
};

const en: Dictionary = {
  messages: {
    'phase.foundation': 'Foundation',
    'status.reading': 'Reading device environment',
    'bridge.connected': 'native bridge connected',
    'bridge.connecting': 'connecting to native bridge',
    'bridge.missing': 'native bridge not connected',
    'failure.title': 'Native bridge unavailable',
    'action.retry': 'Retry',
    'row.android': 'Android',
    'row.device': 'Device',
    'row.abi': 'ABI',
    'row.cpu': 'CPU',
    'row.storage': 'Storage',
    'row.files': 'App files',
    'row.runtimeHost': 'Runtime host',
    'value.android': '{release} (API {sdk})',
    'value.storage': '{free} free of {total}',
    'runtimeHost.installed': '{id} installed',
    'runtimeHost.missing': '{id} not installed',
    'runtimeHost.version': '{id} {version}',
    'settings.open': 'Settings',
    'settings.theme': 'Theme',
    'settings.language': 'Language',
    'settings.auto': 'Auto',
    'theme.dark': 'Dark',
    'theme.light': 'Light',
    'language.en': 'English',
    'language.en.short': 'EN',
    'language.ru': 'Russian',
    'language.ru.short': 'RU',
  },
  plurals: {
    'cpu.cores': {
      one: '{count} core',
      other: '{count} cores',
    },
  },
};

const ru: Dictionary = {
  messages: {
    'phase.foundation': 'Фундамент',
    'status.reading': 'Читаю окружение устройства',
    'bridge.connected': 'нативный мост подключён',
    'bridge.connecting': 'подключаюсь к нативному мосту',
    'bridge.missing': 'нативный мост не подключён',
    'failure.title': 'Нативный мост недоступен',
    'action.retry': 'Повторить',
    'row.android': 'Android',
    'row.device': 'Устройство',
    'row.abi': 'ABI',
    'row.cpu': 'CPU',
    'row.storage': 'Память',
    'row.files': 'Файлы',
    'row.runtimeHost': 'Runtime',
    'value.android': '{release} (API {sdk})',
    'value.storage': '{free} свободно из {total}',
    'runtimeHost.installed': '{id} установлен',
    'runtimeHost.missing': '{id} не установлен',
    'runtimeHost.version': '{id} {version}',
    'settings.open': 'Настройки',
    'settings.theme': 'Тема',
    'settings.language': 'Язык',
    'settings.auto': 'Авто',
    'theme.dark': 'Тёмная',
    'theme.light': 'Светлая',
    'language.en': 'Английский',
    'language.en.short': 'EN',
    'language.ru': 'Русский',
    'language.ru.short': 'RU',
  },
  plurals: {
    'cpu.cores': {
      one: '{count} ядро',
      few: '{count} ядра',
      many: '{count} ядер',
    },
  },
};

export const dictionaries: Readonly<Record<Language, Dictionary>> = {en, ru};
