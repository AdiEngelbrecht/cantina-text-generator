'use client';

import React, {useEffect, useRef, useState} from 'react';
import type {ConversationProps} from '../lib/types';

type Props = {
  props: ConversationProps;
};

type RenderState =
  | {phase: 'idle'}
  | {phase: 'rendering'; progress: number}
  | {phase: 'done'; url: string}
  | {phase: 'error'; error: string};

/** Defensive parse of GET /api/render/<id> — the exact shape is owned by the API agent. */
type RenderStatus = {
  status?: string;
  progress?: number;
  url?: string;
  error?: string;
};

export const RenderPanel: React.FC<Props> = ({props}) => {
  const [state, setState] = useState<RenderState>({phase: 'idle'});
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => stopPolling, []);

  const startRender = async () => {
    stopPolling();
    setState({phase: 'rendering', progress: 0});
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(props),
      });
      if (!res.ok) {
        throw new Error(`Render request failed (${res.status})`);
      }
      const data = (await res.json()) as {id?: string};
      if (!data.id) {
        throw new Error('Render response did not include an id');
      }
      const id = data.id;

      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/render/${id}`);
          if (!statusRes.ok) return; // transient — keep polling
          const status = (await statusRes.json()) as RenderStatus;
          if (status.status === 'done' && status.url) {
            stopPolling();
            setState({phase: 'done', url: status.url});
          } else if (status.status === 'error') {
            stopPolling();
            setState({phase: 'error', error: status.error ?? 'Render failed'});
          } else {
            setState({
              phase: 'rendering',
              progress: Math.min(Math.max(status.progress ?? 0, 0), 1),
            });
          }
        } catch {
          // network hiccup — keep polling
        }
      }, 1000);
    } catch (err) {
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
          <p>Export the final 1080×1920 MP4.</p>
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
        </div>
      ) : null}

      {state.phase === 'done' ? (
        <div className="render-result">
          <a className="btn btn--primary btn--big" href={state.url} download>
            ⬇ Download MP4
          </a>
          <video className="render-video" src={state.url} controls playsInline />
        </div>
      ) : null}

      {state.phase === 'error' ? (
        <p className="section-note error">Render failed: {state.error}</p>
      ) : null}
    </section>
  );
};
