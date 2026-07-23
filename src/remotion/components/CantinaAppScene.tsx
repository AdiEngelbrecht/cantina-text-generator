import React from 'react';
import {Video} from '@remotion/media';
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import type {CantinaAppSceneProps, VideoMessage, VideoTheme} from '../../lib/types';
import {CANTINA_APP_LEAD_SEC, CANTINA_APP_REVEAL_SEC} from '../../lib/timing';
import {FONT_STACK} from './theme';
import {resolveMediaSrc} from './media';

/**
 * Contract for the Cantina app simulation scene (owned by the app-scene
 * agent — replace the render entirely, keep this props signature).
 * Rendered for exactly `timeline.cantinaAppFrames` frames between the hook
 * and the chat; useCurrentFrame() inside is scene-local (starts at 0).
 * Scene beats (use props.typingSec ?? 3, props.generatingSec ?? 4, and the
 * CANTINA_APP_LEAD_SEC / CANTINA_APP_REVEAL_SEC constants from timing.ts):
 * lead-in → clip thumbnail pops into the composer → prompt types out →
 * send → "Generating" modal with animated Cantina logo → response reveal.
 */
export type CantinaAppSceneComponentProps = {
  scene: CantinaAppSceneProps;
  /** The Cantina response clip the scene "generates". */
  videoMessage: VideoMessage;
  theme: VideoTheme;
};

const BRAND_GREEN = '#2ee6a8';
const COMPOSER_BLUE = '#0A84FF';
const COMPOSER_BLUE_DEEP = '#0460D9';

/** Pulsing, hue-shifting Cantina logo mark for the Generating modal. */
const ModalLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + 0.07 * Math.sin(frame / 5);
  const hue = 55 * Math.sin(frame / 18);
  return (
    <div
      style={{
        width: 168,
        height: 168,
        borderRadius: 44,
        padding: 8,
        background: `linear-gradient(135deg, ${BRAND_GREEN}, ${COMPOSER_BLUE})`,
        transform: `scale(${pulse})`,
        filter: `hue-rotate(${hue}deg)`,
        boxShadow: `0 0 60px rgba(46, 230, 168, 0.45)`,
      }}
    >
      <Img
        src={staticFile('brand/cantina-logo.jpg')}
        style={{width: '100%', height: '100%', borderRadius: 38, objectFit: 'cover'}}
      />
    </div>
  );
};

/** 'CANTINA' wordmark: bold italic white with gradient + subtle RGB glitch. */
const Wordmark: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: 'clamp'});
  const glitchOn = frame % 53 < 3;
  const baseStyle: React.CSSProperties = {
    fontFamily: FONT_STACK,
    fontSize: 68,
    fontWeight: 800,
    fontStyle: 'italic',
    letterSpacing: 10,
    lineHeight: 1,
  };
  return (
    <div
      style={{
        position: 'absolute',
        top: 150,
        left: 0,
        right: 0,
        textAlign: 'center',
        opacity,
      }}
    >
      <div style={{position: 'relative', display: 'inline-block'}}>
        {/* glitch ghosts */}
        <span
          style={{
            ...baseStyle,
            position: 'absolute',
            left: 0,
            top: 0,
            color: BRAND_GREEN,
            opacity: glitchOn ? 0.65 : 0,
            transform: 'translate(-5px, 3px)',
          }}
        >
          CANTINA
        </span>
        <span
          style={{
            ...baseStyle,
            position: 'absolute',
            left: 0,
            top: 0,
            color: COMPOSER_BLUE,
            opacity: glitchOn ? 0.65 : 0,
            transform: 'translate(5px, -3px)',
          }}
        >
          CANTINA
        </span>
        <span
          style={{
            ...baseStyle,
            position: 'relative',
            backgroundImage: `linear-gradient(105deg, #ffffff 55%, #b9f6df 85%, ${BRAND_GREEN} 115%)`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          CANTINA
        </span>
      </div>
    </div>
  );
};

export const CantinaAppScene: React.FC<CantinaAppSceneComponentProps> = ({
  scene,
  videoMessage,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const src = resolveMediaSrc(videoMessage.src);

  const typingSec = scene.typingSec ?? 3;
  const generatingSec = scene.generatingSec ?? 4;
  const leadFrames = Math.round(CANTINA_APP_LEAD_SEC * fps);
  const typingFrames = Math.round(typingSec * fps);
  const generatingFrames = Math.round(generatingSec * fps);
  const sendFrame = leadFrames + typingFrames;
  const revealFrame = sendFrame + generatingFrames;

  const prompt = scene.prompt;
  const typedChars = Math.floor(
    interpolate(frame, [leadFrames, sendFrame], [0, prompt.length], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }),
  );
  const caretVisible =
    frame < sendFrame && Math.floor(frame / 14) % 2 === 0;

  // Composer entrance (spring pop during the lead-in).
  const popIn = spring({
    frame: frame - 5,
    fps,
    config: {damping: 13, stiffness: 170, mass: 0.8},
  });
  // Subtle send pulse, then the card settles back/dims under the modal.
  const sendPulse = interpolate(
    frame,
    [sendFrame, sendFrame + 5, sendFrame + 12],
    [1, 1.025, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const dimScale = interpolate(frame, [sendFrame + 4, sendFrame + 20], [1, 0.96], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const composerFadeOut = interpolate(frame, [revealFrame, revealFrame + 12], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const composerScale = popIn * sendPulse * dimScale;
  const composerOpacity =
    interpolate(frame, [5, 12], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * composerFadeOut;
  const sendFlash = interpolate(
    frame,
    [sendFrame, sendFrame + 4, sendFrame + 12],
    [0, 0.3, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const sendBtnScale = interpolate(
    frame,
    [sendFrame, sendFrame + 4, sendFrame + 10],
    [1, 0.8, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Scrim behind the modal.
  const scrimOpacity = interpolate(
    frame,
    [sendFrame + 4, sendFrame + 16],
    [0, 0.55],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  // Generating modal.
  const modalIn = spring({
    frame: frame - (sendFrame + 6),
    fps,
    config: {damping: 16, stiffness: 140, mass: 0.9},
  });
  const modalOut = interpolate(frame, [revealFrame, revealFrame + 10], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const modalOpacity =
    interpolate(frame, [sendFrame + 6, sendFrame + 16], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }) * modalOut;
  const modalScale = (0.9 + 0.1 * modalIn) * (1 - 0.05 * (1 - modalOut));
  const progress = interpolate(frame, [sendFrame + 8, revealFrame - 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.quad),
  });

  // Reveal.
  const revealIn = spring({
    frame: frame - revealFrame,
    fps,
    config: {damping: 15, stiffness: 120, mass: 0.9},
  });
  const revealOpacity = interpolate(frame, [revealFrame, revealFrame + 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#050507',
        backgroundImage:
          'radial-gradient(900px 700px at 50% -10%, rgba(46, 230, 168, 0.10), transparent), radial-gradient(1000px 800px at 50% 115%, rgba(10, 132, 255, 0.10), transparent)',
        fontFamily: FONT_STACK,
      }}
    >
      <Wordmark />

      {/* Composer card */}
      <div
        style={{
          position: 'absolute',
          top: 620,
          left: 80,
          width: 920,
          borderRadius: 40,
          background: `linear-gradient(160deg, ${COMPOSER_BLUE} 0%, ${COMPOSER_BLUE_DEEP} 100%)`,
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.55), 0 0 50px rgba(10, 132, 255, 0.25)',
          padding: '32px 36px 30px',
          opacity: composerOpacity,
          transform: `translateY(${(1 - popIn) * 60}px) scale(${composerScale})`,
          transformOrigin: 'center 70%',
        }}
      >
        {/* send flash */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 40,
            backgroundColor: '#fff',
            opacity: sendFlash,
            pointerEvents: 'none',
          }}
        />
        {/* segmented toggle */}
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: 6,
              borderRadius: 999,
              backgroundColor: 'rgba(0, 0, 0, 0.28)',
            }}
          >
            {(['Image', 'Video'] as const).map((label) => {
              const active = label === 'Video';
              return (
                <div
                  key={label}
                  style={{
                    padding: '12px 36px',
                    borderRadius: 999,
                    fontSize: 30,
                    fontWeight: 700,
                    color: active ? COMPOSER_BLUE : 'rgba(255, 255, 255, 0.85)',
                    backgroundColor: active ? '#fff' : 'transparent',
                  }}
                >
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* clip thumbnail (or character image when provided) */}
        <div
          style={{
            marginTop: 26,
            width: 160,
            height: 210,
            borderRadius: 18,
            overflow: 'hidden',
            backgroundColor: '#0B0B0C',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          }}
        >
          {scene.characterSrc ? (
            <Img
              src={resolveMediaSrc(scene.characterSrc)}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          ) : (
            <Sequence from={5} layout="none">
              <Video
                src={src}
                muted
                objectFit="cover"
                style={{width: '100%', height: '100%'}}
              />
            </Sequence>
          )}
        </div>

        {/* typed prompt + caret */}
        <div
          style={{
            marginTop: 24,
            minHeight: 118,
            fontSize: 42,
            fontWeight: 500,
            lineHeight: 1.35,
            color: '#fff',
            wordBreak: 'break-word',
          }}
        >
          {prompt.slice(0, typedChars)}
          {caretVisible ? (
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 42,
                marginLeft: 3,
                backgroundColor: '#fff',
                verticalAlign: 'middle',
              }}
            />
          ) : null}
        </div>

        {/* bottom row */}
        <div
          style={{
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{fontSize: 30, fontWeight: 700, color: 'rgba(255, 255, 255, 0.95)'}}>
            200 credits
          </span>
          <div style={{display: 'flex', alignItems: 'center', gap: 26}}>
            <span style={{fontSize: 30, fontWeight: 600, color: 'rgba(255, 255, 255, 0.75)'}}>
              {Math.round(videoMessage.durationSec)}s video
            </span>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: '50%',
                backgroundColor: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: `scale(${sendBtnScale})`,
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.35)',
              }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 19V5M5 12l7-7 7 7"
                  stroke={COMPOSER_BLUE}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* scrim */}
      <AbsoluteFill style={{backgroundColor: '#000', opacity: scrimOpacity}} />

      {/* Generating modal */}
      {modalOpacity > 0 ? (
        <AbsoluteFill
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            opacity: modalOpacity,
          }}
        >
          <div
            style={{
              width: 680,
              borderRadius: 36,
              backgroundColor: '#141419',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 40px 120px rgba(0, 0, 0, 0.7)',
              padding: '56px 56px 50px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 34,
              transform: `scale(${modalScale})`,
            }}
          >
            <ModalLogo />
            <div style={{fontSize: 42, fontWeight: 700, color: '#fff'}}>
              Generating video…
            </div>
            <div
              style={{
                width: 540,
                height: 14,
                borderRadius: 999,
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progress * 100}%`,
                  height: '100%',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${BRAND_GREEN}, ${COMPOSER_BLUE})`,
                }}
              />
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.55)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {Math.round(progress * 100)}%
            </div>
          </div>
        </AbsoluteFill>
      ) : null}

      {/* Response reveal */}
      {frame >= revealFrame ? (
        <AbsoluteFill
          style={{alignItems: 'center', justifyContent: 'center', opacity: revealOpacity}}
        >
          <div
            style={{
              width: 864,
              height: 1360,
              borderRadius: 24,
              overflow: 'hidden',
              backgroundColor: '#0B0B0C',
              transform: `scale(${0.5 + 0.5 * revealIn})`,
              boxShadow: `0 0 90px rgba(46, 230, 168, 0.35), 0 40px 120px rgba(0, 0, 0, 0.7)`,
            }}
          >
            <Sequence from={revealFrame} layout="none">
              <Video
                src={src}
                muted={false}
                objectFit="cover"
                style={{width: '100%', height: '100%'}}
              />
            </Sequence>
          </div>
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
