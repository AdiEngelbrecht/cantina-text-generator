'use client';

import React, {useEffect, useRef, useState} from 'react';
import {canRenderMediaOnWeb, renderMediaOnWeb} from '@remotion/web-renderer';
import type {ConversationProps} from '../lib/types';
import {FPS, getTimeline, VIDEO_HEIGHT, VIDEO_WIDTH} from '../lib/timing';
import {ConversationVideo} from '../remotion/ConversationVideo';

type Props = {
  props: ConversationProps;
};

type RenderState =
  | {phase: 'idle'}
  | {phase: 'rendering'; progress: number}
  | {phase: 'done'; url: string; filename: string}
  | {phase: 'cancelled'}
  | {phase: 'error'; error: string};

const UNSUPPORTED_MESSAGE =
  'In-browser rendering is not supported in this browser. Use the latest Chrome, Edge or Firefox.';

export const RenderPanel: React.FC<Props> = ({props}) => {
  const [state, setState] = useState<RenderState>({phase: 'idle'});
  const abortRef = useRef<AbortController | null>(null);
  const urlRef = useRef<string | null>(null);

  const revokeUrl = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(
    () => () => {
      abortRef.current?.abort();
      revokeUrl();
    },
    [],
  );

  const cancelRender = () => {
    abortRef.current?.abort();
  };

  const startRender = async () => {
    const capability = await canRenderMediaOnWeb({
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      videoBitrate: 'high',
    });
    if (!capability.canRender) {
      setState({phase: 'error', error: UNSUPPORTED_MESSAGE});
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    revokeUrl();
    setState({phase: 'rendering', progress: 0});

    try {
      const result = await renderMediaOnWeb({
        composition: {
          id: 'ConversationVideo',
          component: ConversationVideo,
          durationInFrames: getTimeline(props).totalFrames,
          fps: FPS,
          width: VIDEO_WIDTH,
          height: VIDEO_HEIGHT,
          defaultProps: props,
        },
        inputProps: props,
        videoBitrate: 'high',
        onProgress: ({progress}) => {
          setState({phase: 'rendering', progress});
        },
        signal: controller.signal,
      });

      const blob = await result.getBlob();
      const url = URL.createObjectURL(blob);
      urlRef.current = url;
      const filename = `cantina-text-${Date.now()}.mp4`;
      setState({phase: 'done', url, filename});
    } catch (err) {
      if (controller.signal.aborted) {
        setState({phase: 'cancelled'});
        return;
      }
      setState({
        phase: 'error',
        error: err instanceof Error ? err.message : 'Render failed',
      });
    }
  };

  return (
    <section className="editor-section render-panel">
      <header className="section-header">
        <span className="section-number">6</span>
        <div>
          <h2>Render</h2>
          <p>Export the final 1080×1920 MP4 — rendered in your browser.</p>
        </div>
      </header>

      <button
        type="button"
        className="btn btn--primary btn--big"
        onClick={startRender}
        disabled={state.phase === 'rendering'}
      >
        {state.phase === 'rendering' ? 'Rendering…' : 'Render video'}
      </button>

      {state.phase === 'rendering' ? (
        <div className="progress-wrap">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{width: `${Math.round(state.progress * 100)}%`}}
            />
          </div>
          <span className="section-note">{Math.round(state.progress * 100)}%</span>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={cancelRender}
          >
            Cancel
          </button>
          <span className="section-note">
            Keep this tab visible — rendering in your browser
          </span>
        </div>
      ) : null}

      {state.phase === 'done' ? (
        <div className="render-result">
          <a
            className="btn btn--primary btn--big"
            href={state.url}
            download={state.filename}
          >
            ⬇ Download MP4
          </a>
          <video className="render-video" src={state.url} controls playsInline />
        </div>
      ) : null}

      {state.phase === 'cancelled' ? (
        <p className="section-note">Render cancelled.</p>
      ) : null}

      {state.phase === 'error' ? (
        <p className="section-note error">Render failed: {state.error}</p>
      ) : null}
    </section>
  );
};
