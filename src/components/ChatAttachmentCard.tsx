import { useEffect, useRef, useState } from 'react';
import { Download, FileText, Image as ImageIcon, Pause, Play } from 'lucide-react';
import { ChatAttachment } from '../types/siteConfig';

const DEFAULT_WAVEFORM = [
  28, 48, 72, 40, 88, 62, 95, 50, 78, 92, 45, 68, 84, 52, 74, 38, 60, 44, 55, 32, 48, 36, 26,
];

function formatDuration(sec: number): string {
  const safe = Math.max(0, Math.floor(sec));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function ChatAttachmentCard({
  attachment,
  variant,
  cornerClass,
}: {
  attachment: ChatAttachment;
  variant: 'dark' | 'accent' | 'blue' | 'white';
  cornerClass: string;
}) {
  const isAccent = variant === 'accent' || variant === 'blue';
  const isDark = variant === 'dark' || variant === 'accent';
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const simTimerRef = useRef<number | null>(null);

  const audioUrlKey = attachment.type === 'audio' ? attachment.audioUrl ?? '' : '';

  useEffect(() => {
    return () => {
      if (simTimerRef.current) window.clearInterval(simTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlaying(false);
      setProgress(0);
    };
  }, [audioUrlKey]);

  const triggerDownload = (url?: string, filename = 'attachment') => {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const cardSurfaceClass = isDark
    ? isAccent
      ? 'text-[#F8FAFC] border shadow-[0_6px_22px_rgba(0,0,0,0.28)]'
      : 'bg-[#161F30] text-[#F1F5F9] border border-white/[0.08] shadow-[0_6px_18px_rgba(0,0,0,0.22)]'
    : variant === 'blue'
    ? 'bg-[#2F66F6] text-white shadow-[0_6px_20px_rgba(47,102,246,0.22)]'
    : 'bg-white text-[#1E293B] border border-[#E6EAF2] shadow-[0_2px_8px_rgba(15,23,42,0.03)]';

  const accentSurfaceStyle =
    variant === 'accent'
      ? {
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--brand) 22%, #131C30), color-mix(in srgb, var(--brand2) 20%, #0E1525))',
          borderColor: 'color-mix(in srgb, var(--brand) 38%, rgba(255,255,255,0.1))',
        }
      : undefined;

  if (attachment.type === 'link') {
    const safeUrl = attachment.url.trim();
    const href = /^https?:\/\//i.test(safeUrl) ? safeUrl : `https://${safeUrl}`;
    return (
      <div
        style={accentSurfaceStyle}
        className={`w-[260px] max-w-full overflow-hidden rounded-2xl ${cornerClass} p-3 ${cardSurfaceClass}`}
      >
        <div
          className={`h-24 w-full overflow-hidden rounded-[10px] flex items-center justify-center ${
            isDark
              ? 'bg-[#0C121F] border border-white/[0.06]'
              : variant === 'blue'
              ? 'bg-[#1D4FD8]'
              : 'bg-[#EFEFF2]'
          }`}
        >
          {attachment.imageUrl ? (
            <img
              src={attachment.imageUrl}
              alt={attachment.title || 'Attachment preview'}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon
              className={`h-8 w-8 ${
                isDark
                  ? 'text-slate-500'
                  : variant === 'blue'
                  ? 'text-[#2F66F6]'
                  : 'text-[#CBD0DA]'
              }`}
              aria-hidden="true"
            />
          )}
        </div>

        <div className="mt-2.5 space-y-0.5 text-start">
          <div
            className={`text-[13px] font-bold leading-snug truncate ${
              isDark || variant === 'blue' ? 'text-[#F8FAFC]' : 'text-[#1E293B]'
            }`}
          >
            {attachment.title || 'Shared Link'}
          </div>
          {safeUrl && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              dir="ltr"
              className={`block text-[12px] underline underline-offset-2 truncate transition-colors ${
                isDark
                  ? 'text-[#93C5FD] hover:text-white'
                  : variant === 'blue'
                  ? 'text-white/90 hover:text-white'
                  : 'text-[#334155] hover:text-[#2F66F6]'
              }`}
            >
              {safeUrl}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (attachment.type === 'audio') {
    const bars =
      attachment.waveform && attachment.waveform.length > 0
        ? attachment.waveform
        : DEFAULT_WAVEFORM;
    const totalSec = Math.max(1, attachment.durationSec || 48);

    const togglePlay = () => {
      if (attachment.audioUrl) {
        if (!audioRef.current) {
          audioRef.current = new Audio(attachment.audioUrl);
          audioRef.current.onended = () => {
            setPlaying(false);
            setProgress(0);
          };
          audioRef.current.ontimeupdate = () => {
            if (!audioRef.current || !audioRef.current.duration) return;
            setProgress(audioRef.current.currentTime / audioRef.current.duration);
          };
        }
        if (playing) {
          audioRef.current.pause();
          setPlaying(false);
        } else {
          audioRef.current.play().catch(() => {});
          setPlaying(true);
        }
        return;
      }

      if (playing) {
        if (simTimerRef.current) window.clearInterval(simTimerRef.current);
        setPlaying(false);
        return;
      }

      setPlaying(true);
      const stepMs = 150;
      const stepFrac = stepMs / (totalSec * 1000);
      simTimerRef.current = window.setInterval(() => {
        setProgress((prev) => {
          const next = prev + stepFrac;
          if (next >= 1) {
            if (simTimerRef.current) window.clearInterval(simTimerRef.current);
            setPlaying(false);
            return 0;
          }
          return next;
        });
      }, stepMs);
    };

    const activeBarCount = Math.round(progress * bars.length);
    const displayTime = playing
      ? formatDuration(Math.max(0, totalSec - Math.floor(progress * totalSec)))
      : formatDuration(totalSec);

    return (
      <div
        dir="ltr"
        style={accentSurfaceStyle}
        className={`w-[270px] max-w-full flex items-center gap-2.5 rounded-2xl ${cornerClass} px-3.5 py-2.5 ${cardSurfaceClass}`}
      >
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? 'Pause voice note' : 'Play voice note'}
          style={
            isDark
              ? { background: 'var(--brand-grad)', color: '#070B14' }
              : undefined
          }
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95 cursor-pointer ${
            isDark
              ? ''
              : variant === 'blue'
              ? 'bg-white text-[#2F66F6]'
              : 'bg-[#2F66F6] text-white'
          }`}
        >
          {playing ? (
            <Pause className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current ms-0.5" />
          )}
        </button>

        <div
          role="slider"
          aria-label="Audio progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
            setProgress(frac);
            if (audioRef.current && audioRef.current.duration) {
              audioRef.current.currentTime = frac * audioRef.current.duration;
            }
          }}
          className="flex flex-1 items-center gap-[2.5px] h-7 min-w-0 cursor-pointer"
        >
          {bars.map((h, idx) => {
            const passed =
              progress > 0 ? idx < activeBarCount : idx < Math.round(bars.length * 0.56);
            return (
              <span
                key={idx}
                className="flex-1 rounded-full transition-colors duration-150"
                style={{
                  height: `${Math.max(18, Math.min(100, h))}%`,
                  minWidth: '2px',
                  backgroundColor: isDark
                    ? passed
                      ? 'var(--brand)'
                      : 'rgba(148,163,184,0.32)'
                    : variant === 'blue'
                    ? passed
                      ? '#FFFFFF'
                      : 'rgba(255,255,255,0.42)'
                    : passed
                    ? '#1E293B'
                    : '#CBD5E1',
                }}
              />
            );
          })}
        </div>

        <span
          className={`text-[11px] font-medium tabular-nums shrink-0 ${
            isDark
              ? 'text-slate-300'
              : variant === 'blue'
              ? 'text-white/95'
              : 'text-[#94A3B8]'
          }`}
        >
          {displayTime}
        </span>

        <button
          type="button"
          onClick={() => triggerDownload(attachment.audioUrl, 'voice-note.webm')}
          aria-label="Download audio"
          className={`shrink-0 p-1 rounded-md transition-colors cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white'
              : variant === 'blue'
              ? 'text-white/85 hover:text-white'
              : 'text-[#94A3B8] hover:text-[#1E293B]'
          }`}
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={accentSurfaceStyle}
      className={`w-[260px] max-w-full flex items-center gap-3 rounded-2xl ${cornerClass} px-3.5 py-3 ${cardSurfaceClass}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          isDark
            ? 'bg-[#0C121F] border border-white/[0.08] text-[var(--brand)]'
            : variant === 'blue'
            ? 'bg-white text-[#2F66F6]'
            : 'bg-[#EFF3FF] text-[#2F66F6]'
        }`}
      >
        <FileText className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1 text-start">
        <div
          className={`text-[12.5px] font-semibold truncate ${
            isDark || variant === 'blue' ? 'text-[#F8FAFC]' : 'text-[#1E293B]'
          }`}
        >
          {attachment.fileName}
        </div>
        <div
          className={`text-[11px] tabular-nums mt-0.5 ${
            isDark
              ? 'text-slate-400'
              : variant === 'blue'
              ? 'text-white/80'
              : 'text-[#94A3B8]'
          }`}
        >
          {attachment.fileSize}
        </div>
      </div>

      <button
        type="button"
        onClick={() => triggerDownload(attachment.fileUrl, attachment.fileName)}
        aria-label="Download file"
        className={`shrink-0 p-1 rounded-md transition-colors cursor-pointer ${
          isDark
            ? 'text-slate-400 hover:text-white'
            : variant === 'blue'
            ? 'text-white/85 hover:text-white'
            : 'text-[#94A3B8] hover:text-[#1E293B]'
        }`}
      >
        <Download className="h-4 w-4" />
      </button>
    </div>
  );
}
