/**
 * The vocabulary of the agent runtime.
 *
 * docs/ARCHITECTURE.md specifies the whole event stream the runtime will emit once tools,
 * permissions and change sets exist. This file declares only what Phase 2 implements -
 * conversation turns and streamed model output. An event nobody emits would be a lie about
 * what the build does, so the rest stays in the document until it is real.
 */

/** Who produced a turn. Tool turns arrive with the tool layer in Phase 5. */
export type MessageRole = 'user' | 'assistant';

/**
 * What happened to a turn. A user turn is always `complete`. An assistant turn starts
 * `streaming` and ends `complete`, `cancelled` (the user stopped it) or `failed`.
 */
export type MessageStatus = 'complete' | 'streaming' | 'cancelled' | 'failed';

export type Message = {
  id: string;
  role: MessageRole;
  text: string;
  status: MessageStatus;
  createdAt: number;
};

export type Conversation = {
  id: string;
  messages: readonly Message[];
  createdAt: number;
  updatedAt: number;
};

/**
 * Events the Phase 2 runtime emits. `reduceConversation` is their only consumer, which is
 * what keeps conversation state a pure function of the stream instead of a pile of setters.
 */
export type AgentEvent =
  | {type: 'message.add'; at: number; message: Message}
  | {type: 'message.delta'; at: number; id: string; text: string}
  | {type: 'message.done'; at: number; id: string}
  | {type: 'message.cancelled'; at: number; id: string}
  | {type: 'message.failed'; at: number; id: string}
  | {type: 'message.drop'; at: number; id: string};

export type ModelRole = 'system' | MessageRole;

export type ModelMessage = {
  role: ModelRole;
  content: string;
};

export type ModelRequest = {
  messages: readonly ModelMessage[];
  /** Cancellation is part of the contract: a phone user must be able to stop a stream. */
  signal?: AbortSignal;
};

export type ModelChunk = {type: 'text'; text: string};

/**
 * The only thing in the application that talks to a model.
 *
 * Swapping an implementation must never require a UI change: the UI subscribes to
 * conversation state and never learns which endpoint produced it.
 */
export interface ModelProvider {
  readonly id: string;
  stream(request: ModelRequest): AsyncIterable<ModelChunk>;
}

/** Phase 2 ships one kind: any endpoint speaking the OpenAI chat-completions protocol. */
export type ProviderKind = 'openai-compatible';

export type ProviderSettings = {
  kind: ProviderKind;
  baseUrl: string;
  model: string;
};
