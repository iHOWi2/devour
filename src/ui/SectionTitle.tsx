import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';

type Props = {
  title: string;
  hint?: string;
};

/** A hairline and a quiet label: structure without a card. */
export function SectionTitle({title, hint}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.block}>
      <Text style={styles.title}>{title}</Text>
      {hint === undefined ? null : <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      marginTop: space.xl,
      paddingTop: space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    title: {
      ...typography.label,
      color: theme.palette.text,
    },
    hint: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.xs,
    },
  });
}
