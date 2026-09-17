import {
  AgentSession,
  ModelHttpError,
  ProviderNotConfiguredError,
  StreamCancelledError,
} from '../src/agent';
import type {
  Conversation,
  ConversationStore,
  ModelChunk,
  ModelProvider,
  SessionState,
} from '../src/agent';

/** A provider the test drives by hand, so timing is deterministic. */
function controllableProvider() {
  const state = {
    requests: 0,
    push: (_text: string) => {},
    finish: () => {},
    fail: (_error: Error) => {},
  };

  const provider: ModelProvider = {
    id: 'test',
    stream: request => ({
      [Symbol.asyncIterator]() {
        state.requests += 1;

        const queued: ModelChunk[] = [];
        let waiter: {
          resolve(result: IteratorResult<ModelChunk, undefined>): void;
          reject(error: Error): void;
        } | null = null;
        let done = false;
        let failure: Error | null = null;

        const settle = () => {
          if (waiter === null) {
            return;
          }

          const pending = waiter;

          if (queued.length > 0) {
            waiter = null;
            pending.resolve({done: false, value: queued.shift() as ModelChunk});
            return;
          }

          if (failure !== null) {
            waiter = null;
            pending.reject(failure);
            return;
          }

          if (done) {
            waiter = null;
            pending.resolve({done: true, value: undefined});
          }
        };

        state.push = text => {
          queued.push({type: 'text', text});
          settle();
        };
        state.finish = () => {
          done = true;
          settle();
        };
        state.fail = error => {
          failure = error;
          settle();
        };

        request.signal?.addEventListener('abort', () => {
          failure = new StreamCancelledError();
          settle();
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

  return {provider, state};
}

function memoryStore(): ConversationStore & {
  saved: Conversation[];
  cleared: number;
} {
  const store = {
    saved: [] as Conversation[],
    cleared: 0,
    load: () => Promise.resolve<Conversation | null>(null),
    save: (conversation: Conversation) => {
      store.saved.push(conversation);
      return Promise.resolve();
    },
    clear: () => {
      store.cleared += 1;
      return Promise.resolve();
    },
  };

  return store;
}

function deterministic() {
  let clock = 1000;
  let sequence = 0;

  return {
    now: () => {
      clock += 1;
      return clock;
    },
    createId: (prefix: string) => {
      sequence += 1;
      return `${prefix}-${sequence}`;
    },
  };
}

/** Lets every pending promise callback run, so the session has really started streaming. */
function flush(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

describe('agent session', () => {
  it('streams an answer and reports the status the interface renders', async () => {
    const {provider, state} = controllableProvider();
    const store = memoryStore();
    const session = new AgentSession({
      resolveProvider: () => provider,
      store,
      ...deterministic(),
    });

    const seen: SessionState[] = [];
    session.subscribe(nextState => seen.push(nextState));

    const sending = session.send('  add firebase auth  ');
    await flush();

    expect(session.getState().status).toBe('streaming');

    state.push('Firebase ');
    state.push('needs a plan.');
    state.finish();
    await sending;

    const {conversation, status, failure, persistence} = session.getState();

    expect(status).toBe('idle');
    expect(failure).toBeNull();
    expect(persistence).toBe('ready');
    expect(conversation.messages).toEqual([
      {
        id: 'u-2',
        role: 'user',
        text: 'add firebase auth',
        status: 'complete',
        createdAt: 1002,
      },
      {
        id: 'a-3',
        role: 'assistant',
        text: 'Firebase needs a plan.',
        status: 'complete',
        createdAt: 1003,
      },
    ]);
    expect(seen.length).toBeGreaterThan(3);
    expect(store.saved).toHaveLength(2);
  });

  it('ignores an empty turn and a second turn while one is streaming', async () => {
    const {provider, state} = controllableProvider();
    const session = new AgentSession({
      resolveProvider: () => provider,
      ...deterministic(),
    });

    await session.send('   ');
    expect(session.getState().conversation.messages).toHaveLength(0);

    const sending = session.send('first');
    await flush();
    await session.send('second');

    expect(
      session
        .getState()
        .conversation.messages.filter(message => message.role === 'user'),
    ).toHaveLength(1);

    state.finish();
    await sending;
    expect(state.requests).toBe(1);
  });

  it('keeps what arrived when the user stops the stream', async () => {
    const {provider, state} = controllableProvider();
    const session = new AgentSession({
      resolveProvider: () => provider,
      ...deterministic(),
    });

    const sending = session.send('explain');
    await flush();
    state.push('Start by ');
    await flush();
    session.cancel();
    await sending;

    const {conversation, status, failure} = session.getState();

    expect(status).toBe('idle');
    expect(failure).toBeNull();
    expect(conversation.messages[1]).toMatchObject({
      status: 'cancelled',
      text: 'Start by ',
    });
  });

  it('surfaces a provider failure and answers again on retry', async () => {
    const {provider, state} = controllableProvider();
    const session = new AgentSession({
      resolveProvider: () => provider,
      ...deterministic(),
    });

    const sending = session.send('explain');
    await flush();
    state.fail(new ModelHttpError(401, 'Incorrect API key provided'));
    await sending;

    expect(session.getState().failure).toEqual({
      code: 'provider.unauthorized',
      detail: 'Incorrect API key provided',
    });
    expect(session.getState().conversation.messages[1].status).toBe('failed');

    const retrying = session.retry();
    await flush();
    state.push('Second attempt.');
    state.finish();
    await retrying;

    const {conversation, failure} = session.getState();

    expect(failure).toBeNull();
    expect(conversation.messages).toHaveLength(2);
    expect(conversation.messages[1]).toMatchObject({
      status: 'complete',
      text: 'Second attempt.',
    });
    expect(state.requests).toBe(2);
  });

  it('says what is missing when no provider is configured, and writes no empty turn', async () => {
    const session = new AgentSession({
      resolveProvider: () => {
        throw new ProviderNotConfiguredError();
      },
      ...deterministic(),
    });

    await session.send('hello');

    expect(session.getState().failure).toEqual({
      code: 'provider.unconfigured',
      detail: null,
    });
    expect(session.getState().conversation.messages).toHaveLength(1);
  });

  it('restores a stored conversation and settles a stream killed with the process', async () => {
    const {provider} = controllableProvider();
    const store = memoryStore();
    store.load = () =>
      Promise.resolve({
        id: 'c-restored',
        createdAt: 1,
        updatedAt: 2,
        messages: [
          {
            id: 'u-1',
            role: 'user' as const,
            text: 'earlier question',
            status: 'complete' as const,
            createdAt: 1,
          },
          {
            id: 'a-1',
            role: 'assistant' as const,
            text: 'half an answer',
            status: 'streaming' as const,
            createdAt: 2,
          },
        ],
      });

    const session = new AgentSession({
      resolveProvider: () => provider,
      store,
      ...deterministic(),
    });

    await session.hydrate();

    const {conversation, persistence} = session.getState();

    expect(persistence).toBe('ready');
    expect(conversation.id).toBe('c-restored');
    expect(conversation.messages[1]).toMatchObject({
      status: 'cancelled',
      text: 'half an answer',
    });
  });

  it('keeps working in memory when the document store is broken, and says so', async () => {
    const {provider, state} = controllableProvider();
    const store = memoryStore();
    store.load = () => Promise.reject(new Error('no such module'));
    store.save = () => Promise.reject(new Error('no such module'));

    const session = new AgentSession({
      resolveProvider: () => provider,
      store,
      ...deterministic(),
    });

    await session.hydrate();
    expect(session.getState().persistence).toBe('unavailable');

    const sending = session.send('still works');
    await flush();
    state.push('yes');
    state.finish();
    await sending;

    expect(session.getState().conversation.messages[1].text).toBe('yes');
    expect(session.getState().persistence).toBe('unavailable');
  });

  it('starts a new conversation and forgets the stored one', async () => {
    const {provider, state} = controllableProvider();
    const store = memoryStore();
    const session = new AgentSession({
      resolveProvider: () => provider,
      store,
      ...deterministic(),
    });

    const sending = session.send('hello');
    await flush();
    state.finish();
    await sending;

    const first = session.getState().conversation.id;
    await session.reset();

    expect(store.cleared).toBe(1);
    expect(session.getState().conversation.messages).toHaveLength(0);
    expect(session.getState().conversation.id).not.toBe(first);
  });

  it('reports that nothing is persisted when it has no store at all', () => {
    const {provider} = controllableProvider();
    const session = new AgentSession({
      resolveProvider: () => provider,
      store: null,
      ...deterministic(),
    });

    expect(session.getState().persistence).toBe('unavailable');
  });
});
