import React from 'react';
import type {Sender, Tapback as TapbackKind} from '../../lib/types';
import {FONT_STACK, getPalette} from './theme';
import type {VideoTheme} from '../../lib/types';
import {Tapback} from './Tapback';

/** Classic iMessage bubble tail, pointing down-right. Mirror for `them`. */
export const BubbleTail: React.FC<{color: string; flip: boolean}> = ({
  color,
  flip,
}) => (
  <svg
    width="26"
    height="24"
    viewBox="0 0 26 24"
    style={{
      position: 'absolute',
      bottom: 0,
      right: flip ? undefined : -6,
      left: flip ? -6 : undefined,
      transform: flip ? 'scaleX(-1)' : undefined,
    }}
  >
    <path
      d="M0 0 C 11 1 19 6 26 22 C 26 23.2 25.2 24 24 24 C 12 24 3 17 0 9 Z"
      fill={color}
    />
  </svg>
);

/** iOS text message bubble. Entrance animation is applied by the parent. */
export const MessageBubble: React.FC<{
  theme: VideoTheme;
  sender: Sender;
  text: string;
  showTail: boolean;
  /** Optional tapback badge, popped in by the parent via `reactionLocalFrame`. */
  reaction?: TapbackKind;
  /** Frames since the tapback pop started (frame - appearFrame - TAPBACK_DELAY). */
  reactionLocalFrame?: number;
}> = ({theme, sender, text, showTail, reaction, reactionLocalFrame}) => {
  const palette = getPalette(theme);
  const mine = sender === 'me';
  const backgroundColor = mine ? palette.mineBubble : palette.theirsBubble;
  return (
    <div
      style={{
        position: 'relative',
        maxWidth: '65%',
        backgroundColor,
        color: mine ? palette.mineText : palette.theirsText,
        borderRadius: 34,
        padding: '20px 30px',
        fontFamily: FONT_STACK,
        fontSize: 40,
        fontWeight: 400,
        lineHeight: 1.28,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {text}
      {showTail ? <BubbleTail color={backgroundColor} flip={!mine} /> : null}
      {reaction !== undefined && reactionLocalFrame !== undefined ? (
        <Tapback
          sender={sender}
          reaction={reaction}
          localFrame={reactionLocalFrame}
        />
      ) : null}
    </div>
  );
};
