/**
 * Failures the interface has to be able to explain.
 *
 * Each failure carries a code the dictionary translates and an optional detail that stays
 * in its machine form - the endpoint's own words, rendered in mono. Nothing here invents an
 * explanation the runtime does not actually have.
 */

export const AGENT_ERROR_CODES = [
  'provider.unconfigured',
  'provider.unauthorized',
  'provider.http',
  'provider.network',
  'provider.response',
] as const;

export type AgentErrorCode = (typeof AGENT_ERROR_CODES)[number];

export type AgentFailure = {
  code: AgentErrorCode;
  detail: string | null;
};

export class AgentError extends Error {
  readonly code: AgentErrorCode;
  readonly detail: string | null;

  constructor(
    code: AgentErrorCode,
    message: string,
    detail: string | null = null,
  ) {
    super(message);
    this.name = 'AgentError';
    this.code = code;
    this.detail = detail;
  }

  get failure(): AgentFailure {
    return {code: this.code, detail: this.detail};
  }
}

export class ProviderNotConfiguredError extends AgentError {
  constructor() {
    super(
      'provider.unconfigured',
      'No model provider is configured: set an endpoint and a model first.',
    );
    this.name = 'ProviderNotConfiguredError';
  }
}

export class ModelHttpError extends AgentError {
  readonly status: number;

  constructor(status: number, detail: string | null = null) {
    super(
      status === 401 || status === 403
        ? 'provider.unauthorized'
        : 'provider.http',
      `The endpoint answered with HTTP ${status}.`,
      detail,
    );
    this.name = 'ModelHttpError';
    this.status = status;
  }
}

export class ModelNetworkError extends AgentError {
  constructor(message: string, detail: string | null = null) {
    super('provider.network', message, detail);
    this.name = 'ModelNetworkError';
  }
}

export class ModelResponseError extends AgentError {
  constructor(message: string, detail: string | null = null) {
    super('provider.response', message, detail);
    this.name = 'ModelResponseError';
  }
}

/**
 * Not a failure: the user asked the stream to stop. It travels as an error because that is
 * how an in-flight iteration ends, and the session turns it into a `cancelled` turn.
 */
export class StreamCancelledError extends Error {
  constructor() {
    super('The stream was cancelled.');
    this.name = 'StreamCancelledError';
  }
}

const DETAIL_LIMIT = 300;

/**
 * Turns an error response body into one readable line.
 *
 * OpenAI-compatible endpoints answer with `{"error": {"message": "..."}}`, local servers
 * answer with anything at all, and a proxy in between answers with HTML. Whatever arrives,
 * the user sees the endpoint's own words rather than a generic apology.
 */
export function describeErrorBody(body: string): string | null {
  const trimmed = body.trim();

  if (trimmed.length === 0) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const error = record.error;

      if (typeof error === 'string') {
        return error.slice(0, DETAIL_LIMIT);
      }

      if (typeof error === 'object' && error !== null) {
        const message = (error as Record<string, unknown>).message;

        if (typeof message === 'string' && message.length > 0) {
          return message.slice(0, DETAIL_LIMIT);
        }
      }

      if (typeof record.message === 'string' && record.message.length > 0) {
        return record.message.slice(0, DETAIL_LIMIT);
      }
    }
  } catch {
    // Not JSON. The raw body is still the most honest thing to show.
  }

  return trimmed.slice(0, DETAIL_LIMIT);
}

export function toAgentFailure(error: unknown): AgentFailure {
  if (error instanceof AgentError) {
    return error.failure;
  }

  return {
    code: 'provider.response',
    detail: error instanceof Error ? error.message : String(error),
  };
}
