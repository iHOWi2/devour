import React, {useMemo} from 'react';
import {StyleSheet, View} from 'react-native';

import {useThemeControl} from '../design/ThemeProvider';
import type {Theme, ThemePreference} from '../design/theme';
import {space} from '../design/tokens';
import {useI18n} from '../i18n';
import type {LanguagePreference} from '../i18n';
import {SegmentedControl} from './SegmentedControl';
import type {Segment} from './SegmentedControl';

/**
 * The only settings this build has, and both are real: which theme paints the screen and
 * which language it speaks. Both default to the device and are overridable by hand.
 */
export function SettingsPanel() {
  const {
    theme,
    preference: themePreference,
    setPreference: setThemePreference,
  } = useThemeControl();
  const {
    t,
    preference: languagePreference,
    setPreference: setLanguagePreference,
  } = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);

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
    <View style={styles.panel}>
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

function createStyles(theme: Theme) {
  return StyleSheet.create({
    panel: {
      paddingBottom: space.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.palette.edge,
    },
  });
}
