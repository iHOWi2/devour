import React from 'react';
import type {ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {App} from '../src/App';
import type {DeviceEnvironment} from '../src/native';
import {readEnvironment} from '../src/native';

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

async function render(): Promise<ReactTestRenderer> {
  let renderer: ReactTestRenderer | undefined;

  await act(async () => {
    renderer = create(<App />);
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  return renderer;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('App', () => {
  it('shows the phase and the real device facts once the bridge answers', async () => {
    readEnvironmentMock.mockResolvedValue(environment);

    const output = JSON.stringify((await render()).toJSON());

    expect(output).toContain('Foundation');
    expect(output).toContain('Google Pixel 8');
    expect(output).toContain('termux 0.118.0');
    expect(output).toContain('native bridge connected');
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

    const output = JSON.stringify((await render()).toJSON());

    expect(output).toContain('termux not installed');
  });

  it('shows an honest error state with a retry when the bridge is missing', async () => {
    readEnvironmentMock.mockRejectedValue(new Error('not registered'));

    const output = JSON.stringify((await render()).toJSON());

    expect(output).toContain('Native bridge unavailable');
    expect(output).toContain('not registered');
    expect(output).toContain('Retry');
  });
});
