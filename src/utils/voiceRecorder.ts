export interface VoiceRecordingResult {
  durationSec: number;
  audioUrl: string;
  waveform: number[];
}

export interface ActiveVoiceRecorder {
  stopAndSave: () => Promise<VoiceRecordingResult | null>;
  cancel: () => void;
}

const DEFAULT_LEVEL = 22;

function normalizeWaveform(samples: number[], targetBars = 24): number[] {
  if (samples.length === 0) {
    return Array.from({ length: targetBars }, (_, i) =>
      Math.round(35 + ((i * 19) % 45))
    );
  }
  const bars: number[] = [];
  for (let i = 0; i < targetBars; i++) {
    const start = Math.floor((i * samples.length) / targetBars);
    const end = Math.max(start + 1, Math.floor(((i + 1) * samples.length) / targetBars));
    let sum = 0;
    for (let j = start; j < end; j++) {
      sum += samples[j];
    }
    const avg = sum / (end - start);
    bars.push(Math.max(18, Math.min(100, Math.round(avg))));
  }
  return bars;
}

export async function startRealVoiceRecording(
  onTick: (elapsedSec: number, liveLevel: number) => void
): Promise<ActiveVoiceRecorder> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('MIC_UNSUPPORTED');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType =
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : '';

  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType })
    : new MediaRecorder(stream);

  const chunks: Blob[] = [];
  const levelSamples: number[] = [];
  const startedAt = Date.now();
  let cancelled = false;

  let audioCtx: AudioContext | null = null;
  let analyser: AnalyserNode | null = null;
  let dataArray: Uint8Array<ArrayBuffer> | null = null;

  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      dataArray = new Uint8Array(new ArrayBuffer(analyser.frequencyBinCount));
    }
  } catch {
    audioCtx = null;
  }

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const meterInterval = window.setInterval(() => {
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    let level = DEFAULT_LEVEL;
    if (analyser && dataArray) {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / Math.max(1, dataArray.length);
      level = Math.max(16, Math.min(100, Math.round((avg / 145) * 100)));
    }
    levelSamples.push(level);
    onTick(elapsedSec, level);
  }, 120);

  const cleanup = () => {
    window.clearInterval(meterInterval);
    stream.getTracks().forEach((t) => t.stop());
    if (audioCtx && audioCtx.state !== 'closed') {
      audioCtx.close().catch(() => {});
    }
  };

  recorder.start(150);

  return {
    cancel: () => {
      cancelled = true;
      cleanup();
      if (recorder.state !== 'inactive') {
        recorder.stop();
      }
    },
    stopAndSave: () =>
      new Promise((resolve) => {
        if (recorder.state === 'inactive') {
          cleanup();
          resolve(null);
          return;
        }
        recorder.onstop = () => {
          cleanup();
          if (cancelled) {
            resolve(null);
            return;
          }
          const durationSec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
          const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            const audioUrl = String(reader.result || '');
            if (!audioUrl) {
              resolve(null);
              return;
            }
            resolve({
              durationSec,
              audioUrl,
              waveform: normalizeWaveform(levelSamples, 24),
            });
          };
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        };
        recorder.stop();
      }),
  };
}
