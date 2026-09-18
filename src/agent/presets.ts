/**
 * Endpoints people actually use, as one tap each.
 *
 * Typing `https://openrouter.ai/api/v1` on a phone keyboard is the single worst moment in
 * setting Devour up, and a typo in it looks exactly like a network failure. The presets
 * fill both fields and stay editable; none of them is a default, because Devour still
 * refuses to send a conversation to an endpoint the user did not choose.
 *
 * Model names are starting points, not promises: an endpoint can retire a model without
 * asking us, which is why the field next to them is a text field.
 */
export type ProviderPreset = {
  id: string;
  /** A brand or a hostname. Not translated: these are names, not words. */
  label: string;
  baseUrl: string;
  model: string;
};

export const PROVIDER_PRESETS: readonly ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    model: 'openai/gpt-4o-mini',
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
  },
  {
    // llama.cpp and every wrapper around it answer here and ignore the model name, so the
    // value is a placeholder the field still requires.
    id: 'localhost',
    label: 'Localhost',
    baseUrl: 'http://127.0.0.1:8080/v1',
    model: 'local-model',
  },
];
