import React, {useMemo} from 'react';
import {Animated, StyleSheet} from 'react-native';

import {useEntrance, useWave} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space} from '../design/tokens';

/**
 * The shape of an answer, before the answer exists.
 *
 * Between sending a question and the first token there is a gap of a second or more, and
 * the first build filled it with the words "waiting for the model" in small grey type.
 * That is a status, not a response: nothing on the screen suggested that text was about to
 * appear in that spot. Three bars where the lines will be do suggest it, and they are
 * honest - they are replaced by the real text the moment it arrives, and they never
 * pretend to be content, because they carry no letters.
 *
 * The bars are widths, not a spinner. A spinner in the corner says "the app is busy"; a
 * paragraph outline says "your answer is being written here".
 */
type Props = {
  /** What a screen reader says instead of seeing the bars. */
  label: string;
  testID?: string;
};

/** Three lines, tapering, which is what a short paragraph looks like from a distance. */
const BARS = ['92%', '80%', '56%'] as const;

/** Resting and crest opacity of the wave. Both readable, neither one loud. */
const LOW = 0.3;
const HIGH = 0.8;

export function GhostLines({label, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const entrance = useEntrance({distance: 6});
  const {progress, still} = useWave(true);

  return (
    <Animated.View
      accessibilityLabel={label}
      accessible
      style={[styles.group, entrance]}
      testID={testID}>
      {BARS.map((width, index) => {
        // Each bar reads the same value a little later, so the crest travels downwards.
        const offset = index * 0.16;

        return (
          <Animated.View
            key={width}
            style={[
              styles.bar,
              index > 0 && styles.gap,
              {width},
              still
                ? styles.still
                : {
                    opacity: progress.interpolate({
                      inputRange: [0, 0.2 + offset, 0.45 + offset, 1],
                      outputRange: [LOW, HIGH, LOW, LOW],
                    }),
                  },
            ]}
            testID={testID === undefined ? undefined : `${testID}-bar`}
          />
        );
      })}
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    group: {
      alignSelf: 'stretch',
      paddingVertical: space.xs,
    },
    bar: {
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: theme.palette.surfaceStrong,
    },
    gap: {
      marginTop: space.sm,
    },
    still: {
      opacity: 0.55,
    },
  });
}
