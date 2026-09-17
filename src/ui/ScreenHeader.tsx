import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, space, typography} from '../design/tokens';

export type HeaderAction = {
  label: string;
  onPress: () => void;
  testID?: string;
};

type Props = {
  version?: string;
  actions?: ReadonlyArray<HeaderAction>;
};

/**
 * The wordmark, an optional version, and the way out of this screen.
 *
 * Header actions are quiet on purpose: the accent belongs to what the agent is doing and to
 * the one action the screen is asking for, which on the chat screen is Send.
 */
export function ScreenHeader({version, actions = []}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <Text style={styles.wordmark}>devour</Text>
      <View style={styles.right}>
        {version === undefined ? null : (
          <Text style={styles.version}>{version}</Text>
        )}
        {actions.map(action => (
          <Pressable
            accessibilityRole="button"
            key={action.label}
            onPress={action.onPress}
            style={styles.action}
            testID={action.testID}>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: space.lg,
    },
    wordmark: {
      ...typography.title,
      color: theme.palette.text,
    },
    right: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    version: {
      ...typography.mono,
      color: theme.palette.muted,
    },
    action: {
      justifyContent: 'center',
      minHeight: TOUCH_TARGET,
      paddingLeft: space.md,
    },
    actionLabel: {
      ...typography.label,
      color: theme.palette.text,
    },
  });
}
