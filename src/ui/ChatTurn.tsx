import React, {useMemo} from 'react';
import {Animated, StyleSheet, Text, View} from 'react-native';

import type {Message} from '../agent';
import {useEntrance} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import {Caret} from './Caret';
import {CopyAction} from './CopyAction';
import {Markdown} from './Markdown';
import {ActionButton} from './ActionButton';

type Props = {
  message: Message;
  /** Copying is offered only when the device can actually do it. */
  onCopy?: (text: string) => Promise<void>;
  /** Present on the last agent turn: ask the same question again. */
  onRegenerate?: () => void;
};

/**
 * One turn in the flow.
 *
 * The user's words sit in a raised block, right aligned and narrower than the screen; the
 * agent's answer sits directly on the page at full width. Two shapes, no bubbles with
 * tails, no avatars, no name labels - who spoke is obvious from where the text is.
 *
 * While an answer is arriving a block caret pulses at the end of it. A turn that was
 * stopped keeps what arrived and says it was stopped, because a truncated answer with no
 * explanation looks like a bug.
 */
export function ChatTurn({message, onCopy, onRegenerate}: Props) {
  const theme = useTheme();
  const {t} = useI18n();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const entrance = useEntrance({key: message.id});
  const mine = message.role === 'user';
  const streaming = message.status === 'streaming';
  const empty = message.text.length === 0;

  return (
    <Animated.View
      accessibilityLabel={t(mine ? 'chat.turn.user' : 'chat.turn.agent')}
      style={[styles.turn, mine ? styles.mine : styles.theirs, entrance]}
      testID={`turn-${message.id}`}>
      {mine ? (
        <Text style={styles.userText}>{message.text}</Text>
      ) : (
        <View>
          <Markdown
            copiedLabel={t('chat.copied')}
            copyLabel={t('chat.copy')}
            onCopyCode={onCopy}
            text={message.text}
          />
          {streaming ? (
            <View
              accessibilityLabel={t('chat.streaming')}
              style={styles.caretRow}>
              {empty ? (
                <Text style={styles.note}>{t('chat.waiting')}</Text>
              ) : null}
              <Caret testID="chat-caret" />
            </View>
          ) : null}
        </View>
      )}

      {message.status === 'cancelled' ? (
        <Text style={styles.note}>{t('chat.stopped')}</Text>
      ) : null}

      {!mine &&
      !streaming &&
      (onCopy !== undefined || onRegenerate !== undefined) ? (
        <View style={styles.actions}>
          {onCopy === undefined || empty ? null : (
            <CopyAction
              copiedLabel={t('chat.copied')}
              label={t('chat.copy')}
              onCopy={() => onCopy(message.text)}
              testID="copy-turn"
            />
          )}
          {onRegenerate === undefined ? null : (
            <ActionButton
              label={t('chat.regenerate')}
              onPress={onRegenerate}
              testID="chat-regenerate"
              tone="plain"
            />
          )}
        </View>
      ) : null}
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    turn: {
      marginTop: space.xl,
    },
    mine: {
      alignSelf: 'flex-end',
      maxWidth: '86%',
      paddingHorizontal: space.lg,
      paddingVertical: space.md,
      borderRadius: radius.block,
      borderBottomRightRadius: space.xs,
      backgroundColor: theme.palette.surface,
    },
    theirs: {
      alignSelf: 'stretch',
    },
    userText: {
      ...typography.body,
      color: theme.palette.text,
    },
    caretRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    note: {
      ...typography.caption,
      color: theme.palette.faint,
      marginRight: space.sm,
      marginTop: space.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: space.xs,
      marginLeft: -space.md,
    },
  });
}
