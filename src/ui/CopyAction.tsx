import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text} from 'react-native';

import {useSwap} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';
import {Icon} from './Icon';

type Props = {
  label: string;
  copiedLabel: string;
  onCopy: () => Promise<void>;
  testID?: string;
};

/** How long the confirmation stays, in milliseconds. */
const CONFIRMATION = 1600;

/**
 * Copy, and then say so - but only after the clipboard actually took the text.
 *
 * The confirmation is a tick swapping in where the copy icon was, which is the one place a
 * checkmark earns its space: it is the answer to a press that otherwise changes nothing on
 * screen. The label returns to its resting state after a moment, so the confirmation
 * cannot be mistaken for the button's name.
 */
export function CopyAction({label, copiedLabel, onCopy, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [copied, setCopied] = useState(false);
  const swap = useSwap(copied ? 'copied' : 'idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const press = useCallback(() => {
    onCopy()
      .then(() => {
        setCopied(true);

        if (timer.current !== null) {
          clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => setCopied(false), CONFIRMATION);
      })
      .catch(() => {
        // The clipboard refused. Saying "copied" then would be a lie.
        setCopied(false);
      });
  }, [onCopy]);

  return (
    <Pressable
      accessibilityLabel={copied ? copiedLabel : label}
      accessibilityRole="button"
      onPress={press}
      style={({pressed}) => [styles.button, pressed && styles.pressed]}
      testID={testID}>
      <Animated.View style={[styles.icon, swap]}>
        <Icon
          name={copied ? 'check' : 'copy'}
          size={16}
          tone={copied ? 'text' : 'muted'}
        />
      </Animated.View>
      <Text style={[styles.label, copied && styles.copied]}>
        {copied ? copiedLabel : label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: TOUCH_TARGET,
      paddingHorizontal: space.md,
      borderRadius: radius.control,
    },
    pressed: {
      backgroundColor: theme.palette.surface,
    },
    icon: {
      marginRight: space.xs,
    },
    label: {
      ...typography.caption,
      color: theme.palette.muted,
    },
    copied: {
      color: theme.palette.text,
    },
  });
}
