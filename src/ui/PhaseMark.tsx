import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';

type Props = {
  index: string;
  name: string;
};

/**
 * The single bold element on the screen: the roadmap phase this build belongs to.
 * A numbered marker is allowed here because the roadmap is a real sequence.
 */
export function PhaseMark({index, name}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.block}>
      <Text accessibilityLabel={`Phase ${index}`} style={styles.index}>
        {index}
      </Text>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      marginTop: space.xxl,
    },
    index: {
      ...typography.display,
      color: theme.palette.accent,
    },
    name: {
      ...typography.title,
      color: theme.palette.text,
      marginTop: space.xs,
    },
  });
}
