/**
 * Generates the iMessage send/receive blips used by the chat.
 * Dependency-free: both WAVs are synthesized as raw PCM and written as
 * hand-built 44.1kHz 16-bit mono RIFF files.
 *
 *   node scripts/generate-imessage-sfx.mjs
 *
 * Outputs:
 *   public/sounds/imessage-send.wav    — airy ~0.3s swoosh (sent message)
 *   public/sounds/imessage-receive.wav — soft ~0.25s ding (received message)
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
 * Send 'swoosh': white noise through a band-pass whose center sweeps up
 * fast (roughly 800Hz -> 6kHz), quick attack, quick decay. Kept quiet.
 */
const synthSwoosh = (durationSec = 0.3) => {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  const dt = 1 / SAMPLE_RATE;
  let lpHigh = 0; // one-pole lowpass at the sweeping upper cutoff
  let lpLow = 0; // one-pole lowpass at the sweeping lower cutoff
  const attackSec = 0.015;
  const decaySec = 0.055;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    // Exponential sweep up over the first ~80% of the clip.
    const sweep = Math.min(progress / 0.8, 1);
    const cutoffHigh = 800 * Math.pow(7500 / 800, sweep);
    const cutoffLow = cutoffHigh / 3;
    const alphaHigh = dt / (1 / (2 * Math.PI * cutoffHigh) + dt);
    const alphaLow = dt / (1 / (2 * Math.PI * cutoffLow) + dt);
    const noise = Math.random() * 2 - 1;
    lpHigh += alphaHigh * (noise - lpHigh);
    lpLow += alphaLow * (noise - lpLow);
    const band = lpHigh - lpLow;

    const attack = Math.min(t / attackSec, 1);
    const decay = Math.exp(-t / decaySec);
    out[i] = band * attack * decay * 1.4;
  }

  // Normalize to a quiet peak.
  let peak = 0;
  for (const s of out) peak = Math.max(peak, Math.abs(s));
  const gain = peak > 0 ? 0.28 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;
  return out;
};

/**
 * Receive 'ding': sine at ~880Hz (A5) plus a soft octave harmonic,
 * gentle attack, short exponential decay.
 */
const synthDing = (durationSec = 0.25) => {
  const n = Math.round(durationSec * SAMPLE_RATE);
  const out = new Float64Array(n);
  const attackSec = 0.008;
  const decaySec = 0.07;

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const fundamental = Math.sin(2 * Math.PI * 880 * t);
    const harmonic = Math.sin(2 * Math.PI * 1760 * t) * 0.35;
    const attack = Math.min(t / attackSec, 1);
    const decay = Math.exp(-t / decaySec);
    out[i] = (fundamental + harmonic) * attack * decay * 0.35;
  }
  return out;
};

mkdirSync(outDir, {recursive: true});
writeWav(join(outDir, 'imessage-send.wav'), synthSwoosh());
writeWav(join(outDir, 'imessage-receive.wav'), synthDing());
console.log('Wrote imessage-send.wav and imessage-receive.wav to', outDir);
