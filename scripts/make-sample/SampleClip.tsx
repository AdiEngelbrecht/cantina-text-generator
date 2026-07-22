import {Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

/**
 * Placeholder "Cantina response" clip, rendered to
 * `public/sample/cantina-response.mp4` via
 * `npx remotion render scripts/make-sample/entry.ts SampleClip public/sample/cantina-response.mp4`.
 */
export const SampleClip = () => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;

  // Slow rotating gradient sweep.
  const angle = interpolate(t, [0, 6], [0, 360]);
  const hue = interpolate(t, [0, 6], [300, 220]);

  // Pulsing wordmark.
  const pulse = spring({
    frame: frame % Math.round(fps * 0.8),
    fps,
    config: {damping: 12, stiffness: 200, mass: 0.6},
  });
  const scale = 1 + 0.12 * (1 - pulse);

  // Entrance pop.
  const entrance = spring({frame, fps, config: {damping: 14, stiffness: 160}});

  // Glitch: hard horizontal jitter on a few frames each "beat".
  const glitchSeed = Math.floor(frame / 4);
  const glitchOn = glitchSeed % 7 === 3;
  const glitchX = glitchOn ? Math.sin(glitchSeed * 999) * 26 : 0;
  const glitchY = glitchOn ? Math.cos(glitchSeed * 777) * 8 : 0;

  // Energetic slow zoom with a punch at the end.
  const zoom = 1 + 0.08 * Math.sin(t * 2.4) + interpolate(t, [5.2, 6], [0, 0.18], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Caption slides up a beat in.
  const captionIn = spring({frame: Math.max(0, frame - Math.round(fps * 0.9)), fps, config: {damping: 15}});
  const captionY = (1 - captionIn) * 60;

  // RGB-split intensity follows the pulse.
  const split = 3 + 5 * (1 - pulse) + (glitchOn ? 10 : 0);

  return (
    <div
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        background: `linear-gradient(${angle}deg, hsl(${hue}, 90%, 55%), hsl(${(hue + 80) % 360}, 85%, 45%), hsl(${(hue + 180) % 360}, 90%, 50%))`,
        fontFamily: 'Helvetica, Arial, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* drifting glow blob */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.35), transparent 65%)',
          transform: `translate(${Math.sin(t * 1.7) * 160}px, ${Math.cos(t * 1.3) * 220}px) scale(${zoom})`,
        }}
      />

      {/* wordmark stack */}
      <div style={{transform: `translate(${glitchX}px, ${glitchY}px) scale(${scale * entrance * zoom})`}}>
        {(['#00ffff', '#ff00ff', '#ffffff'] as const).map((color, i) => (
          <div
            key={color}
            style={{
              position: i === 2 ? 'relative' : 'absolute',
              inset: 0,
              fontSize: 118,
              fontWeight: 900,
              fontStyle: 'italic',
              letterSpacing: -2,
              color,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              transform:
                i === 0
                  ? `translateX(${-split}px)`
                  : i === 1
                    ? `translateX(${split}px)`
                    : undefined,
              opacity: i === 2 ? 1 : 0.7,
              mixBlendMode: i === 2 ? 'normal' : 'screen',
              textShadow: i === 2 ? '0 6px 40px rgba(0,0,0,0.45)' : undefined,
            }}
          >
            CANTINA
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 32,
          fontSize: 44,
          fontWeight: 700,
          color: 'white',
          opacity: captionIn,
          transform: `translateY(${captionY}px)`,
          textShadow: '0 3px 18px rgba(0,0,0,0.5)',
        }}
      >
        sent this for you
      </div>

      {/* scanlines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 2px, transparent 2px, transparent 6px)',
          pointerEvents: 'none',
        }}
      />

      {/* audio bed: the same Gymnopédie piano used for the punchline */}
      <Audio src={staticFile('sounds/gymnopedie-piano.mp3')} volume={0.4} />
    </div>
  );
};
