import React, {useMemo} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

import {useEntrance} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';
import {ActionButton} from './ActionButton';

type Props = {
  title: string;
  body: string;
  action?: {label: string; onPress: () => void; testID?: string};
  testID?: string;
};

/**
 * The screen before anything has happened on it.
 *
 * This is where the one large type size in the application is spent: an empty chat is the
 * first thing anyone sees, and a centred grey paragraph would be an apology. The three
 * parts arrive in sequence - 0, 70, 140 ms - so the eye is led from the statement to the
 * explanation to the button, and the whole cascade is over well inside half a second.
 */
export function EmptyState({title, body, action, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const first = useEntrance();
  const second = useEntrance({delay: 70});
  const third = useEntrance({delay: 140});

  return (
    <View style={styles.block} testID={testID}>
      <Animated.Text style={[styles.title, first]}>{title}</Animated.Text>
      <Animated.Text style={[styles.body, second]}>{body}</Animated.Text>
      {action === undefined ? null : (
        <Animated.View style={[styles.action, third]}>
          <ActionButton
            label={action.label}
            onPress={action.onPress}
            testID={action.testID}
          />
        </Animated.View>
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      flex: 1,
      justifyContent: 'flex-end',
      paddingBottom: space.lg,
    },
    title: {
      ...typography.display,
      color: theme.palette.text,
      maxWidth: 440,
    },
    body: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.md,
      maxWidth: 440,
    },
    action: {
      alignSelf: 'flex-start',
      marginTop: space.xl,
    },
  });
}
