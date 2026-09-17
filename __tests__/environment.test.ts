import {NativeModules} from 'react-native';

import {
  ENVIRONMENT_MODULE_NAME,
  NativeBridgeUnavailableError,
  isNativeBridgeAvailable,
  normalizeEnvironment,
  readEnvironment,
} from '../src/native';

const modules = NativeModules as Record<string, unknown>;

const fixture = {
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

afterEach(() => {
  delete modules[ENVIRONMENT_MODULE_NAME];
});

describe('native environment bridge', () => {
  it('reports the bridge as missing when the module is not registered', () => {
    expect(isNativeBridgeAvailable()).toBe(false);
  });

  it('fails with a typed error instead of crashing when the bridge is missing', async () => {
    await expect(readEnvironment()).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
  });

  it('reads what the Kotlin layer returns', async () => {
    modules[ENVIRONMENT_MODULE_NAME] = {
      getEnvironment: jest.fn().mockResolvedValue(fixture),
    };

    expect(isNativeBridgeAvailable()).toBe(true);
    await expect(readEnvironment()).resolves.toEqual(fixture);
  });

  it('fills in defaults for anything the native layer omitted', () => {
    expect(normalizeEnvironment({sdkInt: 30})).toEqual({
      sdkInt: 30,
      release: 'unknown',
      manufacturer: 'unknown',
      model: 'unknown',
      abi: 'unknown',
      cpuCount: 0,
      filesDir: 'unknown',
      freeBytes: 0,
      totalBytes: 0,
      runtimeHost: {
        id: 'unknown',
        packageName: 'unknown',
        installed: false,
        versionName: null,
      },
    });
  });
});
