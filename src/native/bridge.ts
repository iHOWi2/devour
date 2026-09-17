import {NativeModules} from 'react-native';

/**
 * The one place that touches `NativeModules`.
 *
 * Nothing outside `src/native` reaches for the bridge directly, and a module that is not
 * part of the running binary fails with a typed error instead of a `TypeError` deep inside
 * a screen. A JavaScript-only development build then degrades honestly: the feature says it
 * is unavailable rather than crashing the app.
 */

/** Thrown when the Kotlin layer, or one module of it, is not linked into the build. */
export class NativeBridgeUnavailableError extends Error {
  readonly moduleName: string;

  constructor(moduleName: string) {
    super(
      `Native module "${moduleName}" is not registered. Rebuild the Android app so the Kotlin layer is linked.`,
    );
    this.name = 'NativeBridgeUnavailableError';
    this.moduleName = moduleName;
  }
}

export function resolveNativeModule<Module>(name: string): Module | undefined {
  const modules = NativeModules as Record<string, Module | undefined>;

  return modules[name] ?? undefined;
}

export function isNativeModuleAvailable(name: string): boolean {
  return resolveNativeModule(name) !== undefined;
}

export function requireNativeModule<Module>(name: string): Module {
  const module = resolveNativeModule<Module>(name);

  if (module === undefined) {
    throw new NativeBridgeUnavailableError(name);
  }

  return module;
}
