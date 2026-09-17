import React, {useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import type {Message} from '../agent';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import {Markdown} from './Markdown';

type Props = {
  message: Message;
};

/**
 * One turn in the flow.
 *
 * The user's words sit on a raised surface, the agent's answer sits directly on the
 * chassis: two shapes, no bubbles with tails, no avatars. A turn that was stopped keeps
 * whatever text arrived and says it was stopped, because a truncated answer with no
 * explanation looks like a bug.
 */
export function ChatTurn({message}: Props) {
  const theme = useTheme();
  const {t} = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const mine = message.role === 'user';

  return (
    <View
      accessibilityLabel={t(mine ? 'chat.turn.user' : 'chat.turn.agent')}
      style={[styles.turn, mine ? styles.mine : styles.theirs]}
      testID={`turn-${message.id}`}>
      {mine ? (
        <Text style={styles.userText}>{message.text}</Text>
      ) : (
        <Markdown text={message.text} />
      )}

      {!mine && message.status === 'streaming' && message.text.length === 0 ? (
        <Text style={styles.note}>{t('chat.waiting')}</Text>
      ) : null}

      {message.status === 'cancelled' ? (
        <Text style={styles.note}>{t('chat.stopped')}</Text>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    turn: {
      marginTop: space.lg,
    },
    mine: {
      alignSelf: 'flex-end',
      maxWidth: '88%',
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: radius.sheet,
      backgroundColor: theme.palette.surface,
    },
    theirs: {
      alignSelf: 'stretch',
    },
    userText: {
      ...typography.body,
      color: theme.palette.text,
    },
    note: {
      ...typography.label,
      color: theme.palette.muted,
      marginTop: space.xs,
    },
  });
}
