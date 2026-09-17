import {formatBytes, formatDeviceName} from '../src/lib/format';

describe('formatBytes', () => {
  it('formats small and invalid values without decimals', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(-1)).toBe('0 B');
    expect(formatBytes(Number.NaN)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
  });

  it('steps up units and keeps one decimal below a hundred', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 ** 3)).toBe('5.0 GB');
  });

  it('drops the decimal at a hundred and above so columns stay narrow', () => {
    expect(formatBytes(128 * 1024 ** 3)).toBe('128 GB');
  });

  it('stops at the largest known unit', () => {
    expect(formatBytes(4 * 1024 ** 4)).toBe('4.0 TB');
    expect(formatBytes(4096 * 1024 ** 4)).toBe('4096 TB');
  });
});

describe('formatDeviceName', () => {
  it('joins a manufacturer and model that do not overlap', () => {
    expect(formatDeviceName('Google', 'Pixel 8')).toBe('Google Pixel 8');
    expect(formatDeviceName('Xiaomi', 'Redmi Note 12')).toBe(
      'Xiaomi Redmi Note 12',
    );
  });

  it('does not repeat a brand the model already carries', () => {
    // Seen on a real device: manufacturer TECNO, model TECNO KJ6.
    expect(formatDeviceName('TECNO', 'TECNO KJ6')).toBe('TECNO KJ6');
    expect(formatDeviceName('TECNO', 'tecno kj6')).toBe('tecno kj6');
    expect(formatDeviceName('OnePlus', 'OnePlus')).toBe('OnePlus');
  });

  it('does not treat a brand that only looks like a prefix as a duplicate', () => {
    expect(formatDeviceName('Vivo', 'Vivobook 14')).toBe('Vivo Vivobook 14');
  });

  it('keeps the casing the platform reported', () => {
    expect(formatDeviceName('samsung', 'SM-G991B')).toBe('samsung SM-G991B');
  });

  it('survives padded or missing values', () => {
    expect(formatDeviceName('  Google ', ' Pixel 8 ')).toBe('Google Pixel 8');
    expect(formatDeviceName('', 'Pixel 8')).toBe('Pixel 8');
    expect(formatDeviceName('Google', '')).toBe('Google');
    expect(formatDeviceName('', '')).toBe('');
  });
});
