'use client';

import React, {useCallback, useRef, useState} from 'react';

type Props = {
  /** Called with the public src and measured duration once the upload succeeds. */
  onVideoReady: (src: string, durationSec: number) => void;
  hasVideo: boolean;
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

export const UploadSection: React.FC<Props> = ({onVideoReady, hasVideo}) => {
  const inputRef = useRef<HTMLInputElement>(null);
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
      } catch (err) {
        URL.revokeObjectURL(url);
        setError(err instanceof Error ? err.message : 'Could not load this video');
      } finally {
        setBusy(false);
      }
    },
    [onVideoReady],
  );

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
    </section>
  );
};
