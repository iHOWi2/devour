import React from 'react';
import {StyleSheet} from 'react-native';
import type {ReactTestInstance, ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {App} from '../src/App';
import {ThemeProvider} from '../src/design/ThemeProvider';
import {themes} from '../src/design/theme';
import type {ThemePreference} from '../src/design/theme';
import {LanguageProvider} from '../src/i18n';
import type {Language, LanguagePreference} from '../src/i18n';
import type {DeviceEnvironment} from '../src/native';
import {readEnvironment} from '../src/native';
import {FoundationScreen} from '../src/screens/FoundationScreen';

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

type Options = {
  deviceLanguage?: Language;
  language?: LanguagePreference;
  theme?: ThemePreference;
};

async function renderScreen(options: Options = {}): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(
      <LanguageProvider
        deviceLanguage={options.deviceLanguage ?? 'en'}
        initialPreference={options.language ?? 'system'}>
        <ThemeProvider initialPreference={options.theme ?? 'dark'}>
          <FoundationScreen />
        </ThemeProvider>
      </LanguageProvider>,
    );
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  return renderer;
}

function output(renderer: ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

function backgroundColour(renderer: ReactTestRenderer): string | undefined {
  const [root] = renderer.root.findAllByProps({testID: 'foundation-screen'});

  if (root === undefined) {
    throw new Error('the screen root was not found');
  }

  const style = StyleSheet.flatten(root.props.style) as {
    backgroundColor?: string;
  };

  return style.backgroundColor;
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

beforeEach(() => {
  readEnvironmentMock.mockResolvedValue(environment);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('Foundation screen', () => {
  it('shows the phase and the real device facts once the bridge answers', async () => {
    const rendered = output(await renderScreen());

    expect(rendered).toContain('Foundation');
    expect(rendered).toContain('Google Pixel 8');
    expect(rendered).toContain('8 cores');
    expect(rendered).toContain('41.2 GB free of 128 GB');
    expect(rendered).toContain('termux 0.118.0');
    expect(rendered).toContain('native bridge connected');
  });

  it('speaks the device language without being asked', async () => {
    const rendered = output(await renderScreen({deviceLanguage: 'ru'}));

    expect(rendered).toContain('Фундамент');
    expect(rendered).toContain('8 ядер');
    expect(rendered).toContain('41.2 GB свободно из 128 GB');
    expect(rendered).toContain('нативный мост подключён');
    expect(rendered).not.toContain('Foundation');
  });

  it('switches language from the settings row', async () => {
    const renderer = await renderScreen();

    await press(renderer, 'settings-toggle');
    await press(renderer, 'segment-language-ru');

    expect(output(renderer)).toContain('Фундамент');
    expect(output(renderer)).not.toContain('Foundation');
  });

  it('switches theme from the settings row', async () => {
    const renderer = await renderScreen({theme: 'dark'});

    expect(backgroundColour(renderer)).toBe(themes.dark.palette.background);

    await press(renderer, 'settings-toggle');
    await press(renderer, 'segment-theme-light');

    expect(backgroundColour(renderer)).toBe(themes.light.palette.background);
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

    expect(output(await renderScreen({deviceLanguage: 'ru'}))).toContain(
      'termux не установлен',
    );
  });

  it('shows an honest error state with a retry when the bridge is missing', async () => {
    readEnvironmentMock.mockRejectedValue(new Error('not registered'));

    const rendered = output(await renderScreen());

    expect(rendered).toContain('Native bridge unavailable');
    expect(rendered).toContain('not registered');
    expect(rendered).toContain('Retry');
  });

  it('recovers when the user retries', async () => {
    readEnvironmentMock.mockRejectedValueOnce(new Error('not registered'));

    const renderer = await renderScreen();
    expect(output(renderer)).toContain('Native bridge unavailable');

    await press(renderer, 'retry');

    expect(output(renderer)).toContain('Google Pixel 8');
  });
});

describe('App', () => {
  it('mounts with the real providers', async () => {
    let renderer: ReactTestRenderer | undefined;

    await act(async () => {
      renderer = create(<App />);
    });

    expect(JSON.stringify(renderer?.toJSON())).toContain('devour');
  });
});
