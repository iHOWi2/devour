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
      tokens.typography.heading.fontSize,
      tokens.typography.body.fontSize,
      tokens.typography.label.fontSize,
      tokens.typography.caption.fontSize,
    ];

    sizes.slice(1).forEach((size, index) => {
      expect(size).toBeLessThan(sizes[index]);
    });
  });

  it('keeps body text at the size a phone can actually be read at', () => {
    expect(tokens.typography.body.fontSize).toBeGreaterThanOrEqual(16);
    expect(tokens.typography.body.lineHeight).toBeGreaterThanOrEqual(
      tokens.typography.body.fontSize * 1.4,
    );
  });

  it('shapes a control, a block and a pill, and not one radius for everything', () => {
    expect(tokens.radius.control).toBeLessThan(tokens.radius.block);
    expect(tokens.radius.block).toBeLessThan(tokens.radius.pill);
  });

  it('reserves monospace for machine data only', () => {
    expect(tokens.typography.mono.fontFamily).toBe('monospace');
    expect(tokens.typography.body).not.toHaveProperty('fontFamily');
  });

  it('keeps every motion duration short enough for a phone', () => {
    Object.values(tokens.motion.duration).forEach(duration => {
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(400);
    });
  });

  it('keeps the duration palette ordered, so a name means a speed', () => {
    const {instant, quick, standard, slow} = tokens.motion.duration;

    expect(instant).toBeLessThan(quick);
    expect(quick).toBeLessThan(standard);
    expect(standard).toBeLessThan(slow);
  });

  /**
   * An entrance decelerates and an exit accelerates: the control points say which is which,
   * because the second handle is what the end of the curve follows.
   */
  it('declares curves that can be handed to a bezier, and in the right character', () => {
    Object.values(tokens.motion.easing).forEach(points => {
      expect(points).toHaveLength(4);
      points.forEach(point => {
        expect(point).toBeGreaterThanOrEqual(0);
        expect(point).toBeLessThanOrEqual(1);
      });
    });

    expect(tokens.motion.easing.signature[3]).toBe(1);
    expect(tokens.motion.easing.exit[1]).toBe(0);
  });

  it('keeps travel distances short enough to read as one movement', () => {
    Object.values(tokens.motion.distance).forEach(distance => {
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(24);
    });
  });

  it('holds the touch target at the accessibility floor', () => {
    expect(tokens.TOUCH_TARGET).toBeGreaterThanOrEqual(44);
  });
});
