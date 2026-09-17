import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type {ScrollViewInstance} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

import {useAgent} from '../agent';
import type {AgentErrorCode} from '../agent';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space, typography} from '../design/tokens';
import {useI18n} from '../i18n';
import type {MessageKey} from '../i18n';
import {ActionButton} from '../ui/ActionButton';
import {ChatTurn} from '../ui/ChatTurn';
import {Composer} from '../ui/Composer';
import {PhaseMark} from '../ui/PhaseMark';
import {ScreenHeader} from '../ui/ScreenHeader';
import {StateLine} from '../ui/StateLine';

/**
 * Phase 2 screen: the conversation.
 *
 * Everything on it is real. The composer sends to a configured endpoint; the accent line
 * appears only while a stream is running; Stop actually cancels the request; a failure
 * shows what the endpoint said and offers the retry that repeats it. When no endpoint is
 * configured the screen says so instead of pretending to be a chat.
 *
 * Tool cards, permission prompts and diffs belong to Phases 5 and 9, so nothing here
 * pre-draws them.
 */
type Props = {
  onOpenSystem: () => void;
};

const FAILURE_MESSAGES: Readonly<Record<AgentErrorCode, MessageKey>> = {
  'provider.unconfigured': 'error.provider.unconfigured',
  'provider.unauthorized': 'error.provider.unauthorized',
  'provider.http': 'error.provider.http',
  'provider.network': 'error.provider.network',
  'provider.response': 'error.provider.response',
};

export function ChatScreen({onOpenSystem}: Props) {
  const theme = useTheme();
  const {t} = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const {state, configured, send, cancel, retry, reset} = useAgent();
  const [draft, setDraft] = useState('');
  const scroll = useRef<ScrollViewInstance | null>(null);

  const {conversation, failure, persistence, status} = state;
  const streaming = status === 'streaming';
  const trimmed = draft.trim();

  const submit = useCallback(() => {
    if (trimmed.length === 0 || streaming) {
      return;
    }

    setDraft('');
    send(trimmed);
  }, [send, streaming, trimmed]);

  const actions = [
    ...(conversation.messages.length > 0
      ? [{label: t('chat.new'), onPress: reset, testID: 'chat-new'}]
      : []),
    {label: t('nav.system'), onPress: onOpenSystem, testID: 'open-system'},
  ];

  return (
    <View style={styles.screen} testID="chat-screen">
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.top}>
        <ScreenHeader actions={actions} />
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          onContentSizeChange={() =>
            scroll.current?.scrollToEnd({animated: true})
          }
          ref={scroll}>
          {conversation.messages.length === 0 ? (
            <View testID="chat-empty">
              <PhaseMark index="02" name={t('phase.chat')} />
              <Text style={styles.emptyBody}>
                {configured
                  ? t('chat.empty.ready')
                  : t('chat.empty.unconfigured')}
              </Text>
              {configured ? null : (
                <View style={styles.emptyAction}>
                  <ActionButton
                    label={t('chat.configure')}
                    onPress={onOpenSystem}
                    testID="chat-configure"
                  />
                </View>
              )}
            </View>
          ) : (
            conversation.messages.map(message => (
              <ChatTurn key={message.id} message={message} />
            ))
          )}
        </ScrollView>

        <View style={styles.status}>
          {streaming ? (
            <StateLine
              testID="chat-streaming"
              text={t('chat.streaming')}
              tone="accent"
            />
          ) : null}

          {!streaming && failure !== null ? (
            <StateLine
              action={
                failure.code === 'provider.unconfigured'
                  ? {
                      label: t('chat.configure'),
                      onPress: onOpenSystem,
                      testID: 'failure-configure',
                    }
                  : {
                      label: t('action.retry'),
                      onPress: retry,
                      testID: 'failure-retry',
                    }
              }
              detail={failure.detail}
              testID="chat-failure"
              text={t(FAILURE_MESSAGES[failure.code])}
              tone="danger"
            />
          ) : null}

          {persistence === 'unavailable' ? (
            <StateLine
              testID="chat-persistence"
              text={t('storage.unavailable')}
              tone="warn"
            />
          ) : null}
        </View>

        <View style={styles.composer}>
          <Composer
            canSend={trimmed.length > 0}
            onChangeText={setDraft}
            onSend={submit}
            onStop={cancel}
            placeholder={t('chat.placeholder')}
            sendLabel={t('chat.send')}
            stopLabel={t('chat.stop')}
            streaming={streaming}
            value={draft}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function createStyles(theme: Theme, insets: EdgeInsets) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: theme.palette.background,
    },
    top: {
      paddingTop: insets.top + space.md,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: space.lg,
      paddingTop: space.md,
      paddingBottom: space.lg,
      flexGrow: 1,
    },
    emptyBody: {
      ...typography.body,
      color: theme.palette.muted,
      marginTop: space.lg,
    },
    emptyAction: {
      alignSelf: 'flex-start',
      marginTop: space.lg,
    },
    status: {
      paddingHorizontal: space.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    composer: {
      paddingBottom: insets.bottom + space.sm,
    },
  });
}
