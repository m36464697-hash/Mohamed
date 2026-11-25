export interface StoryMusicPreset {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  durationSec: number;
  suggestedStartSec: number;
}

export const STORY_MUSIC_PRESETS: StoryMusicPreset[] = [
  {
    id: 'lofi',
    title: 'Midnight Code (Lo-Fi)',
    artist: 'Studio Beats',
    audioUrl: 'preset:lofi',
    durationSec: 28,
    suggestedStartSec: 6,
  },
  {
    id: 'synthwave',
    title: 'Neon Horizon (Synthwave)',
    artist: 'Retro Pulse',
    audioUrl: 'preset:synthwave',
    durationSec: 28,
    suggestedStartSec: 8,
  },
  {
    id: 'dream',
    title: 'Skyline Chill (Ambient)',
    artist: 'Aurora Keys',
    audioUrl: 'preset:dream',
    durationSec: 28,
    suggestedStartSec: 4,
  },
];

const presetBlobCache = new Map<string, string>();

export function formatAudioTime(totalSeconds: number): string {
  const clean = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(clean / 60);
  const secs = clean % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function encodeMonoWav(samples: Float32Array, sampleRate: number): Blob {
  const numSamples = samples.length;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

function synthesizePresetWav(presetId: string): string {
  const cached = presetBlobCache.get(presetId);
  if (cached) return cached;

  const sampleRate = 22050;
  const durationSec = 28;
  const totalSamples = sampleRate * durationSec;
  const samples = new Float32Array(totalSamples);

  const chordsByPreset: Record<string, number[][]> = {
    lofi: [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
      [164.81, 196.0, 246.94, 293.66], // Em7
    ],
    synthwave: [
      [130.81, 196.0, 261.63, 311.13], // Cm
      [116.54, 174.61, 233.08, 293.66], // Bb
      [103.83, 155.56, 207.65, 261.63], // Ab
      [116.54, 174.61, 233.08, 293.66], // Bb
    ],
    dream: [
      [196.0, 246.94, 293.66, 369.99], // Gmaj7
      [164.81, 196.0, 246.94, 329.63], // Em7
      [220.0, 261.63, 329.63, 440.0], // Am
      [146.83, 220.0, 293.66, 369.99], // Dmaj7
    ],
  };

  const chords = chordsByPreset[presetId] ?? chordsByPreset.lofi;
  const bpm = presetId === 'synthwave' ? 112 : presetId === 'dream' ? 78 : 88;
  const beatSec = 60 / bpm;

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const barPos = Math.floor(t / (beatSec * 4));
    const chord = chords[barPos % chords.length];
    const beatPos = t % beatSec;
    const beatIdx = Math.floor(t / beatSec) % 4;
    const step = t % (beatSec / 2);

    // Warm pad chord
    let pad = 0;
    for (let c = 0; c < chord.length; c += 1) {
      const freq = chord[c];
      pad += Math.sin(2 * Math.PI * freq * t) * (0.11 / (c * 0.35 + 1));
    }

    // Subtle arpeggio melody so different sections of the track sound distinct
    const arpFreq = chord[(Math.floor(t / (beatSec / 2)) + barPos) % chord.length] * 2;
    const arpEnv = Math.exp(-step * 8.5);
    const arp = Math.sin(2 * Math.PI * arpFreq * t) * 0.14 * arpEnv;

    // Kick on beats 0 & 2 (soft)
    let drum = 0;
    if (beatIdx === 0 || beatIdx === 2) {
      const kickEnv = Math.exp(-beatPos * 20);
      const kickFreq = 52 + 75 * Math.exp(-beatPos * 35);
      drum += Math.sin(2 * Math.PI * kickFreq * beatPos) * 0.28 * kickEnv;
    }

    // Soft hi-hat tick on off-beats
    if (presetId !== 'dream') {
      const hatEnv = Math.exp(-step * 45);
      const pseudoNoise = Math.sin(i * 12.9898) * 43758.5453;
      const white = (pseudoNoise - Math.floor(pseudoNoise)) * 2 - 1;
      drum += white * 0.04 * hatEnv;
    }

    // Gentle fade-in/out at boundaries
    const edgeEnv = Math.min(1, t / 0.3, (durationSec - t) / 0.3);
    samples[i] = (pad + arp + drum) * edgeEnv * 0.72;
  }

  const blob = encodeMonoWav(samples, sampleRate);
  const url = URL.createObjectURL(blob);
  presetBlobCache.set(presetId, url);
  return url;
}

export function resolveStoryAudioUrl(audioUrl?: string): string {
  if (!audioUrl) return '';
  if (audioUrl.startsWith('preset:')) {
    const id = audioUrl.slice('preset:'.length);
    return synthesizePresetWav(id);
  }
  return audioUrl;
}
