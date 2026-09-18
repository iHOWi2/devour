import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';

type Props = {
  label: string;
  value: string;
};

/**
 * One machine fact: a quiet label and a monospaced value.
 *
 * There is no state dot. A coloured dot would have to mean something, and what it would
 * mean is already written in the value - "not installed" is clearer than amber, and it
 * survives a monochrome interface, sunlight and colour blindness.
 */
export function DataRow({label, value}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text selectable style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: space.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.palette.edge,
    },
    label: {
      ...typography.caption,
      color: theme.palette.muted,
      width: 96,
      paddingTop: 3,
    },
    value: {
      ...typography.mono,
      color: theme.palette.text,
      flex: 1,
    },
  });
}
