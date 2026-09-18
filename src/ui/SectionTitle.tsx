import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';

type Props = {
  title: string;
  hint?: string;
};

/**
 * A section is separated by space and weight, not by a rule and not by a card. Sentence
 * case, because tracked-out capitals are decoration that also costs legibility.
 */
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
      marginTop: space.xxl,
    },
    title: {
      ...typography.title,
      color: theme.palette.text,
    },
    hint: {
      ...typography.caption,
      color: theme.palette.muted,
      marginTop: space.xs,
      maxWidth: 440,
    },
  });
}
