import {motion, palette, space, typography} from '../src/design/tokens';

const HEX = /^#[0-9A-F]{6}$/;

describe('design tokens', () => {
  it('declares every colour as a six digit uppercase hex value', () => {
    Object.values(palette).forEach(value => {
      expect(value).toMatch(HEX);
    });
  });

  it('keeps the spacing scale ascending and on the four pixel base', () => {
    const values = Object.values(space);

    values.forEach(value => {
      expect(value % 4).toBe(0);
    });

    values.slice(1).forEach((value, index) => {
      expect(value).toBeGreaterThan(values[index]);
    });
  });

  it('keeps the type scale strictly descending', () => {
    const sizes = [
      typography.display.fontSize,
      typography.title.fontSize,
      typography.body.fontSize,
      typography.label.fontSize,
    ];

    sizes.slice(1).forEach((size, index) => {
      expect(size).toBeLessThan(sizes[index]);
    });
  });

  it('reserves monospace for machine data only', () => {
    expect(typography.mono.fontFamily).toBe('monospace');
    expect(typography.body).not.toHaveProperty('fontFamily');
  });

  it('keeps motion durations short enough for a phone', () => {
    Object.values(motion).forEach(duration => {
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(400);
    });
  });
});
