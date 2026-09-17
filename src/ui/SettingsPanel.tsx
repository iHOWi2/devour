import React from 'react';
import {View} from 'react-native';

import {useThemeControl} from '../design/ThemeProvider';
import type {ThemePreference} from '../design/theme';
import {useI18n} from '../i18n';
import type {LanguagePreference} from '../i18n';
import {SegmentedControl} from './SegmentedControl';
import type {Segment} from './SegmentedControl';

/**
 * Appearance and language: the two settings that belong to the interface itself. Both
 * default to the device and are overridable by hand, and both live for the session only -
 * the settings store arrives in Phase 3.
 */
export function SettingsPanel() {
  const {preference: themePreference, setPreference: setThemePreference} =
    useThemeControl();
  const {
    t,
    preference: languagePreference,
    setPreference: setLanguagePreference,
  } = useI18n();

  const themeSegments: ReadonlyArray<Segment<ThemePreference>> = [
    {
      value: 'system',
      label: t('settings.auto'),
      testID: 'segment-theme-system',
    },
    {value: 'dark', label: t('theme.dark'), testID: 'segment-theme-dark'},
    {value: 'light', label: t('theme.light'), testID: 'segment-theme-light'},
  ];

  const languageSegments: ReadonlyArray<Segment<LanguagePreference>> = [
    {
      value: 'system',
      label: t('settings.auto'),
      testID: 'segment-language-system',
    },
    {
      value: 'en',
      label: t('language.en.short'),
      accessibilityLabel: t('language.en'),
      testID: 'segment-language-en',
    },
    {
      value: 'ru',
      label: t('language.ru.short'),
      accessibilityLabel: t('language.ru'),
      testID: 'segment-language-ru',
    },
  ];

  return (
    <View>
      <SegmentedControl
        label={t('settings.theme')}
        onChange={setThemePreference}
        segments={themeSegments}
        value={themePreference}
      />
      <SegmentedControl
        label={t('settings.language')}
        onChange={setLanguagePreference}
        segments={languageSegments}
        value={languagePreference}
      />
    </View>
  );
}
