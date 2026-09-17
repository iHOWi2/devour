import React, {useMemo} from 'react';
import {Pressable, StyleSheet, Text, View} from 'react-native';

import {useTheme} from '../design/ThemeProvider';
import type {Theme} from '../design/theme';
import {TOUCH_TARGET, radius, space, typography} from '../design/tokens';

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
 * Three choices at most, full width, 44 px tall so a thumb can hit any of them. The
 * selected state is carried by a quiet fill and a two pixel accent bar rather than a
 * filled block: the accent belongs to agent activity, not to a settings row.
 */
export function SegmentedControl<Value extends string>({
  label,
  value,
  segments,
  onChange,
}: Props<Value>) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.block}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        {segments.map(segment => {
          const selected = segment.value === value;

          return (
            <Pressable
              accessibilityLabel={segment.accessibilityLabel ?? segment.label}
              accessibilityRole="button"
              accessibilityState={{selected}}
              key={segment.value}
              onPress={() => onChange(segment.value)}
              style={[styles.segment, selected && styles.segmentSelected]}
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
      marginTop: space.md,
    },
    label: {
      ...typography.label,
      color: theme.palette.muted,
    },
    track: {
      flexDirection: 'row',
      marginTop: space.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.palette.edge,
      borderRadius: radius.row,
      overflow: 'hidden',
    },
    segment: {
      flex: 1,
      minHeight: TOUCH_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.sm,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    segmentSelected: {
      backgroundColor: theme.palette.surface,
      borderBottomColor: theme.palette.accent,
    },
    segmentLabel: {
      ...typography.label,
      color: theme.palette.muted,
    },
    segmentLabelSelected: {
      color: theme.palette.text,
    },
  });
}
