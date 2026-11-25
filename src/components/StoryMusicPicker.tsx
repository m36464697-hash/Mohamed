import { ChangeEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Music2, Pause, Play, Scissors, Trash2, Upload, Volume2 } from 'lucide-react';
import { StoryMusic } from '../types/siteConfig';
import {
  STORY_MUSIC_PRESETS,
  formatAudioTime,
  resolveStoryAudioUrl,
} from '../utils/storyAudio';

interface StoryMusicPickerProps {
  value?: StoryMusic;
  storyDurationSec: number;
  onChange: (next?: StoryMusic) => void;
  onNotify?: (msg: string) => void;
  compact?: boolean;
}

const WAVEFORM_BARS = [
  34, 52, 74, 46, 88, 62, 40, 92, 78, 55, 68, 95, 58, 42, 82, 66, 48, 86,
  94, 60, 44, 76, 89, 53, 64, 91, 49, 71, 84, 57, 39, 79, 63, 47, 72, 44,
];

export function StoryMusicPicker({
  value,
  storyDurationSec,
  onChange,
  onNotify,
  compact = false,
}: StoryMusicPickerProps) {
  const [urlInput, setUrlInput] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewCurrentSec, setPreviewCurrentSec] = useState(value?.startSec ?? 0);
  const [detectedDuration, setDetectedDuration] = useState<number>(
    value?.totalDurationSec ?? 30
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformRef = useRef<HTMLDivElement | null>(null);

  const resolvedSrc = useMemo(
    () => resolveStoryAudioUrl(value?.audioUrl),
    [value?.audioUrl]
  );

  const totalDuration = Math.max(
    4,
    Math.round(value?.totalDurationSec || detectedDuration || 30)
  );
  const clipDuration = Math.min(
    totalDuration,
    Math.max(2, value?.clipDurationSec ?? Math.min(15, Math.max(storyDurationSec, 6)))
  );
  const maxStart = Math.max(0, totalDuration - clipDuration);
  const startSec = Math.min(maxStart, Math.max(0, value?.startSec ?? 0));
  const endSec = Math.min(totalDuration, startSec + clipDuration);

  useEffect(() => {
    setDetectedDuration(value?.totalDurationSec ?? 30);
    setPreviewCurrentSec(value?.startSec ?? 0);
    setIsPlayingPreview(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [value?.audioUrl]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = value?.volume ?? 0.85;
    }
  }, [value?.volume]);

  // Enforce selected clip window [startSec .. endSec] during preview playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isPlayingPreview) return;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSec || audio.currentTime < startSec - 0.35) {
        audio.currentTime = startSec;
      }
      setPreviewCurrentSec(audio.currentTime);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isPlayingPreview, startSec, endSec]);

  const handleTogglePreview = () => {
    const audio = audioRef.current;
    if (!audio || !resolvedSrc) return;
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
      return;
    }
    audio.currentTime = startSec;
    audio.volume = value?.volume ?? 0.85;
    audio
      .play()
      .then(() => {
        setIsPlayingPreview(true);
        setPreviewCurrentSec(startSec);
      })
      .catch(() => {
        onNotify?.('تعذر تشغيل هذا الرابط الصوتي، تأكد من صحة ملف أو رابط الصوت.');
      });
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) {
      onNotify?.('يفضل اختيار مقطع صوتي أصغر من 4.5 ميجابايت لضمان حفظه بسلاسة.');
    }
    const cleanTitle = file.name.replace(/\.[^.]+$/, '') || 'أغنية مخصصة';
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      onChange({
        title: cleanTitle,
        artist: 'ملف مرفوع',
        audioUrl: dataUrl,
        startSec: 0,
        clipDurationSec: Math.max(4, storyDurationSec),
        totalDurationSec: 30,
        volume: value?.volume ?? 0.85,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddFromUrl = () => {
    const clean = urlInput.trim();
    if (!clean) return;
    onChange({
      title: 'مقطع صوتي من رابط',
      artist: 'Audio URL',
      audioUrl: clean,
      startSec: 0,
      clipDurationSec: Math.max(4, storyDurationSec),
      totalDurationSec: 30,
      volume: value?.volume ?? 0.85,
    });
    setUrlInput('');
  };

  const handleSelectPreset = (preset: (typeof STORY_MUSIC_PRESETS)[number]) => {
    const clipLen = Math.min(preset.durationSec, Math.max(4, storyDurationSec));
    const safeStart = Math.min(
      Math.max(0, preset.durationSec - clipLen),
      preset.suggestedStartSec
    );
    onChange({
      title: preset.title,
      artist: preset.artist,
      audioUrl: preset.audioUrl,
      startSec: safeStart,
      clipDurationSec: clipLen,
      totalDurationSec: preset.durationSec,
      volume: value?.volume ?? 0.85,
    });
  };

  const updateStartSec = (nextStart: number) => {
    if (!value) return;
    const clamped = Math.min(maxStart, Math.max(0, Math.round(nextStart)));
    onChange({
      ...value,
      startSec: clamped,
    });
    if (audioRef.current && isPlayingPreview) {
      audioRef.current.currentTime = clamped;
      setPreviewCurrentSec(clamped);
    }
  };

  const updateClipDuration = (nextDur: number) => {
    if (!value) return;
    const clampedDur = Math.min(totalDuration, Math.max(2, Math.round(nextDur)));
    const nextMaxStart = Math.max(0, totalDuration - clampedDur);
    onChange({
      ...value,
      clipDurationSec: clampedDur,
      startSec: Math.min(value.startSec, nextMaxStart),
    });
  };

  const handleWaveformClick = (e: MouseEvent<HTMLDivElement>) => {
    if (!value || !waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const clickedSec = ratio * totalDuration;
    updateStartSec(clickedSec - clipDuration / 2);
  };

  const windowLeftPct = (startSec / totalDuration) * 100;
  const windowWidthPct = Math.max(4, ((endSec - startSec) / totalDuration) * 100);
  const playheadPct = Math.min(
    100,
    Math.max(0, (previewCurrentSec / totalDuration) * 100)
  );

  const inputClass =
    'h-10 w-full rounded-xl border border-white/[0.09] bg-[#060912] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[#00d2ff] focus:outline-none transition-all';

  if (!value) {
    return (
      <div
        className={`rounded-xl border border-white/[0.08] bg-[#070b14] ${
          compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-4'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-extrabold text-white">
            <Music2 className="h-4 w-4 text-[#00d2ff]" />
            <span>إضافة أغنية أو موسيقى للقصة (اختياري)</span>
          </div>
          <span className="text-[10.5px] font-semibold text-slate-400">
            مع قص المقطع المحدد
          </span>
        </div>

        {/* Built-in Music Presets */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold text-slate-400">
            مقاطع جاهزة للتشغيل الفوري:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STORY_MUSIC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0b101b] p-2.5 text-right hover:border-[#00d2ff]/45 hover:bg-[#0f1728] transition-colors cursor-pointer"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00d2ff]/12 text-[#00d2ff]">
                  <Music2 className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-extrabold text-white truncate">
                    {preset.title}
                  </span>
                  <span className="block text-[10px] text-slate-400 truncate">
                    {preset.artist} · {formatAudioTime(preset.durationSec)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Upload or Paste Direct Audio Link */}
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-3.5 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer shrink-0">
            <Upload className="h-3.5 w-3.5" />
            <span>رفع أغنية (MP3 / WAV)</span>
            <input
              type="file"
              accept="audio/*"
              onChange={handleAudioUpload}
              className="hidden"
            />
          </label>
          <div className="flex flex-1 gap-2">
            <input
              type="url"
              dir="ltr"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="أو الصق رابط ملف صوتي مباشر (.mp3 / .m4a)..."
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAddFromUrl}
              disabled={!urlInput.trim()}
              className="inline-flex h-10 items-center rounded-xl bg-white/10 px-3.5 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40 cursor-pointer shrink-0"
            >
              إضافة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border border-[#00d2ff]/30 bg-[#070b14] ${
        compact ? 'p-3.5 space-y-3.5' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const dur = e.currentTarget.duration;
          if (Number.isFinite(dur) && dur > 1) {
            const rounded = Math.round(dur);
            setDetectedDuration(rounded);
            if (value.totalDurationSec !== rounded) {
              const safeClip = Math.min(rounded, Math.max(2, value.clipDurationSec));
              const safeStart = Math.min(Math.max(0, rounded - safeClip), value.startSec);
              onChange({
                ...value,
                totalDurationSec: rounded,
                clipDurationSec: safeClip,
                startSec: safeStart,
              });
            }
          }
        }}
        onEnded={() => setIsPlayingPreview(false)}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00d2ff]/25 to-[#3a7bd5]/25 border border-[#00d2ff]/35 text-[#00d2ff]">
            <Music2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-white truncate">
              {value.title || 'مقطع موسيقي'}
            </div>
            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5 tabular-nums">
              <span>{value.artist || 'أغنية القصة'}</span>
              <span>·</span>
              <span className="text-[#00d2ff] font-bold">
                المقطع: {formatAudioTime(startSec)} – {formatAudioTime(endSec)}
              </span>
              <span className="text-slate-500">
                (الإجمالي {formatAudioTime(totalDuration)})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleTogglePreview}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer transition-colors ${
              isPlayingPreview
                ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-300'
                : 'border-[#00d2ff]/40 bg-[#00d2ff]/12 text-[#00d2ff] hover:bg-[#00d2ff]/20'
            }`}
          >
            {isPlayingPreview ? (
              <>
                <Pause className="h-3.5 w-3.5" />
                <span>إيقاف المعاينة</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>تشغيل المقطع</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              audioRef.current?.pause();
              setIsPlayingPreview(false);
              onChange(undefined);
            }}
            aria-label="إزالة الأغنية"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editable Song Metadata */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            اسم الأغنية
          </label>
          <input
            type="text"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="اسم الأغنية أو المقطع..."
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 mb-1">
            اسم الفنان / المصدر
          </label>
          <input
            type="text"
            value={value.artist ?? ''}
            onChange={(e) => onChange({ ...value, artist: e.target.value })}
            placeholder="اسم الفنان..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Interactive Waveform Clip Selector */}
      <div className="rounded-xl border border-white/[0.07] bg-[#04070e] p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200">
            <Scissors className="h-3.5 w-3.5 text-[#00d2ff]" />
            <span>اضغط على الموجة أو حرّك المؤشر لتحديد المقطع المطلوب</span>
          </span>
          <span className="font-mono text-[11px] font-bold text-[#00d2ff] tabular-nums">
            {formatAudioTime(startSec)} → {formatAudioTime(endSec)}
          </span>
        </div>

        {/* Clickable Waveform Bar */}
        <div
          ref={waveformRef}
          dir="ltr"
          onClick={handleWaveformClick}
          title="اضغط لاختيار نقطة البداية"
          className="relative h-14 w-full rounded-lg border border-white/[0.08] bg-[#080e1a] overflow-hidden cursor-pointer flex items-center px-1.5 gap-[3px]"
        >
          {/* Selected Clip Highlight Window */}
          <div
            className="pointer-events-none absolute inset-y-0 border-x-2 border-[#00d2ff] bg-[#00d2ff]/14 transition-all duration-150"
            style={{
              left: `${windowLeftPct}%`,
              width: `${windowWidthPct}%`,
            }}
          />

          {/* Live Playhead */}
          {isPlayingPreview && (
            <div
              className="pointer-events-none absolute inset-y-0 w-[2px] bg-white shadow-[0_0_8px_#fff] z-10"
              style={{ left: `${playheadPct}%` }}
            />
          )}

          {WAVEFORM_BARS.map((heightPct, idx) => {
            const barPct = ((idx + 0.5) / WAVEFORM_BARS.length) * 100;
            const inClip =
              barPct >= windowLeftPct && barPct <= windowLeftPct + windowWidthPct;
            return (
              <span
                key={idx}
                className="relative z-[1] flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: inClip ? '#00d2ff' : 'rgba(148, 163, 184, 0.28)',
                }}
              />
            );
          })}
        </div>

        {/* Start Time & Clip Duration Sliders */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">بداية المقطع من الأغنية</span>
              <span className="font-mono font-bold text-[#00d2ff] tabular-nums">
                {formatAudioTime(startSec)}
              </span>
            </div>
            <input
              type="range"
              dir="ltr"
              min={0}
              max={maxStart}
              step={1}
              value={startSec}
              onChange={(e) => updateStartSec(Number(e.target.value))}
              className="w-full accent-[#00d2ff] cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-slate-300">طول المقطع المقتطع</span>
              <span className="font-mono font-bold text-[#00d2ff] tabular-nums">
                {clipDuration} ث
              </span>
            </div>
            <input
              type="range"
              dir="ltr"
              min={2}
              max={Math.min(30, totalDuration)}
              step={1}
              value={clipDuration}
              onChange={(e) => updateClipDuration(Number(e.target.value))}
              className="w-full accent-[#00d2ff] cursor-pointer"
            />
          </div>
        </div>

        {/* Quick Duration Chips + Volume */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            {[5, 8, 10, 15, 20]
              .filter((sec) => sec <= totalDuration)
              .map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateClipDuration(sec)}
                  className={`rounded-md border px-2 py-1 text-[10.5px] font-bold cursor-pointer ${
                    clipDuration === sec
                      ? 'border-[#00d2ff] bg-[#00d2ff]/18 text-[#00d2ff]'
                      : 'border-white/10 bg-[#0b101b] text-slate-400 hover:text-white'
                  }`}
                >
                  {sec} ث
                </button>
              ))}
            {clipDuration !== storyDurationSec && storyDurationSec <= totalDuration && (
              <button
                type="button"
                onClick={() => updateClipDuration(storyDurationSec)}
                className="rounded-md border border-white/15 bg-white/[0.05] px-2 py-1 text-[10.5px] font-bold text-slate-200 hover:border-[#00d2ff]/50 cursor-pointer"
              >
                مطابقة القصة ({storyDurationSec} ث)
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 min-w-[140px]">
            <Volume2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="range"
              dir="ltr"
              min={0.1}
              max={1}
              step={0.05}
              value={value.volume ?? 0.85}
              onChange={(e) =>
                onChange({ ...value, volume: Number(e.target.value) })
              }
              aria-label="مستوى صوت الأغنية"
              className="w-24 accent-[#00d2ff] cursor-pointer"
            />
            <span className="text-[10.5px] font-mono text-slate-400 tabular-nums w-8 text-end">
              {Math.round((value.volume ?? 0.85) * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
