import {
  DEFAULT_PROVIDER_SETTINGS,
  ModelHttpError,
  PROVIDER_PRESETS,
  StreamCancelledError,
  createOpenAiCompatibleProvider,
  createProvider,
  validateProviderSettings,
} from '../src/agent';
import type {
  ModelChunk,
  ProviderSettings,
  StreamHandlers,
  StreamRequest,
} from '../src/agent';

const settings: ProviderSettings = {
  kind: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1',
  model: 'some-model',
};

type Captured = {
  request: StreamRequest;
  handlers: StreamHandlers;
  cancelled: boolean;
};

function fakeTransport() {
  const captured: Captured[] = [];

  const transport = (request: StreamRequest, handlers: StreamHandlers) => {
    const entry: Captured = {request, handlers, cancelled: false};
    captured.push(entry);

    return () => {
      entry.cancelled = true;
    };
  };

  return {captured, transport};
}

function sseEvent(content: string): string {
  return `data: ${JSON.stringify({
    choices: [{delta: {content}}],
  })}\n\n`;
}

async function collect(
  stream: AsyncIterable<ModelChunk>,
): Promise<ModelChunk[]> {
  const chunks: ModelChunk[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return chunks;
}

describe('openai-compatible provider', () => {
  it('posts the chat completions request the protocol expects', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({
      settings,
      apiKey: 'sk-test',
      transport,
    });

    const stream = provider.stream({
      messages: [{role: 'user', content: 'hi'}],
    });
    const collected = collect(stream);

    const [call] = captured;
    expect(call.request.url).toBe(
      'https://api.example.com/v1/chat/completions',
    );
    expect(call.request.headers.Authorization).toBe('Bearer sk-test');
    expect(call.request.headers.Accept).toBe('text/event-stream');
    expect(JSON.parse(call.request.body)).toEqual({
      model: 'some-model',
      messages: [{role: 'user', content: 'hi'}],
      stream: true,
    });

    call.handlers.onText(sseEvent('one'));
    call.handlers.onText('data: [DONE]\n\n');

    await expect(collected).resolves.toEqual([{type: 'text', text: 'one'}]);
  });

  it('sends no authorization header when there is no key, so a local server works', () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({
      settings: {...settings, baseUrl: 'http://127.0.0.1:11434/v1'},
      apiKey: null,
      transport,
    });

    provider.stream({messages: []});

    expect(captured[0].request.headers.Authorization).toBeUndefined();
    expect(captured[0].request.url).toBe(
      'http://127.0.0.1:11434/v1/chat/completions',
    );
  });

  it('streams text as it arrives, in order', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({settings, transport});

    const collected = collect(provider.stream({messages: []}));
    const {handlers} = captured[0];

    handlers.onText('data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n');
    handlers.onText(sseEvent('Fire'));
    handlers.onText(sseEvent('base'));
    handlers.onComplete();

    await expect(collected).resolves.toEqual([
      {type: 'text', text: 'Fire'},
      {type: 'text', text: 'base'},
    ]);
  });

  it('fails with the endpoint own words when the request is rejected', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({settings, transport});

    const collected = collect(provider.stream({messages: []}));

    captured[0].handlers.onFailure(
      new ModelHttpError(401, 'Incorrect API key provided'),
    );

    await expect(collected).rejects.toMatchObject({
      code: 'provider.unauthorized',
      detail: 'Incorrect API key provided',
    });
  });

  it('fails when the stream itself reports an error', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({settings, transport});

    const collected = collect(provider.stream({messages: []}));

    captured[0].handlers.onText(
      'data: {"error":{"message":"context length exceeded"}}\n\n',
    );

    await expect(collected).rejects.toMatchObject({
      code: 'provider.response',
      detail: 'context length exceeded',
    });
  });

  it('stops the request when the caller aborts', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({settings, transport});
    const controller = new AbortController();

    const collected = collect(
      provider.stream({messages: [], signal: controller.signal}),
    );

    captured[0].handlers.onText(sseEvent('partial'));
    controller.abort();

    await expect(collected).rejects.toBeInstanceOf(StreamCancelledError);
    expect(captured[0].cancelled).toBe(true);
  });

  it('refuses to stream before it is aborted', async () => {
    const {captured, transport} = fakeTransport();
    const provider = createOpenAiCompatibleProvider({settings, transport});
    const controller = new AbortController();
    controller.abort();

    await expect(
      collect(provider.stream({messages: [], signal: controller.signal})),
    ).rejects.toBeInstanceOf(StreamCancelledError);
    expect(captured).toHaveLength(0);
  });
});

describe('provider selection', () => {
  it('refuses to build a provider from settings that are not usable', () => {
    expect(() => createProvider({settings: null, apiKey: null})).toThrow(
      /no model provider is configured/i,
    );
    expect(() =>
      createProvider({
        settings: {...settings, baseUrl: 'not a url'},
        apiKey: null,
      }),
    ).toThrow(/no model provider is configured/i);
  });

  it('builds the provider for valid settings', () => {
    expect(createProvider({settings, apiKey: null}).id).toBe(
      'openai-compatible',
    );
  });
});

describe('provider presets', () => {
  it('offers only presets that can be saved as they are', () => {
    PROVIDER_PRESETS.forEach(preset => {
      expect(validateProviderSettings(preset)).toBeNull();
    });
  });

  it('keeps every preset distinct, so a tap is never a no-op', () => {
    const ids = PROVIDER_PRESETS.map(preset => preset.id);
    const endpoints = PROVIDER_PRESETS.map(preset => preset.baseUrl);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(endpoints).size).toBe(endpoints.length);
  });

  it('never becomes a default: an unconfigured Devour stays unconfigured', () => {
    expect(
      PROVIDER_PRESETS.some(
        preset => preset.baseUrl === DEFAULT_PROVIDER_SETTINGS.baseUrl,
      ),
    ).toBe(false);
    expect(DEFAULT_PROVIDER_SETTINGS.baseUrl).toBe('');
  });
});
