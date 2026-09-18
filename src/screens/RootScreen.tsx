import React, {useCallback, useState} from 'react';
import {Animated, StyleSheet} from 'react-native';

import {useSurfaceTransition} from '../design/motion';
import {ChatScreen} from './ChatScreen';
import {SettingsScreen} from './SettingsScreen';

/**
 * Two surfaces, one switch.
 *
 * No navigation library: with two screens it would be a dependency carrying a router, a
 * gesture handler and a stack we do not use. When the workspace and runtime screens arrive
 * in Phases 3 and 4 this is the place that decides whether that is still true.
 *
 * The swap is a crossfade rather than a slide. These screens are siblings, not a stack, so
 * neither of them arrives from a direction, and inventing one would be motion that lies
 * about the structure of the application.
 */
export type RootView = 'chat' | 'settings';

type Props = {
  initialView?: RootView;
};

export function RootScreen({initialView = 'chat'}: Props) {
  const [view, setView] = useState<RootView>(initialView);
  const openChat = useCallback(() => setView('chat'), []);
  const openSettings = useCallback(() => setView('settings'), []);
  const transition = useSurfaceTransition(view);

  return (
    <Animated.View style={[styles.surface, transition]}>
      {view === 'chat' ? (
        <ChatScreen onOpenSettings={openSettings} />
      ) : (
        <SettingsScreen onOpenChat={openChat} />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flex: 1,
  },
});
