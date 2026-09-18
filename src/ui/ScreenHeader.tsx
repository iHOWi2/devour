import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';
import {ActionButton} from './ActionButton';

export type HeaderAction = {
  label: string;
  onPress: () => void;
  testID?: string;
};

type Props = {
  title: string;
  /** What this screen is pointed at right now: the model in use, a version. */
  subtitle?: string | null;
  actions?: ReadonlyArray<HeaderAction>;
};

/**
 * Where you are, what it is pointed at, and the way out.
 *
 * Header actions are text only on purpose. The one filled control on a screen belongs to
 * the thing the screen is for - sending a message, saving the endpoint - and a header full
 * of buttons competes with it.
 */
export function ScreenHeader({title, subtitle, actions = []}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.header}>
      <View style={styles.titles}>
        <Text style={styles.title}>{title}</Text>
        {subtitle === undefined || subtitle === null ? null : (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.actions}>
        {actions.map(action => (
          <ActionButton
            key={action.label}
            label={action.label}
            onPress={action.onPress}
            testID={action.testID}
            tone="plain"
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: space.lg,
      paddingRight: space.xs,
      paddingBottom: space.sm,
    },
    titles: {
      flex: 1,
      paddingRight: space.sm,
    },
    title: {
      ...typography.title,
      color: theme.palette.text,
    },
    subtitle: {
      ...typography.caption,
      color: theme.palette.muted,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });
}
