import {ProviderNotConfiguredError} from '../errors';
import {isProviderConfigured} from '../settings';
import {createXhrTransport} from '../transport';
import type {StreamTransport} from '../transport';
import type {ModelProvider, ProviderSettings} from '../types';
import {createOpenAiCompatibleProvider} from './openaiCompatible';

export {
  PROVIDER_ID,
  chatCompletionsUrl,
  createOpenAiCompatibleProvider,
  extractDelta,
} from './openaiCompatible';

export type CreateProviderOptions = {
  settings: ProviderSettings | null;
  apiKey: string | null;
  /** Tests inject a transport; the application streams over XHR. */
  transport?: StreamTransport;
};

/**
 * Builds the provider for the current settings, or refuses.
 *
 * Refusing is a feature: the chat screen turns `ProviderNotConfiguredError` into a state
 * that tells the user what is missing, instead of sending a request nowhere.
 */
export function createProvider({
  settings,
  apiKey,
  transport,
}: CreateProviderOptions): ModelProvider {
  if (settings === null || !isProviderConfigured(settings)) {
    throw new ProviderNotConfiguredError();
  }

  switch (settings.kind) {
    case 'openai-compatible':
      return createOpenAiCompatibleProvider({
        settings,
        apiKey,
        transport: transport ?? createXhrTransport(),
      });
  }
}
