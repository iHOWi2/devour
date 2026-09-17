import React, {useCallback, useState} from 'react';

import {ChatScreen} from './ChatScreen';
import {SystemScreen} from './SystemScreen';

/**
 * Two surfaces, one switch.
 *
 * No navigation library: with two screens it would be a dependency carrying a router, a
 * gesture handler and a stack we do not use. When the workspace and runtime screens arrive
 * in Phases 3 and 4 this is the place that decides whether that is still true.
 */
export type RootView = 'chat' | 'system';

type Props = {
  initialView?: RootView;
};

export function RootScreen({initialView = 'chat'}: Props) {
  const [view, setView] = useState<RootView>(initialView);
  const openChat = useCallback(() => setView('chat'), []);
  const openSystem = useCallback(() => setView('system'), []);

  return view === 'chat' ? (
    <ChatScreen onOpenSystem={openSystem} />
  ) : (
    <SystemScreen onOpenChat={openChat} />
  );
}
