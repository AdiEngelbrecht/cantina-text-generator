'use client';

import React, {useCallback, useRef, useState} from 'react';
import type {CantinaAppSceneProps} from '../lib/types';

type Props = {
  /** Called with the public src and measured duration once the upload succeeds. */
  onVideoReady: (src: string, durationSec: number) => void;
  hasVideo: boolean;
  /** Current Cantina app-scene settings; undefined = scene disabled (checkbox off). */
  cantinaApp?: CantinaAppSceneProps;
  /** Called with the scene settings, or undefined when the checkbox is off. */
  onCantinaAppChange: (scene: CantinaAppSceneProps | undefined) => void;
};

const DEFAULT_SCENE: CantinaAppSceneProps = {
  prompt: '',
  typingSec: 3,
  generatingSec: 4,
};

const ACCEPT = 'video/*';

/** Measures the duration of a video at an object URL via a temporary <video>. */
const measureDuration = (url: string): Promise<number> =>
  new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        resolve(video.duration);
      } else {
        reject(new Error('Could not read video duration'));
      }
    };
    video.onerror = () => reject(new Error('Could not read this video file'));
    video.src = url;
  });

export const UploadSection: React.FC<Props> = ({
  onVideoReady,
  hasVideo,
  cantinaApp,
  onCantinaAppChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const charInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) {
        setError('That file is not a video. Pick a video from the Cantina app.');
        return;
      }
      setBusy(true);
      setError(null);
      const url = URL.createObjectURL(file);
      try {
        const durationSec = await measureDuration(url);
        onVideoReady(url, Math.round(durationSec * 100) / 100);
        setUploadedName(file.name);
        // The app scene defaults to ON once a video is loaded.
        if (cantinaApp === undefined) onCantinaAppChange(DEFAULT_SCENE);
      } catch (err) {
        URL.revokeObjectURL(url);
        setError(err instanceof Error ? err.message : 'Could not load this video');
      } finally {
        setBusy(false);
      }
    },
    [onVideoReady, cantinaApp, onCantinaAppChange],
  );

  const patchScene = (patch: Partial<CantinaAppSceneProps>) => {
    onCantinaAppChange({...DEFAULT_SCENE, ...cantinaApp, ...patch});
  };

  const handleCharacterFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file); // kept alive for the session
    patchScene({characterSrc: url});
  };

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">1</span>
        <div>
          <h2>Upload Cantina video</h2>
          <p>The response video you made in the Cantina app.</p>
        </div>
      </header>

      <div
        className={`dropzone${dragging ? ' dropzone--dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        {busy ? (
          <span>Processing…</span>
        ) : (
          <>
            <span className="dropzone-title">
              {hasVideo ? 'Replace video' : 'Drop your video here'}
            </span>
            <span className="dropzone-sub">or click to browse</span>
          </>
        )}
      </div>

      {uploadedName && !error ? (
        <p className="section-note ok">Loaded: {uploadedName}</p>
      ) : null}
      {error ? <p className="section-note error">{error}</p> : null}

      {hasVideo ? (
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={cantinaApp !== undefined}
              onChange={(e) =>
                onCantinaAppChange(
                  e.target.checked ? {...DEFAULT_SCENE, ...cantinaApp} : undefined,
                )
              }
              style={{accentColor: 'var(--accent)', width: 16, height: 16}}
            />
            Play Cantina app scene before the chat
          </label>

          {cantinaApp !== undefined ? (
            <>
              <label className="field-label" htmlFor="cantina-prompt">
                Prompt typed in the app
              </label>
              <textarea
                id="cantina-prompt"
                className="input"
                rows={2}
                placeholder="show a funny response video"
                value={cantinaApp.prompt}
                onChange={(e) => patchScene({prompt: e.target.value})}
                style={{resize: 'vertical', fontFamily: 'inherit'}}
              />
              <div className="hook-trim-row" style={{marginTop: 10}}>
                <span className="hook-trim-label" style={{width: 76}}>
                  Typing
                </span>
                <input
                  className="hook-trim-slider"
                  type="range"
                  min={1}
                  max={6}
                  step={0.5}
                  value={cantinaApp.typingSec ?? 3}
                  onChange={(e) => patchScene({typingSec: Number(e.target.value)})}
                />
                <span className="hook-trim-value">
                  {(cantinaApp.typingSec ?? 3).toFixed(1)}s
                </span>
              </div>
              <div className="hook-trim-row" style={{marginTop: 8}}>
                <span className="hook-trim-label" style={{width: 76}}>
                  Generating
                </span>
                <input
                  className="hook-trim-slider"
                  type="range"
                  min={2}
                  max={8}
                  step={0.5}
                  value={cantinaApp.generatingSec ?? 4}
                  onChange={(e) => patchScene({generatingSec: Number(e.target.value)})}
                />
                <span className="hook-trim-value">
                  {(cantinaApp.generatingSec ?? 4).toFixed(1)}s
                </span>
              </div>

              <label className="field-label" style={{marginTop: 12}}>
                Cantina character image (optional)
              </label>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <input
                  ref={charInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleCharacterFile(file);
                    e.target.value = '';
                  }}
                />
                {cantinaApp.characterSrc ? (
                  <img
                    src={cantinaApp.characterSrc}
                    alt="Cantina character"
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      objectFit: 'cover',
                      border: '1px solid var(--border)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      border: '1px dashed var(--border)',
                    }}
                  />
                )}
                <button
                  type="button"
                  className="btn"
                  style={{padding: '6px 12px', fontSize: 12.5}}
                  onClick={() => charInputRef.current?.click()}
                >
                  Upload
                </button>
                {cantinaApp.characterSrc ? (
                  <button
                    type="button"
                    className="btn btn--ghost"
                    style={{padding: '6px 12px', fontSize: 12.5}}
                    onClick={() => patchScene({characterSrc: undefined})}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <p className="section-note" style={{marginTop: 6}}>
                No character? The clip itself is shown in the app.
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};
