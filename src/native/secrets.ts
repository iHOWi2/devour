import {isNativeModuleAvailable, requireNativeModule} from './bridge';

/**
 * Typed boundary over `DevourSecrets`: values that must not sit in a readable file.
 *
 * An API key is the first one. The Kotlin side encrypts with a key held in the Android
 * keystore, so the stored bytes are useless without the device. The plaintext exists in
 * JavaScript only for as long as a request needs it and is never written to a document,
 * never logged and never put into React state.
 */
export const SECRETS_MODULE_NAME = 'DevourSecrets';

type SecretsModule = {
  readSecret(key: string): Promise<string | null>;
  writeSecret(key: string, value: string): Promise<boolean>;
  deleteSecret(key: string): Promise<boolean>;
};

export function isSecretStoreAvailable(): boolean {
  return isNativeModuleAvailable(SECRETS_MODULE_NAME);
}

/** Returns the stored secret, or null when nothing is stored under that key. */
export async function readSecret(key: string): Promise<string | null> {
  const value = await requireNativeModule<SecretsModule>(
    SECRETS_MODULE_NAME,
  ).readSecret(key);

  return typeof value === 'string' && value.length > 0 ? value : null;
}

export async function writeSecret(key: string, value: string): Promise<void> {
  await requireNativeModule<SecretsModule>(SECRETS_MODULE_NAME).writeSecret(
    key,
    value,
  );
}

export async function deleteSecret(key: string): Promise<void> {
  await requireNativeModule<SecretsModule>(SECRETS_MODULE_NAME).deleteSecret(
    key,
  );
}
