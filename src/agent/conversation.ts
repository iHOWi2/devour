import type {AgentEvent, Conversation, Message, ModelMessage} from './types';

/**
 * Conversation state as a pure reduction over the event stream.
 *
 * Every screen renders this structure and nothing else, which is what makes rotation and
 * process death survivable: the state is data, so it can be stored and restored.
 */

export function createConversation(id: string, at: number): Conversation {
  return {id, messages: [], createdAt: at, updatedAt: at};
}

export function userMessage(id: string, text: string, at: number): Message {
  return {id, role: 'user', text, status: 'complete', createdAt: at};
}

export function assistantMessage(id: string, at: number): Message {
  return {id, role: 'assistant', text: '', status: 'streaming', createdAt: at};
}

function mapMessage(
  state: Conversation,
  id: string,
  at: number,
  change: (message: Message) => Message,
): Conversation {
  let touched = false;

  const messages = state.messages.map(message => {
    if (message.id !== id) {
      return message;
    }

    touched = true;
    return change(message);
  });

  return touched ? {...state, messages, updatedAt: at} : state;
}

export function reduceConversation(
  state: Conversation,
  event: AgentEvent,
): Conversation {
  switch (event.type) {
    case 'message.add':
      return {
        ...state,
        messages: [...state.messages, event.message],
        updatedAt: event.at,
      };

    case 'message.delta':
      return mapMessage(state, event.id, event.at, message =>
        message.status === 'streaming'
          ? {...message, text: message.text + event.text}
          : message,
      );

    case 'message.done':
      return mapMessage(state, event.id, event.at, message => ({
        ...message,
        status: 'complete',
      }));

    case 'message.cancelled':
      return mapMessage(state, event.id, event.at, message => ({
        ...message,
        status: 'cancelled',
      }));

    case 'message.failed':
      return mapMessage(state, event.id, event.at, message => ({
        ...message,
        status: 'failed',
      }));

    case 'message.drop': {
      const messages = state.messages.filter(
        message => message.id !== event.id,
      );

      return messages.length === state.messages.length
        ? state
        : {...state, messages, updatedAt: event.at};
    }
  }
}

export function lastMessage(state: Conversation): Message | null {
  return state.messages.length === 0
    ? null
    : state.messages[state.messages.length - 1];
}

export function isStreaming(state: Conversation): boolean {
  return state.messages.some(message => message.status === 'streaming');
}

/**
 * A stream that was interrupted by process death is restored as cancelled, not as still
 * running: the request died with the process, and a spinner that can never finish is worse
 * than a partial answer marked as stopped.
 */
export function settleRestoredConversation(state: Conversation): Conversation {
  if (!isStreaming(state)) {
    return state;
  }

  return {
    ...state,
    messages: state.messages.map(message =>
      message.status === 'streaming'
        ? {...message, status: 'cancelled'}
        : message,
    ),
  };
}

/**
 * The request the model sees: the system turn, then every finished turn that carries text.
 * The turn currently streaming is excluded - it is the answer being produced, not context.
 */
export function toModelMessages(
  state: Conversation,
  systemPrompt: string,
): ModelMessage[] {
  const messages: ModelMessage[] = [{role: 'system', content: systemPrompt}];

  state.messages.forEach(message => {
    if (message.status === 'streaming' || message.text.trim().length === 0) {
      return;
    }

    messages.push({role: message.role, content: message.text});
  });

  return messages;
}
