import React, {useMemo} from 'react';
import {Animated, StyleSheet} from 'react-native';

import {usePulse} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';

/**
 * A block cursor that pulses while the model is answering.
 *
 * This is Devour's one piece of ambient motion, and it is placed where the work is - at the
 * end of the text being written - instead of in a corner spinner. It is a machine typing,
 * which is exactly what is happening. Still visible when the device asks for less motion.
 */
export function Caret({testID}: {testID?: string}) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pulse = usePulse(true);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[styles.caret, pulse]}
      testID={testID}
    />
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    caret: {
      width: 9,
      height: 18,
      marginTop: 4,
      backgroundColor: theme.palette.text,
    },
  });
}
