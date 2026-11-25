import { CSSProperties, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  BookOpen,
  Building2,
  Cake,
  Calendar,
  ExternalLink,
  Globe,
  GraduationCap,
  Heart,
  IdCard,
  Languages,
  Lock,
  MapPin,
  MessageCircle,
  Moon,
  QrCode,
  Settings,
  Share2,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import {
  ChatAttachment,
  ChatReplyRef,
  ChatThread,
  DEFAULT_PROFILE_AVATAR,
  DEFAULT_PROFILE_BANNER,
  Lang,
  PersonalFieldIcon,
  SiteConfig,
  StoryItem,
  TabId,
  Theme,
} from '../types/siteConfig';
import { isStoryExpired, resolveHighlightStories } from '../utils/storyUtils';
import { renderSocialIcon } from './Icons';
import { ChatWidget } from './ChatWidget';
import {
  AvatarChoiceModal,
  AvatarLightboxModal,
  StoryViewerModal,
} from './StoryModals';

const StoryCardExportModal = lazy(() =>
  import('./StoryCardExportModal').then((m) => ({ default: m.StoryCardExportModal }))
);

interface SiteViewProps {
  config: SiteConfig;
  theme: Theme;
  lang: Lang;
  activeTab: TabId;
  onToggleTheme: () => void;
  onToggleLang: () => void;
  onSelectTab: (tab: TabId) => void;
  onOpenSettings?: () => void;
  onNotify?: (msg: string) => void;
  unreadOwnerCount?: number;
  activeThread: ChatThread | null;
  chatOpen: boolean;
  onToggleChatOpen: (open: boolean) => void;
  onSendVisitorMessage: (
    visitorName: string,
    visitorTag: string,
    text: string,
    attachment?: ChatAttachment,
    replyTo?: ChatReplyRef
  ) => void;
  onStartNewChatSession: () => void;
  onMarkVisitorRead: (threadId: string) => void;
  onToggleMessageReaction?: (
    threadId: string,
    messageId: string,
    emoji: string,
    by: 'visitor' | 'owner'
  ) => void;
  onEditMessage?: (threadId: string, messageId: string, newText: string) => void;
  onDeleteMessage?: (threadId: string, messageId: string) => void;
  ownerTyping?: boolean;
  isPreview?: boolean;
}

function safeHref(rawUrl: string): string {
  const clean = (rawUrl || '').trim();
  if (!clean) return '#';
  if (/^(https?:|mailto:|tel:|\/|#)/i.test(clean)) return clean;
  if (/^[a-z][a-z0-9+.-]*:/i.test(clean)) return '#';
  return `https://${clean}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return `rgba(0, 210, 255, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(0, 210, 255, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function SiteView({
  config,
  theme,
  lang,
  activeTab,
  onToggleTheme,
  onToggleLang,
  onSelectTab,
  onOpenSettings,
  onNotify,
  unreadOwnerCount = 0,
  activeThread,
  chatOpen,
  onToggleChatOpen,
  onSendVisitorMessage,
  onStartNewChatSession,
  onMarkVisitorRead,
  onToggleMessageReaction,
  onEditMessage,
  onDeleteMessage,
  ownerTyping = false,
  isPreview = false,
}: SiteViewProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [avatarChoiceOpen, setAvatarChoiceOpen] = useState(false);
  const [avatarLightboxOpen, setAvatarLightboxOpen] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<{
    title: string;
    stories: StoryItem[];
  } | null>(null);
  const [storyCardOpen, setStoryCardOpen] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const bannerCoverRef = useRef<HTMLDivElement | null>(null);
  const bannerParallaxRef = useRef<HTMLDivElement | null>(null);
  const heroGlowRef = useRef<HTMLDivElement | null>(null);
  const [seenStoryIds, setSeenStoryIds] = useState<string[]>(() => {
    try {
      const raw = window.localStorage.getItem('alaadev_seen_stories_v1');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (isPreview || !config.appearance.showScrollProgress) {
      setScrollProgress(0);
      return;
    }
    const handleScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 0) {
        setScrollProgress(0);
        return;
      }
      setScrollProgress(Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)));
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isPreview, config.appearance.showScrollProgress]);

  const handleShareProfile = async () => {
    const shareUrl = window.location.href;
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        copied = true;
      }
    } catch {
      copied = false;
    }
    if (!copied) {
      try {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        ta.remove();
      } catch {
        copied = false;
      }
    }
    onNotify?.(
      copied
        ? lang === 'ar'
          ? 'تم نسخ رابط الموقع!'
          : 'Profile link copied!'
        : lang === 'ar'
        ? 'انسخ الرابط من شريط العنوان'
        : 'Copy the URL from the address bar'
    );
  };

  const visibleTabs = config.tabs.items.filter((t) => t.visible);
  const visibleSocials = config.socials.filter((s) => s.visible);
  const activeStories = config.stories?.enabled
    ? config.stories.items.filter((s) => s.visible && !isStoryExpired(s))
    : [];
  const visibleHighlights =
    (config.stories?.highlightsEnabled ?? true)
      ? (config.stories?.highlights ?? [])
          .map((hl) => ({
            hl,
            stories: resolveHighlightStories(hl, config.stories?.items ?? []),
          }))
          .filter(({ hl, stories }) => hl.visible && stories.length > 0)
      : [];
  const hasActiveStories = activeStories.length > 0;
  const hasUnseenStories = activeStories.some((s) => !seenStoryIds.includes(s.id));
  const year = new Date().getFullYear();

  const handleMarkStorySeen = useCallback((storyId: string) => {
    setSeenStoryIds((prev) => {
      if (prev.includes(storyId)) return prev;
      const next = [...prev.slice(-30), storyId];
      try {
        window.localStorage.setItem('alaadev_seen_stories_v1', JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  }, []);

  const handleAvatarClick = () => {
    if (hasActiveStories) {
      setAvatarChoiceOpen(true);
    } else {
      setAvatarLightboxOpen(true);
    }
  };

  const handleSendStoryReply = useCallback(
    (story: StoryItem, text: string) => {
      const visitorName =
        activeThread?.visitorName || (lang === 'ar' ? 'زائر القصة' : 'Story Viewer');
      const visitorTag = activeThread?.visitorTag || '@story';
      const snippet = (lang === 'ar' ? story.captionAr : story.captionEn) || '';
      const prefix =
        lang === 'ar'
          ? `[رد على القصة${snippet ? `: "${snippet.slice(0, 32)}"` : ''}] `
          : `[Story reply${snippet ? `: "${snippet.slice(0, 32)}"` : ''}] `;
      onSendVisitorMessage(visitorName, visitorTag, `${prefix}${text}`);
    },
    [activeThread, lang, onSendVisitorMessage]
  );

  const unreadVisitorReplies = activeThread
    ? activeThread.messages.filter((m) => m.sender === 'owner' && !m.readByVisitor).length
    : 0;

  const renderTabIcon = (id: TabId) => {
    if (id === 'socials') return <Share2 className="w-4 h-4" aria-hidden="true" />;
    return <IdCard className="w-4 h-4" aria-hidden="true" />;
  };

  const renderPersonalFieldIcon = (icon: PersonalFieldIcon) => {
    switch (icon) {
      case 'cake':
        return <Cake className="w-4 h-4" aria-hidden="true" />;
      case 'graduation':
        return <GraduationCap className="w-4 h-4" aria-hidden="true" />;
      case 'book':
        return <BookOpen className="w-4 h-4" aria-hidden="true" />;
      case 'map':
        return <MapPin className="w-4 h-4" aria-hidden="true" />;
      case 'globe':
        return <Globe className="w-4 h-4" aria-hidden="true" />;
      case 'building':
        return <Building2 className="w-4 h-4" aria-hidden="true" />;
      case 'languages':
        return <Languages className="w-4 h-4" aria-hidden="true" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" aria-hidden="true" />;
      case 'sparkles':
        return <Sparkles className="w-4 h-4" aria-hidden="true" />;
      default:
        return <User className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const previewVars: CSSProperties | undefined = isPreview
    ? ({
        '--brand': config.appearance.brandColor,
        '--brand2': config.appearance.brandColor2,
        '--grad-angle': `${config.appearance.gradientAngle}deg`,
        '--card-radius': `${config.appearance.cardRadiusPx}px`,
        '--site-font': `'${config.appearance.fontFamily}'`,
        '--bg-dark': config.appearance.bgDark,
        '--surface-dark': config.appearance.surfaceDark,
        '--bg-light': config.appearance.bgLight,
        '--surface-light': config.appearance.surfaceLight,
        '--hover': hexToRgba(config.appearance.brandColor, theme === 'light' ? 0.09 : 0.07),
      } as CSSProperties)
    : undefined;

  const isFbCenter = config.hero.profileLayout === 'center';
  const avatarShape = config.hero.avatarShape ?? 'circle';
  const avatarDesign = config.hero.avatarDesign ?? 'classic';
  const bannerDesign = config.hero.bannerDesign ?? 'fade-bottom';
  const bannerOverlay = config.hero.bannerOverlay ?? 'scrim';
  const backdropStyle = config.appearance.backdropStyle ?? 'mesh';
  const cardMaterial = config.appearance.cardMaterial ?? 'solid';
  const tabStyle = config.appearance.tabStyle ?? 'segmented';
  const contentWidth = config.appearance.contentWidth ?? 'normal';
  const uiDensity = config.appearance.uiDensity ?? 'cozy';
  const fontScale = config.appearance.fontSizeScale ?? 1;
  const enableAnimations = config.appearance.enableAnimations ?? true;
  const cursorGlowEnabled = !isPreview && (config.appearance.cursorGlow ?? true) && enableAnimations;
  const cursorGlowSizePx = config.appearance.cursorGlowSizePx ?? 380;
  const bannerParallaxEnabled = (config.hero.bannerParallax ?? true) && enableAnimations;
  const bannerParallaxSpeed = Math.min(
    0.65,
    Math.max(0.1, config.hero.bannerParallaxSpeed ?? 0.38)
  );

  const bannerMode = config.hero.bannerMode ?? 'image';
  const validSlides = (config.hero.bannerSlides ?? []).filter((s) => Boolean(s && s.trim()));
  const slidesToRender = validSlides.length > 0 ? validSlides : [config.hero.bannerImage];
  const slideIntervalMs = Math.max(2, Math.min(20, config.hero.bannerSlideIntervalSec ?? 4)) * 1000;

  useEffect(() => {
    if (bannerMode !== 'slideshow' || slidesToRender.length <= 1) {
      setActiveSlideIdx(0);
      return;
    }
    const timer = window.setInterval(() => {
      setActiveSlideIdx((prev) => (prev + 1) % slidesToRender.length);
    }, slideIntervalMs);
    return () => window.clearInterval(timer);
  }, [bannerMode, slidesToRender.length, slideIntervalMs]);

  useEffect(() => {
    if (!cursorGlowEnabled) return;
    if (
      typeof window === 'undefined' ||
      window.matchMedia('(pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let rafId = 0;
    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;
    let visible = false;

    const tick = () => {
      const el = cursorGlowRef.current;
      if (el) {
        if (!visible) {
          el.style.opacity = '0';
        } else {
          currentX += (targetX - currentX) * 0.22;
          currentY += (targetY - currentY) * 0.22;
          const half = cursorGlowSizePx / 2;
          el.style.transform = `translate3d(${currentX - half}px, ${currentY - half}px, 0)`;
          el.style.opacity = '1';
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!visible) {
        currentX = e.clientX;
        currentY = e.clientY;
        visible = true;
      }
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const onLeave = () => {
      visible = false;
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('mouseleave', onLeave);
    };
  }, [cursorGlowEnabled, cursorGlowSizePx]);

  useEffect(() => {
    const parallaxEl = bannerParallaxRef.current;
    const coverEl = bannerCoverRef.current;
    const glowEl = heroGlowRef.current;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!bannerParallaxEnabled || reducedMotion) {
      if (parallaxEl) parallaxEl.style.transform = '';
      if (glowEl) glowEl.style.transform = '';
      return;
    }

    if (!parallaxEl || !coverEl) return;

    const scrollContainer = isPreview
      ? (coverEl.closest('.alaa-scroll-thin') as HTMLElement | null)
      : null;

    let rafId = 0;

    const updateParallax = () => {
      rafId = 0;
      const scrollY = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const coverH = Math.max(120, coverEl.offsetHeight);
      const maxDown = coverH * 0.18;
      const maxUp = -coverH * 0.08;
      const shiftY = Math.min(maxDown, Math.max(maxUp, scrollY * bannerParallaxSpeed));
      const safeScale = 1.06 + (Math.abs(shiftY) * 2.12) / coverH;

      parallaxEl.style.transform = `translate3d(0, ${shiftY.toFixed(2)}px, 0) scale(${safeScale.toFixed(4)})`;
      if (glowEl) {
        glowEl.style.transform = `translate3d(0, ${(shiftY * 0.45).toFixed(2)}px, 0)`;
      }
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateParallax);
    };

    updateParallax();
    const listenerTarget: HTMLElement | Window = scrollContainer ?? window;
    listenerTarget.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      listenerTarget.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [
    bannerParallaxEnabled,
    bannerParallaxSpeed,
    isPreview,
    config.hero.bannerHeightRem,
    config.hero.bannerMode,
    config.hero.bannerDesign,
  ]);

  const activeTabVisible = visibleTabs.some((t) => t.id === activeTab);

  const badge1 = lang === 'ar' ? config.hero.profileBadge1Ar : config.hero.profileBadge1En;
  const badge2 = lang === 'ar' ? config.hero.profileBadge2Ar : config.hero.profileBadge2En;

  const personalTiles: {
    key: string;
    icon: PersonalFieldIcon;
    label: string;
    value: string;
  }[] = [
    config.personal.showFullName && {
      key: 'name',
      icon: 'user' as PersonalFieldIcon,
      label: lang === 'ar' ? 'الاسم الكامل' : 'Full Name',
      value: lang === 'ar' ? config.personal.fullNameAr : config.personal.fullNameEn,
    },
    config.personal.showAge && {
      key: 'age',
      icon: 'cake' as PersonalFieldIcon,
      label: lang === 'ar' ? 'العمر' : 'Age',
      value: lang === 'ar' ? config.personal.ageAr : config.personal.ageEn,
    },
    config.personal.showGrade && {
      key: 'grade',
      icon: 'book' as PersonalFieldIcon,
      label: lang === 'ar' ? 'الفصل الدراسي' : 'Class / Grade',
      value: lang === 'ar' ? config.personal.gradeAr : config.personal.gradeEn,
    },
    config.personal.showStage && {
      key: 'stage',
      icon: 'graduation' as PersonalFieldIcon,
      label: lang === 'ar' ? 'المرحلة الدراسية' : 'Education Stage',
      value: lang === 'ar' ? config.personal.stageAr : config.personal.stageEn,
    },
    config.personal.showCountry && {
      key: 'country',
      icon: 'globe' as PersonalFieldIcon,
      label: lang === 'ar' ? 'بلد الإقامة' : 'Country of Residence',
      value: lang === 'ar' ? config.personal.countryAr : config.personal.countryEn,
    },
    config.personal.showCity && {
      key: 'city',
      icon: 'map' as PersonalFieldIcon,
      label: lang === 'ar' ? 'المدينة / المحافظة' : 'City',
      value: lang === 'ar' ? config.personal.cityAr : config.personal.cityEn,
    },
    config.personal.showSchool && {
      key: 'school',
      icon: 'building' as PersonalFieldIcon,
      label: lang === 'ar' ? 'المدرسة / الجامعة' : 'School / Institution',
      value: lang === 'ar' ? config.personal.schoolAr : config.personal.schoolEn,
    },
    config.personal.showLanguages && {
      key: 'languages',
      icon: 'languages' as PersonalFieldIcon,
      label: lang === 'ar' ? 'اللغات' : 'Languages',
      value: lang === 'ar' ? config.personal.languagesAr : config.personal.languagesEn,
    },
    config.personal.showBirthdate && {
      key: 'birthdate',
      icon: 'calendar' as PersonalFieldIcon,
      label: lang === 'ar' ? 'سنة / تاريخ الميلاد' : 'Birthdate',
      value: lang === 'ar' ? config.personal.birthdateAr : config.personal.birthdateEn,
    },
    ...config.personal.customFields
      .filter((cf) => cf.visible)
      .map((cf) => ({
        key: cf.id,
        icon: cf.icon,
        label: lang === 'ar' ? cf.labelAr : cf.labelEn,
        value: lang === 'ar' ? cf.valueAr : cf.valueEn,
      })),
  ].filter(
    (item): item is { key: string; icon: PersonalFieldIcon; label: string; value: string } =>
      Boolean(item && item.value.trim())
  );

  const personalHobbies = lang === 'ar' ? config.personal.hobbiesAr : config.personal.hobbiesEn;

  return (
    <div
      data-theme={theme}
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      style={previewVars}
      className={isPreview ? 'alaa-preview-scope relative min-h-full overflow-hidden' : 'relative'}
    >
      {!isPreview && config.appearance.showScrollProgress && (
        <div
          className="alaa-scroll-progress"
          style={{ width: `${scrollProgress}%` }}
          aria-hidden="true"
        />
      )}

      {cursorGlowEnabled && (
        <div
          ref={cursorGlowRef}
          className="alaa-cursor-glow"
          style={{
            width: `${cursorGlowSizePx}px`,
            height: `${cursorGlowSizePx}px`,
            opacity: 0,
          }}
          aria-hidden="true"
        />
      )}

      {backdropStyle !== 'clean' && (
        <div
          className={`alaa-backdrop-layer alaa-backdrop-${backdropStyle}`}
          aria-hidden="true"
        />
      )}

      <div
        className={`alaa-wrap alaa-width-${contentWidth} alaa-density-${uiDensity} alaa-material-${cardMaterial} ${
          config.appearance.tiltCards ? '' : 'alaa-no-tilt'
        } ${enableAnimations ? '' : 'alaa-no-anim'}`}
        style={fontScale !== 1 ? { zoom: fontScale } : undefined}
      >
        {/* Top Utility Bar */}
        <div className="alaa-bar">
          {config.appearance.showShareBtn && (
            <button
              type="button"
              className="alaa-chip-btn"
              aria-label={lang === 'ar' ? 'مشاركة الرابط' : 'Share profile'}
              onClick={handleShareProfile}
            >
              <Share2 className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
          {config.appearance.showThemeBtn && (
            <button
              type="button"
              className="alaa-chip-btn"
              aria-label="Toggle theme"
              onClick={onToggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          )}
          {config.appearance.showLangBtn && (
            <button
              type="button"
              className="alaa-chip-btn"
              onClick={onToggleLang}
            >
              {lang === 'ar' ? 'English' : 'عربي'}
            </button>
          )}
          {!isPreview && onOpenSettings && (
            <button
              type="button"
              className="alaa-chip-btn relative"
              aria-label={lang === 'ar' ? 'الإعدادات' : 'Settings'}
              title={
                config.security?.requirePassword
                  ? 'الإعدادات محمية بكلمة سر (Ctrl+Shift+E)'
                  : 'الإعدادات (Ctrl+Shift+E)'
              }
              onClick={onOpenSettings}
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
              <span>{lang === 'ar' ? 'الإعدادات' : 'Settings'}</span>
              {config.security?.requirePassword && (
                <Lock className="w-3 h-3 opacity-70" aria-hidden="true" />
              )}
              {unreadOwnerCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                  {unreadOwnerCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Primary Profile Picture + Cover Banner Header */}
        <header
          className={`alaa-fb-shell ${
            bannerDesign === 'card' ? 'alaa-fb-shell-card' : ''
          }`}
        >
          <div className="alaa-hero-wrap">
            {config.hero.showHeroGlow && <div ref={heroGlowRef} className="alaa-hero-glow" />}
            <div
              ref={bannerCoverRef}
              className={`alaa-fb-cover alaa-fb-cover-${bannerDesign}`}
              style={{ '--banner-h': `${config.hero.bannerHeightRem}rem` } as CSSProperties}
            >
              <div className="alaa-fb-media-stage">
                <div
                  ref={bannerParallaxRef}
                  className="alaa-fb-parallax-layer"
                  style={
                    bannerParallaxEnabled
                      ? { transform: 'translate3d(0, 0, 0) scale(1.06)' }
                      : undefined
                  }
                >
                  {bannerMode === 'video' && config.hero.bannerVideoUrl ? (
                    <video
                      src={config.hero.bannerVideoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      poster={config.hero.bannerImage}
                      style={{
                        filter: `blur(${config.hero.bannerBlurPx ?? 0}px) saturate(${
                          config.hero.bannerSaturation ?? 100
                        }%) brightness(${config.hero.bannerBrightness ?? 100}%)`,
                        objectPosition: `50% ${config.hero.bannerPositionY ?? 50}%`,
                      }}
                    />
                  ) : bannerMode === 'slideshow' && slidesToRender.length > 1 ? (
                    <>
                      {slidesToRender.map((slideSrc, idx) => (
                        <img
                          key={`${slideSrc.slice(0, 48)}-${idx}`}
                          src={slideSrc}
                          alt={`${config.hero.brandName} cover slide ${idx + 1}`}
                          referrerPolicy="no-referrer"
                          className="alaa-fb-slide-img"
                          style={{
                            opacity: idx === activeSlideIdx % slidesToRender.length ? 1 : 0,
                            filter: `blur(${config.hero.bannerBlurPx ?? 0}px) saturate(${
                              config.hero.bannerSaturation ?? 100
                            }%) brightness(${config.hero.bannerBrightness ?? 100}%)`,
                            objectPosition: `50% ${config.hero.bannerPositionY ?? 50}%`,
                          }}
                        />
                      ))}
                    </>
                  ) : (
                    <img
                      src={config.hero.bannerImage || DEFAULT_PROFILE_BANNER}
                      alt={`${config.hero.brandName} cover banner`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.dataset.fallbackApplied) return;
                        e.currentTarget.dataset.fallbackApplied = '1';
                        e.currentTarget.src = DEFAULT_PROFILE_BANNER;
                      }}
                      style={{
                        filter: `blur(${config.hero.bannerBlurPx ?? 0}px) saturate(${
                          config.hero.bannerSaturation ?? 100
                        }%) brightness(${config.hero.bannerBrightness ?? 100}%)`,
                        objectPosition: `50% ${config.hero.bannerPositionY ?? 50}%`,
                      }}
                    />
                  )}
                </div>
              </div>
              {bannerDesign === 'fade-bottom' && (
                <div className="alaa-fb-cover-fade-shadow" aria-hidden="true" />
              )}
              <div className={`alaa-fb-cover-overlay alaa-fb-overlay-${bannerOverlay}`} />

              {bannerDesign === 'wave' && (
                <svg
                  className="alaa-fb-cover-cut"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,48 C260,120 480,0 760,64 C960,110 1100,45 1200,24 L1200,120 L0,120 Z"
                    fill="var(--bg)"
                  />
                </svg>
              )}
              {bannerDesign === 'double-wave' && (
                <svg
                  className="alaa-fb-cover-cut"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,30 C240,105 460,5 760,72 C980,118 1110,55 1200,15 L1200,120 L0,120 Z"
                    fill="var(--bg)"
                    opacity="0.45"
                  />
                  <path
                    d="M0,62 C290,115 520,25 810,82 C1020,120 1125,70 1200,45 L1200,120 L0,120 Z"
                    fill="var(--bg)"
                  />
                </svg>
              )}
              {bannerDesign === 'angled' && (
                <svg
                  className="alaa-fb-cover-cut"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polygon points="0,120 1200,15 1200,120" fill="var(--bg)" />
                </svg>
              )}
              {bannerDesign === 'chevron' && (
                <svg
                  className="alaa-fb-cover-cut"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <polygon points="0,0 600,112 1200,0 1200,120 0,120" fill="var(--bg)" />
                </svg>
              )}
              {bannerDesign === 'notched' && (
                <svg
                  className="alaa-fb-cover-cut"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0,15 Q600,130 1200,15 L1200,120 L0,120 Z"
                    fill="var(--bg)"
                  />
                </svg>
              )}

              {config.hero.showCornerMark && config.hero.cornerMark && (
                <span className="alaa-hero-mark" style={{ zIndex: 2 }}>
                  {config.hero.cornerMark}
                </span>
              )}
            </div>
          </div>

          <div
            className={`alaa-fb-avatar-row ${isFbCenter ? 'alaa-fb-center' : ''} alaa-fb-shape-${avatarShape} alaa-fb-design-${avatarDesign}`}
            style={
              { '--avatar-offset': `${config.hero.avatarOffsetRem ?? -3.75}rem` } as CSSProperties
            }
          >
            <div
              className="alaa-fb-avatar-holder"
              style={
                { '--avatar-size': `${config.hero.avatarSizeRem ?? 7.5}rem` } as CSSProperties
              }
            >
              <button
                type="button"
                onClick={handleAvatarClick}
                aria-label={
                  hasActiveStories
                    ? lang === 'ar'
                      ? 'عرض خيارات الصورة الشخصية والقصة'
                      : 'View profile photo or story'
                    : lang === 'ar'
                    ? 'عرض الصورة الشخصية'
                    : 'View profile photo'
                }
                className="alaa-fb-avatar-btn"
              >
                <div
                  className={`alaa-fb-avatar-outer ${
                    hasActiveStories
                      ? hasUnseenStories
                        ? `alaa-story-ring-${config.stories?.ringStyle ?? 'instagram'}`
                        : 'alaa-story-ring-seen'
                      : config.hero.avatarRing && avatarDesign === 'classic'
                      ? 'alaa-fb-ring'
                      : ''
                  }`}
                >
                  <div className="alaa-fb-avatar-inner">
                    <img
                      src={config.hero.avatarImage || DEFAULT_PROFILE_AVATAR}
                      alt={config.hero.brandName}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.dataset.fallbackApplied) return;
                        e.currentTarget.dataset.fallbackApplied = '1';
                        e.currentTarget.src = DEFAULT_PROFILE_AVATAR;
                      }}
                      style={{ transform: `scale(${config.hero.avatarZoom ?? 1})` }}
                    />
                  </div>
                </div>
              </button>
              {config.hero.showAvatarStatusDot && (
                <span className="alaa-fb-online-dot pointer-events-none" aria-hidden="true" />
              )}
            </div>
          </div>

          <div className={`alaa-fb-meta ${isFbCenter ? 'alaa-fb-center' : ''}`}>
            <div className="alaa-fb-name-line">
              <h1 className="alaa-fb-name">{config.hero.brandName}</h1>
              {config.hero.showVerifiedBadge && (
                <BadgeCheck
                  className="w-5 h-5 sm:w-6 sm:h-6 shrink-0"
                  style={{ color: config.appearance.brandColor }}
                  aria-label="Verified"
                />
              )}
            </div>

            <p className="alaa-tag" style={{ marginTop: '0.15rem' }}>
              {lang === 'ar' ? config.hero.tagAr : config.hero.tagEn}
              {config.hero.tagSuffix && (
                <>
                  {' '}
                  {config.hero.showTagDot && <span className="alaa-dot">·</span>}{' '}
                  {config.hero.tagSuffix}
                </>
              )}
            </p>

            {config.hero.showProfileBadges && (badge1 || badge2) && (
              <div
                className={`flex flex-wrap gap-1.5 mt-1.5 ${
                  isFbCenter ? 'justify-center' : ''
                }`}
              >
                {badge1 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      borderColor: hexToRgba(config.appearance.brandColor, 0.35),
                      background: hexToRgba(config.appearance.brandColor, 0.1),
                      color: 'var(--text)',
                    }}
                  >
                    <Sparkles
                      className="w-3 h-3"
                      style={{ color: config.appearance.brandColor }}
                      aria-hidden="true"
                    />
                    <span>{badge1}</span>
                  </span>
                )}
                {badge2 && (
                  <span
                    className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-0.5 text-[11px] font-bold"
                    style={{
                      borderColor: 'var(--line)',
                      background: 'var(--surface)',
                      color: 'var(--muted)',
                    }}
                  >
                    <span>{badge2}</span>
                  </span>
                )}
              </div>
            )}

            <div className="alaa-fb-actions">
              {config.chat.enabled && (
                <button
                  type="button"
                  onClick={() => onToggleChatOpen(true)}
                  className="alaa-fb-btn-primary relative"
                >
                  <MessageCircle className="w-4 h-4" aria-hidden="true" />
                  <span>{lang === 'ar' ? config.chat.labelAr : config.chat.labelEn}</span>
                  {unreadVisitorReplies > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-extrabold text-white">
                      {unreadVisitorReplies}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={handleShareProfile}
                className="alaa-fb-btn-secondary"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'ar' ? 'مشاركة الملف' : 'Share Profile'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStoryCardOpen(true)}
                className="alaa-fb-btn-secondary"
              >
                <QrCode className="w-4 h-4" aria-hidden="true" />
                <span>{lang === 'ar' ? 'بطاقة ستوري' : 'Story Card'}</span>
              </button>
            </div>

            {/* Instagram-style Permanent Story Highlights Strip */}
            {visibleHighlights.length > 0 && (
              <div
                className={`alaa-scroll-thin flex items-start gap-2.5 sm:gap-3.5 overflow-x-auto pt-3 sm:pt-3.5 pb-1 max-w-full ${
                  isFbCenter ? 'justify-center' : ''
                }`}
              >
                {visibleHighlights.map(({ hl, stories }) => {
                  const title =
                    (lang === 'ar' ? hl.titleAr : hl.titleEn) ||
                    hl.titleEn ||
                    hl.titleAr;
                  const ringColor = hl.accentColor || config.appearance.brandColor;
                  return (
                    <button
                      key={hl.id}
                      type="button"
                      onClick={() => {
                        setActiveHighlight({ title, stories });
                        setStoryViewerOpen(true);
                      }}
                      className="group flex flex-col items-center gap-1.5 w-[56px] sm:w-[64px] shrink-0 cursor-pointer focus:outline-none"
                    >
                      <div
                        className="h-12 w-12 sm:h-14 sm:w-14 rounded-full p-[2px] transition-transform duration-200 group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${ringColor}, ${config.appearance.brandColor2})`,
                        }}
                      >
                        <div
                          className="h-full w-full rounded-full overflow-hidden p-[2px]"
                          style={{ background: 'var(--bg)' }}
                        >
                          <img
                            src={hl.coverUrl || config.hero.avatarImage}
                            alt={title}
                            referrerPolicy="no-referrer"
                            className="h-full w-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <span
                        className="text-[10.5px] sm:text-[11px] font-bold leading-tight truncate w-full text-center transition-colors group-hover:text-[var(--brand)]"
                        style={{ color: 'var(--text)' }}
                      >
                        {title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </header>

        {/* Section Tabs (Personal Info & Socials only) */}
        {visibleTabs.length > 0 && (
          <nav
            className={`alaa-tabs alaa-tabbar-${tabStyle} ${
              config.appearance.stickyTabs && !isPreview ? '' : 'alaa-tabs-static'
            }`}
            role="tablist"
          >
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="alaa-tab"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => onSelectTab(tab.id)}
              >
                {renderTabIcon(tab.id)}
                <span>{lang === 'ar' ? tab.labelAr : tab.labelEn}</span>
              </button>
            ))}
          </nav>
        )}

        <main>
          {/* Personal Info */}
          {activeTabVisible && activeTab === 'personal' && (
            <section className="alaa-panel" id={isPreview ? undefined : 'personal'} role="tabpanel">
              {config.personal.showCardHeader && (
                <div className="alaa-group">
                  <h2 className="alaa-about-heading">
                    {lang === 'ar'
                      ? config.personal.sectionTitleAr
                      : config.personal.sectionTitleEn}
                  </h2>
                  <div className="alaa-list">
                    <div
                      className="alaa-featured-card text-center items-center"
                      style={{
                        background: `linear-gradient(135deg, ${hexToRgba(
                          config.appearance.brandColor,
                          0.11
                        )}, transparent 72%)`,
                      }}
                    >
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono" style={{ color: 'var(--brand)' }}>
                        <IdCard className="w-4 h-4" aria-hidden="true" />
                        <span>
                          {lang === 'ar'
                            ? config.personal.sectionTitleAr
                            : config.personal.sectionTitleEn}
                        </span>
                      </div>
                      <div className="text-base font-extrabold" style={{ color: 'var(--text)' }}>
                        {lang === 'ar'
                          ? config.personal.headlineAr
                          : config.personal.headlineEn}
                      </div>
                      {(lang === 'ar' ? config.personal.quoteAr : config.personal.quoteEn) && (
                        <p className="text-sm leading-relaxed max-w-md" style={{ color: 'var(--muted)' }}>
                          {lang === 'ar' ? config.personal.quoteAr : config.personal.quoteEn}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {personalTiles.length > 0 && (
                <div className="alaa-group">
                  {!config.personal.showCardHeader && (
                    <h2 className="alaa-about-heading">
                      {lang === 'ar'
                        ? config.personal.sectionTitleAr
                        : config.personal.sectionTitleEn}
                    </h2>
                  )}
                  <div className="alaa-personal-grid">
                    {personalTiles.map((tile) => (
                      <div key={tile.key} className="alaa-personal-tile">
                        <span className="alaa-personal-ico">
                          {renderPersonalFieldIcon(tile.icon)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="alaa-personal-label">{tile.label}</div>
                          <div className="alaa-personal-value">{tile.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {config.personal.showHobbies && personalHobbies.length > 0 && (
                <div className="alaa-group">
                  <h2 className="alaa-about-heading">
                    <Heart className="w-3.5 h-3.5" style={{ color: 'var(--brand)' }} aria-hidden="true" />
                    <span>
                      {lang === 'ar'
                        ? config.personal.hobbiesTitleAr
                        : config.personal.hobbiesTitleEn}
                    </span>
                  </h2>
                  <div className="alaa-list">
                    <div className="alaa-tech-grid">
                      {personalHobbies.map((hobby, idx) => (
                        <span key={`${hobby}-${idx}`} className="alaa-tech-item">
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Socials */}
          {activeTabVisible && activeTab === 'socials' && (
            <section className="alaa-panel" id={isPreview ? undefined : 'socials'} role="tabpanel">
              <div className="alaa-group">
                <div className="alaa-list">
                  {visibleSocials.map((item, idx) => {
                    const shouldAnimateRow = enableAnimations;
                    return (
                      <a
                        key={item.id}
                        className={`alaa-row ${
                          shouldAnimateRow ? 'animate__animated animate__fadeInUp' : ''
                        }`}
                        style={
                          shouldAnimateRow
                            ? {
                                animationDelay: `${idx * 75}ms`,
                                animationDuration: '0.52s',
                              }
                            : undefined
                        }
                        href={safeHref(item.href)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span
                          className="alaa-ico"
                          style={{
                            color: item.accentColor,
                            backgroundColor: hexToRgba(item.accentColor, 0.13),
                          }}
                        >
                          {renderSocialIcon(item.icon, 'w-5 h-5')}
                        </span>
                        <span className="alaa-txt">
                          <div className="alaa-name">{item.name}</div>
                          <div className="alaa-sub">
                            {lang === 'ar' ? item.subAr : item.subEn}
                          </div>
                        </span>
                        <ExternalLink className="w-4 h-4 alaa-go" aria-hidden="true" />
                      </a>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </main>

        {config.footer.visible && (
          <footer className="alaa-footer">
            {config.footer.showStatus && (
              <span className="alaa-status">
                <span
                  className={`alaa-pulse ${
                    config.footer.statusPulse ? '' : 'alaa-no-pulse'
                  }`}
                  style={{ background: config.footer.statusDotColor }}
                />
                <span>
                  {lang === 'ar' ? config.footer.statusAr : config.footer.statusEn}
                </span>
              </span>
            )}
            <span>
              © {year} {config.footer.copyrightName}
            </span>
            {config.footer.showSignature && (
              <span className="alaa-sig">{config.footer.signature}</span>
            )}
          </footer>
        )}
      </div>

      {/* Direct Chat Modal */}
      <ChatWidget
        config={config}
        theme={theme}
        lang={lang}
        activeThread={activeThread}
        isOpen={chatOpen}
        onClose={() => onToggleChatOpen(false)}
        onSendVisitorMessage={onSendVisitorMessage}
        onStartNewSession={onStartNewChatSession}
        onMarkVisitorRead={onMarkVisitorRead}
        onToggleMessageReaction={onToggleMessageReaction}
        onEditMessage={onEditMessage}
        onDeleteMessage={onDeleteMessage}
        ownerTyping={ownerTyping}
        isPreview={isPreview}
      />

      {/* Story Card Export with Scannable QR */}
      {storyCardOpen && (
        <Suspense fallback={null}>
          <StoryCardExportModal
            isOpen={storyCardOpen}
            lang={lang}
            theme={theme}
            config={config}
            onNotify={onNotify}
            onClose={() => setStoryCardOpen(false)}
          />
        </Suspense>
      )}

      {/* Avatar Click Action Choice (View Story vs View Profile Photo) */}
      <AvatarChoiceModal
        isOpen={avatarChoiceOpen}
        lang={lang}
        theme={theme}
        config={config}
        storyCount={activeStories.length}
        hasUnseenStories={hasUnseenStories}
        onChooseViewStory={() => {
          setAvatarChoiceOpen(false);
          setActiveHighlight(null);
          setStoryViewerOpen(true);
        }}
        onChooseViewAvatar={() => {
          setAvatarChoiceOpen(false);
          setAvatarLightboxOpen(true);
        }}
        onClose={() => setAvatarChoiceOpen(false)}
      />

      {/* Full-Screen Profile Avatar Photo Lightbox */}
      <AvatarLightboxModal
        isOpen={avatarLightboxOpen}
        lang={lang}
        config={config}
        onClose={() => setAvatarLightboxOpen(false)}
      />

      {/* Instagram / TikTok Stories Viewer */}
      <StoryViewerModal
        isOpen={storyViewerOpen}
        lang={lang}
        config={config}
        stories={activeHighlight ? activeHighlight.stories : activeStories}
        highlightTitle={activeHighlight?.title}
        onStorySeen={handleMarkStorySeen}
        onSendStoryReply={handleSendStoryReply}
        onNotify={onNotify}
        onClose={() => {
          setStoryViewerOpen(false);
          setActiveHighlight(null);
        }}
      />
    </div>
  );
}
