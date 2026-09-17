import React from 'react';
import type {ReactTestInstance, ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {App} from '../src/App';

/**
 * The composition root, with nothing mocked.
 *
 * A test renderer has no Kotlin layer, which is exactly the state of a JavaScript-only
 * development build: this suite exists to prove the app then degrades honestly - it says
 * what is missing, keeps both surfaces reachable, and never pretends a model endpoint is
 * there. The screens' own behaviour is covered by ChatScreen.test.tsx and
 * SystemScreen.test.tsx.
 */
async function renderApp(): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(<App />);
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  return renderer;
}

function output(renderer: ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

async function press(
  renderer: ReactTestRenderer,
  testID: string,
): Promise<void> {
  const target: ReactTestInstance | undefined = renderer.root
    .findAllByProps({testID})
    .find(node => typeof node.props.onPress === 'function');

  if (target === undefined) {
    throw new Error(`no pressable found for testID "${testID}"`);
  }

  await act(async () => {
    target.props.onPress();
  });
}

describe('App', () => {
  it('opens on the conversation', async () => {
    const renderer = await renderApp();

    expect(
      renderer.root.findAllByProps({testID: 'chat-screen'}),
    ).not.toHaveLength(0);
    expect(output(renderer)).toContain('devour');
  });

  it('says the endpoint is not configured instead of offering a chat', async () => {
    const rendered = output(await renderApp());

    expect(rendered).toContain('No model is configured');
    expect(rendered).toContain('Configure the model');
  });

  it('warns that this build cannot keep the conversation', async () => {
    const renderer = await renderApp();

    expect(
      renderer.root.findAllByProps({testID: 'chat-persistence'}),
    ).not.toHaveLength(0);
  });

  it('reaches the system screen and comes back', async () => {
    const renderer = await renderApp();

    await press(renderer, 'chat-configure');
    expect(
      renderer.root.findAllByProps({testID: 'system-screen'}),
    ).not.toHaveLength(0);
    expect(output(renderer)).toContain('Native bridge unavailable');

    await press(renderer, 'open-chat');
    expect(
      renderer.root.findAllByProps({testID: 'chat-screen'}),
    ).not.toHaveLength(0);
  });
});
