import React from 'react';
import type {VideoTheme} from '../../lib/types';
import {FONT_STACK, IOS_BLUE, getPalette} from './theme';

const BackChevron: React.FC = () => (
  <svg width="28" height="50" viewBox="0 0 28 50">
    <path
      d="M21 5 L6 25 L21 45"
      fill="none"
      stroke={IOS_BLUE}
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const VideoCameraIcon: React.FC = () => (
  <svg width="66" height="46" viewBox="0 0 66 46">
    <rect x="2" y="7" width="40" height="32" rx="9" fill={IOS_BLUE} />
    <path d="M44 19.5 L62 9 L62 37 L44 26.5 Z" fill={IOS_BLUE} />
  </svg>
);

/**
 * iOS Messages chat header: back chevron + count on the left,
 * centered avatar with the contact name underneath, video icon right.
 */
export const ChatHeader: React.FC<{
  theme: VideoTheme;
  name: string;
  count: number;
}> = ({theme, name, count}) => {
  const palette = getPalette(theme);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  return (
    <div
      style={{
        position: 'relative',
        height: 214,
        borderBottom: `1px solid ${palette.hairline}`,
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <BackChevron />
        <span style={{fontSize: 40, color: IOS_BLUE, fontWeight: 400}}>
          {count}
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 6,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: '50%',
            background: 'linear-gradient(160deg, #9A9AA2 0%, #545458 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{fontSize: 50, fontWeight: 500, color: '#FFFFFF'}}>
            {initial}
          </span>
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 30,
            fontWeight: 600,
            color: palette.headerText,
            maxWidth: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </div>
      </div>
      <div style={{position: 'absolute', right: 44, top: 34}}>
        <VideoCameraIcon />
      </div>
    </div>
  );
};
