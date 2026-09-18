import React, {useMemo} from 'react';
import {Animated, Pressable, StyleSheet} from 'react-native';

import {usePressScale, useSwap} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius} from '../design/tokens';
import {Icon} from './Icon';
import type {IconName, IconTone} from './Icon';

/**
 * An action that is only its icon.
 *
 * The first build wrote the word next to the picture - a copy icon labelled `Copy`, a
 * circular arrow labelled `Again` - and on a phone that is twice the ink for one meaning.
 * The author's verdict was blunt and correct: it is obvious without the caption. The word
 * is still there, it is just spoken rather than drawn, so a screen reader announces exactly
 * what it did before.
 *
 * Icon-only is not a licence for mystery meat. It is used for the two actions every chat
 * has had for years, and nothing else: copy this, and ask again. Anything a user would have
 * to guess at keeps its label.
 */

/**
 * Drawn diameter, and the slop that pads the touch area out to `TOUCH_TARGET`.
 *
 * A 44 px circle under a paragraph is a button that shouts; the ink can be smaller than the
 * finger as long as the finger is what the rule is measured against.
 */
const DIAMETER = 36;
const SLOP = (TOUCH_TARGET - DIAMETER) / 2;

type Props = {
  icon: IconName;
  /** Said out loud, not written on screen. Never omitted. */
  label: string;
  onPress: () => void;
  tone?: IconTone;
  testID?: string;
};

export function IconAction({
  icon,
  label,
  onPress,
  tone = 'muted',
  testID,
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const press = usePressScale();
  const swap = useSwap(icon);

  return (
    <Animated.View style={press.style}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole="button"
        hitSlop={SLOP}
        onPress={onPress}
        onPressIn={press.onPressIn}
        onPressOut={press.onPressOut}
        style={({pressed}) => [styles.button, pressed && styles.pressed]}
        testID={testID}>
        <Animated.View style={swap}>
          <Icon name={icon} size={20} tone={tone} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    button: {
      width: DIAMETER,
      height: DIAMETER,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      backgroundColor: theme.palette.surface,
    },
  });
}
