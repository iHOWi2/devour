import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollViewInstance,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import type {EdgeInsets} from 'react-native-safe-area-context';

import {useAgent} from '../agent';
import type {AgentErrorCode} from '../agent';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {space} from '../design/tokens';
import {useI18n} from '../i18n';
import type {MessageKey} from '../i18n';
import {copyToClipboard, isClipboardAvailable} from '../native';
import {ChatTurn} from '../ui/ChatTurn';
import {Composer} from '../ui/Composer';
import {EmptyState} from '../ui/EmptyState';
import {ScreenHeader} from '../ui/ScreenHeader';
import {ScrollPill} from '../ui/ScrollPill';
import {StateLine} from '../ui/StateLine';

/**
 * The conversation.
 *
 * Everything on it is real. The composer sends to a configured endpoint, a caret pulses at
 * the end of the answer while it arrives, Stop actually cancels the request, and a failure
 * shows what the endpoint said next to the retry that repeats it. When no endpoint is
 * configured the screen says so instead of pretending to be a chat.
 *
 * The page follows the stream only while the reader is already at the bottom. Scrolling up
 * to re-read something is a decision, and an interface that drags the page back down
 * mid-sentence is fighting its user; the pill is the way back when they want it.
 *
 * Tool cards, permission prompts and diffs belong to Phases 5 and 9, so nothing here
 * pre-draws them.
 */
type Props = {
  onOpenSettings: () => void;
};

const FAILURE_MESSAGES: Readonly<Record<AgentErrorCode, MessageKey>> = {
  'provider.unconfigured': 'error.provider.unconfigured',
  'provider.unauthorized': 'error.provider.unauthorized',
  'provider.http': 'error.provider.http',
  'provider.network': 'error.provider.network',
  'provider.response': 'error.provider.response',
};

/** How far from the bottom still counts as "reading the newest turn", in pixels. */
const BOTTOM_SLACK = 32;

export function ChatScreen({onOpenSettings}: Props) {
  const theme = useTheme();
  const {t} = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const {state, settings, configured, send, cancel, retry, regenerate, reset} =
    useAgent();
  const [draft, setDraft] = useState('');
  const [adrift, setAdrift] = useState(false);
  const scroll = useRef<ScrollViewInstance | null>(null);
  const following = useRef(true);

  const {conversation, failure, persistence, status} = state;
  const streaming = status === 'streaming';
  const trimmed = draft.trim();
  const messages = conversation.messages;

  // Copying is a capability, not a convenience: a build whose native module is missing hides
  // the action instead of offering a button that quietly does nothing.
  const copy = useMemo(
    () => (isClipboardAvailable() ? copyToClipboard : undefined),
    [],
  );

  const follow = useCallback(() => {
    following.current = true;
    setAdrift(false);
    scroll.current?.scrollToEnd({animated: true});
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
      const fromBottom =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      const atBottom = fromBottom <= BOTTOM_SLACK;

      following.current = atBottom;
      setAdrift(!atBottom);
    },
    [],
  );

  const onContentSizeChange = useCallback(() => {
    if (following.current) {
      scroll.current?.scrollToEnd({animated: true});
    }
  }, []);

  const submit = useCallback(() => {
    if (trimmed.length === 0 || streaming) {
      return;
    }

    setDraft('');
    follow();
    send(trimmed);
  }, [follow, send, streaming, trimmed]);

  const lastMessage = messages[messages.length - 1];

  const actions = [
    ...(messages.length > 0
      ? [{label: t('chat.new'), onPress: reset, testID: 'chat-new'}]
      : []),
    {label: t('nav.settings'), onPress: onOpenSettings, testID: 'open-system'},
  ];

  return (
    <View style={styles.screen} testID="chat-screen">
      <StatusBar barStyle={theme.statusBarStyle} />
      <View style={styles.top}>
        <ScreenHeader
          actions={actions}
          subtitle={configured ? settings.model : t('chat.noModel')}
          title={t('app.name')}
        />
      </View>

      <KeyboardAvoidingView behavior="padding" style={styles.body}>
        <View style={styles.list}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardDismissMode="interactive"
            onContentSizeChange={onContentSizeChange}
            onScroll={onScroll}
            ref={scroll}
            scrollEventThrottle={32}>
            {messages.length === 0 ? (
              <EmptyState
                action={
                  configured
                    ? undefined
                    : {
                        label: t('chat.configure'),
                        onPress: onOpenSettings,
                        testID: 'chat-configure',
                      }
                }
                body={
                  configured
                    ? t('chat.empty.ready')
                    : t('chat.empty.unconfigured')
                }
                testID="chat-empty"
                title={
                  configured
                    ? t('chat.empty.title')
                    : t('chat.empty.title.unconfigured')
                }
              />
            ) : (
              messages.map(message => (
                <ChatTurn
                  key={message.id}
                  message={message}
                  onCopy={copy}
                  onRegenerate={
                    !streaming &&
                    message.id === lastMessage?.id &&
                    message.role === 'assistant'
                      ? regenerate
                      : undefined
                  }
                />
              ))
            )}
          </ScrollView>

          <ScrollPill
            label={t('chat.newest')}
            onPress={follow}
            testID="chat-newest"
            visible={adrift && messages.length > 0}
          />
        </View>

        {!streaming && failure !== null ? (
          <View style={styles.line}>
            <StateLine
              action={
                failure.code === 'provider.unconfigured'
                  ? {
                      label: t('chat.configure'),
                      onPress: onOpenSettings,
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
              tone="alert"
            />
          </View>
        ) : null}

        {persistence === 'unavailable' ? (
          <View style={styles.line}>
            <StateLine
              testID="chat-persistence"
              text={t('storage.unavailable')}
              tone="quiet"
            />
          </View>
        ) : null}

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
      paddingTop: insets.top + space.sm,
    },
    body: {
      flex: 1,
    },
    content: {
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
      paddingBottom: space.lg,
      flexGrow: 1,
    },
    // The list owns the space the pill floats in, so the pill never displaces a turn.
    list: {
      flex: 1,
    },
    line: {
      paddingHorizontal: space.lg,
      paddingTop: space.sm,
    },
    composer: {
      paddingBottom: insets.bottom + space.sm,
    },
  });
}
