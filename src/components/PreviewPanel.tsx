'use client';

import React, {useMemo} from 'react';
import {Player} from '@remotion/player';
import {ConversationVideo} from '../remotion/ConversationVideo';
import type {ConversationProps} from '../lib/types';
import {SOUNDS} from '../lib/sounds';
import {FPS, VIDEO_HEIGHT, VIDEO_WIDTH, getTimeline} from '../lib/timing';

type Props = {
  props: ConversationProps;
};

export const PreviewPanel: React.FC<Props> = ({props}) => {
  const totalFrames = useMemo(() => getTimeline(props).totalFrames, [props]);
  const seconds = (totalFrames / FPS).toFixed(1);
  const soundLabel =
    props.sound === 'none'
      ? 'None'
      : (SOUNDS.find((s) => s.file === props.sound)?.label ?? props.sound);

  return (
    <aside className="preview-panel">
      <h2 className="preview-title">Live preview</h2>

      <div className="preview-summary">
        <span className="preview-summary-item" title="Contact name">
          👤 {props.contactName || 'Unnamed'}
        </span>
        <span className="preview-summary-item" title="Message count">
          💬 {props.messages.length}
        </span>
        <span className="preview-summary-item" title="Video duration">
          ⏱ {seconds}s
        </span>
        <span className="preview-summary-item" title="Sound">
          🔊 {soundLabel}
        </span>
        {props.hook ? (
          <span className="preview-summary-item" title="Hook clip">
            🎬 hook
          </span>
        ) : null}
      </div>

      <div className="iphone-chassis">
        <span className="iphone-btn iphone-btn--silent" aria-hidden />
        <span className="iphone-btn iphone-btn--vol-up" aria-hidden />
        <span className="iphone-btn iphone-btn--vol-down" aria-hidden />
        <span className="iphone-btn iphone-btn--power" aria-hidden />
        <div className="iphone-screen">
          <Player
            component={ConversationVideo}
            inputProps={props}
            durationInFrames={Math.max(1, totalFrames)}
            compositionWidth={VIDEO_WIDTH}
            compositionHeight={VIDEO_HEIGHT}
            fps={FPS}
            controls
            loop
            clickToPlay
            style={{width: 400, height: 711, maxWidth: '100%'}}
          />
        </div>
      </div>
      <p className="section-note">
        {seconds}s · 1080×1920 · {FPS}fps
      </p>
    </aside>
  );
};
