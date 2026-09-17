import {
  assistantMessage,
  createConversation,
  lastMessage,
  reduceConversation,
  settleRestoredConversation,
  toModelMessages,
  userMessage,
} from './conversation';
import {StreamCancelledError, toAgentFailure} from './errors';
import type {AgentFailure} from './errors';
import {DEVOUR_SYSTEM_PROMPT} from './prompt';
import type {ConversationStore} from './storage';
import type {AgentEvent, Conversation, ModelProvider} from './types';

/**
 * The agent runtime for Phase 2.
 *
 * It owns one conversation, one stream at a time, and the decision of what to send to the
 * model. It imports no React and no React Native component: the UI subscribes to state and
 * calls four methods, which is the whole reason a provider can be swapped without touching
 * a screen.
 */
export type SessionStatus = 'idle' | 'streaming';

/** Whether the conversation is actually being written to disk. */
export type PersistenceStatus = 'unknown' | 'ready' | 'unavailable';

export type SessionState = {
  conversation: Conversation;
  status: SessionStatus;
  failure: AgentFailure | null;
  persistence: PersistenceStatus;
};

export type SessionOptions = {
  /** Throws when no provider is configured; the failure is shown, never swallowed. */
  resolveProvider: () => ModelProvider;
  store?: ConversationStore | null;
  systemPrompt?: string;
  now?: () => number;
  createId?: (prefix: string) => string;
};

let counter = 0;

function defaultId(prefix: string): string {
  counter += 1;

  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

export class AgentSession {
  private readonly resolveProvider: () => ModelProvider;
  private readonly store: ConversationStore | null;
  private readonly systemPrompt: string;
  private readonly now: () => number;
  private readonly createId: (prefix: string) => string;
  private readonly listeners = new Set<(state: SessionState) => void>();

  private controller: AbortController | null = null;
  private state: SessionState;

  constructor(options: SessionOptions) {
    this.resolveProvider = options.resolveProvider;
    this.store = options.store ?? null;
    this.systemPrompt = options.systemPrompt ?? DEVOUR_SYSTEM_PROMPT;
    this.now = options.now ?? (() => Date.now());
    this.createId = options.createId ?? defaultId;

    this.state = {
      conversation: createConversation(this.createId('c'), this.now()),
      status: 'idle',
      failure: null,
      persistence: this.store === null ? 'unavailable' : 'unknown',
    };
  }

  getState(): SessionState {
    return this.state;
  }

  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Restores the stored conversation. Called once, when the app starts. */
  async hydrate(): Promise<void> {
    if (this.store === null) {
      return;
    }

    try {
      const stored = await this.store.load();

      if (stored !== null && stored.messages.length > 0) {
        this.patch({conversation: settleRestoredConversation(stored)});
      }

      this.patch({persistence: 'ready'});
    } catch {
      // A missing or broken document store is not a reason to lose the chat: the session
      // keeps working in memory and the interface says that history is not being saved.
      this.patch({persistence: 'unavailable'});
    }
  }

  async send(text: string): Promise<void> {
    const trimmed = text.trim();

    if (trimmed.length === 0 || this.state.status === 'streaming') {
      return;
    }

    const at = this.now();

    this.apply({
      type: 'message.add',
      at,
      message: userMessage(this.createId('u'), trimmed, at),
    });
    this.patch({failure: null});
    await this.persist();
    await this.run();
  }

  /** Answers the last user turn again, dropping the attempt that failed or was stopped. */
  async retry(): Promise<void> {
    if (this.state.status === 'streaming') {
      return;
    }

    const last = lastMessage(this.state.conversation);

    if (
      last !== null &&
      last.role === 'assistant' &&
      last.status !== 'complete'
    ) {
      this.apply({type: 'message.drop', at: this.now(), id: last.id});
    }

    const target = lastMessage(this.state.conversation);

    if (target === null || target.role !== 'user') {
      return;
    }

    await this.run();
  }

  cancel(): void {
    this.controller?.abort();
  }

  /** Starts a new conversation and forgets the stored one. */
  async reset(): Promise<void> {
    this.cancel();
    this.patch({
      conversation: createConversation(this.createId('c'), this.now()),
      failure: null,
    });

    if (this.store === null) {
      return;
    }

    try {
      await this.store.clear();
    } catch {
      this.patch({persistence: 'unavailable'});
    }
  }

  private async run(): Promise<void> {
    let provider: ModelProvider;

    try {
      provider = this.resolveProvider();
    } catch (error) {
      this.patch({failure: toAgentFailure(error)});

      return;
    }

    const at = this.now();
    const assistant = assistantMessage(this.createId('a'), at);

    this.apply({type: 'message.add', at, message: assistant});
    this.patch({status: 'streaming', failure: null});

    const controller = new AbortController();
    this.controller = controller;

    try {
      const stream = provider.stream({
        messages: toModelMessages(this.state.conversation, this.systemPrompt),
        signal: controller.signal,
      });

      for await (const chunk of stream) {
        this.apply({
          type: 'message.delta',
          at: this.now(),
          id: assistant.id,
          text: chunk.text,
        });
      }

      this.apply({type: 'message.done', at: this.now(), id: assistant.id});
    } catch (error) {
      if (error instanceof StreamCancelledError || controller.signal.aborted) {
        this.apply({
          type: 'message.cancelled',
          at: this.now(),
          id: assistant.id,
        });
      } else {
        this.apply({type: 'message.failed', at: this.now(), id: assistant.id});
        this.patch({failure: toAgentFailure(error)});
      }
    } finally {
      this.controller = null;
      this.patch({status: 'idle'});
      await this.persist();
    }
  }

  private async persist(): Promise<void> {
    if (this.store === null) {
      return;
    }

    try {
      await this.store.save(this.state.conversation);

      if (this.state.persistence !== 'ready') {
        this.patch({persistence: 'ready'});
      }
    } catch {
      this.patch({persistence: 'unavailable'});
    }
  }

  private apply(event: AgentEvent): void {
    this.patch({
      conversation: reduceConversation(this.state.conversation, event),
    });
  }

  private patch(change: Partial<SessionState>): void {
    this.state = {...this.state, ...change};
    this.listeners.forEach(listener => listener(this.state));
  }
}
