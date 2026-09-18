import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import type {InlineSpan, MarkdownBlock} from '../lib/markdown';
import {parseMarkdown} from '../lib/markdown';
import {CopyAction} from './CopyAction';

type Props = {
  text: string;
  /** Present only when the device can actually copy; see src/native/clipboard.ts. */
  onCopyCode?: (code: string) => Promise<void>;
  copyLabel?: string;
  copiedLabel?: string;
};

/**
 * Renders the blocks the streaming parser produced.
 *
 * A code block is the one place this interface draws a container: machine text needs an
 * edge, a name and a way out of the app. Its header carries the language the model named
 * and the copy action, and long lines scroll sideways rather than wrapping into porridge.
 */
export function Markdown({text, onCopyCode, copyLabel, copiedLabel}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseMarkdown(text), [text]);

  return (
    <View>
      {blocks.map((block, index) => (
        <Block
          block={block}
          copiedLabel={copiedLabel}
          copyLabel={copyLabel}
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
  copyLabel?: string;
  copiedLabel?: string;
};

function Block({
  block,
  styles,
  onCopyCode,
  copyLabel,
  copiedLabel,
}: BlockProps) {
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
              <Text style={styles.bullet}>
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
        <View style={styles.code}>
          <View style={styles.codeHeader}>
            <Text style={styles.codeLanguage}>{block.language ?? 'code'}</Text>
            {onCopyCode === undefined ||
            copyLabel === undefined ||
            copiedLabel === undefined ? null : (
              <CopyAction
                copiedLabel={copiedLabel}
                label={copyLabel}
                onCopy={() => onCopyCode(block.code)}
                testID="copy-code"
              />
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={styles.codeText}>{block.code}</Text>
          </ScrollView>
        </View>
      );

    case 'rule':
      return <View style={styles.rule} />;
  }
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
    bullet: {
      ...typography.body,
      color: theme.palette.faint,
      width: 22,
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
      paddingLeft: space.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.palette.edge,
    },
    codeLanguage: {
      ...typography.caption,
      color: theme.palette.faint,
    },
    codeText: {
      ...typography.mono,
      color: theme.palette.text,
      padding: space.md,
    },
    rule: {
      marginVertical: space.lg,
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.palette.edge,
    },
  });
}
