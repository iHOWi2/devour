import React, {useMemo} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import {useEntrance} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {MAX_FONT_SCALE, radius, space, typography} from '../design/tokens';
import {ActionButton} from './ActionButton';

/**
 * What went wrong, or what the build cannot do, as one line the user can act on.
 *
 * `alert` inverts: black on white in the dark theme, white on black in the light one. In a
 * monochrome interface that is the loudest thing available, which is what a failure
 * deserves, and it stays unmistakable for anyone who cannot tell red from amber. `quiet` is
 * for a limitation the user should know about but does not have to fix now.
 */
export type StateTone = 'alert' | 'quiet';

type Props = {
  tone: StateTone;
  text: string;
  /** The endpoint's own words, if it said anything. Machine text, so monospaced. */
  detail?: string | null;
  action?: {label: string; onPress: () => void; testID?: string};
  testID?: string;
};

export function StateLine({tone, text, detail, action, testID}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const entrance = useEntrance({distance: 6});
  const alert = tone === 'alert';

  return (
    <Animated.View
      style={[styles.line, alert ? styles.alert : styles.quiet, entrance]}
      testID={testID}>
      <View style={styles.body}>
        <Text style={[styles.text, alert ? styles.onAlert : styles.onQuiet]}>
          {text}
        </Text>
        {detail === undefined || detail === null ? null : (
          <Text
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            style={[styles.detail, alert ? styles.onAlert : styles.onQuiet]}>
            {detail}
          </Text>
        )}
      </View>
      {action === undefined ? null : (
        <View style={styles.action}>
          <ActionButton
            label={action.label}
            onPress={action.onPress}
            testID={action.testID}
            tone={alert ? 'contrast' : 'quiet'}
          />
        </View>
      )}
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    line: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: space.sm,
      paddingHorizontal: space.md,
      borderRadius: radius.control,
    },
    alert: {
      backgroundColor: theme.palette.inverse,
    },
    quiet: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
    },
    body: {
      flex: 1,
      paddingRight: space.sm,
    },
    action: {
      marginLeft: space.xs,
    },
    text: {
      ...typography.label,
    },
    detail: {
      ...typography.mono,
      marginTop: 2,
    },
    onAlert: {
      color: theme.palette.onInverse,
    },
    onQuiet: {
      color: theme.palette.muted,
    },
  });
}
