import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import {usePressScale} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, typography} from '../design/tokens';

/**
 * The composer's single round control.
 *
 * Two glyphs, both drawn rather than fetched: `send` is an upward arrow, `stop` is a filled
 * square. No icon font ships with Devour, and a missing glyph is a broken button - the
 * square is a plain View and the arrow is one character that every Android font has.
 */
export type Glyph = 'send' | 'stop';

type Props = {
  glyph: Glyph;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function RoundAction({
  glyph,
  label,
  onPress,
  disabled = false,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const press = usePressScale(0.94);

  return (
    <Animated.View style={disabled ? undefined : press.style}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.button, disabled && styles.disabled]}
        testID={testID}>
        {glyph === 'stop' ? (
          <View style={styles.square} />
        ) : (
          <Text style={styles.arrow}>{'\u2191'}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.palette.inverse,
    },
    disabled: {
      opacity: 0.25,
    },
    arrow: {
      ...typography.title,
      lineHeight: 26,
      color: theme.palette.onInverse,
    },
    square: {
      width: 13,
      height: 13,
      borderRadius: 3,
      backgroundColor: theme.palette.onInverse,
    },
  });
}
