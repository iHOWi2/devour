import {ModelHttpError, ModelNetworkError, describeErrorBody} from './errors';

export type StreamRequest = {
  url: string;
  headers: Readonly<Record<string, string>>;
  body: string;
};

export type StreamHandlers = {
  /** Only the newly appended text, never the whole body so far. */
  onText(chunk: string): void;
  onFailure(error: Error): void;
  onComplete(): void;
};

/** Starts a streamed POST and returns the function that stops it. */
export type StreamTransport = (
  request: StreamRequest,
  handlers: StreamHandlers,
) => () => void;

type XhrFactory = () => XMLHttpRequest;

/**
 * Streaming over XMLHttpRequest, not over fetch.
 *
 * React Native's `fetch` is a polyfill on top of the native networking stack: it resolves
 * once the whole body has arrived and exposes no readable `response.body`. Awaiting it
 * would turn a streaming endpoint into a single late paragraph. XHR does stream here -
 * `responseText` grows while `readyState` is 3 - so the newly appended slice is the chunk,
 * and the SSE decoder is what makes sense of the boundaries.
 *
 * The factory is injectable so the provider can be tested without a network at all.
 */
export function createXhrTransport(
  createXhr: XhrFactory = () => new XMLHttpRequest(),
): StreamTransport {
  return (request, handlers) => {
    const xhr = createXhr();
    let delivered = 0;
    let settled = false;
    let ok: boolean | null = null;

    function finish(action: () => void): void {
      if (settled) {
        return;
      }

      settled = true;
      action();
    }

    xhr.onreadystatechange = () => {
      if (settled || xhr.readyState < 3) {
        return;
      }

      if (ok === null && xhr.status !== 0) {
        ok = xhr.status >= 200 && xhr.status < 300;
      }

      const text = typeof xhr.responseText === 'string' ? xhr.responseText : '';

      if (ok === true && text.length > delivered) {
        const chunk = text.slice(delivered);
        delivered = text.length;
        handlers.onText(chunk);
      }

      if (xhr.readyState === 4) {
        if (ok === true) {
          finish(handlers.onComplete);
          return;
        }

        // An error response is a body, not a stream: it is described, never decoded.
        finish(() =>
          handlers.onFailure(
            new ModelHttpError(xhr.status, describeErrorBody(text)),
          ),
        );
      }
    };

    xhr.onerror = () =>
      finish(() =>
        handlers.onFailure(
          new ModelNetworkError(
            'The request failed before a response arrived.',
          ),
        ),
      );

    xhr.ontimeout = () =>
      finish(() =>
        handlers.onFailure(new ModelNetworkError('The request timed out.')),
      );

    xhr.open('POST', request.url, true);

    Object.keys(request.headers).forEach(name => {
      xhr.setRequestHeader(name, request.headers[name]);
    });

    xhr.send(request.body);

    return () => {
      settled = true;
      xhr.abort();
    };
  };
}
