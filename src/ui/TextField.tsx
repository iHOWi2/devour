import React, {useMemo} from 'react';
import {StyleSheet, Text, TextInput, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  hint?: string;
  secure?: boolean;
  invalid?: boolean;
  keyboardType?: 'default' | 'url';
  testID?: string;
};

/**
 * One line of machine data the user types: an endpoint, a model name, a key. Monospaced,
 * because that is what the value is, with autocorrect and capitalisation off - a keyboard
 * that "fixes" a URL is a support ticket waiting to happen.
 */
export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  hint,
  secure = false,
  invalid = false,
  keyboardType = 'default',
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.palette.muted}
        secureTextEntry={secure}
        spellCheck={false}
        style={[styles.input, invalid && styles.inputInvalid]}
        testID={testID}
        value={value}
      />
      {hint === undefined ? null : <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    field: {
      marginTop: space.md,
    },
    label: {
      ...typography.label,
      color: theme.palette.muted,
    },
    input: {
      ...typography.mono,
      color: theme.palette.text,
      minHeight: TOUCH_TARGET,
      marginTop: space.xs,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      borderRadius: radius.row,
      backgroundColor: theme.palette.surface,
    },
    inputInvalid: {
      borderColor: theme.palette.danger,
    },
    hint: {
      ...typography.label,
      color: theme.palette.muted,
      marginTop: space.xs,
    },
  });
}
