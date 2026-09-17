import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette, space, typography} from '../design/tokens';

export type RowState = 'neutral' | 'ok' | 'warn' | 'danger';

type Props = {
  label: string;
  value: string;
  state?: RowState;
};

const stateColour: Record<RowState, string> = {
  neutral: 'transparent',
  ok: palette.ok,
  warn: palette.warn,
  danger: palette.danger,
};

/** One line of machine data: a quiet label, a monospaced value, an optional state dot. */
export function DataRow({label, value, state = 'neutral'}: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueColumn}>
        {state === 'neutral' ? null : (
          <View style={[styles.dot, {backgroundColor: stateColour[state]}]} />
        )}
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.edge,
  },
  label: {
    ...typography.label,
    color: palette.muted,
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
    color: palette.bone,
    flex: 1,
  },
});
