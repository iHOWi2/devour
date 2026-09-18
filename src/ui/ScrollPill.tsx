import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet, Text} from 'react-native';

import {useAppear} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

type Props = {
  visible: boolean;
  label: string;
  onPress: () => void;
  testID?: string;
};

/**
 * Jump back to the newest turn.
 *
 * It exists because the chat only follows the stream while the user is already at the
 * bottom: scrolling up to read is a decision, and an interface that yanks the page back
 * down mid-sentence is fighting its user. The pill is the way back, and it is only there
 * when there is somewhere to go.
 */
export function ScrollPill({visible, label, onPress, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const appear = useAppear(visible);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.holder, appear]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        onPress={onPress}
        style={({pressed}) => [styles.pill, pressed && styles.pressed]}
        testID={testID}>
        <Text style={styles.glyph}>↓</Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    holder: {
      position: 'absolute',
      alignSelf: 'center',
      bottom: space.md,
    },
    pill: {
      width: TOUCH_TARGET,
      height: TOUCH_TARGET,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      backgroundColor: theme.palette.surface,
    },
    pressed: {
      backgroundColor: theme.palette.surfaceStrong,
    },
    glyph: {
      ...typography.body,
      lineHeight: 20,
      color: theme.palette.text,
    },
  });
}
