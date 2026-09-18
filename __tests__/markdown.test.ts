import {parseInline, parseMarkdown} from '../src/lib/markdown';

describe('inline markdown', () => {
  it('reads code, emphasis and links', () => {
    expect(parseInline('run `npm test` in **the** repo')).toEqual([
      {text: 'run '},
      {text: 'npm test', code: true},
      {text: ' in '},
      {text: 'the', bold: true},
      {text: ' repo'},
    ]);

    expect(parseInline('_quietly_ and [docs](https://example.com)')).toEqual([
      {text: 'quietly', italic: true},
      {text: ' and '},
      {text: 'docs', link: 'https://example.com'},
    ]);
  });

  it('leaves arithmetic alone', () => {
    expect(parseInline('2 * 3 * 4 = 24')).toEqual([{text: '2 * 3 * 4 = 24'}]);
  });

  it('keeps markup inside code literal', () => {
    expect(parseInline('`**not bold**`')).toEqual([
      {text: '**not bold**', code: true},
    ]);
  });
});

describe('markdown blocks', () => {
  it('separates paragraphs on blank lines and joins soft wraps', () => {
    const blocks = parseMarkdown('first line\nstill first\n\nsecond');

    expect(blocks).toEqual([
      {type: 'paragraph', spans: [{text: 'first line still first'}]},
      {type: 'paragraph', spans: [{text: 'second'}]},
    ]);
  });

  it('reads a fenced code block with its language', () => {
    const blocks = parseMarkdown(
      'before\n\n```ts\nconst a = 1;\nconst b = 2;\n```\n\nafter',
    );

    expect(blocks[1]).toEqual({
      type: 'code',
      language: 'ts',
      code: 'const a = 1;\nconst b = 2;',
      closed: true,
    });
    expect(blocks[2]).toEqual({
      type: 'paragraph',
      spans: [{text: 'after'}],
    });
  });

  it('renders a code block that is still streaming as open', () => {
    const blocks = parseMarkdown('```kotlin\nval x = 1');

    expect(blocks).toEqual([
      {type: 'code', language: 'kotlin', code: 'val x = 1', closed: false},
    ]);
  });

  /**
   * Models wrap their fences in blank lines, and rendering those literally leaves a gap
   * under the block's header that reads as a broken layout. Only the ends are trimmed:
   * a blank line between two functions is the author's paragraph break.
   */
  it('drops the blank lines a fence is padded with, and keeps the ones inside it', () => {
    const blocks = parseMarkdown(
      '```py\n\n  \ndef a():\n    pass\n\n\ndef b():\n    pass\n\n```',
    );

    expect(blocks).toEqual([
      {
        type: 'code',
        language: 'py',
        code: 'def a():\n    pass\n\n\ndef b():\n    pass',
        closed: true,
      },
    ]);
  });

  it('holds an empty fence as empty rather than as a blank line', () => {
    expect(parseMarkdown('```\n\n```')).toEqual([
      {type: 'code', language: null, code: '', closed: true},
    ]);
  });

  it('never treats markdown inside a fence as markdown', () => {
    const blocks = parseMarkdown('```\n# not a heading\n- not a list\n```');

    expect(blocks).toEqual([
      {
        type: 'code',
        language: null,
        code: '# not a heading\n- not a list',
        closed: true,
      },
    ]);
  });

  it('groups consecutive list items and splits ordered from unordered', () => {
    const blocks = parseMarkdown('- one\n- two\n1. first\n2. second');

    expect(blocks).toEqual([
      {
        type: 'list',
        ordered: false,
        items: [[{text: 'one'}], [{text: 'two'}]],
      },
      {
        type: 'list',
        ordered: true,
        items: [[{text: 'first'}], [{text: 'second'}]],
      },
    ]);
  });

  it('reads headings, quotes and rules', () => {
    expect(parseMarkdown('## Plan')).toEqual([
      {type: 'heading', level: 2, spans: [{text: 'Plan'}]},
    ]);
    expect(parseMarkdown('> careful\n> here')).toEqual([
      {type: 'quote', spans: [{text: 'careful here'}]},
    ]);
    expect(parseMarkdown('---')).toEqual([{type: 'rule'}]);
  });

  it('returns nothing for nothing', () => {
    expect(parseMarkdown('')).toEqual([]);
    expect(parseMarkdown('   \n\n')).toEqual([]);
  });
});
