import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {ScrollView, StatusBar, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

import {useAgent, validateProviderSettings} from '../agent';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import type {MessageKey, Translator} from '../i18n';
import {formatBytes, formatDeviceName} from '../lib/format';
import {readEnvironment} from '../native';
import type {DeviceEnvironment} from '../native';
import {ProviderForm} from './ProviderForm';
import {ActionButton} from '../ui/ActionButton';
import {DataRow} from '../ui/DataRow';
import {ScreenHeader} from '../ui/ScreenHeader';
import {SectionTitle} from '../ui/SectionTitle';
import {SettingsPanel} from '../ui/SettingsPanel';
import {StateLine} from '../ui/StateLine';

/**
 * The instrument panel: what the device is, where the model comes from, how the interface
 * behaves. It grew out of the Phase 1 screen - the device facts and the bridge state are
 * unchanged - and gained the endpoint the chat screen needs.
 *
 * The settings are no longer collapsed behind a toggle: on a screen whose subject is the
 * configuration, hiding it would be chrome for its own sake.
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

export function SystemScreen({onOpenChat}: Props) {
  const theme = useTheme();
  const {t, plural} = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const {settings, hasApiKey, saveProvider, clearApiKey} = useAgent();

  const [state, setState] = useState<EnvironmentState>({status: 'loading'});
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [model, setModel] = useState(settings.model);
  const [apiKey, setApiKey] = useState('');
  const [save, setSave] = useState<SaveState>({status: 'idle'});

  const load = useCallback(() => {
    let cancelled = false;

    setState({status: 'loading'});

    readEnvironment()
      .then(environment => {
        if (!cancelled) {
          setState({status: 'ready', environment});
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState({
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

  return (
    <View style={styles.screen} testID="system-screen">
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.top}>
        <ScreenHeader
          actions={[
            {label: t('nav.chat'), onPress: onOpenChat, testID: 'open-chat'},
          ]}
          version={VERSION}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <SectionTitle title={t('provider.section')} hint={t('provider.hint')} />

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
          <StateLine
            testID="provider-saved"
            text={t('provider.saved')}
            tone="ok"
          />
        ) : null}

        {save.status === 'invalid' ? (
          <StateLine
            testID="provider-invalid"
            text={t(save.message)}
            tone="danger"
          />
        ) : null}

        {save.status === 'failed' ? (
          <StateLine
            detail={save.detail}
            testID="provider-failed"
            text={t('provider.saveFailed')}
            tone="danger"
          />
        ) : null}

        <SectionTitle title={t('system.environment')} />

        {state.status === 'loading' ? (
          <Text style={styles.status}>{t('status.reading')}</Text>
        ) : null}

        {state.status === 'failed' ? (
          <View style={styles.failure}>
            <StateLine
              action={{
                label: t('action.retry'),
                onPress: load,
                testID: 'retry',
              }}
              detail={state.message}
              text={t('failure.title')}
              tone="danger"
            />
          </View>
        ) : null}

        {state.status === 'ready' ? (
          <View style={styles.rows}>
            <DataRow
              label={t('row.android')}
              value={t('value.android', {
                release: state.environment.release,
                sdk: state.environment.sdkInt,
              })}
            />
            <DataRow
              label={t('row.device')}
              value={formatDeviceName(
                state.environment.manufacturer,
                state.environment.model,
              )}
            />
            <DataRow label={t('row.abi')} value={state.environment.abi} />
            <DataRow
              label={t('row.cpu')}
              value={plural('cpu.cores', state.environment.cpuCount)}
            />
            <DataRow
              label={t('row.storage')}
              value={t('value.storage', {
                free: formatBytes(state.environment.freeBytes),
                total: formatBytes(state.environment.totalBytes),
              })}
            />
            <DataRow
              label={t('row.files')}
              value={state.environment.filesDir}
            />
            <DataRow
              label={t('row.runtimeHost')}
              state={state.environment.runtimeHost.installed ? 'ok' : 'warn'}
              value={runtimeHostValue(t, state.environment)}
            />
          </View>
        ) : null}

        <SectionTitle title={t('settings.interface')} />
        <SettingsPanel />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t(bridgeMessage(state))}</Text>
      </View>
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
      paddingTop: insets.top + space.md,
    },
    content: {
      paddingHorizontal: space.lg,
      paddingBottom: space.xl,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: space.md,
    },
    secondaryAction: {
      marginLeft: space.sm,
    },
    status: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.md,
    },
    failure: {
      marginTop: space.xs,
    },
    rows: {
      marginTop: space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    footer: {
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
      paddingBottom: insets.bottom + space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    footerText: {
      ...typography.mono,
      color: theme.palette.muted,
    },
  });
}
