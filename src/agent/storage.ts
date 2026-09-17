import {
  deleteDocument,
  deleteSecret,
  readDocument,
  readSecret,
  writeDocument,
  writeSecret,
} from '../native';
import type {
  Conversation,
  Message,
  MessageRole,
  MessageStatus,
  ProviderSettings,
} from './types';

/**
 * Persistence for the agent runtime.
 *
 * Two different problems, deliberately kept apart: the conversation and the endpoint
 * settings are documents in the application's private files directory, while the API key is
 * a secret held in the Android keystore. Writing a key into a JSON document would be a
 * quiet downgrade of the user's security for our convenience.
 *
 * Everything read back from storage is validated. A document written by an older build, a
 * half-written file or a hand-edited one must not be able to crash the app, so a shape that
 * does not parse is treated as absent.
 */
export const CONVERSATION_DOCUMENT = 'conversation.json';
export const PROVIDER_DOCUMENT = 'provider.json';
export const API_KEY_SECRET = 'provider.apiKey';

/** How many turns are kept. A phone has a small disk and a long memory is not the feature. */
export const CONVERSATION_LIMIT = 200;

export type DocumentIo = {
  read(name: string): Promise<string | null>;
  write(name: string, contents: string): Promise<void>;
  remove(name: string): Promise<void>;
};

export type SecretIo = {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export const nativeDocumentIo: DocumentIo = {
  read: readDocument,
  write: writeDocument,
  remove: deleteDocument,
};

export const nativeSecretIo: SecretIo = {
  read: readSecret,
  write: writeSecret,
  remove: deleteSecret,
};

const ROLES: readonly MessageRole[] = ['user', 'assistant'];
const STATUSES: readonly MessageStatus[] = [
  'complete',
  'streaming',
  'cancelled',
  'failed',
];

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function parseMessage(value: unknown): Message | null {
  const record = asRecord(value);

  if (record === null) {
    return null;
  }

  const {id, role, text, status, createdAt} = record;

  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  if (typeof role !== 'string' || !ROLES.includes(role as MessageRole)) {
    return null;
  }

  if (
    typeof status !== 'string' ||
    !STATUSES.includes(status as MessageStatus)
  ) {
    return null;
  }

  if (typeof text !== 'string') {
    return null;
  }

  return {
    id,
    role: role as MessageRole,
    text,
    status: status as MessageStatus,
    createdAt: typeof createdAt === 'number' ? createdAt : 0,
  };
}

export function parseConversation(raw: string): Conversation | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const record = asRecord(parsed);

  if (record === null || typeof record.id !== 'string') {
    return null;
  }

  if (!Array.isArray(record.messages)) {
    return null;
  }

  const messages = record.messages
    .map(parseMessage)
    .filter((message): message is Message => message !== null);

  const createdAt = typeof record.createdAt === 'number' ? record.createdAt : 0;

  return {
    id: record.id,
    messages,
    createdAt,
    updatedAt:
      typeof record.updatedAt === 'number' ? record.updatedAt : createdAt,
  };
}

export function parseProviderSettings(raw: string): ProviderSettings | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const record = asRecord(parsed);

  if (record === null) {
    return null;
  }

  const {baseUrl, model} = record;

  if (typeof baseUrl !== 'string' || typeof model !== 'string') {
    return null;
  }

  return {kind: 'openai-compatible', baseUrl, model};
}

export type ConversationStore = {
  load(): Promise<Conversation | null>;
  save(conversation: Conversation): Promise<void>;
  clear(): Promise<void>;
};

export function createConversationStore(
  io: DocumentIo = nativeDocumentIo,
): ConversationStore {
  return {
    async load() {
      const raw = await io.read(CONVERSATION_DOCUMENT);

      return raw === null ? null : parseConversation(raw);
    },

    async save(conversation) {
      const messages =
        conversation.messages.length > CONVERSATION_LIMIT
          ? conversation.messages.slice(-CONVERSATION_LIMIT)
          : conversation.messages;

      await io.write(
        CONVERSATION_DOCUMENT,
        JSON.stringify({...conversation, messages}),
      );
    },

    clear() {
      return io.remove(CONVERSATION_DOCUMENT);
    },
  };
}

export type ProviderSettingsStore = {
  load(): Promise<ProviderSettings | null>;
  save(settings: ProviderSettings): Promise<void>;
};

export function createProviderSettingsStore(
  io: DocumentIo = nativeDocumentIo,
): ProviderSettingsStore {
  return {
    async load() {
      const raw = await io.read(PROVIDER_DOCUMENT);

      return raw === null ? null : parseProviderSettings(raw);
    },

    async save(settings) {
      await io.write(PROVIDER_DOCUMENT, JSON.stringify(settings));
    },
  };
}

export type SecretStore = {
  load(): Promise<string | null>;
  save(value: string): Promise<void>;
  clear(): Promise<void>;
};

export function createApiKeyStore(io: SecretIo = nativeSecretIo): SecretStore {
  return {
    load() {
      return io.read(API_KEY_SECRET);
    },

    save(value) {
      return io.write(API_KEY_SECRET, value);
    },

    clear() {
      return io.remove(API_KEY_SECRET);
    },
  };
}
