import {isNativeModuleAvailable, requireNativeModule} from './bridge';

/**
 * Typed boundary over `DevourClipboard`.
 *
 * Copying is the one way an answer leaves Devour today, so it is a real capability rather
 * than a convenience: a build without the native module hides the action instead of
 * offering a button that does nothing.
 */
export const CLIPBOARD_MODULE_NAME = 'DevourClipboard';

type ClipboardModule = {
  setString(text: string): Promise<boolean>;
};

export function isClipboardAvailable(): boolean {
  return isNativeModuleAvailable(CLIPBOARD_MODULE_NAME);
}

export async function copyToClipboard(text: string): Promise<void> {
  await requireNativeModule<ClipboardModule>(CLIPBOARD_MODULE_NAME).setString(
    text,
  );
}
