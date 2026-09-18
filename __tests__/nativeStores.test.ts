import {NativeModules} from 'react-native';

import {
  CLIPBOARD_MODULE_NAME,
  NativeBridgeUnavailableError,
  SECRETS_MODULE_NAME,
  STORAGE_MODULE_NAME,
  copyToClipboard,
  deleteDocument,
  deleteSecret,
  isClipboardAvailable,
  isDocumentStoreAvailable,
  isSecretStoreAvailable,
  readDocument,
  readSecret,
  writeDocument,
  writeSecret,
} from '../src/native';

/**
 * The boundary over the two Kotlin stores. What is worth testing here is the boundary
 * itself: a missing module has to fail with a typed error rather than a TypeError, and
 * whatever the bridge hands back has to arrive as the declared type - the Kotlin side can
 * resolve null, and a document that was never written is not an error.
 */
const modules = NativeModules as Record<string, unknown>;

afterEach(() => {
  delete modules[STORAGE_MODULE_NAME];
  delete modules[SECRETS_MODULE_NAME];
  delete modules[CLIPBOARD_MODULE_NAME];
});

describe('document store', () => {
  it('reports itself missing when the module is not registered', () => {
    expect(isDocumentStoreAvailable()).toBe(false);
  });

  it('fails with a typed error instead of crashing when the module is missing', async () => {
    await expect(readDocument('conversation.json')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
    await expect(
      writeDocument('conversation.json', '{}'),
    ).rejects.toBeInstanceOf(NativeBridgeUnavailableError);
    await expect(deleteDocument('conversation.json')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
  });

  it('passes the name and the contents through to the module', async () => {
    const readDocumentMock = jest.fn().mockResolvedValue('{"a":1}');
    const writeDocumentMock = jest.fn().mockResolvedValue(true);
    const deleteDocumentMock = jest.fn().mockResolvedValue(true);

    modules[STORAGE_MODULE_NAME] = {
      readDocument: readDocumentMock,
      writeDocument: writeDocumentMock,
      deleteDocument: deleteDocumentMock,
    };

    expect(isDocumentStoreAvailable()).toBe(true);
    await expect(readDocument('conversation.json')).resolves.toBe('{"a":1}');
    await writeDocument('conversation.json', '{"a":1}');
    await deleteDocument('conversation.json');

    expect(readDocumentMock).toHaveBeenCalledWith('conversation.json');
    expect(writeDocumentMock).toHaveBeenCalledWith(
      'conversation.json',
      '{"a":1}',
    );
    expect(deleteDocumentMock).toHaveBeenCalledWith('conversation.json');
  });

  it('treats a document that was never written as null, not as a failure', async () => {
    modules[STORAGE_MODULE_NAME] = {
      readDocument: jest.fn().mockResolvedValue(null),
      writeDocument: jest.fn(),
      deleteDocument: jest.fn(),
    };

    await expect(readDocument('conversation.json')).resolves.toBeNull();
  });
});

describe('secret store', () => {
  it('reports itself missing when the module is not registered', () => {
    expect(isSecretStoreAvailable()).toBe(false);
  });

  it('fails with a typed error instead of crashing when the module is missing', async () => {
    await expect(readSecret('provider.api_key')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
    await expect(
      writeSecret('provider.api_key', 'sk-x'),
    ).rejects.toBeInstanceOf(NativeBridgeUnavailableError);
    await expect(deleteSecret('provider.api_key')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
  });

  it('passes the key and the value through to the module', async () => {
    const readSecretMock = jest.fn().mockResolvedValue('sk-live');
    const writeSecretMock = jest.fn().mockResolvedValue(true);
    const deleteSecretMock = jest.fn().mockResolvedValue(true);

    modules[SECRETS_MODULE_NAME] = {
      readSecret: readSecretMock,
      writeSecret: writeSecretMock,
      deleteSecret: deleteSecretMock,
    };

    expect(isSecretStoreAvailable()).toBe(true);
    await expect(readSecret('provider.api_key')).resolves.toBe('sk-live');
    await writeSecret('provider.api_key', 'sk-live');
    await deleteSecret('provider.api_key');

    expect(readSecretMock).toHaveBeenCalledWith('provider.api_key');
    expect(writeSecretMock).toHaveBeenCalledWith('provider.api_key', 'sk-live');
    expect(deleteSecretMock).toHaveBeenCalledWith('provider.api_key');
  });

  it('reads an absent or emptied secret as null', async () => {
    modules[SECRETS_MODULE_NAME] = {
      readSecret: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(''),
      writeSecret: jest.fn(),
      deleteSecret: jest.fn(),
    };

    await expect(readSecret('provider.api_key')).resolves.toBeNull();
    await expect(readSecret('provider.api_key')).resolves.toBeNull();
  });
});

describe('clipboard', () => {
  it('reports itself missing when the module is not registered', () => {
    expect(isClipboardAvailable()).toBe(false);
  });

  it('fails with a typed error instead of crashing when the module is missing', async () => {
    await expect(copyToClipboard('npm test')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
  });

  it('hands the text over exactly once, and resolves with nothing to say', async () => {
    const setString = jest.fn(() => Promise.resolve(true));
    modules[CLIPBOARD_MODULE_NAME] = {setString};

    await expect(copyToClipboard('npm test')).resolves.toBeUndefined();
    expect(setString).toHaveBeenCalledTimes(1);
    expect(setString).toHaveBeenCalledWith('npm test');
  });
});
