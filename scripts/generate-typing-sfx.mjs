/**
 * Generates the typing sound effects used by the chat.
 * Dependency-free: both WAVs are synthesized as raw PCM and written as
 * hand-built 44.1kHz 16-bit mono RIFF files.
 *
 *   node scripts/generate-typing-sfx.mjs
 *
 * Outputs:
 *   public/sounds/typing-indicator.wav — ~0.6s soft rumble (them is typing)
 *   public/sounds/keyboard-clicks.wav  — ~1.2s quiet key-click track,
 *                                        looped during each me-typing window
 */

import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SAMPLE_RATE = 44100;
const outDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'sounds',
);

/** Writes a Float64 sample array ([-1, 1]) as a 16-bit mono WAV. */
const writeWav = (path, samples) => {
  const dataSize = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // PCM fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM format
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  writeFileSync(path, buffer);
};

/**
 * Typing-indicator rumble: lowpassed brown-ish noise swelling in and out
 * over ~0.6s — a soft "someone is typing" bed under the indicator dots.
 */
const synthTypingIndicator = (durationSec = 0.6) => {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  const dt = 1 / SAMPLE_RATE;
  let lp = 0;
  let brown = 0;
  const cutoff = 420; // Hz — keep it a low rumble
  const alpha = dt / (1 / (2 * Math.PI * cutoff) + dt);

  for (let i = 0; i < n; i++) {
    const progress = i / n;
    // Sine swell envelope: fade in, fade out, no clicks at the edges.
    const envelope = Math.sin(Math.PI * progress) ** 2;
    const noise = Math.random() * 2 - 1;
    brown = (brown + 0.02 * noise) / 1.02;
    lp += alpha * (brown * 8 - lp);
    // A faint high "tappity" shimmer on top.
    const shimmer = noise * 0.06 * envelope;
    out[i] = (lp * 0.9 + shimmer) * envelope;
  }

  // Normalize to a quiet peak.
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.22 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;
  return out;
};

/**
 * Keyboard clicks: ~9 short filtered noise ticks at slightly irregular
 * intervals over ~1.2s, quiet enough to loop under a typing window.
 * Deterministic tick pattern so the loop seam is not jarring.
 */
const synthKeyboardClicks = (durationSec = 1.2) => {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  // Tick onset times (seconds) — irregular like real typing, with a gap
  // near the end so the loop reads as a natural pause between words.
  const ticks = [0.04, 0.13, 0.21, 0.34, 0.4, 0.52, 0.66, 0.74, 0.88, 0.97];
  const tickLen = Math.round(0.018 * SAMPLE_RATE);

  for (const start of ticks) {
    const offset = Math.round(start * SAMPLE_RATE);
    // Each tick: bandpassed noise burst, slightly different pitch per tick.
    const center = 1800 + Math.random() * 1400;
    const dt = 1 / SAMPLE_RATE;
    let lpHigh = 0;
    let lpLow = 0;
    const alphaHigh = dt / (1 / (2 * Math.PI * center) + dt);
    const alphaLow = dt / (1 / (2 * Math.PI * (center / 2.5)) + dt);
    for (let i = 0; i < tickLen && offset + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const noise = Math.random() * 2 - 1;
      lpHigh += alphaHigh * (noise - lpHigh);
      lpLow += alphaLow * (noise - lpLow);
      const envelope = Math.exp(-t / 0.004);
      out[offset + i] += (lpHigh - lpLow) * envelope * 0.9;
    }
  }

  // Normalize to a quiet peak.
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.18 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;
  return out;
};

mkdirSync(outDir, {recursive: true});
writeWav(join(outDir, 'typing-indicator.wav'), synthTypingIndicator());
writeWav(join(outDir, 'keyboard-clicks.wav'), synthKeyboardClicks());
console.log('Wrote typing-indicator.wav and keyboard-clicks.wav to', outDir);
