import {formatBytes, formatStorage} from '../src/lib/format';

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

describe('formatStorage', () => {
  it('reads as one line of machine data', () => {
    expect(formatStorage(44_236_800_000, 137_438_953_472)).toBe(
      '41.2 GB free of 128 GB',
    );
  });
});
