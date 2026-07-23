import React from 'react';
import {Img} from 'remotion';
import type {ImageMessage, VideoTheme} from '../../lib/types';
import {getPalette} from './theme';
import {Tapback} from './Tapback';
import {resolveMediaSrc} from './media';

const MAX_HEIGHT = 700;

/**
 * Photo message bubble: the image itself is the bubble (no background color,
 * no tail — photos have no tail in iMessage). Entrance animation is applied
 * by the parent. Supports a tapback badge exactly like MessageBubble.
 */
export const ImageBubble: React.FC<{
  theme: VideoTheme;
  message: ImageMessage;
  /** Frames since the tapback pop started (frame - appearFrame - TAPBACK_DELAY). */
  reactionLocalFrame?: number;
}> = ({theme, message, reactionLocalFrame}) => {
  // Palette kept for parity with the other bubbles (theme-driven border).
  const palette = getPalette(theme);
  return (
    <div style={{position: 'relative', maxWidth: '65%'}}>
      <Img
        src={resolveMediaSrc(message.src)}
        style={{
          display: 'block',
          maxWidth: '100%',
          maxHeight: MAX_HEIGHT,
          objectFit: 'cover',
          borderRadius: 18,
          border: `1px solid ${palette.hairline}`,
        }}
      />
      {message.reaction !== undefined && reactionLocalFrame !== undefined ? (
        <Tapback
          sender={message.sender}
          reaction={message.reaction}
          localFrame={reactionLocalFrame}
        />
      ) : null}
    </div>
  );
};
