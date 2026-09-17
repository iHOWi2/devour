import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {palette, space, typography} from '../design/tokens';

type Props = {
  index: string;
  name: string;
};

/**
 * The single bold element on the screen: the roadmap phase this build belongs to.
 * A numbered marker is allowed here because the roadmap is a real sequence.
 */
export function PhaseMark({index, name}: Props) {
  return (
    <View style={styles.block}>
      <Text accessibilityLabel={`Phase ${index}`} style={styles.index}>
        {index}
      </Text>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginTop: space.xxl,
  },
  index: {
    ...typography.display,
    color: palette.molten,
  },
  name: {
    ...typography.title,
    color: palette.bone,
    marginTop: space.xs,
  },
});
