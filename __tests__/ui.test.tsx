import React from 'react';
import {StyleSheet, processColor} from 'react-native';
import type {ReactTestInstance, ReactTestRenderer} from 'react-test-renderer';
import {act, create} from 'react-test-renderer';

import {themes} from '../src/design/theme';
import {TOUCH_TARGET} from '../src/design/tokens';
import {ThemeProvider} from '../src/design/ThemeProvider';
import {LanguageProvider} from '../src/i18n';
import type {Language} from '../src/i18n';
import {ActionButton} from '../src/ui/ActionButton';
import type {ButtonTone} from '../src/ui/ActionButton';
import {CopyAction} from '../src/ui/CopyAction';
import {GhostLines} from '../src/ui/GhostLines';
import {ICON_NAMES, Icon} from '../src/ui/Icon';
import {IconAction} from '../src/ui/IconAction';
import {Markdown} from '../src/ui/Markdown';
import {SettingRow} from '../src/ui/SettingRow';
import {StateLine} from '../src/ui/StateLine';

const palette = themes.dark.palette;

/**
 * Every tree this file mounts, so it can be taken down again.
 *
 * The motion layer asks the device whether it wants less motion, and that answer arrives as
 * a promise. A tree left mounted resolves it after Jest has torn the environment down,
 * which prints a stack trace next to a passing test - so each test unmounts what it
 * mounted and lets the pending work land first.
 */
const mounted: ReactTestRenderer[] = [];

afterEach(async () => {
  await act(async () => {
    mounted.splice(0).forEach(renderer => renderer.unmount());
    await new Promise(resolve => setImmediate(resolve));
  });
});

function render(
  node: React.ReactElement,
  language: Language = 'en',
): ReactTestRenderer {
  let renderer: ReactTestRenderer | undefined;

  act(() => {
    renderer = create(
      <LanguageProvider deviceLanguage={language} initialPreference="system">
        <ThemeProvider initialPreference="dark">{node}</ThemeProvider>
      </LanguageProvider>,
    );
  });

  if (renderer === undefined) {
    throw new Error('renderer was not created');
  }

  mounted.push(renderer);

  return renderer;
}

function json(renderer: ReactTestRenderer): string {
  return JSON.stringify(renderer.toJSON());
}

/** Every host node of a kind, which is how a vector is told apart from a character. */
function hosts(renderer: ReactTestRenderer, type: string): ReactTestInstance[] {
  return renderer.root.findAll(
    node => typeof node.type === 'string' && node.type === type,
  );
}

function host(renderer: ReactTestRenderer, testID: string): ReactTestInstance {
  const found = renderer.root.findAll(
    node => typeof node.type === 'string' && node.props.testID === testID,
  );

  if (found.length === 0) {
    throw new Error(`no host element with testID "${testID}"`);
  }

  return found[0];
}

/** The element that carries the handler, which on a Pressable is not the host view. */
function pressable(
  renderer: ReactTestRenderer,
  testID: string,
): ReactTestInstance {
  const found = renderer.root
    .findAll(node => node.props.testID === testID)
    .find(node => typeof node.props.onPress === 'function');

  if (found === undefined) {
    throw new Error(`no pressable element with testID "${testID}"`);
  }

  return found;
}

function style(node: ReactTestInstance): Record<string, unknown> {
  return (StyleSheet.flatten(node.props.style) ?? {}) as Record<
    string,
    unknown
  >;
}

function labelColour(renderer: ReactTestRenderer): unknown {
  return style(hosts(renderer, 'Text')[0]).color;
}

describe('icons', () => {
  /**
   * The reason this component exists: on a real device the send button rendered the Unicode
   * arrow as two empty boxes, because the font the phone shipped with does not have that
   * character. Geometry cannot go missing, so every icon is asserted to be geometry.
   */
  it('draws every icon as vector geometry and never as a character', () => {
    ICON_NAMES.forEach(name => {
      const renderer = render(<Icon name={name} testID="icon" />);
      const drawn = [
        ...hosts(renderer, 'RNSVGPath'),
        ...hosts(renderer, 'RNSVGRect'),
      ];

      expect(drawn.length).toBeGreaterThan(0);
      expect(hosts(renderer, 'Text')).toHaveLength(0);
    });
  });

  it('takes its colour from the role it was asked for, not from a hex value', () => {
    const renderer = render(<Icon name="copy" tone="muted" />);

    expect(json(renderer)).toContain(String(processColor(palette.muted)));
  });

  /**
   * One stroke weight scaled down reads as a thinner icon, not a smaller one, so the small
   * sizes are drawn heavier on purpose.
   */
  it('keeps the visual weight even across the three sizes', () => {
    const weight = (size: 16 | 20 | 24) =>
      hosts(render(<Icon name="next" size={size} />), 'RNSVGPath')[0].props
        .strokeWidth as number;

    expect(weight(16)).toBeGreaterThan(weight(20));
    expect(weight(20)).toBeGreaterThan(weight(24));
  });
});

describe('ghost lines', () => {
  it('draws the shape of a paragraph and says in words what it is', () => {
    const renderer = render(
      <GhostLines label="waiting for the model" testID="ghost" />,
    );

    expect(host(renderer, 'ghost').props.accessibilityLabel).toBe(
      'waiting for the model',
    );
    expect(
      renderer.root.findAll(
        node =>
          typeof node.type === 'string' && node.props.testID === 'ghost-bar',
      ),
    ).toHaveLength(3);
  });
});

describe('buttons', () => {
  /**
   * A label the same colour as the block under it is invisible, and that is not a
   * hypothetical: the retry button on a failure line used the page's text colour on an
   * inverted fill, which in the dark theme meant white on white.
   */
  it('never draws a label in the colour of the surface under it', () => {
    const tones: ButtonTone[] = ['primary', 'quiet', 'ghost', 'contrast'];

    tones.forEach(tone => {
      const renderer = render(
        <ActionButton
          label="Retry"
          onPress={() => {}}
          testID="button"
          tone={tone}
        />,
      );
      const surface =
        style(host(renderer, 'button')).backgroundColor ?? palette.background;

      expect(labelColour(renderer)).not.toBe(surface);
    });
  });

  it('keeps the action on an alert line readable against the alert itself', () => {
    const renderer = render(
      <StateLine
        action={{label: 'Retry', onPress: () => {}, testID: 'retry'}}
        testID="line"
        text="The endpoint returned an error"
        tone="alert"
      />,
    );

    expect(style(host(renderer, 'line')).backgroundColor).toBe(palette.inverse);
    expect(labelColour(renderer)).not.toBe(palette.inverse);
  });

  it('never draws an icon next to a word that already says it', () => {
    expect(
      hosts(
        render(<ActionButton label="Again" onPress={() => {}} />),
        'RNSVGPath',
      ),
    ).toHaveLength(0);
  });
});

describe('icon-only actions', () => {
  /**
   * The author's verdict on the first pass: a copy icon captioned `Copy` is twice the ink
   * for one meaning, and everyone already knows what the two chat actions do. The word did
   * not disappear, it stopped being drawn.
   */
  it('says its name out loud instead of writing it next to the icon', () => {
    const renderer = render(
      <IconAction icon="again" label="Again" onPress={() => {}} testID="act" />,
    );

    expect(host(renderer, 'act').props.accessibilityLabel).toBe('Again');
    expect(hosts(renderer, 'RNSVGPath').length).toBeGreaterThan(0);
    expect(hosts(renderer, 'Text')).toHaveLength(0);
  });

  /**
   * A 44 px circle under a paragraph is a button that shouts, so the ink is 36. The rule is
   * about the finger, not the ink: `hitSlop` has to make up the difference.
   */
  it('keeps the touch area at the floor even though the circle is smaller', () => {
    const renderer = render(
      <IconAction icon="copy" label="Copy" onPress={() => {}} testID="act" />,
    );
    const button = host(renderer, 'act');
    const drawn = style(button).width as number;
    const slop = button.props.hitSlop as number;

    expect(drawn).toBeLessThan(TOUCH_TARGET);
    expect(drawn + slop * 2).toBeGreaterThanOrEqual(TOUCH_TARGET);
  });
});

describe('rows', () => {
  it('marks a row that opens something with a drawn chevron', () => {
    const renderer = render(
      <SettingRow label="Theme" onPress={() => {}} testID="row" />,
    );

    expect(hosts(renderer, 'RNSVGPath').length).toBeGreaterThan(0);
    expect(json(renderer)).not.toContain('\u203a');
  });
});

describe('copy action', () => {
  it('confirms with a tick, and only once the clipboard took the text', async () => {
    const renderer = render(
      <CopyAction
        copiedLabel="Copied"
        label="Copy"
        onCopy={() => Promise.resolve()}
        testID="copy"
      />,
    );

    expect(host(renderer, 'copy').props.accessibilityLabel).toBe('Copy');
    expect(hosts(renderer, 'Text')).toHaveLength(0);

    await act(async () => {
      pressable(renderer, 'copy').props.onPress();
    });

    expect(host(renderer, 'copy').props.accessibilityLabel).toBe('Copied');
  });

  it('says nothing when the clipboard refused', async () => {
    const renderer = render(
      <CopyAction
        copiedLabel="Copied"
        label="Copy"
        onCopy={() => Promise.reject(new Error('no clipboard'))}
        testID="copy"
      />,
    );

    await act(async () => {
      pressable(renderer, 'copy').props.onPress();
    });

    expect(host(renderer, 'copy').props.accessibilityLabel).toBe('Copy');
  });
});

describe('code blocks', () => {
  const listing = (count: number) =>
    Array.from({length: count}, (_, index) => `line ${index + 1}`).join('\n');

  it('folds a finished listing and says how many lines are hidden', () => {
    const renderer = render(
      <Markdown text={'```ts\n' + listing(30) + '\n```'} />,
    );

    expect(json(renderer)).toContain('line 14');
    expect(json(renderer)).not.toContain('line 30');
    expect(json(renderer)).toContain('Show all 30 lines');

    act(() => {
      pressable(renderer, 'code-fold').props.onPress();
    });

    expect(json(renderer)).toContain('line 30');
    expect(json(renderer)).toContain('Show less');
  });

  it('counts the lines in correct russian', () => {
    expect(
      json(render(<Markdown text={'```\n' + listing(22) + '\n```'} />, 'ru')),
    ).toContain('Показать все 22 строки');
    expect(
      json(render(<Markdown text={'```\n' + listing(30) + '\n```'} />, 'ru')),
    ).toContain('Показать все 30 строк');
  });

  it('never folds a listing that is still arriving', () => {
    const renderer = render(<Markdown text={'```ts\n' + listing(30)} />);

    expect(json(renderer)).toContain('line 30');
    expect(json(renderer)).not.toContain('code-fold');
  });

  it('names an unnamed fence in the reader language', () => {
    expect(json(render(<Markdown text={'```\nls\n```'} />))).toContain('code');
    expect(json(render(<Markdown text={'```\nls\n```'} />, 'ru'))).toContain(
      'код',
    );
  });
});
