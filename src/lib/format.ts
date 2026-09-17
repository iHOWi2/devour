const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Formats a byte count for one line of machine data: `0 B`, `512 B`, `1.5 KB`, `128 GB`.
 * Values of 100 and above drop the decimal so columns stay narrow on a phone.
 */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }

  let value = bytes;
  let unit = 0;

  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const decimals = unit === 0 || value >= 100 ? 0 : 1;
  return `${value.toFixed(decimals)} ${UNITS[unit]}`;
}

/** `41.2 GB free of 128 GB` */
export function formatStorage(freeBytes: number, totalBytes: number): string {
  return `${formatBytes(freeBytes)} free of ${formatBytes(totalBytes)}`;
}
