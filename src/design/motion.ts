import {useEffect, useMemo, useRef, useState} from 'react';
import {AccessibilityInfo, Animated, Easing} from 'react-native';

import {motion} from './tokens';

/**
 * Devour's motion layer.
 *
 * Built on React Native's own `Animated` with the native driver, which runs transform and
 * opacity off the JavaScript thread. That is enough for everything this interface does:
 * things arrive, things respond to a press, one thing pulses while the machine works.
 * Reanimated is the right tool for gestures and shared element transitions and is planned
 * for the phase that needs them (docs/ROADMAP.md, Phase 9-10) - not before.
 *
 * Two rules hold everywhere, taken from the motion principles in docs/RESEARCH.md:
 * entrances decelerate and are longer than exits, and no motion is the only carrier of
 * information. Every animation here has a still state that says the same thing, which is
 * also what makes "reduce motion" a one-line branch rather than a redesign.
 */
function curve([x1, y1, x2, y2]: readonly number[]) {
  return Easing.bezier(x1 ?? 0, y1 ?? 0, x2 ?? 0, y2 ?? 1);
}

export const easing = {
  signature: curve(motion.easing.signature),
  exit: curve(motion.easing.exit),
  ambient: curve(motion.easing.ambient),
};

/**
 * Whether the device asked for less motion.
 *
 * Android exposes this as an animator duration scale of zero, which React Native reports
 * through `isReduceMotionEnabled`. The value is read once and then followed, so turning the
 * setting on does not require a restart.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled()
      .then(value => {
        if (!cancelled) {
          setReduced(value);
        }
      })
      .catch(() => {
        // A device that cannot answer is a device that did not ask for less motion.
      });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduced,
    );

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduced;
}

type EntranceOptions = {
  /** Stagger, in milliseconds. Kept small: the whole cascade must end inside 500 ms. */
  delay?: number;
  /** How far the element rises. Defaults to the shared rise distance. */
  distance?: number;
  /** Re-runs the entrance when this changes. */
  key?: string | number;
};

/**
 * The one entrance pattern: rise and fade, decelerating.
 *
 * Returns a style object, so a component animates by spreading it and nothing else.
 */
export function useEntrance(options: EntranceOptions = {}) {
  const {delay = 0, distance = motion.distance.rise, key} = options;
  const reduced = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      progress.setValue(1);
      return;
    }

    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: motion.duration.standard,
      delay,
      easing: easing.signature,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [delay, key, progress, reduced]);

  return useMemo(
    () => ({
      opacity: progress,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [distance, 0],
          }),
        },
      ],
    }),
    [distance, progress],
  );
}

/**
 * Press feedback: the control takes the touch instead of waiting for the screen to change.
 *
 * A press scales to 0.97 in 90 ms and settles back in 150 ms - firm, no overshoot. Bounce
 * would be a different product's personality.
 */
export function usePressScale(scale = 0.97) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;

  const animate = (toValue: number, duration: number) => {
    if (reduced) {
      return;
    }

    Animated.timing(value, {
      toValue,
      duration,
      easing: easing.signature,
      useNativeDriver: true,
    }).start();
  };

  return {
    style: {transform: [{scale: value}]},
    onPressIn: () => animate(scale, motion.duration.instant),
    onPressOut: () => animate(1, motion.duration.quick),
  };
}

/**
 * A slow symmetric pulse for the one thing that says the machine is working.
 *
 * Ambient motion, so it loops; ambient motion is also the first thing to drop when the
 * device asks for less of it, and the element it belongs to stays visible either way.
 */
export function usePulse(active: boolean, low = 0.25) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!active || reduced) {
      value.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: low,
          duration: 520,
          easing: easing.ambient,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: 520,
          easing: easing.ambient,
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();

    return () => {
      loop.stop();
      value.setValue(1);
    };
  }, [active, low, reduced, value]);

  return {opacity: value};
}

/**
 * Crossfade between two surfaces.
 *
 * A phone has no room for a slide that means nothing: the surfaces are siblings, not a
 * stack, so neither one comes from a direction. The outgoing surface leaves faster than the
 * incoming one arrives, which is what keeps the swap from feeling like a lag.
 */
export function useSurfaceTransition(key: string | number) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }

    value.setValue(0);
    const animation = Animated.timing(value, {
      toValue: 1,
      duration: motion.duration.slow,
      easing: easing.signature,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [key, reduced, value]);

  return useMemo(
    () => ({
      opacity: value,
      transform: [
        {
          scale: value.interpolate({
            inputRange: [0, 1],
            outputRange: [0.99, 1],
          }),
        },
      ],
    }),
    [value],
  );
}

/**
 * One element that comes and goes: the jump-to-newest pill, a hint that only applies
 * sometimes.
 *
 * The element stays mounted and fades, because a conditional render has no exit, and
 * something that vanishes on the frame it was pressed reads as a glitch. The exit is
 * shorter than the entrance and accelerates.
 */
export function useAppear(visible: boolean, distance = motion.distance.rise) {
  const reduced = useReducedMotion();
  const value = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    if (reduced) {
      value.setValue(visible ? 1 : 0);
      return;
    }

    const animation = Animated.timing(value, {
      toValue: visible ? 1 : 0,
      duration: visible ? motion.duration.standard : motion.duration.quick,
      easing: visible ? easing.signature : easing.exit,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [reduced, value, visible]);

  return useMemo(
    () => ({
      opacity: value,
      transform: [
        {
          translateY: value.interpolate({
            inputRange: [0, 1],
            outputRange: [distance, 0],
          }),
        },
      ],
    }),
    [distance, value],
  );
}
