import type {ProviderSettings} from './types';

/**
 * Provider settings: what the user typed, validated once, in one place.
 *
 * Nothing is guessed. An empty configuration stays empty and the chat screen says so,
 * because a default endpoint the user never chose would send their conversation somewhere
 * they did not agree to.
 */
export const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  kind: 'openai-compatible',
  baseUrl: '',
  model: '',
};

/**
 * Deliberately not `new URL(...)`: Hermes ships an incomplete URL implementation, and the
 * question here is narrow - is this an http(s) address with a host. Plain http is allowed
 * because a local model server on the device answers on `http://127.0.0.1`.
 */
const URL_PATTERN = /^https?:\/\/[^\s/?#]+[^\s?#]*$/i;

export type ProviderField = 'baseUrl' | 'model';

export function normalizeProviderSettings(input: {
  baseUrl: string;
  model: string;
}): ProviderSettings {
  return {
    kind: 'openai-compatible',
    baseUrl: input.baseUrl.trim().replace(/\/+$/, ''),
    model: input.model.trim(),
  };
}

/** Returns the first field that is not usable yet, or null when the settings are valid. */
export function validateProviderSettings(input: {
  baseUrl: string;
  model: string;
}): ProviderField | null {
  const settings = normalizeProviderSettings(input);

  if (!URL_PATTERN.test(settings.baseUrl)) {
    return 'baseUrl';
  }

  if (settings.model.length === 0) {
    return 'model';
  }

  return null;
}

export function isProviderConfigured(
  settings: ProviderSettings | null,
): boolean {
  return settings !== null && validateProviderSettings(settings) === null;
}
