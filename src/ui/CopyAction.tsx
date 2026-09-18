import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, space, typography} from '../design/tokens';

type Props = {
  label: string;
  copiedLabel: string;
  onCopy: () => Promise<void>;
  testID?: string;
};

/**
 * Copy, and then say so - but only after the clipboard actually took the text. The label
 * returns to its resting state after a moment, so the confirmation cannot be mistaken for
 * the button's name.
 */
export function CopyAction({label, copiedLabel, onCopy, testID}: Props) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [copied, setCopied] = useState(false);
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

        timer.current = setTimeout(() => setCopied(false), 1600);
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
      style={styles.button}
      testID={testID}>
      <Text style={styles.label}>{copied ? copiedLabel : label}</Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      minHeight: TOUCH_TARGET,
      justifyContent: 'center',
      paddingHorizontal: space.md,
    },
    label: {
      ...typography.caption,
      color: theme.palette.muted,
    },
  });
}
