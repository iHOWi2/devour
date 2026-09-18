/**
 * A small Markdown reader for streamed model output.
 *
 * Why not a library: the renderer has to work on partial text. While a fenced block is
 * still arriving there is no closing fence, and a parser that waits for one shows nothing
 * for several seconds. This one returns an open code block instead, so the code appears as
 * it is written. It covers what models actually emit - paragraphs, fenced code, headings,
 * lists, quotes, inline code, emphasis and links - and treats anything else as text.
 *
 * It is a pure function over a string, which is what makes it testable without a renderer.
 */
export type InlineSpan = {
  text: string;
  code?: boolean;
  bold?: boolean;
  italic?: boolean;
  link?: string;
};

export type MarkdownBlock =
  | {type: 'paragraph'; spans: InlineSpan[]}
  | {type: 'heading'; level: 1 | 2 | 3; spans: InlineSpan[]}
  | {type: 'code'; language: string | null; code: string; closed: boolean}
  | {type: 'list'; ordered: boolean; items: InlineSpan[][]}
  | {type: 'quote'; spans: InlineSpan[]}
  | {type: 'rule'};

/**
 * Emphasis is matched without lookbehind on purpose: Hermes is not the place to rely on
 * regular expression features. The first and last characters of an emphasised run must not
 * be whitespace, which is what keeps `2 * 3 * 4` out of italics.
 */
const INLINE_PATTERN = new RegExp(
  [
    '(`+)([^`]+?)\\1',
    '\\*\\*([^\\s*](?:[^*]*?[^\\s*])?)\\*\\*',
    '__([^\\s_](?:[^_]*?[^\\s_])?)__',
    '\\*([^\\s*](?:[^*\\n]*?[^\\s*])?)\\*',
    '_([^\\s_](?:[^_\\n]*?[^\\s_])?)_',
    '\\[([^\\]\\n]+)\\]\\(([^)\\s]+)\\)',
  ].join('|'),
  'g',
);

const FENCE = /^\s*(`{3,}|~{3,})\s*([A-Za-z0-9_+.-]*)\s*$/;
const HEADING = /^(#{1,3})\s+(.+?)\s*$/;
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const UNORDERED = /^\s*[-*+]\s+(.+)$/;
const ORDERED = /^\s*\d+[.)]\s+(.+)$/;

export function parseInline(text: string): InlineSpan[] {
  const spans: InlineSpan[] = [];
  let index = 0;

  const push = (span: InlineSpan) => {
    if (span.text.length > 0) {
      spans.push(span);
    }
  };

  INLINE_PATTERN.lastIndex = 0;

  let match = INLINE_PATTERN.exec(text);

  while (match !== null) {
    push({text: text.slice(index, match.index)});

    const [
      ,
      ,
      code,
      boldStars,
      boldUnderscores,
      italicStar,
      italicUnderscore,
      linkLabel,
      linkUrl,
    ] = match;

    if (code !== undefined) {
      push({text: code, code: true});
    } else if (boldStars !== undefined || boldUnderscores !== undefined) {
      push({text: boldStars ?? boldUnderscores, bold: true});
    } else if (italicStar !== undefined || italicUnderscore !== undefined) {
      push({text: italicStar ?? italicUnderscore, italic: true});
    } else if (linkLabel !== undefined && linkUrl !== undefined) {
      push({text: linkLabel, link: linkUrl});
    }

    index = match.index + match[0].length;
    match = INLINE_PATTERN.exec(text);
  }

  push({text: text.slice(index)});

  return spans;
}

/**
 * The text inside a fence, without the empty lines at its two ends.
 *
 * Models routinely open a fence, leave a blank line, and close the same way. Rendered
 * literally that is a gap under the block's header that looks like a broken layout, and a
 * container taller than the code in it. Only the ends are touched: blank lines inside a
 * listing are the author's paragraphs.
 */
function fenceCode(lines: readonly string[]): string {
  let start = 0;
  let end = lines.length;

  while (start < end && lines[start].trim().length === 0) {
    start += 1;
  }

  while (end > start && lines[end - 1].trim().length === 0) {
    end -= 1;
  }

  return lines.slice(start, end).join('\n');
}

export function parseMarkdown(text: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = text.split('\n');

  let paragraph: string[] = [];
  let quote: string[] = [];
  let list: {ordered: boolean; items: string[]} | null = null;
  let fence: {marker: string; language: string | null; lines: string[]} | null =
    null;

  function flushParagraph(): void {
    if (paragraph.length > 0) {
      blocks.push({type: 'paragraph', spans: parseInline(paragraph.join(' '))});
      paragraph = [];
    }
  }

  function flushQuote(): void {
    if (quote.length > 0) {
      blocks.push({type: 'quote', spans: parseInline(quote.join(' '))});
      quote = [];
    }
  }

  function flushList(): void {
    if (list !== null) {
      blocks.push({
        type: 'list',
        ordered: list.ordered,
        items: list.items.map(parseInline),
      });
      list = null;
    }
  }

  function flushText(): void {
    flushParagraph();
    flushQuote();
    flushList();
  }

  // A plain loop rather than `forEach`: the fence state is reassigned inside it, and
  // TypeScript narrows a reassigned variable only where the flow is visible to it.
  for (const line of lines) {
    if (fence !== null) {
      const closing = FENCE.exec(line);

      if (closing !== null && closing[1][0] === fence.marker[0]) {
        blocks.push({
          type: 'code',
          language: fence.language,
          code: fenceCode(fence.lines),
          closed: true,
        });
        fence = null;
        continue;
      }

      fence.lines.push(line);
      continue;
    }

    const opening = FENCE.exec(line);

    if (opening !== null) {
      flushText();
      fence = {
        marker: opening[1],
        language: opening[2].length > 0 ? opening[2] : null,
        lines: [],
      };
      continue;
    }

    if (line.trim().length === 0) {
      flushText();
      continue;
    }

    const heading = HEADING.exec(line);

    if (heading !== null) {
      flushText();
      blocks.push({
        type: 'heading',
        level: heading[1].length as 1 | 2 | 3,
        spans: parseInline(heading[2]),
      });
      continue;
    }

    if (RULE.test(line)) {
      flushText();
      blocks.push({type: 'rule'});
      continue;
    }

    const quoted = QUOTE.exec(line);

    if (quoted !== null) {
      flushParagraph();
      flushList();
      quote.push(quoted[1]);
      continue;
    }

    const ordered = ORDERED.exec(line);
    const unordered = UNORDERED.exec(line);

    if (ordered !== null || unordered !== null) {
      flushParagraph();
      flushQuote();

      const isOrdered = ordered !== null;
      const item = ordered !== null ? ordered[1] : unordered?.[1] ?? '';

      if (list === null || list.ordered !== isOrdered) {
        flushList();
        list = {ordered: isOrdered, items: []};
      }

      list.items.push(item);
      continue;
    }

    flushQuote();
    flushList();
    paragraph.push(line.trim());
  }

  if (fence !== null) {
    // Still streaming: an open block is the honest state, not a reason to render nothing.
    blocks.push({
      type: 'code',
      language: fence.language,
      code: fenceCode(fence.lines),
      closed: false,
    });
  }

  flushText();

  return blocks;
}
