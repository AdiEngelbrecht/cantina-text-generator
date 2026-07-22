'use client';

import React, {useCallback, useEffect, useRef, useState} from 'react';
import type {HookClip} from '../lib/types';

type Props = {
  hook: HookClip | undefined;
  setHook: (hook: HookClip | undefined) => void;
};

type LibraryClip = {
  name: string;
  src: string;
};

const ACCEPT = 'video/*';

/** Measures the duration of a video at an object URL via a temporary <video>. */
const measureFileDuration = (url: string): Promise<number> =>
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

/** Measures the duration of a video at a public URL via a temporary <video>. */
const measureUrlDuration = (src: string): Promise<number> =>
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
    video.onerror = () => reject(new Error('Could not load this clip'));
    video.src = src;
  });

const round2 = (n: number): number => Math.round(n * 100) / 100;

const clamp = (n: number, min: number, max: number): number =>
  Math.min(Math.max(n, min), max);

/** Display name for a hook src: last path segment without extension. */
const hookName = (src: string): string => {
  const file = src.split('/').pop() ?? src;
  const dot = file.lastIndexOf('.');
  return dot > 0 ? file.slice(0, dot) : file;
};

export const HookSection: React.FC<Props> = ({hook, setHook}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [library, setLibrary] = useState<LibraryClip[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimStart = hook?.trimStartSec ?? 0;
  const trimEnd = hook?.trimEndSec ?? hook?.durationSec ?? 0;

  useEffect(() => {
    let cancelled = false;
    fetch('/hooks/manifest.json')
      .then((res) => (res.ok ? res.json() : {hooks: []}))
      .then((data: {hooks?: LibraryClip[]}) => {
        if (!cancelled) setLibrary(data.hooks ?? []);
      })
      .catch(() => {
        if (!cancelled) setLibrary([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectLibraryClip = useCallback(
    async (clip: LibraryClip) => {
      setBusy(true);
      setError(null);
      try {
        const durationSec = await measureUrlDuration(clip.src);
        setHook({src: clip.src, durationSec: round2(durationSec)});
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this clip');
      } finally {
        setBusy(false);
      }
    },
    [setHook],
  );

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('video/')) {
        setError('That file is not a video.');
        return;
      }
      setBusy(true);
      setError(null);
      const url = URL.createObjectURL(file);
      try {
        const durationSec = await measureFileDuration(url);
        setHook({src: url, durationSec: round2(durationSec)});
        setOpen(false);
      } catch (err) {
        URL.revokeObjectURL(url);
        setError(err instanceof Error ? err.message : 'Could not load this clip');
      } finally {
        setBusy(false);
      }
    },
    [setHook],
  );

  return (
    <section className="editor-section">
      <header className="section-header">
        <span className="section-number">2</span>
        <div>
          <h2>Hook video</h2>
          <p>
            Optional. A reaction clip that plays before the chat — caption it
            in CapCut first, it looks better that way.
          </p>
          <p className="section-note" style={{marginTop: 6}}>
            Need clips?{' '}
            <a
              href="https://drive.google.com/drive/folders/1suQPzPFb0i_6ATiABZsLOCMG2-AYYJqn?usp=sharing"
              target="_blank"
              rel="noreferrer"
            >
              Download crying hooks from our Drive folder
            </a>{' '}
            → add your caption in CapCut → upload the finished clip here.
          </p>
        </div>
      </header>

      {hook ? (
        <>
          <div className="hook-card">
            <video
              className="hook-card-video"
              src={hook.src}
              muted
              loop
              playsInline
              preload="metadata"
              onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
            />
            <div className="hook-card-body">
              <strong>{hookName(hook.src)}</strong>
              <span>{hook.durationSec.toFixed(1)}s</span>
            </div>
            <button
              type="button"
              className="btn hook-remove"
              onClick={() => setHook(undefined)}
            >
              Remove hook
            </button>
          </div>

          <label className="field-label">Trim clip</label>
          <div className="hook-trim">
            <div className="hook-trim-row">
              <span className="hook-trim-label">Start</span>
              <input
                type="range"
                className="hook-trim-slider"
                min={0}
                max={hook.durationSec}
                step={0.1}
                value={trimStart}
                onChange={(e) => {
                  const v = clamp(
                    parseFloat(e.target.value) || 0,
                    0,
                    trimEnd - 0.5,
                  );
                  setHook({
                    ...hook,
                    trimStartSec: round2(v),
                    trimEndSec: trimEnd,
                  });
                }}
              />
              <span className="hook-trim-value">{trimStart.toFixed(1)}s</span>
            </div>
            <div className="hook-trim-row">
              <span className="hook-trim-label">End</span>
              <input
                type="range"
                className="hook-trim-slider"
                min={0}
                max={hook.durationSec}
                step={0.1}
                value={trimEnd}
                onChange={(e) => {
                  const v = clamp(
                    parseFloat(e.target.value) || 0,
                    trimStart + 0.5,
                    hook.durationSec,
                  );
                  setHook({
                    ...hook,
                    trimStartSec: trimStart,
                    trimEndSec: round2(v),
                  });
                }}
              />
              <span className="hook-trim-value">{trimEnd.toFixed(1)}s</span>
            </div>
            <div className="hook-trim-footer">
              <span className="section-note hook-trim-readout">
                {trimStart.toFixed(1)}s – {trimEnd.toFixed(1)}s · shows{' '}
                {(trimEnd - trimStart).toFixed(1)}s
              </span>
              <button
                type="button"
                className="btn hook-trim-reset"
                onClick={() =>
                  setHook({
                    ...hook,
                    trimStartSec: 0,
                    trimEndSec: hook.durationSec,
                  })
                }
              >
                Reset
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          {!open ? (
            <button
              type="button"
              className="btn"
              onClick={() => setOpen(true)}
            >
              Add hook video
            </button>
          ) : (
            <>
              {library.length > 0 ? (
                <div className="hook-grid">
                  {library.map((clip) => (
                    <button
                      key={clip.src}
                      type="button"
                      className="hook-clip-card"
                      disabled={busy}
                      onClick={() => selectLibraryClip(clip)}
                    >
                      <video
                        className="hook-clip-video"
                        src={clip.src}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onMouseEnter={(e) =>
                          void e.currentTarget.play().catch(() => {})
                        }
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      <span className="hook-clip-name">{clip.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="section-note">
                  No clips yet — drop clips into <code>public/hooks</code> and
                  run <code>node scripts/update-hooks-manifest.mjs</code>, then
                  they&apos;ll show up here.
                </p>
              )}

              <div className="btn-row">
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => inputRef.current?.click()}
                >
                  {busy ? 'Working…' : 'Upload your own'}
                </button>
                <button
                  type="button"
                  className="btn"
                  disabled={busy}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUpload(file);
                  e.target.value = '';
                }}
              />
            </>
          )}
        </>
      )}

      {error ? <p className="section-note error">{error}</p> : null}
    </section>
  );
};
