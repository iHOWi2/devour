import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

type Props = {
  label: string;
  /** What pressing this actually does, when that is not obvious from the label. */
  description?: string;
  /** The current value, if the row shows one. Machine text, so monospaced. */
  value?: string;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
};

/**
 * A row you can press: clear the conversation, forget the key.
 *
 * The press is answered by the row filling in rather than by the row shrinking - a
 * full-width block that scales looks like the screen flexed. Nothing here is red: a row
 * that destroys something says what it destroys, and the confirmation is the action's own
 * result line.
 */
export function SettingRow({
  label,
  description,
  value,
  onPress,
  disabled = false,
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const body = (
    <>
      <View style={styles.text}>
        <Text style={[styles.label, disabled && styles.dim]}>{label}</Text>
        {description === undefined ? null : (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      {value === undefined ? null : <Text style={styles.value}>{value}</Text>}
      {onPress === undefined ? null : (
        <Text style={[styles.chevron, disabled && styles.dim]}>›</Text>
      )}
    </>
  );

  if (onPress === undefined) {
    return <View style={styles.row}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && styles.pressed]}
      testID={testID}>
      {body}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: TOUCH_TARGET,
      paddingVertical: space.md,
      paddingHorizontal: space.md,
      marginHorizontal: -space.md,
      borderRadius: radius.control,
    },
    pressed: {
      backgroundColor: theme.palette.surface,
    },
    text: {
      flex: 1,
      paddingRight: space.md,
    },
    label: {
      ...typography.body,
      color: theme.palette.text,
    },
    description: {
      ...typography.caption,
      color: theme.palette.muted,
      marginTop: 2,
    },
    value: {
      ...typography.mono,
      color: theme.palette.muted,
    },
    chevron: {
      ...typography.title,
      color: theme.palette.faint,
      marginLeft: space.sm,
    },
    dim: {
      color: theme.palette.faint,
    },
  });
}
