import React, {useEffect, useState} from 'react';
import {Video} from '@remotion/media';
import {
  Sequence,
  continueRender,
  delayRender,
  useCurrentFrame,
} from 'remotion';
import type {VideoMessage, VideoTheme} from '../../lib/types';
import type {MessageTiming} from '../../lib/timing';
import {getPalette} from './theme';
import {BubbleTail} from './MessageBubble';
import {TAPBACK_DELAY, Tapback} from './Tapback';
import {resolveMediaSrc} from './media';

const MAX_WIDTH = 702; // ~65% of 1080
const MAX_HEIGHT = 860; // keeps the bubble (and a tapback on it) inside the chat area

const PlayGlyph: React.FC = () => (
  <div
    style={{
      width: 110,
      height: 110,
      borderRadius: '50%',
      backgroundColor: 'rgba(40, 40, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <svg width="44" height="50" viewBox="0 0 44 50">
      <path d="M4 4 L42 25 L4 46 Z" fill="#FFFFFF" />
    </svg>
  </div>
);

/**
 * Video message bubble holding the uploaded Cantina clip. The bubble pops in
 * at `appearFrame` (entrance applied by the parent) and the clip itself starts
 * playing at `playFromFrame`, unmuted.
 */
export const VideoBubble: React.FC<{
  theme: VideoTheme;
  message: VideoMessage;
  timing: MessageTiming;
  showTail: boolean;
}> = ({theme, message, timing, showTail}) => {
  const frame = useCurrentFrame();
  const palette = getPalette(theme);
  const mine = message.sender === 'me';
  const src = resolveMediaSrc(message.src);
  const [aspect, setAspect] = useState<number | null>(null); // width / height

  useEffect(() => {
    const handle = delayRender(`probe-video-${message.id}`);
    let settled = false;
    const finish = (ratio: number) => {
      if (settled) return;
      settled = true;
      setAspect(ratio);
      continueRender(handle);
    };
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.muted = true;
    probe.src = src;
    probe.addEventListener('loadedmetadata', () =>
      finish(probe.videoWidth / Math.max(1, probe.videoHeight)),
    );
    probe.addEventListener('error', () => finish(9 / 16));
    return () => {
      if (!settled) {
        settled = true;
        continueRender(handle);
      }
    };
  }, [message.id, src]);

  const ratio = aspect ?? 9 / 16;
  let width = MAX_WIDTH;
  let height = width / ratio;
  if (height > MAX_HEIGHT) {
    height = MAX_HEIGHT;
    width = height * ratio;
  }
  width = Math.round(width);
  height = Math.round(height);

  const playFromFrame = timing.playFromFrame ?? timing.appearFrame;
  const playing = frame >= playFromFrame;
  const tailColor = mine ? palette.mineBubble : palette.theirsBubble;

  return (
    <div style={{position: 'relative', width, height}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 34,
          overflow: 'hidden',
          backgroundColor: '#0B0B0C',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {playing ? (
          <Sequence from={playFromFrame} layout="none">
            <Video
              src={src}
              muted={false}
              objectFit="cover"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
            />
          </Sequence>
        ) : (
          <PlayGlyph />
        )}
      </div>
      {showTail ? <BubbleTail color={tailColor} flip={!mine} /> : null}
      {message.reaction ? (
        <Tapback
          sender={message.sender}
          reaction={message.reaction}
          localFrame={frame - timing.appearFrame - TAPBACK_DELAY}
        />
      ) : null}
    </div>
  );
};
