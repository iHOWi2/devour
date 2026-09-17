import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Palette, Theme} from '../design/theme';
import {space, typography} from '../design/tokens';
import {ActionButton} from './ActionButton';

export type StateTone = 'accent' | 'ok' | 'warn' | 'danger' | 'muted';

type Props = {
  tone: StateTone;
  text: string;
  /** The endpoint's own words, if it said anything. Machine text, so monospaced. */
  detail?: string | null;
  action?: {label: string; onPress: () => void; testID?: string};
  testID?: string;
};

function toneColour(palette: Palette, tone: StateTone): string {
  switch (tone) {
    case 'accent':
      return palette.accent;
    case 'ok':
      return palette.ok;
    case 'warn':
      return palette.warn;
    case 'danger':
      return palette.danger;
    default:
      return palette.muted;
  }
}

/**
 * What the machine is doing or what went wrong, as one line above the composer: a six pixel
 * state dot, a short label, the endpoint's own detail, and at most one action. A status line
 * that can be read is better than a spinner that cannot.
 */
export function StateLine({tone, text, detail, action, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const colour = toneColour(theme.palette, tone);

  return (
    <View style={styles.line} testID={testID}>
      <View style={[styles.dot, {backgroundColor: colour}]} />
      <View style={styles.body}>
        <Text style={[styles.text, {color: colour}]}>{text}</Text>
        {detail === undefined || detail === null ? null : (
          <Text style={styles.detail}>{detail}</Text>
        )}
      </View>
      {action === undefined ? null : (
        <ActionButton
          label={action.label}
          onPress={action.onPress}
          testID={action.testID}
          tone="quiet"
        />
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: space.sm,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: space.sm,
    },
    body: {
      flex: 1,
      paddingRight: space.sm,
    },
    text: {
      ...typography.label,
    },
    detail: {
      ...typography.mono,
      color: theme.palette.muted,
      marginTop: 2,
    },
  });
}
