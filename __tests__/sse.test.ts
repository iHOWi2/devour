import {createSseDecoder} from '../src/agent';

describe('server-sent event decoding', () => {
  it('emits one event per blank line', () => {
    const decoder = createSseDecoder();

    expect(decoder.push('data: one\n\ndata: two\n\n')).toEqual(['one', 'two']);
  });

  it('survives a payload chopped across chunks', () => {
    const decoder = createSseDecoder();

    expect(decoder.push('data: {"a"')).toEqual([]);
    expect(decoder.push(':1}')).toEqual([]);
    expect(decoder.push('\n')).toEqual([]);
    expect(decoder.push('\n')).toEqual(['{"a":1}']);
  });

  it('handles carriage returns and keep-alive comments', () => {
    const decoder = createSseDecoder();

    expect(decoder.push(': keep alive\r\ndata: hello\r\n\r\n')).toEqual([
      'hello',
    ]);
  });

  it('joins a multi-line payload with newlines, as the specification says', () => {
    const decoder = createSseDecoder();

    expect(decoder.push('data: first\ndata: second\n\n')).toEqual([
      'first\nsecond',
    ]);
  });

  it('ignores fields other than data', () => {
    const decoder = createSseDecoder();

    expect(decoder.push('event: message\nid: 7\ndata: body\n\n')).toEqual([
      'body',
    ]);
  });

  it('flushes a trailing event that never got its blank line', () => {
    const decoder = createSseDecoder();

    expect(decoder.push('data: [DONE]')).toEqual([]);
    expect(decoder.flush()).toEqual(['[DONE]']);
  });
});
