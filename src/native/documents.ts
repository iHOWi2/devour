import {isNativeModuleAvailable, requireNativeModule} from './bridge';

/**
 * Typed boundary over `DevourStorage`: small JSON documents in the application's private
 * files directory, written by Kotlin.
 *
 * This exists because the conversation has to survive process death, which is a Phase 2
 * exit criterion. Kotlin owns the filesystem (docs://ARCHITECTURE.md), so the document
 * store is a native module rather than a JavaScript dependency.
 */
export const STORAGE_MODULE_NAME = 'DevourStorage';

type StorageModule = {
  readDocument(name: string): Promise<string | null>;
  writeDocument(name: string, contents: string): Promise<boolean>;
  deleteDocument(name: string): Promise<boolean>;
};

export function isDocumentStoreAvailable(): boolean {
  return isNativeModuleAvailable(STORAGE_MODULE_NAME);
}

/** Returns the document contents, or null when it has never been written. */
export async function readDocument(name: string): Promise<string | null> {
  const contents = await requireNativeModule<StorageModule>(
    STORAGE_MODULE_NAME,
  ).readDocument(name);

  return typeof contents === 'string' ? contents : null;
}

export async function writeDocument(
  name: string,
  contents: string,
): Promise<void> {
  await requireNativeModule<StorageModule>(STORAGE_MODULE_NAME).writeDocument(
    name,
    contents,
  );
}

export async function deleteDocument(name: string): Promise<void> {
  await requireNativeModule<StorageModule>(STORAGE_MODULE_NAME).deleteDocument(
    name,
  );
}
