import React from 'react';
import type {ReactTestInstance, ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {
  AgentProvider,
  ModelHttpError,
  StreamCancelledError,
} from '../src/agent';
import type {
  Conversation,
  ConversationStore,
  ModelChunk,
  ModelProvider,
  ProviderSettings,
} from '../src/agent';
import {ThemeProvider} from '../src/design/ThemeProvider';
import {LanguageProvider} from '../src/i18n';
import type {Language} from '../src/i18n';
import {ChatScreen} from '../src/screens/ChatScreen';

const settings: ProviderSettings = {
  kind: 'openai-compatible',
  baseUrl: 'https://api.example.com/v1',
  model: 'some-model',
};

function flush(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

async function settle(): Promise<void> {
  await act(async () => {
    await flush();
  });
}

/** A provider the test drives, so streaming order is deterministic. */
function controllable() {
  const control = {
    push: (_text: string) => {},
    finish: () => {},
    fail: (_error: Error) => {},
  };

  const provider: ModelProvider = {
    id: 'test',
    stream: request => ({
      [Symbol.asyncIterator]() {
        const queued: ModelChunk[] = [];
        let waiter: {
          resolve(result: IteratorResult<ModelChunk, undefined>): void;
          reject(error: Error): void;
        } | null = null;
        let done = false;
        let failure: Error | null = null;

        const settleNext = () => {
          if (waiter === null) {
            return;
          }

          const pending = waiter;

          if (queued.length > 0) {
            waiter = null;
            pending.resolve({done: false, value: queued.shift() as ModelChunk});
          } else if (failure !== null) {
            waiter = null;
            pending.reject(failure);
          } else if (done) {
            waiter = null;
            pending.resolve({done: true, value: undefined});
          }
        };

        control.push = text => {
          queued.push({type: 'text', text});
          settleNext();
        };
        control.finish = () => {
          done = true;
          settleNext();
        };
        control.fail = error => {
          failure = error;
          settleNext();
        };

        request.signal?.addEventListener('abort', () => {
          failure = new StreamCancelledError();
          settleNext();
        });

        return {
          next() {
            if (queued.length > 0) {
              return Promise.resolve({
                done: false,
                value: queued.shift() as ModelChunk,
              });
            }

            if (failure !== null) {
              return Promise.reject(failure);
            }

            if (done) {
              return Promise.resolve({done: true, value: undefined});
            }

            return new Promise<IteratorResult<ModelChunk, undefined>>(
              (resolve, reject) => {
                waiter = {resolve, reject};
              },
            );
          },
        };
      },
    }),
  };

  return {control, provider};
}

function memoryConversationStore(
  stored: Conversation | null = null,
  broken = false,
): ConversationStore {
  return {
    load: () =>
      broken
        ? Promise.reject(new Error('no such module'))
        : Promise.resolve(stored),
    save: () =>
      broken ? Promise.reject(new Error('no such module')) : Promise.resolve(),
    clear: () => Promise.resolve(),
  };
}

type Options = {
  settings?: ProviderSettings | null;
  conversation?: Conversation | null;
  brokenStore?: boolean;
  language?: Language;
};

async function renderChat(options: Options = {}) {
  const {control, provider} = controllable();
  const openSystem = jest.fn();
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <LanguageProvider
        deviceLanguage={options.language ?? 'en'}
        initialPreference="system">
        <ThemeProvider initialPreference="dark">
          <AgentProvider
            apiKeyStore={{
              load: () => Promise.resolve(null),
              save: () => Promise.resolve(),
              clear: () => Promise.resolve(),
            }}
            conversationStore={memoryConversationStore(
              options.conversation ?? null,
              options.brokenStore ?? false,
            )}
            resolveProvider={() => provider}
            settingsStore={{
              load: () =>
                Promise.resolve(
                  options.settings === undefined ? settings : options.settings,
                ),
              save: () => Promise.resolve(),
            }}>
            <ChatScreen onOpenSystem={openSystem} />
          </AgentProvider>
        </ThemeProvider>
      </LanguageProvider>,
    );
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  await settle();

  return {control, openSystem, renderer};
}

function output(renderer: ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

function find(renderer: ReactTestRenderer, testID: string): ReactTestInstance {
  const target = renderer.root
    .findAllByProps({testID})
    .find(
      node =>
        typeof node.props.onPress === 'function' ||
        typeof node.props.onChangeText === 'function',
    );

  if (target === undefined) {
    throw new Error(`no interactive element found for testID "${testID}"`);
  }

  return target;
}

async function type(
  renderer: ReactTestRenderer,
  testID: string,
  text: string,
): Promise<void> {
  await act(async () => {
    find(renderer, testID).props.onChangeText(text);
  });
}

async function press(
  renderer: ReactTestRenderer,
  testID: string,
): Promise<void> {
  await act(async () => {
    find(renderer, testID).props.onPress();
    await flush();
  });
}

describe('chat screen', () => {
  it('says the model is missing instead of pretending to be a chat', async () => {
    const {renderer, openSystem} = await renderChat({settings: null});

    expect(output(renderer)).toContain('No model is configured');

    await press(renderer, 'chat-configure');

    expect(openSystem).toHaveBeenCalled();
  });

  it('states what the build can do once an endpoint is configured', async () => {
    const {renderer} = await renderChat();

    const rendered = output(renderer);
    expect(rendered).toContain('Ask the model anything');
    expect(rendered).toContain('it cannot read your files or run commands');
  });

  it('streams the answer into the flow and renders its code block', async () => {
    const {control, renderer} = await renderChat();

    await type(renderer, 'composer-input', 'how do I run the tests?');
    await press(renderer, 'composer-send');

    expect(output(renderer)).toContain('how do I run the tests?');
    expect(output(renderer)).toContain('answering');

    await act(async () => {
      control.push('Run ');
      control.push('```bash\nnpm test\n```');
      await flush();
    });

    expect(output(renderer)).toContain('npm test');
    expect(output(renderer)).toContain('bash');

    await act(async () => {
      control.finish();
      await flush();
    });

    expect(output(renderer)).not.toContain('answering');
  });

  it('stops a stream and keeps what already arrived', async () => {
    const {control, renderer} = await renderChat({language: 'ru'});

    await type(renderer, 'composer-input', 'объясни');
    await press(renderer, 'composer-send');

    await act(async () => {
      control.push('Сначала ');
      await flush();
    });

    await press(renderer, 'composer-stop');

    const rendered = output(renderer);
    expect(rendered).toContain('Сначала');
    expect(rendered).toContain('остановлено');
    expect(rendered).not.toContain('отвечает');
  });

  it('shows what the endpoint said and answers again on retry', async () => {
    const {control, renderer} = await renderChat();

    await type(renderer, 'composer-input', 'hello');
    await press(renderer, 'composer-send');

    await act(async () => {
      control.fail(new ModelHttpError(401, 'Incorrect API key provided'));
      await flush();
    });

    const failed = output(renderer);
    expect(failed).toContain('The endpoint rejected the API key');
    expect(failed).toContain('Incorrect API key provided');

    await press(renderer, 'failure-retry');

    await act(async () => {
      control.push('Second attempt.');
      control.finish();
      await flush();
    });

    const retried = output(renderer);
    expect(retried).toContain('Second attempt.');
    expect(retried).not.toContain('The endpoint rejected the API key');
  });

  it('offers the configuration screen when the failure is a missing endpoint', async () => {
    const {openSystem, renderer} = await renderChat({settings: null});

    await type(renderer, 'composer-input', 'hello');
    await press(renderer, 'composer-send');

    expect(output(renderer)).toContain('No model provider is configured');

    await press(renderer, 'failure-configure');
    expect(openSystem).toHaveBeenCalled();
  });

  it('restores the stored conversation after process death', async () => {
    const {renderer} = await renderChat({
      conversation: {
        id: 'c-old',
        createdAt: 1,
        updatedAt: 2,
        messages: [
          {
            id: 'u-1',
            role: 'user',
            text: 'earlier question',
            status: 'complete',
            createdAt: 1,
          },
          {
            id: 'a-1',
            role: 'assistant',
            text: 'half an answer',
            status: 'streaming',
            createdAt: 2,
          },
        ],
      },
    });

    const rendered = output(renderer);
    expect(rendered).toContain('earlier question');
    expect(rendered).toContain('half an answer');
    // The process died mid-stream: the turn is shown as stopped, not as still running.
    expect(rendered).toContain('stopped');
    expect(rendered).not.toContain('answering');
  });

  it('starts a new conversation on request', async () => {
    const {control, renderer} = await renderChat();

    await type(renderer, 'composer-input', 'first question');
    await press(renderer, 'composer-send');
    await act(async () => {
      control.finish();
      await flush();
    });

    await press(renderer, 'chat-new');

    const rendered = output(renderer);
    expect(rendered).not.toContain('first question');
    expect(rendered).toContain('Ask the model anything');
  });

  it('warns when the conversation is not being saved', async () => {
    const {renderer} = await renderChat({brokenStore: true});

    expect(output(renderer)).toContain('history is not being saved');
  });
});
