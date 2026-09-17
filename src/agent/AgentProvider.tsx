import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {ProviderNotConfiguredError} from './errors';
import {createProvider} from './providers';
import {AgentSession} from './session';
import type {SessionState} from './session';
import {
  DEFAULT_PROVIDER_SETTINGS,
  isProviderConfigured,
  normalizeProviderSettings,
} from './settings';
import {
  createApiKeyStore,
  createConversationStore,
  createProviderSettingsStore,
} from './storage';
import type {
  ConversationStore,
  ProviderSettingsStore,
  SecretStore,
} from './storage';
import type {ModelProvider, ProviderSettings} from './types';

/**
 * The UI's only door into the agent runtime.
 *
 * The session lives here for the lifetime of the process, so an orientation change - which
 * React Native survives, because the activity declares the configuration changes it handles
 * - does not touch the conversation, and process death is covered by the document store.
 *
 * The API key never enters React state: it sits in a ref, is read when a request is built,
 * and only its presence is exposed to the interface.
 */
export type ProviderDraft = {
  baseUrl: string;
  model: string;
  /** Empty means "keep whatever is already stored". */
  apiKey: string;
};

export type AgentControl = {
  state: SessionState;
  settings: ProviderSettings;
  hasApiKey: boolean;
  configured: boolean;
  /** False until the stored conversation, settings and key have been read. */
  restored: boolean;
  send(text: string): void;
  cancel(): void;
  retry(): void;
  reset(): void;
  saveProvider(draft: ProviderDraft): Promise<void>;
  clearApiKey(): Promise<void>;
};

const AgentContext = createContext<AgentControl | undefined>(undefined);

type Props = {
  children: React.ReactNode;
  /** Tests inject fakes here; the application uses the native stores and XHR streaming. */
  conversationStore?: ConversationStore | null;
  settingsStore?: ProviderSettingsStore | null;
  apiKeyStore?: SecretStore | null;
  resolveProvider?: (
    settings: ProviderSettings,
    apiKey: string | null,
  ) => ModelProvider;
};

export function AgentProvider({
  children,
  conversationStore,
  settingsStore,
  apiKeyStore,
  resolveProvider,
}: Props) {
  const settingsRef = useRef<ProviderSettings>(DEFAULT_PROVIDER_SETTINGS);
  const apiKeyRef = useRef<string | null>(null);

  const stores = useRef({
    conversation:
      conversationStore === undefined
        ? createConversationStore()
        : conversationStore,
    settings:
      settingsStore === undefined
        ? createProviderSettingsStore()
        : settingsStore,
    apiKey: apiKeyStore === undefined ? createApiKeyStore() : apiKeyStore,
  });

  const sessionRef = useRef<AgentSession | null>(null);

  if (sessionRef.current === null) {
    sessionRef.current = new AgentSession({
      store: stores.current.conversation,
      // One place decides whether a request may be made at all, so an unconfigured
      // endpoint always produces the same explained failure rather than a silent attempt.
      resolveProvider: () => {
        const current = settingsRef.current;

        if (!isProviderConfigured(current)) {
          throw new ProviderNotConfiguredError();
        }

        return resolveProvider === undefined
          ? createProvider({settings: current, apiKey: apiKeyRef.current})
          : resolveProvider(current, apiKeyRef.current);
      },
    });
  }

  const session = sessionRef.current;

  const [state, setState] = useState<SessionState>(() => session.getState());
  const [settings, setSettings] = useState<ProviderSettings>(
    DEFAULT_PROVIDER_SETTINGS,
  );
  const [hasApiKey, setHasApiKey] = useState(false);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const unsubscribe = session.subscribe(setState);

    const restore = async () => {
      const {settings: settingsStorage, apiKey: keyStorage} = stores.current;

      try {
        const stored = (await settingsStorage?.load()) ?? null;

        if (stored !== null) {
          settingsRef.current = stored;
          setSettings(stored);
        }
      } catch {
        // Settings that cannot be read are settings that were never written.
      }

      try {
        const key = (await keyStorage?.load()) ?? null;
        apiKeyRef.current = key;
        setHasApiKey(key !== null);
      } catch {
        apiKeyRef.current = null;
        setHasApiKey(false);
      }

      await session.hydrate();
      setRestored(true);
    };

    start(restore());

    return unsubscribe;
  }, [session]);

  const saveProvider = useCallback(async (draft: ProviderDraft) => {
    const next = normalizeProviderSettings(draft);

    await stores.current.settings?.save(next);
    settingsRef.current = next;
    setSettings(next);

    const key = draft.apiKey.trim();

    if (key.length > 0) {
      await stores.current.apiKey?.save(key);
      apiKeyRef.current = key;
      setHasApiKey(true);
    }
  }, []);

  const clearApiKey = useCallback(async () => {
    await stores.current.apiKey?.clear();
    apiKeyRef.current = null;
    setHasApiKey(false);
  }, []);

  const value = useMemo<AgentControl>(
    () => ({
      state,
      settings,
      hasApiKey,
      configured: isProviderConfigured(settings),
      restored,
      send: text => start(session.send(text)),
      cancel: () => session.cancel(),
      retry: () => start(session.retry()),
      reset: () => start(session.reset()),
      saveProvider,
      clearApiKey,
    }),
    [clearApiKey, hasApiKey, restored, saveProvider, session, settings, state],
  );

  return (
    <AgentContext.Provider value={value}>{children}</AgentContext.Provider>
  );
}

/**
 * The session reports every request failure as state, so a rejection reaching here would be
 * a defect in the session rather than a failed request. It is logged instead of vanishing.
 */
function start(work: Promise<void>): void {
  work.catch((error: unknown) => {
    console.error('devour: the agent session rejected', error);
  });
}

export function useAgent(): AgentControl {
  const control = useContext(AgentContext);

  if (control === undefined) {
    throw new Error('useAgent must be used inside an AgentProvider');
  }

  return control;
}
