import React, {useMemo, useState} from 'react';
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
 *
 * Focus and rejection are both shown by the outline rather than by a hue: focus brightens
 * it, an invalid value doubles it. That is legible in either theme, and the reason is
 * spelled out in words underneath rather than implied by red.
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
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={theme.palette.faint}
        secureTextEntry={secure}
        spellCheck={false}
        style={[
          styles.input,
          focused && styles.inputFocused,
          invalid && styles.inputInvalid,
        ]}
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
      marginTop: space.lg,
    },
    label: {
      ...typography.caption,
      color: theme.palette.muted,
    },
    input: {
      ...typography.mono,
      color: theme.palette.text,
      minHeight: TOUCH_TARGET,
      marginTop: space.sm,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderWidth: 1,
      borderColor: theme.palette.edge,
      borderRadius: radius.control,
      backgroundColor: theme.palette.surface,
    },
    inputFocused: {
      borderColor: theme.palette.faint,
    },
    inputInvalid: {
      borderWidth: 2,
      borderColor: theme.palette.text,
    },
    hint: {
      ...typography.caption,
      color: theme.palette.faint,
      marginTop: space.sm,
    },
  });
}
