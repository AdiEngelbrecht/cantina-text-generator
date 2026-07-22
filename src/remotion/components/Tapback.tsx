import React from 'react';
import {interpolate, spring, useVideoConfig} from 'remotion';
import type {Sender, Tapback as TapbackKind} from '../../lib/types';
import {FONT_STACK} from './theme';

/** Frames after a bubble's appearFrame before its tapback badge pops in. */
export const TAPBACK_DELAY = 8;

const PILL_WIDTH = 110;
const PILL_HEIGHT = 72;
/** iOS tapback badge: light gray pill with a flat dark glyph, in both themes. */
const PILL_BG = '#E9E9EB';
const GLYPH_COLOR = '#48484A';

const HeartGlyph: React.FC = () => (
  <svg width="46" height="42" viewBox="0 0 64 58">
    <path
      d="M32 54 C10 40 4 26 4 16 C4 7 10 2 18 2 C24 2 29 5 32 11 C35 5 40 2 46 2 C54 2 60 7 60 16 C60 26 54 40 32 54 Z"
      fill={GLYPH_COLOR}
    />
  </svg>
);

const ThumbGlyph: React.FC<{down?: boolean}> = ({down}) => (
  <svg
    width="46"
    height="44"
    viewBox="0 0 64 58"
    style={down ? {transform: 'scaleY(-1)'} : undefined}
  >
    <rect x="5" y="22" width="11" height="30" rx="3" fill={GLYPH_COLOR} />
    <path
      d="M20 52 H43 C47.5 52 50.5 49.5 51.2 45.5 L54.6 29 C55.3 25.2 52.6 22 48.6 22 H37.5 L39.2 13.5 C39.8 9.5 38.2 5.8 35 5.2 C32 4.6 29.8 6.8 29 10 L26.4 19.5 C25 23.5 22.8 25.5 20 26.5 Z"
      fill={GLYPH_COLOR}
    />
  </svg>
);

const TextGlyph: React.FC<{text: string; fontSize?: number}> = ({
  text,
  fontSize = 38,
}) => (
  <span
    style={{
      fontFamily: FONT_STACK,
      fontSize,
      fontWeight: 700,
      color: GLYPH_COLOR,
      lineHeight: 1,
      marginTop: -2,
    }}
  >
    {text}
  </span>
);

const Glyph: React.FC<{reaction: TapbackKind}> = ({reaction}) => {
  switch (reaction) {
    case 'love':
      return <HeartGlyph />;
    case 'like':
      return <ThumbGlyph />;
    case 'dislike':
      return <ThumbGlyph down />;
    case 'laugh':
      return <TextGlyph text="Ha" />;
    case 'emphasize':
      return <TextGlyph text="!!" fontSize={40} />;
    case 'question':
      return <TextGlyph text="?" fontSize={42} />;
  }
};

/**
 * iOS tapback badge: a light gray pill with a flat glyph, overlapping the
 * top corner of a message bubble (top-left for `them`, top-right for `me`).
 * Pops in with a spring driven by `localFrame` (negative = not yet visible).
 * Position it inside a `position: relative` bubble wrapper.
 */
export const Tapback: React.FC<{
  sender: Sender;
  reaction: TapbackKind;
  /** Frames since the pop started: frame - appearFrame - TAPBACK_DELAY. */
  localFrame: number;
}> = ({sender, reaction, localFrame}) => {
  const {fps} = useVideoConfig();
  const pop = spring({
    frame: localFrame,
    fps,
    config: {damping: 12, stiffness: 280, mass: 0.6},
  });
  const scale = interpolate(pop, [0, 1], [0.2, 1]);
  const opacity = interpolate(pop, [0, 1], [0, 1]);
  const mine = sender === 'me';
  return (
    <div
      style={{
        position: 'absolute',
        top: -PILL_HEIGHT / 2 + 4,
        ...(mine ? {right: -16} : {left: -16}),
        width: PILL_WIDTH,
        height: PILL_HEIGHT,
        borderRadius: PILL_HEIGHT / 2,
        backgroundColor: PILL_BG,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 6px 16px rgba(0,0,0,0.28)',
        transform: `scale(${scale})`,
        transformOrigin: mine ? 'bottom right' : 'bottom left',
        opacity,
      }}
    >
      <Glyph reaction={reaction} />
    </div>
  );
};
