import {
  assistantMessage,
  createConversation,
  isStreaming,
  lastMessage,
  reduceConversation,
  settleRestoredConversation,
  toModelMessages,
  userMessage,
} from '../src/agent';
import type {Conversation} from '../src/agent';

function conversationWithTurn(): {state: Conversation; id: string} {
  const empty = createConversation('c-1', 1000);
  const withUser = reduceConversation(empty, {
    type: 'message.add',
    at: 1001,
    message: userMessage('u-1', 'add firebase auth', 1001),
  });
  const assistant = assistantMessage('a-1', 1002);

  return {
    state: reduceConversation(withUser, {
      type: 'message.add',
      at: 1002,
      message: assistant,
    }),
    id: assistant.id,
  };
}

describe('conversation state', () => {
  it('appends turns and moves the clock forward', () => {
    const {state} = conversationWithTurn();

    expect(state.messages).toHaveLength(2);
    expect(state.updatedAt).toBe(1002);
    expect(lastMessage(state)?.role).toBe('assistant');
  });

  it('accumulates deltas into the streaming turn only', () => {
    const {state, id} = conversationWithTurn();

    const first = reduceConversation(state, {
      type: 'message.delta',
      at: 1003,
      id,
      text: 'Firebase ',
    });
    const second = reduceConversation(first, {
      type: 'message.delta',
      at: 1004,
      id,
      text: 'needs a plan.',
    });

    expect(second.messages[1].text).toBe('Firebase needs a plan.');
    expect(second.messages[0].text).toBe('add firebase auth');
    expect(isStreaming(second)).toBe(true);
  });

  it('ignores a delta that arrives after the turn finished', () => {
    const {state, id} = conversationWithTurn();

    const done = reduceConversation(state, {
      type: 'message.done',
      at: 1005,
      id,
    });
    const late = reduceConversation(done, {
      type: 'message.delta',
      at: 1006,
      id,
      text: 'too late',
    });

    expect(late.messages[1].status).toBe('complete');
    expect(late.messages[1].text).toBe('');
  });

  it('keeps the partial answer when a stream is cancelled', () => {
    const {state, id} = conversationWithTurn();

    const partial = reduceConversation(state, {
      type: 'message.delta',
      at: 1003,
      id,
      text: 'Start by',
    });
    const cancelled = reduceConversation(partial, {
      type: 'message.cancelled',
      at: 1004,
      id,
    });

    expect(cancelled.messages[1]).toMatchObject({
      status: 'cancelled',
      text: 'Start by',
    });
  });

  it('drops a turn when the user retries, and leaves the rest alone', () => {
    const {state, id} = conversationWithTurn();

    const dropped = reduceConversation(state, {
      type: 'message.drop',
      at: 1010,
      id,
    });

    expect(dropped.messages).toHaveLength(1);
    expect(dropped.messages[0].id).toBe('u-1');
  });

  it('leaves state untouched when the event names an unknown turn', () => {
    const {state} = conversationWithTurn();

    expect(
      reduceConversation(state, {
        type: 'message.done',
        at: 2000,
        id: 'nope',
      }),
    ).toBe(state);
  });

  it('restores an interrupted stream as cancelled, never as running', () => {
    const {state} = conversationWithTurn();

    const restored = settleRestoredConversation(state);

    expect(isStreaming(restored)).toBe(false);
    expect(restored.messages[1].status).toBe('cancelled');
  });

  it('sends the system turn plus finished turns, never the one being written', () => {
    const {state, id} = conversationWithTurn();

    const partial = reduceConversation(state, {
      type: 'message.delta',
      at: 1003,
      id,
      text: 'half an answer',
    });

    expect(toModelMessages(partial, 'you are devour')).toEqual([
      {role: 'system', content: 'you are devour'},
      {role: 'user', content: 'add firebase auth'},
    ]);
  });
});
