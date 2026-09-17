import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

export type ButtonTone = 'accent' | 'quiet';

type Props = {
  label: string;
  onPress: () => void;
  tone?: ButtonTone;
  disabled?: boolean;
  accessibilityLabel?: string;
  testID?: string;
};

/**
 * The one action a screen wants the user to take is `accent`; everything else is `quiet`.
 * Spending the accent on more than one control per screen is what makes it stop meaning
 * anything, so there is no third tone.
 */
export function ActionButton({
  label,
  onPress,
  tone = 'accent',
  disabled = false,
  accessibilityLabel,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        tone === 'accent' ? styles.accent : styles.quiet,
        disabled && styles.disabled,
      ]}
      testID={testID}>
      <Text
        style={[
          styles.label,
          tone === 'accent' ? styles.accentLabel : styles.quietLabel,
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.lg,
      borderRadius: radius.row,
    },
    accent: {
      backgroundColor: theme.palette.accent,
    },
    quiet: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
    },
    disabled: {
      opacity: 0.4,
    },
    label: {
      ...typography.label,
    },
    accentLabel: {
      color: theme.palette.onAccent,
    },
    quietLabel: {
      color: theme.palette.text,
    },
  });
}
