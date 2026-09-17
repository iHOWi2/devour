import React, {useCallback, useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {palette, radius, space, typography} from './design/tokens';
import {formatStorage} from './lib/format';
import {readEnvironment} from './native';
import type {DeviceEnvironment} from './native';
import {DataRow} from './ui/DataRow';
import {PhaseMark} from './ui/PhaseMark';

const VERSION = '0.1.0';

/**
 * Phase 1 screen.
 *
 * It shows only facts that are real: what the Kotlin layer reports about the device and
 * whether a local runtime host exists. No chat composer is drawn before the agent runtime
 * exists - a dead input box would be a lie about what this build can do.
 */
type ScreenState =
  | {status: 'loading'}
  | {status: 'ready'; environment: DeviceEnvironment}
  | {status: 'failed'; message: string};

function runtimeHostLabel(environment: DeviceEnvironment): string {
  const {runtimeHost} = environment;

  if (!runtimeHost.installed) {
    return `${runtimeHost.id} not installed`;
  }

  if (runtimeHost.versionName === null) {
    return `${runtimeHost.id} installed`;
  }

  return `${runtimeHost.id} ${runtimeHost.versionName}`;
}

function bridgeLabel(state: ScreenState): string {
  switch (state.status) {
    case 'ready':
      return 'native bridge connected';
    case 'loading':
      return 'connecting to native bridge';
    default:
      return 'native bridge not connected';
  }
}

export function App() {
  const [state, setState] = useState<ScreenState>({status: 'loading'});

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
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.wordmark}>devour</Text>
          <Text style={styles.version}>{VERSION}</Text>
        </View>

        <PhaseMark index="01" name="Foundation" />

        {state.status === 'loading' ? (
          <Text style={styles.status}>Reading device environment</Text>
        ) : null}

        {state.status === 'failed' ? (
          <View style={styles.failure}>
            <Text style={styles.failureTitle}>Native bridge unavailable</Text>
            <Text style={styles.failureBody}>{state.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={load}
              style={styles.retry}>
              <Text style={styles.retryLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : null}

        {state.status === 'ready' ? (
          <View style={styles.rows}>
            <DataRow
              label="Android"
              value={`${state.environment.release} (API ${state.environment.sdkInt})`}
            />
            <DataRow
              label="Device"
              value={`${state.environment.manufacturer} ${state.environment.model}`}
            />
            <DataRow label="ABI" value={state.environment.abi} />
            <DataRow
              label="CPU"
              value={`${state.environment.cpuCount} cores`}
            />
            <DataRow
              label="Storage"
              value={formatStorage(
                state.environment.freeBytes,
                state.environment.totalBytes,
              )}
            />
            <DataRow label="App files" value={state.environment.filesDir} />
            <DataRow
              label="Runtime host"
              state={state.environment.runtimeHost.installed ? 'ok' : 'warn'}
              value={runtimeHostLabel(state.environment)}
            />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{bridgeLabel(state)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.chassis,
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
    color: palette.bone,
  },
  version: {
    ...typography.mono,
    color: palette.muted,
  },
  status: {
    ...typography.body,
    color: palette.muted,
    marginTop: space.lg,
  },
  rows: {
    marginTop: space.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.edge,
  },
  failure: {
    marginTop: space.xl,
    padding: space.md,
    borderRadius: radius.sheet,
    backgroundColor: palette.surface,
  },
  failureTitle: {
    ...typography.title,
    color: palette.danger,
  },
  failureBody: {
    ...typography.mono,
    color: palette.muted,
    marginTop: space.sm,
  },
  retry: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    minHeight: 44,
    marginTop: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.row,
    backgroundColor: palette.molten,
  },
  retryLabel: {
    ...typography.label,
    color: palette.chassis,
  },
  footer: {
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.edge,
  },
  footerText: {
    ...typography.mono,
    color: palette.muted,
  },
});

export default App;
