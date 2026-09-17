import React from 'react';
import {StyleSheet} from 'react-native';
import type {ReactTestInstance, ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {AgentProvider} from '../src/agent';
import type {ProviderSettings} from '../src/agent';
import {ThemeProvider} from '../src/design/ThemeProvider';
import {themes} from '../src/design/theme';
import type {ThemePreference} from '../src/design/theme';
import {LanguageProvider} from '../src/i18n';
import type {Language, LanguagePreference} from '../src/i18n';
import type {DeviceEnvironment} from '../src/native';
import {readEnvironment} from '../src/native';
import {SystemScreen} from '../src/screens/SystemScreen';

jest.mock('../src/native', () => ({
  readEnvironment: jest.fn(),
}));

const readEnvironmentMock = readEnvironment as jest.MockedFunction<
  typeof readEnvironment
>;

const environment: DeviceEnvironment = {
  sdkInt: 36,
  release: '16',
  manufacturer: 'Google',
  model: 'Pixel 8',
  abi: 'arm64-v8a',
  cpuCount: 8,
  filesDir: '/data/user/0/com.devour.app/files',
  freeBytes: 44_236_800_000,
  totalBytes: 137_438_953_472,
  runtimeHost: {
    id: 'termux',
    packageName: 'com.termux',
    installed: true,
    versionName: '0.118.0',
  },
};

function flush(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve));
}

type Options = {
  deviceLanguage?: Language;
  language?: LanguagePreference;
  theme?: ThemePreference;
  settings?: ProviderSettings | null;
  storedKey?: string | null;
  failingSave?: boolean;
};

async function renderSystem(options: Options = {}) {
  const saved: ProviderSettings[] = [];
  const keys: Array<string | null> = [];
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <LanguageProvider
        deviceLanguage={options.deviceLanguage ?? 'en'}
        initialPreference={options.language ?? 'system'}>
        <ThemeProvider initialPreference={options.theme ?? 'dark'}>
          <AgentProvider
            apiKeyStore={{
              load: () => Promise.resolve(options.storedKey ?? null),
              save: value => {
                keys.push(value);
                return Promise.resolve();
              },
              clear: () => {
                keys.push(null);
                return Promise.resolve();
              },
            }}
            conversationStore={null}
            resolveProvider={() => {
              throw new Error('the system screen never streams');
            }}
            settingsStore={{
              load: () => Promise.resolve(options.settings ?? null),
              save: value => {
                if (options.failingSave === true) {
                  return Promise.reject(new Error('disk is full'));
                }

                saved.push(value);
                return Promise.resolve();
              },
            }}>
            <SystemScreen onOpenChat={jest.fn()} />
          </AgentProvider>
        </ThemeProvider>
      </LanguageProvider>,
    );
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  await act(async () => {
    await flush();
  });

  return {keys, renderer, saved};
}

function output(renderer: ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

function backgroundColour(renderer: ReactTestRenderer): string | undefined {
  const [root] = renderer.root.findAllByProps({testID: 'system-screen'});

  if (root === undefined) {
    throw new Error('the screen root was not found');
  }

  return (StyleSheet.flatten(root.props.style) as {backgroundColor?: string})
    .backgroundColor;
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

async function press(
  renderer: ReactTestRenderer,
  testID: string,
): Promise<void> {
  await act(async () => {
    find(renderer, testID).props.onPress();
    await flush();
  });
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

beforeEach(() => {
  readEnvironmentMock.mockResolvedValue(environment);
});

afterEach(() => {
  // Only this suite's own mock: jest.resetAllMocks() would also wipe the
  // implementation out of the safe-area mock, which is a jest.fn() too.
  readEnvironmentMock.mockReset();
});

describe('system screen: the device', () => {
  it('shows the real device facts once the bridge answers', async () => {
    const {renderer} = await renderSystem();
    const rendered = output(renderer);

    expect(rendered).toContain('Google Pixel 8');
    expect(rendered).toContain('8 cores');
    expect(rendered).toContain('41.2 GB free of 128 GB');
    expect(rendered).toContain('termux 0.118.0');
    expect(rendered).toContain('native bridge connected');
  });

  it('speaks the device language without being asked', async () => {
    const {renderer} = await renderSystem({deviceLanguage: 'ru'});
    const rendered = output(renderer);

    expect(rendered).toContain('Окружение');
    expect(rendered).toContain('8 ядер');
    expect(rendered).toContain('41.2 GB свободно из 128 GB');
    expect(rendered).toContain('нативный мост подключён');
    expect(rendered).not.toContain('Environment');
  });

  it('marks a missing runtime host instead of hiding it', async () => {
    readEnvironmentMock.mockResolvedValue({
      ...environment,
      runtimeHost: {
        id: 'termux',
        packageName: 'com.termux',
        installed: false,
        versionName: null,
      },
    });

    const {renderer} = await renderSystem({deviceLanguage: 'ru'});

    expect(output(renderer)).toContain('termux не установлен');
  });

  it('shows an honest error state with a retry when the bridge is missing', async () => {
    readEnvironmentMock.mockRejectedValue(new Error('not registered'));

    const {renderer} = await renderSystem();
    const rendered = output(renderer);

    expect(rendered).toContain('Native bridge unavailable');
    expect(rendered).toContain('not registered');
    expect(rendered).toContain('Retry');
  });

  it('recovers when the user retries', async () => {
    readEnvironmentMock.mockRejectedValueOnce(new Error('not registered'));

    const {renderer} = await renderSystem();
    expect(output(renderer)).toContain('Native bridge unavailable');

    await press(renderer, 'retry');

    expect(output(renderer)).toContain('Google Pixel 8');
  });
});

describe('system screen: the interface', () => {
  it('switches language from the settings section', async () => {
    const {renderer} = await renderSystem();

    await press(renderer, 'segment-language-ru');

    expect(output(renderer)).toContain('Окружение');
    expect(output(renderer)).not.toContain('Environment');
  });

  it('switches theme from the settings section', async () => {
    const {renderer} = await renderSystem({theme: 'dark'});

    expect(backgroundColour(renderer)).toBe(themes.dark.palette.background);

    await press(renderer, 'segment-theme-light');

    expect(backgroundColour(renderer)).toBe(themes.light.palette.background);
  });
});

describe('system screen: the model endpoint', () => {
  it('shows the stored endpoint and that a key is already held', async () => {
    const {renderer} = await renderSystem({
      settings: {
        kind: 'openai-compatible',
        baseUrl: 'https://api.example.com/v1',
        model: 'some-model',
      },
      storedKey: 'sk-stored',
    });

    const rendered = output(renderer);
    expect(rendered).toContain('https://api.example.com/v1');
    expect(rendered).toContain('some-model');
    expect(rendered).toContain('stored in the Android keystore');
    expect(rendered).not.toContain('sk-stored');
  });

  it('refuses an endpoint that is not an address, and says which field', async () => {
    const {renderer, saved} = await renderSystem();

    await type(renderer, 'provider-base-url', 'api.example.com');
    await type(renderer, 'provider-model', 'some-model');
    await press(renderer, 'provider-save');

    expect(output(renderer)).toContain(
      'The endpoint must be an http or https address',
    );
    expect(saved).toHaveLength(0);
  });

  it('refuses to save without a model name', async () => {
    const {renderer, saved} = await renderSystem();

    await type(renderer, 'provider-base-url', 'https://api.example.com/v1');
    await press(renderer, 'provider-save');

    expect(output(renderer)).toContain('Enter the model name');
    expect(saved).toHaveLength(0);
  });

  it('stores the endpoint, puts the key in the secret store and clears the field', async () => {
    const {keys, renderer, saved} = await renderSystem();

    await type(renderer, 'provider-base-url', 'https://api.example.com/v1/ ');
    await type(renderer, 'provider-model', ' some-model ');
    await type(renderer, 'provider-api-key', ' sk-typed ');
    await press(renderer, 'provider-save');

    expect(saved).toEqual([
      {
        kind: 'openai-compatible',
        baseUrl: 'https://api.example.com/v1',
        model: 'some-model',
      },
    ]);
    expect(keys).toEqual(['sk-typed']);

    const rendered = output(renderer);
    expect(rendered).toContain('saved');
    expect(rendered).not.toContain('sk-typed');
    expect(rendered).toContain('leave empty to keep the stored key');
  });

  it('forgets the key when asked', async () => {
    const {keys, renderer} = await renderSystem({storedKey: 'sk-stored'});

    await press(renderer, 'provider-clear-key');

    expect(keys).toEqual([null]);
    expect(output(renderer)).toContain('not set');
  });

  it('says so when the settings cannot be written', async () => {
    const {renderer} = await renderSystem({failingSave: true});

    await type(renderer, 'provider-base-url', 'https://api.example.com/v1');
    await type(renderer, 'provider-model', 'some-model');
    await press(renderer, 'provider-save');

    const rendered = output(renderer);
    expect(rendered).toContain('The settings could not be saved');
    expect(rendered).toContain('disk is full');
  });
});
