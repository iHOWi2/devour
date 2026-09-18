import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet} from 'react-native';

import {usePressScale, useSwap} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius} from '../design/tokens';
import {Icon} from './Icon';

/**
 * The composer's single round control.
 *
 * It has two jobs and never moves between them: while a stream runs, the same circle under
 * the thumb stops it. Which job it is doing is carried by the icon and by the fill - a
 * filled circle is a live action, an outlined one is a control with nothing to do yet -
 * and the icon scales in when either changes, so the swap is visible without being a
 * flourish.
 */
export type RoundActionIcon = 'send' | 'stop';

type Props = {
  icon: RoundActionIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
};

export function RoundAction({
  icon,
  label,
  onPress,
  disabled = false,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const press = usePressScale(0.94);
  const swap = useSwap(`${icon}-${disabled ? 'idle' : 'live'}`);

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
        style={[styles.button, disabled && styles.idle]}
        testID={testID}>
        <Animated.View style={swap}>
          <Icon name={icon} size={24} tone={disabled ? 'faint' : 'onInverse'} />
        </Animated.View>
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
    idle: {
      backgroundColor: theme.palette.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
    },
  });
}
