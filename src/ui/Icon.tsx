import React, {useMemo} from 'react';
import Svg, {Path, Rect} from 'react-native-svg';

import {useTheme} from '../design/ThemeProvider';
import type {Palette} from '../design/theme';

/**
 * Devour's icons, drawn as vectors.
 *
 * The first build used text characters - an upward arrow for send, a chevron for a row that
 * opens. On a real device that turned out to be a bug: the arrow rendered as two broken
 * boxes, because the glyph is simply absent from the font the phone shipped with, and a
 * send button showing "ij" is worse than no icon at all. Nothing user facing may depend on
 * a character existing in an unknown font, so every icon here is geometry the app carries
 * itself.
 *
 * No icon font either: a font is a binary blob with a licence and its own metrics, and it
 * still has to be loaded before the first frame. `react-native-svg` draws these as platform
 * vectors, so they are sharp at any density and any accessibility scale.
 *
 * The set is small and stays small. Every name here is used by a screen; an icon with no
 * caller is deleted, not kept for later.
 */
export const ICON_NAMES = [
  /** Send the draft. */
  'send',
  /** Stop the stream that is running. */
  'stop',
  /** Jump back down to the newest turn. */
  'newest',
  /** Put this text on the clipboard. */
  'copy',
  /** It worked. */
  'check',
  /** Ask the same question again. */
  'again',
  /** This row opens something. */
  'next',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

/**
 * Which text role the icon is drawn in. An icon is text, not decoration: it sits next to
 * words, in the same colour, and asks for a role rather than a hex value - the same rule
 * every other component follows.
 */
export type IconTone = Extract<
  keyof Palette,
  'text' | 'muted' | 'faint' | 'onInverse'
>;

export type IconSize = 16 | 20 | 24;

type Props = {
  name: IconName;
  /** Density independent pixels. 16 sits inside a caption, 24 inside a round control. */
  size?: IconSize;
  tone?: IconTone;
  testID?: string;
};

/**
 * Stroke weight per size, in the coordinates of a 24 unit grid.
 *
 * A single weight scaled down gets spindly: at 16 dp a 1.8 unit stroke lands on 1.2 dp,
 * which is thinner than the hairlines around it. The small sizes are drawn heavier so all
 * three read as the same family.
 */
const STROKE: Readonly<Record<IconSize, number>> = {
  16: 2.1,
  20: 1.9,
  24: 1.75,
};

/**
 * The geometry, on a 24 unit grid with a 2 unit margin.
 *
 * Open paths only, with round caps and joins, which is what makes a seven line icon set
 * look drawn by one hand. `stop` is the exception and the reason: a stop is a solid,
 * because what it means is "the thing that is moving ends here".
 */
const PATHS: Readonly<Record<IconName, readonly string[]>> = {
  send: ['M12 20V5', 'M5.5 11.5 12 5l6.5 6.5'],
  stop: [],
  newest: ['M12 4v15', 'M18.5 12.5 12 19l-6.5-6.5'],
  copy: [
    'M9.5 9.5h9a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 20v-9a1.5 1.5 0 0 1 1.5-1.5z',
    'M5.5 15.5A1.5 1.5 0 0 1 4 14V4.5A1.5 1.5 0 0 1 5.5 3H15a1.5 1.5 0 0 1 1.5 1.5V6',
  ],
  check: ['M4.5 12.5 9.5 18 19.5 6.5'],
  again: ['M20 5.5V11h-5.5', 'M19.5 14a8 8 0 1 1-1.9-8.3L20 8'],
  next: ['M9.5 5 16.5 12 9.5 19'],
};

export function Icon({name, size = 20, tone = 'text', testID}: Props) {
  const theme = useTheme();
  const color = theme.palette[tone];
  const paths = useMemo(() => PATHS[name], [name]);

  return (
    <Svg
      accessibilityElementsHidden
      importantForAccessibility="no"
      height={size}
      testID={testID}
      viewBox="0 0 24 24"
      width={size}>
      {name === 'stop' ? (
        <Rect fill={color} height={11} rx={2.5} width={11} x={6.5} y={6.5} />
      ) : (
        paths.map(path => (
          <Path
            d={path}
            fill="none"
            key={path}
            stroke={color}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={STROKE[size]}
          />
        ))
      )}
    </Svg>
  );
}
