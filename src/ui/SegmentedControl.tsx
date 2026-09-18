import React, {useMemo, useRef, useState} from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {easing, useReducedMotion} from '../design/motion';
import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {
  TOUCH_TARGET,
  motion,
  radius,
  space,
  typography,
} from '../design/tokens';

export type Segment<Value extends string> = {
  value: Value;
  label: string;
  /** Spoken name when the visible label is an abbreviation such as `RU`. */
  accessibilityLabel?: string;
  testID?: string;
};

type Props<Value extends string> = {
  label: string;
  value: Value;
  segments: ReadonlyArray<Segment<Value>>;
  onChange: (value: Value) => void;
};

/**
 * Three choices at most, full width, 44 px tall so a thumb can hit any of them.
 *
 * The selection is a filled block that slides to the choice the user made: the movement is
 * the confirmation, which is what motion is for. The still state carries the same
 * information - filled block, inverted label - so nothing depends on having seen it move.
 */
export function SegmentedControl<Value extends string>({
  label,
  value,
  segments,
  onChange,
}: Props<Value>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const offset = useRef(new Animated.Value(0)).current;

  const index = Math.max(
    0,
    segments.findIndex(segment => segment.value === value),
  );
  const segmentWidth = segments.length > 0 ? width / segments.length : 0;

  const measure = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth(next);
    offset.setValue((next / Math.max(1, segments.length)) * index);
  };

  const moveTo = (nextIndex: number) => {
    const target = segmentWidth * nextIndex;

    if (reduced || segmentWidth === 0) {
      offset.setValue(target);
      return;
    }

    Animated.timing(offset, {
      toValue: target,
      duration: motion.duration.quick,
      easing: easing.signature,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View onLayout={measure} style={styles.track}>
        {segmentWidth === 0 ? null : (
          <Animated.View
            style={[
              styles.selection,
              {width: segmentWidth, transform: [{translateX: offset}]},
            ]}
          />
        )}
        {segments.map((segment, position) => {
          const selected = segment.value === value;

          return (
            <Pressable
              accessibilityLabel={segment.accessibilityLabel ?? segment.label}
              accessibilityRole="button"
              accessibilityState={{selected}}
              key={segment.value}
              onPress={() => {
                moveTo(position);
                onChange(segment.value);
              }}
              style={styles.segment}
              testID={segment.testID}>
              <Text
                style={[
                  styles.segmentLabel,
                  selected && styles.segmentLabelSelected,
                ]}>
                {segment.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    block: {
      marginTop: space.lg,
    },
    label: {
      ...typography.label,
      color: theme.palette.muted,
    },
    track: {
      flexDirection: 'row',
      marginTop: space.sm,
      borderRadius: radius.control,
      backgroundColor: theme.palette.surface,
      overflow: 'hidden',
    },
    selection: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      borderRadius: radius.control,
      backgroundColor: theme.palette.inverse,
    },
    segment: {
      flex: 1,
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
    },
    segmentLabel: {
      ...typography.label,
      color: theme.palette.muted,
    },
    segmentLabelSelected: {
      color: theme.palette.onInverse,
    },
  });
}
