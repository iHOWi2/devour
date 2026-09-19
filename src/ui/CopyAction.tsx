import React, {useCallback, useEffect, useRef, useState} from 'react';

import {IconAction} from './IconAction';

type Props = {
  label: string;
  copiedLabel: string;
  onCopy: () => Promise<void>;
  testID?: string;
};

/** How long the tick stays before the icon goes back to resting, in milliseconds. */
const CONFIRMATION = 1600;

/**
 * Copy, and then say so - but only after the clipboard actually took the text.
 *
 * The confirmation is the icon itself becoming a tick, which is the answer to a press that
 * changes nothing else on screen. It goes back to resting after a moment, so the tick
 * cannot be mistaken for the button's normal state, and the spoken label follows it.
 */
export function CopyAction({label, copiedLabel, onCopy, testID}: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
      }
    },
    [],
  );

  const press = useCallback(() => {
    onCopy()
      .then(() => {
        setCopied(true);

        if (timer.current !== null) {
          clearTimeout(timer.current);
        }

        timer.current = setTimeout(() => setCopied(false), CONFIRMATION);
      })
      .catch(() => {
        // The clipboard refused. Saying "copied" then would be a lie.
        setCopied(false);
      });
  }, [onCopy]);

  return (
    <IconAction
      icon={copied ? 'check' : 'copy'}
      label={copied ? copiedLabel : label}
      onPress={press}
      testID={testID}
      tone={copied ? 'text' : 'muted'}
    />
  );
}
