import React, {useMemo} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import {ActionButton} from './ActionButton';

type Props = {
  value: string;
  placeholder: string;
  sendLabel: string;
  stopLabel: string;
  streaming: boolean;
  canSend: boolean;
  onChangeText: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
};

/**
 * The composer exists now, and only now: Phase 1 deliberately drew no input box, because
 * there was nothing behind it. While a stream is running the same corner offers Stop, so
 * the action the user needs is always the one under their thumb.
 */
export function Composer({
  value,
  placeholder,
  sendLabel,
  stopLabel,
  streaming,
  canSend,
  onChangeText,
  onSend,
  onStop,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.composer}>
      <TextInput
        accessibilityLabel={placeholder}
        editable={!streaming}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.palette.muted}
        style={styles.input}
        testID="composer-input"
        value={value}
      />
      {streaming ? (
        <ActionButton
          label={stopLabel}
          onPress={onStop}
          testID="composer-stop"
          tone="quiet"
        />
      ) : (
        <ActionButton
          disabled={!canSend}
          label={sendLabel}
          onPress={onSend}
          testID="composer-send"
        />
      )}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
    },
    input: {
      ...typography.body,
      color: theme.palette.text,
      flex: 1,
      maxHeight: 132,
      marginRight: space.sm,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      borderRadius: radius.sheet,
      backgroundColor: theme.palette.surface,
    },
  });
}
