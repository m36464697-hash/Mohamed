import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Music2,
  Pause,
  Play,
  Send,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { Lang, SiteConfig, StoryItem, StoryRingStyle, Theme } from '../types/siteConfig';
import { formatAudioTime, resolveStoryAudioUrl } from '../utils/storyAudio';
import { formatStoryExpiryRemaining } from '../utils/storyUtils';

function getStoryRingGradient(style: StoryRingStyle, brand1: string, brand2: string): string {
  if (style === 'tiktok') {
    return 'linear-gradient(135deg, #25F4EE 0%, #8B5CF6 48%, #FE2C55 100%)';
  }
  if (style === 'brand') {
    return `linear-gradient(135deg, ${brand1}, ${brand2})`;
  }
  return 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)';
}

function formatRelativeTime(iso: string, lang: Lang): string {
  try {
    const diffMs = Math.max(0, Date.now() - new Date(iso).getTime());
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return lang === 'ar' ? 'الآن' : 'Just now';
    if (mins < 60) return lang === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return lang === 'ar' ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return lang === 'ar' ? `منذ ${days} ي` : `${days}d ago`;
  } catch {
    return lang === 'ar' ? 'اليوم' : 'Today';
  }
}

/* ============================================================================
 * 1. Avatar Click Choice Modal (View Story vs View Profile Photo)
 * ============================================================================ */
interface AvatarChoiceModalProps {
  isOpen: boolean;
  lang: Lang;
  theme: Theme;
  config: SiteConfig;
  storyCount: number;
  hasUnseenStories: boolean;
  onChooseViewStory: () => void;
  onChooseViewAvatar: () => void;
  onClose: () => void;
}

export function AvatarChoiceModal({
  isOpen,
  lang,
  theme,
  config,
  storyCount,
  hasUnseenStories,
  onChooseViewStory,
  onChooseViewAvatar,
  onClose,
}: AvatarChoiceModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';
  const isLight = theme === 'light';
  const ringGrad = getStoryRingGradient(
    config.stories.ringStyle,
    config.appearance.brandColor,
    config.appearance.brandColor2
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'خيارات الصورة الشخصية' : 'Profile photo options'}
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 p-3 sm:p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`alaa-pop-in w-full max-w-[360px] rounded-[22px] border p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)] ${
          isLight
            ? 'border-slate-200 bg-white text-slate-900'
            : 'border-white/10 bg-[#0f1624] text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-current/10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={config.hero.avatarImage}
              alt={config.hero.brandName}
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border border-current/15 shrink-0"
            />
            <div className="min-w-0">
              <div className="text-sm font-extrabold truncate">{config.hero.brandName}</div>
              <div
                className={`text-[11px] ${
                  isLight ? 'text-slate-500' : 'text-slate-400'
                }`}
              >
                {isAr ? 'ماذا تريد أن تشاهد؟' : 'What would you like to view?'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                : 'text-slate-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Option 1: View Story */}
          <button
            type="button"
            onClick={onChooseViewStory}
            className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-start transition-all cursor-pointer ${
              isLight
                ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100'
                : 'border-white/[0.08] bg-[#161f30] hover:border-white/20 hover:bg-[#1c273b]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full p-[2.5px] shadow-sm"
                style={{
                  background: hasUnseenStories
                    ? ringGrad
                    : isLight
                    ? '#CBD5E1'
                    : 'rgba(148, 163, 184, 0.45)',
                }}
              >
                <div
                  className={`h-full w-full rounded-full p-[2px] overflow-hidden ${
                    isLight ? 'bg-white' : 'bg-[#0f1624]'
                  }`}
                >
                  <img
                    src={config.hero.avatarImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold">
                  {isAr ? 'رؤية القصة' : 'View Story'}
                </div>
                <div
                  className={`text-[11.5px] mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {isAr
                    ? `${storyCount} ${storyCount === 1 ? 'قصة نشطة الآن' : 'قصص نشطة الآن'}`
                    : `${storyCount} ${storyCount === 1 ? 'active story' : 'active stories'}`}
                </div>
              </div>
            </div>
            {isAr ? (
              <ChevronLeft className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </button>

          {/* Option 2: View Profile Picture */}
          <button
            type="button"
            onClick={onChooseViewAvatar}
            className={`group flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-start transition-all cursor-pointer ${
              isLight
                ? 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-100'
                : 'border-white/[0.08] bg-[#161f30] hover:border-white/20 hover:bg-[#1c273b]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                  isLight
                    ? 'border-slate-200 bg-white text-slate-700'
                    : 'border-white/10 bg-[#0f1624] text-slate-200'
                }`}
              >
                <User className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <div className="text-[13.5px] font-extrabold">
                  {isAr ? 'رؤية صورة الملف الشخصي' : 'View Profile Photo'}
                </div>
                <div
                  className={`text-[11.5px] mt-0.5 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {isAr ? 'عرض الصورة الشخصية بالحجم الكامل' : 'Open full-size avatar photo'}
                </div>
              </div>
            </div>
            {isAr ? (
              <ChevronLeft className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 2. Profile Picture Lightbox Modal
 * ============================================================================ */
interface AvatarLightboxModalProps {
  isOpen: boolean;
  lang: Lang;
  config: SiteConfig;
  onClose: () => void;
}

export function AvatarLightboxModal({
  isOpen,
  lang,
  config,
  onClose,
}: AvatarLightboxModalProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    if (isOpen) setImgFailed(false);
  }, [isOpen, config.hero.avatarImage]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'صورة الملف الشخصي' : 'Profile Photo'}
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-[85] flex flex-col items-center justify-center bg-black/92 p-4 backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={isAr ? 'إغلاق' : 'Close'}
        className="absolute top-5 end-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
      >
        <X className="h-5 w-5" />
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="alaa-pop-in flex flex-col items-center gap-4 max-w-[90vw]"
      >
        <div className="relative h-[min(72vw,380px)] w-[min(72vw,380px)] overflow-hidden rounded-full border-2 border-white/20 bg-[#0b101b] shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
          {imgFailed ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-slate-400">
              <ImageIcon className="h-12 w-12 opacity-60" />
              <span className="text-xs font-semibold">{config.hero.brandName}</span>
            </div>
          ) : (
            <img
              src={config.hero.avatarImage}
              alt={config.hero.brandName}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <div className="flex items-center gap-2 text-white">
          <span className="text-base font-extrabold">{config.hero.brandName}</span>
          {config.hero.showVerifiedBadge && (
            <BadgeCheck
              className="h-5 w-5"
              style={{ color: config.appearance.brandColor }}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 3. Instagram / TikTok Full-Screen Stories Viewer
 * ============================================================================ */
interface StoryViewerModalProps {
  isOpen: boolean;
  lang: Lang;
  config: SiteConfig;
  stories: StoryItem[];
  highlightTitle?: string;
  initialIndex?: number;
  onStorySeen?: (storyId: string) => void;
  onSendStoryReply?: (story: StoryItem, text: string) => void;
  onNotify?: (msg: string) => void;
  onClose: () => void;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  offsetX: number;
}

const STORY_REACTIONS = ['❤️', '🔥', '👏', '😮', '😂'];

export function StoryViewerModal({
  isOpen,
  lang,
  config,
  stories,
  highlightTitle,
  initialIndex = 0,
  onStorySeen,
  onSendStoryReply,
  onNotify,
  onClose,
}: StoryViewerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replyFocused, setReplyFocused] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [imgError, setImgError] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const elapsedRef = useRef(0);
  const lastFrameRef = useRef<number | null>(null);

  const isAr = lang === 'ar';
  const currentStory = stories[currentIndex];
  const currentMusic = currentStory?.music;
  const resolvedMusicSrc = useMemo(
    () => resolveStoryAudioUrl(currentMusic?.audioUrl),
    [currentMusic?.audioUrl]
  );

  useEffect(() => {
    if (isOpen) {
      const safeIdx = Math.min(Math.max(0, initialIndex), Math.max(0, stories.length - 1));
      setCurrentIndex(safeIdx);
      setProgress(0);
      elapsedRef.current = 0;
      lastFrameRef.current = null;
      setIsPaused(false);
      setReplyText('');
      setReplyFocused(false);
      setFloatingReactions([]);
      setImgError(false);
    }
  }, [isOpen, initialIndex, stories.length]);

  useEffect(() => {
    if (isOpen && currentStory) {
      onStorySeen?.(currentStory.id);
      setImgError(false);
      elapsedRef.current = 0;
      setProgress(0);
      lastFrameRef.current = null;
    }
  }, [isOpen, currentStory?.id, onStorySeen]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = useCallback(() => {
    if (elapsedRef.current > 1500) {
      elapsedRef.current = 0;
      setProgress(0);
      if (videoRef.current) videoRef.current.currentTime = 0;
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    } else {
      elapsedRef.current = 0;
      setProgress(0);
    }
  }, [currentIndex]);

  // Smooth auto-advance timer
  useEffect(() => {
    if (!isOpen || !currentStory) return;
    const paused = isPaused || replyFocused;
    if (paused) {
      lastFrameRef.current = null;
      return;
    }

    const durationMs = Math.max(2, currentStory.durationSec || 6) * 1000;
    let rafId = 0;

    const tick = (now: number) => {
      if (lastFrameRef.current === null) {
        lastFrameRef.current = now;
      }
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;
      elapsedRef.current += delta;

      const pct = Math.min(100, (elapsedRef.current / durationMs) * 100);
      setProgress(pct);

      if (elapsedRef.current >= durationMs) {
        goNext();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, currentStory, isPaused, replyFocused, goNext]);

  // Sync video play/pause & mute
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.muted = isMuted;
    if (isPaused || replyFocused) {
      vid.pause();
    } else {
      vid.play().catch(() => {});
    }
  }, [isPaused, replyFocused, isMuted, currentStory?.id]);

  // Sync story background music clip playback [startSec .. startSec + clipDurationSec]
  useEffect(() => {
    const audio = musicAudioRef.current;
    if (!audio) return;
    if (!isOpen || !currentMusic?.audioUrl || !resolvedMusicSrc) {
      audio.pause();
      return;
    }

    const startSec = Math.max(0, currentMusic.startSec || 0);
    const clipLen = Math.max(2, currentMusic.clipDurationSec || currentStory?.durationSec || 6);
    const endSec = startSec + clipLen;

    audio.volume = currentMusic.volume ?? 0.85;
    audio.muted = isMuted;

    const handleTimeUpdate = () => {
      if (audio.currentTime >= endSec || audio.currentTime < startSec - 0.35) {
        audio.currentTime = startSec;
      }
    };

    const seekAndPlay = () => {
      try {
        if (Math.abs(audio.currentTime - startSec) > 0.45 && audio.currentTime < startSec) {
          audio.currentTime = startSec;
        }
      } catch {
        // Ignore seek before metadata ready
      }
      if (!isPaused && !replyFocused) {
        audio.play().catch(() => {});
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);

    if (audio.readyState >= 1) {
      if (audio.currentTime < startSec || audio.currentTime >= endSec) {
        audio.currentTime = startSec;
      }
      seekAndPlay();
    } else {
      const onLoaded = () => {
        audio.currentTime = startSec;
        seekAndPlay();
      };
      audio.addEventListener('loadedmetadata', onLoaded, { once: true });
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoaded);
      };
    }

    if (isPaused || replyFocused) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [
    isOpen,
    currentStory?.id,
    currentMusic?.audioUrl,
    currentMusic?.startSec,
    currentMusic?.clipDurationSec,
    currentMusic?.volume,
    resolvedMusicSrc,
    isPaused,
    replyFocused,
    isMuted,
  ]);

  useEffect(() => {
    if (!isOpen && musicAudioRef.current) {
      musicAudioRef.current.pause();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (replyFocused) return;
      if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'ArrowRight') {
        if (isAr) goPrev();
        else goNext();
      } else if (e.key === 'ArrowLeft') {
        if (isAr) goNext();
        else goPrev();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, replyFocused, isAr, goNext, goPrev, onClose]);

  if (!isOpen || !currentStory) return null;

  const caption = isAr ? currentStory.captionAr : currentStory.captionEn;
  const expiryRemaining = formatStoryExpiryRemaining(currentStory, lang);

  const triggerReaction = (emoji: string) => {
    const id = Date.now() + Math.random();
    const offsetX = Math.round((Math.random() - 0.5) * 44);
    setFloatingReactions((prev) => [...prev.slice(-10), { id, emoji, offsetX }]);
    window.setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== id));
    }, 1100);

    if (onSendStoryReply && config.chat.enabled) {
      onSendStoryReply(currentStory, emoji);
      onNotify?.(isAr ? `تم إرسال تفاعل ${emoji}` : `Sent ${emoji} reaction`);
    }
  };

  const handleReplySubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || !onSendStoryReply) return;
    onSendStoryReply(currentStory, trimmed);
    setReplyText('');
    setReplyFocused(false);
    onNotify?.(isAr ? 'تم إرسال ردك على القصة!' : 'Reply sent to chat!');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'عارض القصص' : 'Stories Viewer'}
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#04060c]/96 sm:p-4 backdrop-blur-2xl select-none"
    >
      {/* Desktop Left/Right Arrows */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isAr) goNext();
          else goPrev();
        }}
        aria-label={isAr ? 'التالي' : 'Previous'}
        className="hidden sm:inline-flex absolute start-6 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer z-20"
      >
        {isAr ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isAr) goPrev();
          else goNext();
        }}
        aria-label={isAr ? 'السابق' : 'Next'}
        className="hidden sm:inline-flex absolute end-6 top-1/2 -translate-y-1/2 h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer z-20"
      >
        {isAr ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </button>

      {/* Main 9:16 Story Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        onPointerDown={() => setIsPaused(true)}
        onPointerUp={() => setIsPaused(false)}
        onPointerCancel={() => setIsPaused(false)}
        className="alaa-pop-in relative flex h-full w-full sm:h-[min(90vh,780px)] sm:w-[420px] flex-col overflow-hidden sm:rounded-[26px] border border-white/12 bg-[#090d16] shadow-[0_32px_90px_rgba(0,0,0,0.8)]"
      >
        {resolvedMusicSrc && (
          <audio
            ref={musicAudioRef}
            key={`music-${currentStory.id}-${resolvedMusicSrc}`}
            src={resolvedMusicSrc}
            preload="auto"
          />
        )}

        {/* Story Background / Media Layer */}
        <div className="absolute inset-0">
          {currentStory.type === 'text' ? (
            <div
              className="flex h-full w-full items-center justify-center px-8 text-center"
              style={{
                background:
                  currentStory.bgGradient ||
                  `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
              }}
            >
              <div className="max-w-[320px] space-y-4">
                <Sparkles className="mx-auto h-7 w-7 text-white/80" aria-hidden="true" />
                <p
                  className="text-xl sm:text-2xl font-extrabold leading-relaxed text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.35)]"
                  style={{ textWrap: 'balance' }}
                >
                  {caption || (isAr ? 'حالة جديدة' : 'New Status')}
                </p>
              </div>
            </div>
          ) : currentStory.type === 'video' && currentStory.mediaUrl ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.mediaUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={goNext}
              className="h-full w-full object-cover bg-black"
            />
          ) : imgError || !currentStory.mediaUrl ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#0f172a] to-[#1e293b] text-slate-300 px-6 text-center">
              <ImageIcon className="h-10 w-10 opacity-60" />
              <p className="text-sm font-bold">{caption}</p>
            </div>
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt={caption || config.hero.brandName}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          )}
        </div>

        {/* Top Contrast Scrim */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/75 via-black/35 to-transparent z-10" />

        {/* Bottom Contrast Scrim */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-black/88 via-black/48 to-transparent z-10" />

        {/* Top Bars + Header */}
        <div className="relative z-20 px-3.5 pt-3.5 space-y-3">
          {/* Segmented Progress Bars */}
          <div className="flex items-center gap-1.5" dir="ltr">
            {stories.map((st, idx) => {
              const fill =
                idx < currentIndex ? 100 : idx === currentIndex ? progress : 0;
              return (
                <div
                  key={st.id}
                  className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/25"
                >
                  <div
                    className="h-full rounded-full bg-white transition-none"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Story Author Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={config.hero.avatarImage}
                alt={config.hero.brandName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-full object-cover border border-white/30"
              />
              <div className="min-w-0 text-white">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold truncate">
                    {highlightTitle || config.hero.brandName}
                  </span>
                  {!highlightTitle && config.hero.showVerifiedBadge && (
                    <BadgeCheck
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: config.appearance.brandColor }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="text-[11px] text-white/70 font-medium tabular-nums">
                    · {formatRelativeTime(currentStory.createdAt, lang)}
                  </span>
                  {expiryRemaining && !highlightTitle && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white/95">
                      <Clock className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>{expiryRemaining}</span>
                    </span>
                  )}
                </div>
                <div className="text-[10.5px] text-white/65 tabular-nums">
                  {highlightTitle ? `${config.hero.brandName} · ` : ''}
                  {currentIndex + 1} / {stories.length}
                </div>
              </div>
            </div>

            {/* Playback & Close Buttons */}
            <div
              className="flex items-center gap-1"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={isPaused ? 'Play' : 'Pause'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>

              {(currentStory.type === 'video' || Boolean(currentMusic?.audioUrl)) && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !isMuted;
                    setIsMuted(nextMuted);
                    if (!nextMuted && musicAudioRef.current && !isPaused) {
                      musicAudioRef.current.play().catch(() => {});
                    }
                  }}
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60 transition-colors cursor-pointer"
                >
                  {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label={isAr ? 'إغلاق' : 'Close'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/35 text-white hover:bg-black/60 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Instagram / TikTok Story Music Pill */}
          {currentMusic?.audioUrl && (
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-md"
            >
              <Music2
                className={`h-3.5 w-3.5 shrink-0 ${
                  !isPaused && !isMuted ? 'animate-pulse text-[#00d2ff]' : 'text-white/75'
                }`}
                aria-hidden="true"
              />
              <span className="truncate">
                {currentMusic.title}
                {currentMusic.artist ? ` — ${currentMusic.artist}` : ''}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-white/75 tabular-nums">
                {formatAudioTime(currentMusic.startSec)}–
                {formatAudioTime(currentMusic.startSec + currentMusic.clipDurationSec)}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Left / Right Tap Zones */}
        <div className="relative flex-1 z-10 flex">
          <button
            type="button"
            aria-label={isAr ? 'القصة التالية' : 'Previous story'}
            onClick={() => (isAr ? goNext() : goPrev())}
            className="h-full w-1/3 bg-transparent border-0 cursor-pointer focus:outline-none"
          />
          <div className="h-full w-1/3" />
          <button
            type="button"
            aria-label={isAr ? 'القصة السابقة' : 'Next story'}
            onClick={() => (isAr ? goPrev() : goNext())}
            className="h-full w-1/3 bg-transparent border-0 cursor-pointer focus:outline-none"
          />
        </div>

        {/* Floating Reactions */}
        <div className="pointer-events-none absolute bottom-28 inset-x-0 z-30 flex justify-center">
          {floatingReactions.map((r) => (
            <span
              key={r.id}
              className="alaa-story-float text-3xl absolute"
              style={{ transform: `translateX(${r.offsetX}px)` }}
            >
              {r.emoji}
            </span>
          ))}
        </div>

        {/* Bottom Caption, Quick Reactions & Reply Bar */}
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="relative z-20 px-4 pb-4 pt-2 space-y-3"
        >
          {currentStory.type !== 'text' && caption && (
            <p className="text-center text-xs sm:text-[13px] font-semibold leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              {caption}
            </p>
          )}

          {/* Quick Emoji Reactions */}
          <div className="flex items-center justify-center gap-2">
            {STORY_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => triggerReaction(emoji)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/10 text-base backdrop-blur-md transition-transform hover:scale-115 active:scale-95 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          {config.chat.enabled && onSendStoryReply && (
            <form onSubmit={handleReplySubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onFocus={() => setReplyFocused(true)}
                onBlur={() => setReplyFocused(false)}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={isAr ? 'أرسل رداً على القصة...' : 'Reply to story...'}
                className="h-10 flex-1 rounded-full border border-white/25 bg-black/45 px-4 text-xs text-white placeholder:text-white/60 backdrop-blur-md focus:border-white/60 focus:outline-none"
              />
              {replyText.trim().length > 0 && (
                <button
                  type="submit"
                  aria-label={isAr ? 'إرسال' : 'Send'}
                  style={{
                    background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
                  }}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-md cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
