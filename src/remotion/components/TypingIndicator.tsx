import React from 'react';
import {useCurrentFrame} from 'remotion';
import type {VideoTheme} from '../../lib/types';
import {getPalette} from './theme';
import {BubbleTail} from './MessageBubble';

/** Gray bubble with three bouncing dots, shown before a `them` message lands. */
export const TypingIndicator: React.FC<{theme: VideoTheme}> = ({theme}) => {
  const frame = useCurrentFrame();
  const palette = getPalette(theme);
  return (
    <div
      style={{
        position: 'relative',
        width: 132,
        height: 76,
        borderRadius: 34,
        backgroundColor: palette.typingBubble,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      {[0, 1, 2].map((i) => {
        // 21-frame loop, staggered per dot.
        const t = (frame + i * 7) % 21;
        const lift = t < 10 ? -10 * Math.sin((t / 10) * Math.PI) : 0;
        return (
          <div
            key={i}
            style={{
              width: 21,
              height: 21,
              borderRadius: '50%',
              backgroundColor: palette.typingDot,
              transform: `translateY(${lift}px)`,
            }}
          />
        );
      })}
      <BubbleTail color={palette.typingBubble} flip />
    </div>
  );
};
