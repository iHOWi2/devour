import React, {useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {
  MAX_FONT_SCALE,
  TOUCH_TARGET,
  radius,
  space,
  typography,
} from '../design/tokens';
import {useI18n} from '../i18n';
import type {InlineSpan, MarkdownBlock} from '../lib/markdown';
import {parseMarkdown} from '../lib/markdown';
import {CopyAction} from './CopyAction';

type Props = {
  text: string;
  /** Present only when the device can actually copy; see src/native/clipboard.ts. */
  onCopyCode?: (code: string) => Promise<void>;
};

/**
 * How many lines of a finished listing are shown before it is folded.
 *
 * A model asked for a file happily answers with two hundred lines, and on a phone that is
 * three screens of scrolling between one sentence and the next. Fourteen lines is about
 * half a screen: enough to recognise the code and decide, and the rest is one tap away.
 */
const CODE_PREVIEW_LINES = 14;

/**
 * Renders the blocks the streaming parser produced.
 *
 * A code block is the one place this interface draws a container: machine text needs an
 * edge, a name and a way out of the app. Its header carries the language the model named
 * and the copy action, long lines scroll sideways rather than wrapping into porridge, and a
 * long listing is folded down to a preview with the line count on the button that opens it.
 */
export function Markdown({text, onCopyCode}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseMarkdown(text), [text]);

  return (
    <View>
      {blocks.map((block, index) => (
        <Block
          block={block}
          key={index}
          onCopyCode={onCopyCode}
          styles={styles}
        />
      ))}
    </View>
  );
}

type Styles = ReturnType<typeof createStyles>;

function Spans({spans, styles}: {spans: InlineSpan[]; styles: Styles}) {
  return (
    <>
      {spans.map((span, index) => (
        <Text
          key={index}
          maxFontSizeMultiplier={
            span.code === true ? MAX_FONT_SCALE : undefined
          }
          style={[
            span.code === true && styles.inlineCode,
            span.bold === true && styles.bold,
            span.italic === true && styles.italic,
            span.link !== undefined && styles.link,
          ]}>
          {span.text}
        </Text>
      ))}
    </>
  );
}

type BlockProps = {
  block: MarkdownBlock;
  styles: Styles;
  onCopyCode?: (code: string) => Promise<void>;
};

function Block({block, styles, onCopyCode}: BlockProps) {
  switch (block.type) {
    case 'paragraph':
      return (
        <Text style={styles.paragraph}>
          <Spans spans={block.spans} styles={styles} />
        </Text>
      );

    case 'heading':
      return (
        <Text
          style={[styles.heading, block.level === 1 && styles.headingStrong]}>
          <Spans spans={block.spans} styles={styles} />
        </Text>
      );

    case 'quote':
      return (
        <View style={styles.quote}>
          <Text style={styles.quoteText}>
            <Spans spans={block.spans} styles={styles} />
          </Text>
        </View>
      );

    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text
                style={[styles.bullet, block.ordered && styles.bulletOrdered]}>
                {block.ordered ? `${index + 1}.` : '\u2022'}
              </Text>
              <Text style={styles.listText}>
                <Spans spans={item} styles={styles} />
              </Text>
            </View>
          ))}
        </View>
      );

    case 'code':
      return (
        <CodeBlock block={block} onCopyCode={onCopyCode} styles={styles} />
      );

    case 'rule':
      return <View style={styles.rule} />;
  }
}

type CodeProps = {
  block: Extract<MarkdownBlock, {type: 'code'}>;
  styles: Styles;
  onCopyCode?: (code: string) => Promise<void>;
};

function CodeBlock({block, styles, onCopyCode}: CodeProps) {
  const {t, plural} = useI18n();
  const [expanded, setExpanded] = useState(false);
  const lines = useMemo(() => block.code.split('\n'), [block.code]);

  // A block that is still arriving is never folded: the user is watching it be written,
  // and a preview that swallows the newest line would hide exactly what they are watching.
  const foldable = block.closed && lines.length > CODE_PREVIEW_LINES;
  const shown =
    foldable && !expanded
      ? lines.slice(0, CODE_PREVIEW_LINES).join('\n')
      : block.code;

  return (
    <View style={styles.code}>
      <View style={styles.codeHeader}>
        <Text style={styles.codeLanguage}>
          {block.language ?? t('code.unnamed')}
        </Text>
        {onCopyCode === undefined ? null : (
          <CopyAction
            copiedLabel={t('chat.copied')}
            label={t('chat.copy')}
            onCopy={() => onCopyCode(block.code)}
            testID="copy-code"
          />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.codeContent}
        horizontal
        showsHorizontalScrollIndicator={false}>
        <Text maxFontSizeMultiplier={MAX_FONT_SCALE} style={styles.codeText}>
          {shown}
        </Text>
      </ScrollView>

      {foldable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{expanded}}
          onPress={() => setExpanded(current => !current)}
          style={({pressed}) => [styles.codeFold, pressed && styles.pressed]}
          testID="code-fold">
          <Text style={styles.codeFoldLabel}>
            {expanded ? t('code.fold') : plural('code.lines', lines.length)}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    paragraph: {
      ...typography.body,
      color: theme.palette.text,
      marginTop: space.sm,
    },
    heading: {
      ...typography.heading,
      color: theme.palette.text,
      marginTop: space.lg,
    },
    headingStrong: {
      ...typography.title,
      color: theme.palette.text,
    },
    bold: {
      fontWeight: '700',
    },
    italic: {
      fontStyle: 'italic',
    },
    link: {
      textDecorationLine: 'underline',
    },
    inlineCode: {
      ...typography.mono,
      color: theme.palette.text,
    },
    quote: {
      marginTop: space.md,
      paddingLeft: space.md,
      borderLeftWidth: 2,
      borderLeftColor: theme.palette.edge,
    },
    quoteText: {
      ...typography.body,
      color: theme.palette.muted,
    },
    list: {
      marginTop: space.sm,
    },
    listItem: {
      flexDirection: 'row',
      marginTop: space.xs,
    },
    // A marker column wide enough for "10." leaves a dot floating half a word away from
    // its own line, which is what it looked like on a device with a large system font.
    bullet: {
      ...typography.body,
      color: theme.palette.faint,
      width: 16,
    },
    bulletOrdered: {
      width: 24,
    },
    listText: {
      ...typography.body,
      color: theme.palette.text,
      flex: 1,
    },
    code: {
      marginTop: space.md,
      borderRadius: radius.control,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      backgroundColor: theme.palette.surface,
      overflow: 'hidden',
    },
    codeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: space.xl,
      paddingLeft: space.md,
      paddingRight: space.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.palette.edge,
    },
    codeLanguage: {
      ...typography.caption,
      color: theme.palette.faint,
    },
    codeContent: {
      padding: space.md,
    },
    codeText: {
      ...typography.mono,
      color: theme.palette.text,
    },
    codeFold: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: TOUCH_TARGET,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
    pressed: {
      backgroundColor: theme.palette.surfaceStrong,
    },
    codeFoldLabel: {
      ...typography.label,
      color: theme.palette.muted,
    },
    rule: {
      marginVertical: space.lg,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.palette.edge,
    },
  });
}
