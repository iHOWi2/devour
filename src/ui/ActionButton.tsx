import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet, Text} from 'react-native';

import {usePressScale} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

/**
 * `primary` is the one loud control on a screen: a filled block at maximum contrast.
 * `quiet` is outlined, `plain` is text only. There is no fourth tone, because a screen with
 * four kinds of button has no hierarchy.
 */
export type ButtonTone = 'primary' | 'quiet' | 'plain';

type Props = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
  disabled = false,
  accessibilityLabel,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const press = usePressScale();

  return (
    <Animated.View style={disabled ? undefined : press.style}>
      <Pressable
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityRole="button"
        accessibilityState={{disabled}}
        disabled={disabled}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={[styles.button, styles[tone], disabled && styles.disabled]}
        testID={testID}>
        <Text
          style={[
            styles.label,
            tone === 'primary' ? styles.primaryLabel : styles.quietLabel,
          ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      borderRadius: radius.control,
    },
    primary: {
      backgroundColor: theme.palette.inverse,
    },
    quiet: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      backgroundColor: theme.palette.surface,
    },
    plain: {
      paddingHorizontal: space.sm,
    },
    disabled: {
      opacity: 0.35,
    },
    label: {
      ...typography.label,
    },
    primaryLabel: {
      color: theme.palette.onInverse,
    },
    quietLabel: {
      color: theme.palette.text,
    },
  });
}
