import * as tokens from '../src/design/tokens';

describe('design tokens', () => {
  it('keeps colour out: colour belongs to the theme', () => {
    expect(Object.keys(tokens)).not.toContain('palette');
  });

  it('keeps the spacing scale ascending and on the four pixel base', () => {
    const values = Object.values(tokens.space);

    values.forEach(value => {
      expect(value % 4).toBe(0);
    });

    values.slice(1).forEach((value, index) => {
      expect(value).toBeGreaterThan(values[index]);
    });
  });

  it('keeps the type scale strictly descending', () => {
    const sizes = [
      tokens.typography.display.fontSize,
      tokens.typography.title.fontSize,
      tokens.typography.body.fontSize,
      tokens.typography.label.fontSize,
    ];

    sizes.slice(1).forEach((size, index) => {
      expect(size).toBeLessThan(sizes[index]);
    });
  });

  it('reserves monospace for machine data only', () => {
    expect(tokens.typography.mono.fontFamily).toBe('monospace');
    expect(tokens.typography.body).not.toHaveProperty('fontFamily');
  });

  it('keeps motion durations short enough for a phone', () => {
    Object.values(tokens.motion).forEach(duration => {
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(400);
    });
  });

  it('holds the touch target at the accessibility floor', () => {
    expect(tokens.TOUCH_TARGET).toBeGreaterThanOrEqual(44);
  });
});
