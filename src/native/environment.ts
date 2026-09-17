import {NativeModules} from 'react-native';

/**
 * TypeScript boundary over the Kotlin layer.
 *
 * Nothing outside `src/native` touches `NativeModules`. Values coming across the bridge are
 * normalised here, and a missing native module fails with a typed error instead of crashing,
 * so a JavaScript-only development build degrades honestly.
 */

/** Status of the local execution runtime. Detected in Kotlin, see docs/ARCHITECTURE.md. */
export type RuntimeHostStatus = {
  id: string;
  packageName: string;
  installed: boolean;
  versionName: string | null;
};

export type DeviceEnvironment = {
  sdkInt: number;
  release: string;
  manufacturer: string;
  model: string;
  abi: string;
  cpuCount: number;
  filesDir: string;
  freeBytes: number;
  totalBytes: number;
  runtimeHost: RuntimeHostStatus;
};

export const ENVIRONMENT_MODULE_NAME = 'DevourEnvironment';

/** Thrown when the Kotlin layer is not part of the running binary. */
export class NativeBridgeUnavailableError extends Error {
  constructor(moduleName: string = ENVIRONMENT_MODULE_NAME) {
    super(
      `Native module "${moduleName}" is not registered. Rebuild the Android app so the Kotlin layer is linked.`,
    );
    this.name = 'NativeBridgeUnavailableError';
  }
}

type RawRuntimeHost = Partial<RuntimeHostStatus> | null | undefined;

type RawEnvironment = Partial<Omit<DeviceEnvironment, 'runtimeHost'>> & {
  runtimeHost?: RawRuntimeHost;
};

type EnvironmentModule = {
  getEnvironment(): Promise<RawEnvironment>;
};

function resolveModule(): EnvironmentModule | undefined {
  const modules = NativeModules as Record<
    string,
    EnvironmentModule | undefined
  >;
  return modules[ENVIRONMENT_MODULE_NAME] ?? undefined;
}

export function isNativeBridgeAvailable(): boolean {
  return resolveModule() !== undefined;
}

function numberOr(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function normalizeRuntimeHost(raw: RawRuntimeHost): RuntimeHostStatus {
  return {
    id: stringOr(raw?.id, 'unknown'),
    packageName: stringOr(raw?.packageName, 'unknown'),
    installed: raw?.installed === true,
    versionName: typeof raw?.versionName === 'string' ? raw.versionName : null,
  };
}

export function normalizeEnvironment(raw: RawEnvironment): DeviceEnvironment {
  return {
    sdkInt: numberOr(raw.sdkInt, 0),
    release: stringOr(raw.release, 'unknown'),
    manufacturer: stringOr(raw.manufacturer, 'unknown'),
    model: stringOr(raw.model, 'unknown'),
    abi: stringOr(raw.abi, 'unknown'),
    cpuCount: numberOr(raw.cpuCount, 0),
    filesDir: stringOr(raw.filesDir, 'unknown'),
    freeBytes: numberOr(raw.freeBytes, 0),
    totalBytes: numberOr(raw.totalBytes, 0),
    runtimeHost: normalizeRuntimeHost(raw.runtimeHost),
  };
}

export async function readEnvironment(): Promise<DeviceEnvironment> {
  const native = resolveModule();

  if (native === undefined) {
    throw new NativeBridgeUnavailableError();
  }

  return normalizeEnvironment(await native.getEnvironment());
}
