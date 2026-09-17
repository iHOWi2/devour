import React, {useMemo} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {radius, space, typography} from '../design/tokens';
import {parseMarkdown} from '../lib/markdown';
import type {InlineSpan, MarkdownBlock} from '../lib/markdown';

type Props = {
  text: string;
};

/**
 * Renders what a model actually writes: prose, fenced code, headings, lists, quotes.
 *
 * Code scrolls sideways instead of wrapping, because a wrapped command line is a lie about
 * where the line breaks are. Everything else follows the type scale: prose in the sans,
 * machine text in the mono, and no colour beyond the palette.
 */
export function Markdown({text}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const blocks = useMemo(() => parseMarkdown(text), [text]);

  return (
    <View>
      {blocks.map((block, index) => (
        <Block block={block} key={index} styles={styles} />
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

function Block({block, styles}: {block: MarkdownBlock; styles: Styles}) {
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
          {block.language === null ? null : (
            <Text style={styles.codeLanguage}>{block.language}</Text>
          )}
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
      ...typography.body,
      fontWeight: '600',
      color: theme.palette.text,
      marginTop: space.md,
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
      marginTop: space.sm,
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
      color: theme.palette.muted,
      width: 24,
    },
    listText: {
      ...typography.body,
      color: theme.palette.text,
      flex: 1,
    },
    code: {
      marginTop: space.md,
      padding: space.md,
      borderRadius: radius.sheet,
      backgroundColor: theme.palette.surface,
    },
    codeLanguage: {
      ...typography.label,
      color: theme.palette.muted,
      marginBottom: space.xs,
    },
    codeText: {
      ...typography.mono,
      color: theme.palette.text,
    },
    rule: {
      marginTop: space.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.palette.edge,
    },
  });
}
