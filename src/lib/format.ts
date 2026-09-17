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

/**
 * Joins the manufacturer and the model into one device name without saying the brand twice.
 *
 * Android reports the two independently, and plenty of vendors already put the brand inside
 * the model. The first real phone this build ran on reports manufacturer `TECNO` and model
 * `TECNO KJ6`, which rendered as "TECNO TECNO KJ6". The brand is only prepended when the
 * model does not already start with it.
 *
 * Casing is left exactly as the platform reports it (`samsung`, `TECNO`): this row shows
 * machine facts, and prettifying them would make the screen less trustworthy, not more.
 */
export function formatDeviceName(manufacturer: string, model: string): string {
  const brand = manufacturer.trim();
  const name = model.trim();

  if (brand.length === 0) {
    return name;
  }

  if (name.length === 0) {
    return brand;
  }

  const lowerBrand = brand.toLowerCase();
  const lowerName = name.toLowerCase();

  // A trailing space keeps `Vivo` + `Vivobook 14` from looking like a duplicate.
  if (lowerName === lowerBrand || lowerName.startsWith(`${lowerBrand} `)) {
    return name;
  }

  return `${brand} ${name}`;
}
