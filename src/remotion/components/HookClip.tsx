import React from 'react';
import {Video} from '@remotion/media';
import {AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {HookClip as HookClipProps} from '../../lib/types';
import {HOOK_MAX_SECONDS} from '../../lib/timing';
import {resolveMediaSrc} from './media';

/**
 * Optional hook clip shown BEFORE the chat: a fullscreen reaction video
 * (1080x1920, cover, unmuted) or, with `mediaType: 'image'`, a still photo.
 * Clippers caption it in CapCut beforehand — no caption is rendered here.
 * Video clips are trimmed to [trimStartSec, trimEndSec) via `trimBefore`;
 * the surrounding Sequence duration (see getHookFrames) already equals the
 * shown window. `zoom` applies a slow Ken Burns scale over the hook's
 * duration, for videos and stills alike. Hard cut to the chat afterwards
 * (handled by the parent).
 */
export const HookClip: React.FC<{hook: HookClipProps}> = ({hook}) => {
  const {fps} = useVideoConfig();
  const frame = useCurrentFrame();
  const src = resolveMediaSrc(hook.src);
  const isImage = (hook.mediaType ?? 'video') === 'image';
  const trimBefore = Math.round((hook.trimStartSec ?? 0) * fps);

  // Same shown-window math as getHookFrames in lib/timing.
  const hookFrames = isImage
    ? Math.round(Math.min(Math.max(hook.durationSec, 0.5), HOOK_MAX_SECONDS) * fps)
    : hook.autoDuration === false
      ? Math.round(
          Math.min(
            Math.max(hook.customDurationSec ?? hook.durationSec, 0.5),
            HOOK_MAX_SECONDS,
          ) * fps,
        )
      : (() => {
          const start = Math.max(0, hook.trimStartSec ?? 0);
          const end = Math.min(
            hook.durationSec,
            hook.trimEndSec ?? hook.durationSec,
          );
          const effective = Math.max(end - start, 0.5);
          return Math.round(Math.min(effective, HOOK_MAX_SECONDS) * fps);
        })();

  const scale = interpolate(frame, [0, hookFrames], [1, hook.zoom ?? 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          transform: `scale(${scale})`,
        }}
      >
        {isImage ? (
          <Img
            src={src}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Video
            src={src}
            muted={false}
            trimBefore={trimBefore}
            objectFit="cover"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
            }}
          />
        )}
      </div>
    </AbsoluteFill>
  );
};
