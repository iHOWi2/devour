import {NativeModules} from 'react-native';

import {
  API_KEY_SECRET,
  CONVERSATION_DOCUMENT,
  PROVIDER_DOCUMENT,
  createApiKeyStore,
  createConversationStore,
  createProviderSettingsStore,
  parseConversation,
  parseProviderSettings,
} from '../src/agent';
import type {Conversation, DocumentIo, SecretIo} from '../src/agent';
import {
  NativeBridgeUnavailableError,
  SECRETS_MODULE_NAME,
  STORAGE_MODULE_NAME,
  isDocumentStoreAvailable,
  isSecretStoreAvailable,
  readDocument,
  readSecret,
  writeDocument,
  writeSecret,
} from '../src/native';

const modules = NativeModules as Record<string, unknown>;

function memoryDocuments(): DocumentIo & {files: Map<string, string>} {
  const files = new Map<string, string>();

  return {
    files,
    read: name => Promise.resolve(files.get(name) ?? null),
    write: (name, contents) => {
      files.set(name, contents);
      return Promise.resolve();
    },
    remove: name => {
      files.delete(name);
      return Promise.resolve();
    },
  };
}

function memorySecrets(): SecretIo & {values: Map<string, string>} {
  const values = new Map<string, string>();

  return {
    values,
    read: key => Promise.resolve(values.get(key) ?? null),
    write: (key, value) => {
      values.set(key, value);
      return Promise.resolve();
    },
    remove: key => {
      values.delete(key);
      return Promise.resolve();
    },
  };
}

const conversation: Conversation = {
  id: 'c-1',
  createdAt: 10,
  updatedAt: 20,
  messages: [
    {id: 'u-1', role: 'user', text: 'hello', status: 'complete', createdAt: 11},
    {
      id: 'a-1',
      role: 'assistant',
      text: 'hi',
      status: 'complete',
      createdAt: 12,
    },
  ],
};

afterEach(() => {
  delete modules[STORAGE_MODULE_NAME];
  delete modules[SECRETS_MODULE_NAME];
});

describe('conversation documents', () => {
  it('round-trips a conversation', async () => {
    const io = memoryDocuments();
    const store = createConversationStore(io);

    await store.save(conversation);

    expect(io.files.has(CONVERSATION_DOCUMENT)).toBe(true);
    await expect(store.load()).resolves.toEqual(conversation);
  });

  it('reports nothing stored instead of failing on a first run', async () => {
    await expect(
      createConversationStore(memoryDocuments()).load(),
    ).resolves.toBeNull();
  });

  it('treats a corrupt or foreign document as absent', () => {
    expect(parseConversation('{')).toBeNull();
    expect(parseConversation('[]')).toBeNull();
    expect(parseConversation('{"id":"c","messages":"none"}')).toBeNull();
  });

  it('keeps only the turns it can trust', () => {
    const parsed = parseConversation(
      JSON.stringify({
        id: 'c-2',
        createdAt: 1,
        updatedAt: 2,
        messages: [
          {id: 'ok', role: 'user', text: 'fine', status: 'complete'},
          {id: 'bad-role', role: 'tool', text: 'x', status: 'complete'},
          {id: 'no-text', role: 'user', status: 'complete'},
        ],
      }),
    );

    expect(parsed?.messages).toEqual([
      {id: 'ok', role: 'user', text: 'fine', status: 'complete', createdAt: 0},
    ]);
  });

  it('stores at most the most recent turns', async () => {
    const io = memoryDocuments();
    const store = createConversationStore(io);

    await store.save({
      ...conversation,
      messages: Array.from({length: 260}, (unused, index) => ({
        id: `m-${index}`,
        role: 'user' as const,
        text: `turn ${index}`,
        status: 'complete' as const,
        createdAt: index,
      })),
    });

    const stored = parseConversation(io.files.get(CONVERSATION_DOCUMENT) ?? '');

    expect(stored?.messages).toHaveLength(200);
    expect(stored?.messages[0].id).toBe('m-60');
  });

  it('forgets the conversation when asked', async () => {
    const io = memoryDocuments();
    const store = createConversationStore(io);

    await store.save(conversation);
    await store.clear();

    expect(io.files.size).toBe(0);
  });
});

describe('provider settings and the api key', () => {
  it('round-trips settings and rejects a document that is not settings', async () => {
    const io = memoryDocuments();
    const store = createProviderSettingsStore(io);

    await store.save({
      kind: 'openai-compatible',
      baseUrl: 'https://api.example.com/v1',
      model: 'some-model',
    });

    await expect(store.load()).resolves.toEqual({
      kind: 'openai-compatible',
      baseUrl: 'https://api.example.com/v1',
      model: 'some-model',
    });

    expect(parseProviderSettings('{"baseUrl":5}')).toBeNull();
    expect(parseProviderSettings('nonsense')).toBeNull();
  });

  it('keeps the key in the secret store, never in a document', async () => {
    const documents = memoryDocuments();
    const secrets = memorySecrets();
    const keys = createApiKeyStore(secrets);

    await createProviderSettingsStore(documents).save({
      kind: 'openai-compatible',
      baseUrl: 'https://api.example.com/v1',
      model: 'some-model',
    });
    await keys.save('sk-secret');

    expect(JSON.stringify([...documents.files.values()])).not.toContain(
      'sk-secret',
    );
    await expect(keys.load()).resolves.toBe('sk-secret');

    await keys.clear();
    await expect(keys.load()).resolves.toBeNull();
  });
});

describe('native storage bridges', () => {
  it('report themselves missing in a javascript-only build', () => {
    expect(isDocumentStoreAvailable()).toBe(false);
    expect(isSecretStoreAvailable()).toBe(false);
  });

  it('fail with a typed error rather than a crash when the module is absent', async () => {
    await expect(readDocument('x.json')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
    await expect(readSecret('x')).rejects.toBeInstanceOf(
      NativeBridgeUnavailableError,
    );
  });

  it('passes values through to the kotlin modules', async () => {
    const storage = {
      readDocument: jest.fn().mockResolvedValue('{"id":"c"}'),
      writeDocument: jest.fn().mockResolvedValue(true),
      deleteDocument: jest.fn().mockResolvedValue(true),
    };
    const secrets = {
      readSecret: jest.fn().mockResolvedValue('sk-test'),
      writeSecret: jest.fn().mockResolvedValue(true),
      deleteSecret: jest.fn().mockResolvedValue(true),
    };

    modules[STORAGE_MODULE_NAME] = storage;
    modules[SECRETS_MODULE_NAME] = secrets;

    await expect(readDocument('conversation.json')).resolves.toBe('{"id":"c"}');
    await writeDocument('conversation.json', '{}');
    expect(storage.writeDocument).toHaveBeenCalledWith(
      'conversation.json',
      '{}',
    );

    await expect(readSecret('provider.apiKey')).resolves.toBe('sk-test');
    await writeSecret('provider.apiKey', 'sk-test');
    expect(secrets.writeSecret).toHaveBeenCalledWith(
      'provider.apiKey',
      'sk-test',
    );
  });

  it('treats an empty secret as no secret', async () => {
    modules[SECRETS_MODULE_NAME] = {
      readSecret: jest.fn().mockResolvedValue(''),
      writeSecret: jest.fn(),
      deleteSecret: jest.fn(),
    };

    await expect(readSecret('provider.apiKey')).resolves.toBeNull();
  });
});

/**
 * The Kotlin modules validate the name before they touch the filesystem or the keystore, and
 * a name they refuse is a feature that silently cannot save anything. This regression guard
 * exists because `provider.apiKey` was refused on a real phone: the first pattern allowed
 * lowercase letters only, so saving the API key failed with "is not a secret name" while the
 * endpoint settings next to it saved fine.
 *
 * Keep this in step with NAME_PATTERN in DevourStorageModule.kt and KEY_PATTERN in
 * DevourSecretsModule.kt.
 */
const NATIVE_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

describe('the names the native layer is asked to accept', () => {
  it.each([
    ['conversation document', CONVERSATION_DOCUMENT],
    ['provider document', PROVIDER_DOCUMENT],
    ['api key secret', API_KEY_SECRET],
  ])('%s is a name Kotlin will take', (_label, name) => {
    expect(name).toMatch(NATIVE_NAME_PATTERN);
  });

  it('is a pattern that refuses a path, not just an odd character', () => {
    expect('../conversation.json').not.toMatch(NATIVE_NAME_PATTERN);
    expect('nested/conversation.json').not.toMatch(NATIVE_NAME_PATTERN);
    expect('.hidden').not.toMatch(NATIVE_NAME_PATTERN);
    expect('').not.toMatch(NATIVE_NAME_PATTERN);
  });
});
