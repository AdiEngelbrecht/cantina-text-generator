import React from 'react';
import {AbsoluteFill, OffthreadVideo, useVideoConfig} from 'remotion';
import type {HookClip as HookClipProps} from '../../lib/types';
import {resolveMediaSrc} from './media';

/**
 * Optional hook clip shown BEFORE the chat: a fullscreen reaction video
 * (1080x1920, cover, unmuted). Clippers caption it in CapCut beforehand —
 * no caption is rendered here. The clip is trimmed to
 * [trimStartSec, trimEndSec) via `startFrom`; the surrounding Sequence
 * duration (see getHookFrames) already equals the trimmed window.
 * Hard cut to the chat afterwards (handled by the parent).
 */
export const HookClip: React.FC<{hook: HookClipProps}> = ({hook}) => {
  const {fps} = useVideoConfig();
  const src = resolveMediaSrc(hook.src);
  const startFrom = Math.round((hook.trimStartSec ?? 0) * fps);

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <OffthreadVideo
        src={src}
        muted={false}
        startFrom={startFrom}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </AbsoluteFill>
  );
};
