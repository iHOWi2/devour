import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import type {MessageKey, Translator} from '../i18n';
import {formatBytes} from '../lib/format';
import {readEnvironment} from '../native';
import type {DeviceEnvironment} from '../native';
import {DataRow} from '../ui/DataRow';
import {PhaseMark} from '../ui/PhaseMark';
import {SettingsPanel} from '../ui/SettingsPanel';

const VERSION = '0.1.0';

/**
 * Phase 1 screen.
 *
 * It shows only facts that are real: what the Kotlin layer reports about the device and
 * whether a local runtime host exists. No chat composer is drawn before the agent runtime
 * exists - a dead input box would be a lie about what this build can do. The settings row
 * is collapsed by default, because persistent chrome has to earn its space.
 */
type ScreenState =
  | {status: 'loading'}
  | {status: 'ready'; environment: DeviceEnvironment}
  | {status: 'failed'; message: string};

function bridgeMessage(state: ScreenState): MessageKey {
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

export function FoundationScreen() {
  const theme = useTheme();
  const {t, plural} = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [state, setState] = useState<ScreenState>({status: 'loading'});
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  return (
    <View style={styles.screen} testID="foundation-screen">
      <StatusBar barStyle={theme.statusBarStyle} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>devour</Text>
          <Text style={styles.version}>{VERSION}</Text>
        </View>

        <PhaseMark index="01" name={t('phase.foundation')} />

        {state.status === 'loading' ? (
          <Text style={styles.status}>{t('status.reading')}</Text>
        ) : null}

        {state.status === 'failed' ? (
          <View style={styles.failure}>
            <Text style={styles.failureTitle}>{t('failure.title')}</Text>
            <Text style={styles.failureBody}>{state.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={styles.retry}
              testID="retry">
              <Text style={styles.retryLabel}>{t('action.retry')}</Text>
            </Pressable>
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
              value={`${state.environment.manufacturer} ${state.environment.model}`}
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
      </ScrollView>

      <View style={styles.footer}>
        {settingsOpen ? <SettingsPanel /> : null}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{t(bridgeMessage(state))}</Text>
          <Pressable
            accessibilityLabel={t('settings.open')}
            accessibilityRole="button"
            accessibilityState={{expanded: settingsOpen}}
            onPress={() => setSettingsOpen(open => !open)}
            style={styles.settingsButton}
            testID="settings-toggle">
            <Text style={styles.settingsLabel}>{t('settings.open')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.palette.background,
    },
    content: {
      paddingHorizontal: space.lg,
      paddingTop: (StatusBar.currentHeight ?? 0) + space.lg,
      paddingBottom: space.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
    },
    wordmark: {
      ...typography.title,
      color: theme.palette.text,
    },
    version: {
      ...typography.mono,
      color: theme.palette.muted,
    },
    status: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.lg,
    },
    rows: {
      marginTop: space.xl,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    failure: {
      marginTop: space.xl,
      padding: space.md,
      borderRadius: radius.sheet,
      backgroundColor: theme.palette.surface,
    },
    failureTitle: {
      ...typography.title,
      color: theme.palette.danger,
    },
    failureBody: {
      ...typography.mono,
      color: theme.palette.muted,
      marginTop: space.sm,
    },
    retry: {
      alignSelf: 'flex-start',
      justifyContent: 'center',
      minHeight: TOUCH_TARGET,
      marginTop: space.md,
      paddingHorizontal: space.lg,
      borderRadius: radius.row,
      backgroundColor: theme.palette.accent,
    },
    retryLabel: {
      ...typography.label,
      color: theme.palette.onAccent,
    },
    footer: {
      paddingHorizontal: space.lg,
      paddingBottom: space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    footerText: {
      ...typography.mono,
      color: theme.palette.muted,
      flex: 1,
    },
    settingsButton: {
      justifyContent: 'center',
      minHeight: TOUCH_TARGET,
      paddingLeft: space.md,
    },
    settingsLabel: {
      ...typography.label,
      color: theme.palette.accent,
    },
  });
}
