import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';

import {usePressScale} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';
import {Icon} from './Icon';
import type {IconName, IconTone} from './Icon';

/**
 * `primary` is the one loud control on a screen: a filled block at maximum contrast.
 * `quiet` is outlined. `ghost` is label only until it is touched, and then it fills - a
 * text button with no press state is the most common place where an interface feels dead.
 *
 * `contrast` is the mirror of `primary` and exists for one situation: a control sitting on
 * an inverted fill, where `ghost` would draw its label in the same colour as the block
 * under it. That is not a style choice, it is how the retry button on a failure line
 * became invisible in the dark theme.
 */
export type ButtonTone = 'primary' | 'quiet' | 'ghost' | 'contrast';

type Props = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  /** Drawn before the label, at label size. Only where it adds to the word. */
  icon?: IconName;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

const LABEL_TONE: Readonly<Record<ButtonTone, IconTone>> = {
  primary: 'onInverse',
  quiet: 'text',
  ghost: 'muted',
  contrast: 'onInverse',
};

export function ActionButton({
  label,
  onPress,
  tone = 'primary',
  icon,
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
        style={({pressed}) => [
          styles.button,
          styles[tone],
          pressed && styles[`${tone}Pressed`],
          disabled && styles.disabled,
        ]}
        testID={testID}>
        {icon === undefined ? null : (
          <View style={styles.icon}>
            <Icon name={icon} size={16} tone={LABEL_TONE[tone]} />
          </View>
        )}
        <Text style={[styles.label, styles[`${tone}Label`]]}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGET,
      paddingHorizontal: space.lg,
      borderRadius: radius.control,
    },
    primary: {
      backgroundColor: theme.palette.inverse,
    },
    primaryPressed: {
      opacity: 0.85,
    },
    quiet: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      backgroundColor: theme.palette.surface,
    },
    quietPressed: {
      backgroundColor: theme.palette.surfaceStrong,
    },
    ghost: {
      paddingHorizontal: space.md,
    },
    ghostPressed: {
      backgroundColor: theme.palette.surface,
    },
    contrast: {
      backgroundColor: theme.palette.onInverse,
      paddingHorizontal: space.md,
    },
    contrastPressed: {
      opacity: 0.85,
    },
    disabled: {
      opacity: 0.35,
    },
    icon: {
      marginRight: space.xs,
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
    ghostLabel: {
      color: theme.palette.muted,
    },
    contrastLabel: {
      color: theme.palette.inverse,
    },
  });
}
