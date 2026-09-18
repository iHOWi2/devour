import React, {useMemo} from 'react';
import {StyleSheet, TextInput, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import {RoundAction} from './RoundAction';

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
 * One rounded field with one round control.
 *
 * The control does not move between states: while a stream runs the same circle stops it,
 * so the thing under the thumb is always the thing the user needs. The field keeps taking
 * text during a stream - typing the next question while reading the answer is normal - and
 * sending is what waits.
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
      <View style={styles.field}>
        <TextInput
          accessibilityLabel={placeholder}
          multiline
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.palette.faint}
          style={styles.input}
          testID="composer-input"
          value={value}
        />
      </View>
      {streaming ? (
        <RoundAction
          glyph="stop"
          label={stopLabel}
          onPress={onStop}
          testID="composer-stop"
        />
      ) : (
        <RoundAction
          disabled={!canSend}
          glyph="send"
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
    field: {
      flex: 1,
      marginRight: space.sm,
      borderRadius: radius.block,
      backgroundColor: theme.palette.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      justifyContent: 'center',
      minHeight: 44,
    },
    input: {
      ...typography.body,
      color: theme.palette.text,
      maxHeight: 148,
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
      paddingBottom: space.sm,
    },
  });
}
