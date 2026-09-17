const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * Formats a byte count for one line of machine data: `0 B`, `512 B`, `1.5 KB`, `128 GB`.
 * Values of 100 and above drop the decimal so columns stay narrow on a phone.
 *
 * Units stay in their machine form in every language, and the sentence around them is
 * assembled by the translator, not here - word order is not a formatting concern.
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
