'use client';

import React from 'react';

type Props = {
  /** Typing speed multiplier for 'me' messages (0.5–2, default 1). */
  typingSpeed: number;
  /** Reply pacing multiplier for 'them' messages (0.5–2, default 1). */
  replyDelay: number;
  /** iMessage send/receive blips on each message (default true). */
  chatSounds: boolean;
  onChange: (patch: {
    typingSpeed?: number;
    replyDelay?: number;
    chatSounds?: boolean;
  }) => void;
};

const MIN = 0.5;
const MAX = 2;
const STEP = 0.1;

const readout = (v: number): string => `${v.toFixed(1)}×`;

export const TimingSection: React.FC<Props> = ({
  typingSpeed,
  replyDelay,
  chatSounds,
  onChange,
}) => {
  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">5</span>
        <div>
          <h2>Timing &amp; chat sounds</h2>
          <p>How fast you type, how quickly they reply, and the send blips.</p>
        </div>
      </header>

      <div className="hook-trim">
        <label className="field-label" htmlFor="typing-speed" style={{margin: 0}}>
          Me typing speed
        </label>
        <div className="hook-trim-row">
          <span className="hook-trim-label">Slow</span>
          <input
            id="typing-speed"
            type="range"
            className="hook-trim-slider"
            min={MIN}
            max={MAX}
            step={STEP}
            value={typingSpeed}
            onChange={(e) => onChange({typingSpeed: parseFloat(e.target.value)})}
          />
          <span className="hook-trim-label" style={{textAlign: 'right'}}>
            Fast
          </span>
          <span className="hook-trim-value">{readout(typingSpeed)}</span>
        </div>

        <label className="field-label" htmlFor="reply-delay" style={{margin: 0}}>
          Reply delay (them)
        </label>
        <div className="hook-trim-row">
          <span className="hook-trim-label">Fast</span>
          <input
            id="reply-delay"
            type="range"
            className="hook-trim-slider"
            min={MIN}
            max={MAX}
            step={STEP}
            value={replyDelay}
            onChange={(e) => onChange({replyDelay: parseFloat(e.target.value)})}
          />
          <span className="hook-trim-label" style={{textAlign: 'right'}}>
            Slow
          </span>
          <span className="hook-trim-value">{readout(replyDelay)}</span>
        </div>
      </div>

      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
          fontSize: 13.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={chatSounds}
          onChange={(e) => onChange({chatSounds: e.target.checked})}
          style={{accentColor: 'var(--accent)', width: 16, height: 16, margin: 0}}
        />
        iMessage send &amp; receive sounds
      </label>
    </section>
  );
};
