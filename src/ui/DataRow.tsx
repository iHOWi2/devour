import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Palette, Theme} from '../design/theme';
import {space, typography} from '../design/tokens';

export type RowState = 'neutral' | 'ok' | 'warn' | 'danger';

type Props = {
  label: string;
  value: string;
  state?: RowState;
};

function stateColour(palette: Palette, state: RowState): string {
  switch (state) {
    case 'ok':
      return palette.ok;
    case 'warn':
      return palette.warn;
    case 'danger':
      return palette.danger;
    default:
      return 'transparent';
  }
}

/** One line of machine data: a quiet label, a monospaced value, an optional state dot. */
export function DataRow({label, value, state = 'neutral'}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueColumn}>
        {state === 'neutral' ? null : (
          <View
            style={[
              styles.dot,
              {backgroundColor: stateColour(theme.palette, state)},
            ]}
          />
        )}
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: space.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.palette.edge,
    },
    label: {
      ...typography.label,
      color: theme.palette.muted,
      width: 104,
      paddingTop: 2,
    },
    valueColumn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: space.sm,
    },
    value: {
      ...typography.mono,
      color: theme.palette.text,
      flex: 1,
    },
  });
}
