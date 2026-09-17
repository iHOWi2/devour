/**
 * Server-sent events, decoded from arbitrarily chopped text.
 *
 * A streamed HTTP response hands you bytes, not messages: one `data:` line can arrive in
 * three pieces and three events can arrive in one piece. The decoder keeps the tail of an
 * incomplete line and emits an event only when a blank line closes it, which is what the
 * specification defines as an event boundary. Getting this wrong shows up as text that
 * silently loses characters, so it is a pure function with its own tests.
 */
export type SseDecoder = {
  /** Feeds the next slice of the body and returns every event it completed. */
  push(chunk: string): string[];
  /** Closes the stream: emits a trailing event that arrived without its blank line. */
  flush(): string[];
};

export function createSseDecoder(): SseDecoder {
  let buffer = '';
  let dataLines: string[] = [];
  const completed: string[] = [];

  function handleLine(line: string): void {
    if (line.length === 0) {
      if (dataLines.length > 0) {
        completed.push(dataLines.join('\n'));
        dataLines = [];
      }

      return;
    }

    // A line starting with a colon is a comment. Endpoints send them as keep-alives.
    if (line.startsWith(':')) {
      return;
    }

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);

    if (field !== 'data') {
      return;
    }

    const raw = separator === -1 ? '' : line.slice(separator + 1);
    dataLines.push(raw.startsWith(' ') ? raw.slice(1) : raw);
  }

  function drain(): string[] {
    if (completed.length === 0) {
      return [];
    }

    const events = completed.slice();
    completed.length = 0;

    return events;
  }

  return {
    push(chunk) {
      buffer += chunk;

      let index = buffer.indexOf('\n');

      while (index !== -1) {
        const line = buffer.slice(0, index).replace(/\r$/, '');
        buffer = buffer.slice(index + 1);
        handleLine(line);
        index = buffer.indexOf('\n');
      }

      return drain();
    },

    flush() {
      if (buffer.length > 0) {
        handleLine(buffer.replace(/\r$/, ''));
        buffer = '';
      }

      handleLine('');

      return drain();
    },
  };
}
