import React from 'react';
import type {VideoTheme} from '../../lib/types';
import {FONT_STACK, getPalette} from './theme';

const SignalIcon: React.FC<{color: string}> = ({color}) => {
  const bars = [10, 14, 18, 22];
  return (
    <svg width="44" height="26" viewBox="0 0 44 26">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * 12}
          y={26 - h}
          width="8"
          height={h}
          rx="2"
          fill={color}
        />
      ))}
    </svg>
  );
};

const WifiIcon: React.FC<{color: string}> = ({color}) => (
  <svg
    width="36"
    height="26"
    viewBox="0 0 36 26"
    fill="none"
    stroke={color}
    strokeWidth="4.6"
    strokeLinecap="round"
  >
    <path d="M3 9.5 A 21 21 0 0 1 33 9.5" />
    <path d="M8.7 15.3 A 13.2 13.2 0 0 1 27.3 15.3" />
    <path d="M14.2 20.6 A 6 6 0 0 1 21.8 20.6" />
    <circle cx="18" cy="23.6" r="2.6" fill={color} stroke="none" />
  </svg>
);

const BatteryIcon: React.FC<{color: string}> = ({color}) => (
  <svg width="60" height="26" viewBox="0 0 60 26">
    <rect
      x="1.6"
      y="2.6"
      width="48"
      height="20.8"
      rx="6.4"
      fill="none"
      stroke={color}
      strokeOpacity="0.4"
      strokeWidth="2.4"
    />
    <rect x="5.4" y="6.4" width="30" height="13.2" rx="3.4" fill={color} />
    <path
      d="M53.4 9 L53.4 17 A 5.6 5.6 0 0 0 53.4 9 Z"
      fill={color}
      fillOpacity="0.45"
    />
  </svg>
);

/**
 * iOS 17 status bar: time on the left, Dynamic Island centered at the top,
 * cellular bars + 5G + wifi + battery on the right.
 */
export const StatusBar: React.FC<{theme: VideoTheme; time: string}> = ({
  theme,
  time,
}) => {
  const palette = getPalette(theme);
  return (
    <div
      style={{
        position: 'relative',
        height: 112,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 72,
        paddingRight: 56,
        fontFamily: FONT_STACK,
      }}
    >
      {/* Dynamic Island (iPhone 14/15 Pro) */}
      <div
        style={{
          position: 'absolute',
          top: 22,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 252,
          height: 64,
          borderRadius: 32,
          background: palette.dynamicIsland,
          border: palette.dynamicIslandBorder,
        }}
      />
      <div
        style={{
          fontSize: 44,
          fontWeight: 600,
          color: palette.statusBar,
          letterSpacing: 0.5,
        }}
      >
        {time}
      </div>
      <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
        <SignalIcon color={palette.statusBar} />
        <span
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: palette.statusBar,
            letterSpacing: 0.5,
            marginTop: -2,
          }}
        >
          5G
        </span>
        <WifiIcon color={palette.statusBar} />
        <BatteryIcon color={palette.statusBar} />
      </div>
    </div>
  );
};
