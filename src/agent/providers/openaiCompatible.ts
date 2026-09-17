import {
  ModelResponseError,
  StreamCancelledError,
  describeErrorBody,
} from '../errors';
import {createAsyncQueue} from '../queue';
import {createSseDecoder} from '../sse';
import type {StreamTransport} from '../transport';
import type {
  ModelChunk,
  ModelProvider,
  ModelRequest,
  ProviderSettings,
} from '../types';

/**
 * A provider for any endpoint that speaks the OpenAI chat-completions protocol: OpenAI
 * itself, OpenRouter, Groq, vLLM, llama.cpp, Ollama's compatible route. One protocol covers
 * the hosted services and a model running on the phone, which is why it is the first one.
 *
 * Nothing about this file is special-cased in the runtime: it is one implementation of
 * `ModelProvider`, and a second protocol is a second file.
 */
export const PROVIDER_ID = 'openai-compatible';

const DONE_PAYLOAD = '[DONE]';

export function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, '');

  return trimmed.endsWith('/chat/completions')
    ? trimmed
    : `${trimmed}/chat/completions`;
}

/**
 * Reads one SSE payload.
 *
 * Returns the text this event carried, or null when the event carried no text - the first
 * event of a stream usually announces the role and nothing else. A payload that describes
 * an error is thrown, because a stream that reports a failure mid-flight has failed.
 */
export function extractDelta(payload: string): string | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(payload);
  } catch {
    throw new ModelResponseError(
      'The endpoint sent an event that is not JSON.',
      describeErrorBody(payload),
    );
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return null;
  }

  const record = parsed as Record<string, unknown>;

  if (record.error !== undefined) {
    throw new ModelResponseError(
      'The endpoint reported an error while streaming.',
      describeErrorBody(payload),
    );
  }

  const choices = record.choices;

  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const choice = choices[0] as Record<string, unknown> | null;

  if (choice === null || typeof choice !== 'object') {
    return null;
  }

  const delta = choice.delta as Record<string, unknown> | undefined;
  const content = delta?.content;

  return typeof content === 'string' && content.length > 0 ? content : null;
}

export type OpenAiCompatibleOptions = {
  settings: ProviderSettings;
  apiKey?: string | null;
  transport: StreamTransport;
};

export function createOpenAiCompatibleProvider({
  settings,
  apiKey,
  transport,
}: OpenAiCompatibleOptions): ModelProvider {
  const url = chatCompletionsUrl(settings.baseUrl);
  const key = typeof apiKey === 'string' ? apiKey.trim() : '';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
  };

  // A local server needs no key, so an absent one is a valid configuration, not an error.
  if (key.length > 0) {
    headers.Authorization = `Bearer ${key}`;
  }

  return {
    id: PROVIDER_ID,

    stream(request: ModelRequest) {
      const decoder = createSseDecoder();
      let stop: (() => void) | null = null;
      let finished = false;

      function onAbort(): void {
        queue.fail(new StreamCancelledError());
        stop?.();
      }

      const queue = createAsyncQueue<ModelChunk>(() => {
        request.signal?.removeEventListener('abort', onAbort);
        stop?.();
        stop = null;
      });

      if (request.signal?.aborted === true) {
        queue.fail(new StreamCancelledError());

        return queue.iterable;
      }

      request.signal?.addEventListener('abort', onAbort);

      /** Returns false once the stream is over, so later text is ignored. */
      function consume(payload: string): boolean {
        if (finished) {
          return false;
        }

        if (payload === DONE_PAYLOAD) {
          finished = true;
          queue.close();

          return false;
        }

        try {
          const text = extractDelta(payload);

          if (text !== null) {
            queue.push({type: 'text', text});
          }
        } catch (error) {
          finished = true;
          queue.fail(
            error instanceof Error
              ? error
              : new ModelResponseError(String(error)),
          );

          return false;
        }

        return true;
      }

      stop = transport(
        {
          url,
          headers,
          body: JSON.stringify({
            model: settings.model,
            messages: request.messages,
            stream: true,
          }),
        },
        {
          onText(chunk) {
            decoder.push(chunk).some(payload => !consume(payload));
          },

          onFailure(error) {
            finished = true;
            queue.fail(error);
          },

          onComplete() {
            decoder.flush().some(payload => !consume(payload));
            finished = true;
            queue.close();
          },
        },
      );

      return queue.iterable;
    },
  };
}
