import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

import {PROVIDER_PRESETS, useAgent, validateProviderSettings} from '../agent';
import {useTheme} from '../design/ThemeProvider';
import type {Theme, ThemePreference} from '../design/theme';
import {space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import type {LanguagePreference, MessageKey, Translator} from '../i18n';
import {formatBytes, formatDeviceName} from '../lib/format';
import {readEnvironment} from '../native';
import type {DeviceEnvironment} from '../native';
import {useThemeControl} from '../design/ThemeProvider';
import {ProviderForm} from './ProviderForm';
import {ActionButton} from '../ui/ActionButton';
import {DataRow} from '../ui/DataRow';
import {ScreenHeader} from '../ui/ScreenHeader';
import {SectionTitle} from '../ui/SectionTitle';
import {SegmentedControl} from '../ui/SegmentedControl';
import type {Segment} from '../ui/SegmentedControl';
import {SettingRow} from '../ui/SettingRow';
import {StateLine} from '../ui/StateLine';

/**
 * Settings: where the model comes from, how the interface behaves, what is stored, and what
 * this device actually is.
 *
 * Four sections in the order they matter on a phone that has just been installed. The
 * endpoint comes first because nothing else works without it, and the device facts come
 * last because they are reference material - they were the whole screen in Phase 1, which
 * was honest then and would be vanity now.
 */
const VERSION = '0.1.0';

type Props = {
  onOpenChat: () => void;
};

type EnvironmentState =
  | {status: 'loading'}
  | {status: 'ready'; environment: DeviceEnvironment}
  | {status: 'failed'; message: string};

type SaveState =
  | {status: 'idle'}
  | {status: 'saved'}
  | {status: 'invalid'; message: MessageKey}
  | {status: 'failed'; detail: string};

function bridgeMessage(state: EnvironmentState): MessageKey {
  switch (state.status) {
    case 'ready':
      return 'bridge.connected';
    case 'loading':
      return 'bridge.connecting';
    default:
      return 'bridge.missing';
  }
}

function runtimeHostValue(
  t: Translator['t'],
  environment: DeviceEnvironment,
): string {
  const {runtimeHost} = environment;

  if (!runtimeHost.installed) {
    return t('runtimeHost.missing', {id: runtimeHost.id});
  }

  if (runtimeHost.versionName === null) {
    return t('runtimeHost.installed', {id: runtimeHost.id});
  }

  return t('runtimeHost.version', {
    id: runtimeHost.id,
    version: runtimeHost.versionName,
  });
}

export function SettingsScreen({onOpenChat}: Props) {
  const theme = useTheme();
  const {
    t,
    plural,
    preference: languagePreference,
    setPreference: setLanguagePreference,
  } = useI18n();
  const {preference: themePreference, setPreference: setThemePreference} =
    useThemeControl();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const {state, settings, hasApiKey, saveProvider, clearApiKey, reset} =
    useAgent();

  const [environment, setEnvironment] = useState<EnvironmentState>({
    status: 'loading',
  });
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [apiKey, setApiKey] = useState('');
  const [save, setSave] = useState<SaveState>({status: 'idle'});
  const [cleared, setCleared] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;

    setEnvironment({status: 'loading'});

    readEnvironment()
      .then(next => {
        if (!cancelled) {
          setEnvironment({status: 'ready', environment: next});
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setEnvironment({
            status: 'failed',
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => load(), [load]);

  // The stored settings arrive after the first render, because reading them is a promise.
  useEffect(() => {
    setBaseUrl(settings.baseUrl);
    setModel(settings.model);
  }, [settings]);

  const submit = useCallback(() => {
    const invalid = validateProviderSettings({baseUrl, model});

    if (invalid !== null) {
      setSave({
        status: 'invalid',
        message:
          invalid === 'baseUrl'
            ? 'provider.invalid.baseUrl'
            : 'provider.invalid.model',
      });

      return;
    }

    saveProvider({baseUrl, model, apiKey})
      .then(() => {
        // The key is never echoed back into the field: what is stored is stored.
        setApiKey('');
        setSave({status: 'saved'});
      })
      .catch((error: unknown) => {
        setSave({
          status: 'failed',
          detail: error instanceof Error ? error.message : String(error),
        });
      });
  }, [apiKey, baseUrl, model, saveProvider]);

  const forgetKey = useCallback(() => {
    clearApiKey().catch((error: unknown) => {
      setSave({
        status: 'failed',
        detail: error instanceof Error ? error.message : String(error),
      });
    });
  }, [clearApiKey]);

  const clearConversation = useCallback(() => {
    reset();
    setCleared(true);
  }, [reset]);

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

  const turns = state.conversation.messages.length;

  return (
    <View style={styles.screen} testID="settings-screen">
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.top}>
        <ScreenHeader
          actions={[
            {label: t('nav.chat'), onPress: onOpenChat, testID: 'open-chat'},
          ]}
          subtitle={t('app.version', {version: VERSION})}
          title={t('nav.settings')}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle title={t('provider.section')} hint={t('provider.hint')} />

        <View style={styles.presets}>
          {PROVIDER_PRESETS.map(preset => (
            <View key={preset.id} style={styles.preset}>
              <ActionButton
                label={preset.label}
                onPress={() => {
                  setBaseUrl(preset.baseUrl);
                  setModel(preset.model);
                  setSave({status: 'idle'});
                }}
                testID={`preset-${preset.id}`}
                tone="quiet"
              />
            </View>
          ))}
        </View>

        <ProviderForm
          apiKey={apiKey}
          baseUrl={baseUrl}
          hasApiKey={hasApiKey}
          invalidField={save.status === 'invalid' ? save.message : null}
          model={model}
          onChangeApiKey={setApiKey}
          onChangeBaseUrl={setBaseUrl}
          onChangeModel={setModel}
        />

        <View style={styles.actions}>
          <ActionButton
            label={t('provider.save')}
            onPress={submit}
            testID="provider-save"
          />
          {hasApiKey ? (
            <View style={styles.secondaryAction}>
              <ActionButton
                label={t('provider.clearKey')}
                onPress={forgetKey}
                testID="provider-clear-key"
                tone="quiet"
              />
            </View>
          ) : null}
        </View>

        {save.status === 'saved' ? (
          <View style={styles.line}>
            <StateLine
              testID="provider-saved"
              text={t('provider.saved')}
              tone="quiet"
            />
          </View>
        ) : null}

        {save.status === 'invalid' ? (
          <View style={styles.line}>
            <StateLine
              testID="provider-invalid"
              text={t(save.message)}
              tone="alert"
            />
          </View>
        ) : null}

        {save.status === 'failed' ? (
          <View style={styles.line}>
            <StateLine
              detail={save.detail}
              testID="provider-failed"
              text={t('provider.saveFailed')}
              tone="alert"
            />
          </View>
        ) : null}

        <SectionTitle title={t('settings.interface')} />

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

        <SectionTitle
          title={t('settings.data')}
          hint={t('settings.data.hint')}
        />

        <View style={styles.rows}>
          <SettingRow
            description={
              turns === 0 ? t('settings.clearChat.empty') : undefined
            }
            disabled={turns === 0}
            label={t('settings.clearChat')}
            onPress={clearConversation}
            testID="settings-clear-chat"
          />
        </View>

        {cleared ? (
          <View style={styles.line}>
            <StateLine
              testID="settings-cleared"
              text={t('settings.cleared')}
              tone="quiet"
            />
          </View>
        ) : null}

        {state.persistence === 'unavailable' ? (
          <View style={styles.line}>
            <StateLine
              testID="settings-persistence"
              text={t('storage.unavailable')}
              tone="quiet"
            />
          </View>
        ) : null}

        <SectionTitle title={t('system.environment')} />

        {environment.status === 'loading' ? (
          <Text style={styles.status}>{t('status.reading')}</Text>
        ) : null}

        {environment.status === 'failed' ? (
          <View style={styles.line}>
            <StateLine
              action={{
                label: t('action.retry'),
                onPress: load,
                testID: 'retry',
              }}
              detail={environment.message}
              text={t('failure.title')}
              tone="alert"
            />
          </View>
        ) : null}

        <View style={styles.rows}>
          {environment.status === 'ready' ? (
            <>
              <DataRow
                label={t('row.android')}
                value={t('value.android', {
                  release: environment.environment.release,
                  sdk: environment.environment.sdkInt,
                })}
              />
              <DataRow
                label={t('row.device')}
                value={formatDeviceName(
                  environment.environment.manufacturer,
                  environment.environment.model,
                )}
              />
              <DataRow
                label={t('row.abi')}
                value={environment.environment.abi}
              />
              <DataRow
                label={t('row.cpu')}
                value={plural('cpu.cores', environment.environment.cpuCount)}
              />
              <DataRow
                label={t('row.storage')}
                value={t('value.storage', {
                  free: formatBytes(environment.environment.freeBytes),
                  total: formatBytes(environment.environment.totalBytes),
                })}
              />
              <DataRow
                label={t('row.files')}
                value={environment.environment.filesDir}
              />
              <DataRow
                label={t('row.runtimeHost')}
                value={runtimeHostValue(t, environment.environment)}
              />
            </>
          ) : null}
          <DataRow
            label={t('row.bridge')}
            value={t(bridgeMessage(environment))}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(theme: Theme, insets: EdgeInsets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.palette.background,
    },
    top: {
      paddingTop: insets.top + space.sm,
    },
    content: {
      paddingHorizontal: space.lg,
      paddingBottom: insets.bottom + space.xxl,
    },
    presets: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: space.lg,
      marginLeft: -space.xs,
    },
    preset: {
      marginLeft: space.xs,
      marginTop: space.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: space.lg,
    },
    secondaryAction: {
      marginLeft: space.sm,
    },
    line: {
      marginTop: space.md,
    },
    status: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.md,
    },
    rows: {
      marginTop: space.md,
    },
  });
}
