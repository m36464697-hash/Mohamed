import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import {
  ChatAttachment,
  ChatMessage,
  ChatReplyRef,
  ChatThread,
  DEFAULT_SITE_CONFIG,
  Lang,
  SiteConfig,
  TabConfig,
  TabId,
  Theme,
} from './types/siteConfig';
import { SiteView } from './components/SiteView';
import { SecurityLockModal } from './components/SecurityLockModal';

const SettingsModal = lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);

const STORAGE_CONFIG_KEY = 'alaadev_site_config_v8';
const STORAGE_CHAT_THREADS_KEY = 'alaadev_chat_threads_v1';
const STORAGE_ACTIVE_THREAD_KEY = 'alaadev_active_visitor_thread_v1';
const STORAGE_UNLOCKED_KEY = 'alaadev_settings_unlocked_v1';

const VISITOR_COLORS = ['#00d2ff', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#3b82f6'];

function loadSavedConfig(): SiteConfig {
  try {
    const raw =
      window.localStorage.getItem(STORAGE_CONFIG_KEY) ??
      window.localStorage.getItem('alaadev_site_config_v7') ??
      window.localStorage.getItem('alaadev_site_config_v6') ??
      window.localStorage.getItem('alaadev_site_config_v5') ??
      window.localStorage.getItem('alaadev_site_config_v4') ??
      window.localStorage.getItem('alaadev_site_config_v3') ??
      window.localStorage.getItem('alaadev_site_config_v2') ??
      window.localStorage.getItem('alaadev_site_config_v1');
    if (!raw) return DEFAULT_SITE_CONFIG;
    const parsed = JSON.parse(raw) as Partial<SiteConfig>;

    const allowedTabIds: TabId[] = ['personal', 'socials'];
    let mergedTabs: TabConfig[] = DEFAULT_SITE_CONFIG.tabs.items;

    if (Array.isArray(parsed.tabs?.items)) {
      const validSaved = parsed.tabs.items.filter((t): t is TabConfig =>
        allowedTabIds.includes(t.id as TabId)
      );
      const missingDefaults = DEFAULT_SITE_CONFIG.tabs.items.filter(
        (def) => !validSaved.some((t) => t.id === def.id)
      );
      const combined = [...validSaved, ...missingDefaults];
      if (combined.length > 0) {
        mergedTabs = combined;
      }
    }

    const rawDefaultTab = parsed.tabs?.defaultTab;
    const validDefaultTab: TabId =
      rawDefaultTab === 'personal' || rawDefaultTab === 'socials'
        ? rawDefaultTab
        : DEFAULT_SITE_CONFIG.tabs.defaultTab;

    return {
      ...DEFAULT_SITE_CONFIG,
      ...parsed,
      appearance: { ...DEFAULT_SITE_CONFIG.appearance, ...parsed.appearance },
      security: {
        ...DEFAULT_SITE_CONFIG.security,
        ...parsed.security,
        password: parsed.security?.password || DEFAULT_SITE_CONFIG.security.password,
      },
      hero: {
        ...DEFAULT_SITE_CONFIG.hero,
        ...parsed.hero,
        bannerMode: parsed.hero?.bannerMode ?? DEFAULT_SITE_CONFIG.hero.bannerMode,
        bannerSlides:
          Array.isArray(parsed.hero?.bannerSlides) && parsed.hero.bannerSlides.length > 0
            ? parsed.hero.bannerSlides
            : DEFAULT_SITE_CONFIG.hero.bannerSlides,
        bannerSlideIntervalSec:
          parsed.hero?.bannerSlideIntervalSec ?? DEFAULT_SITE_CONFIG.hero.bannerSlideIntervalSec,
        bannerVideoUrl: parsed.hero?.bannerVideoUrl ?? DEFAULT_SITE_CONFIG.hero.bannerVideoUrl,
        bannerParallax: parsed.hero?.bannerParallax ?? DEFAULT_SITE_CONFIG.hero.bannerParallax,
        bannerParallaxSpeed:
          parsed.hero?.bannerParallaxSpeed ?? DEFAULT_SITE_CONFIG.hero.bannerParallaxSpeed,
      },
      chat: {
        ...DEFAULT_SITE_CONFIG.chat,
        ...(parsed.chat
          ? {
              enabled: parsed.chat.enabled ?? DEFAULT_SITE_CONFIG.chat.enabled,
              labelEn: parsed.chat.labelEn ?? DEFAULT_SITE_CONFIG.chat.labelEn,
              labelAr: parsed.chat.labelAr ?? DEFAULT_SITE_CONFIG.chat.labelAr,
              headerTitleEn: parsed.chat.headerTitleEn ?? DEFAULT_SITE_CONFIG.chat.headerTitleEn,
              headerTitleAr: parsed.chat.headerTitleAr ?? DEFAULT_SITE_CONFIG.chat.headerTitleAr,
              headerSubEn: parsed.chat.headerSubEn ?? DEFAULT_SITE_CONFIG.chat.headerSubEn,
              headerSubAr: parsed.chat.headerSubAr ?? DEFAULT_SITE_CONFIG.chat.headerSubAr,
              welcomeEn: parsed.chat.welcomeEn ?? DEFAULT_SITE_CONFIG.chat.welcomeEn,
              welcomeAr: parsed.chat.welcomeAr ?? DEFAULT_SITE_CONFIG.chat.welcomeAr,
              availabilityStatus:
                parsed.chat.availabilityStatus ?? DEFAULT_SITE_CONFIG.chat.availabilityStatus,
              autoReplyEnabled:
                parsed.chat.autoReplyEnabled ?? DEFAULT_SITE_CONFIG.chat.autoReplyEnabled,
              autoReplyDelaySec:
                parsed.chat.autoReplyDelaySec ?? DEFAULT_SITE_CONFIG.chat.autoReplyDelaySec,
              autoReplyTextEn:
                parsed.chat.autoReplyTextEn ?? DEFAULT_SITE_CONFIG.chat.autoReplyTextEn,
              autoReplyTextAr:
                parsed.chat.autoReplyTextAr ?? DEFAULT_SITE_CONFIG.chat.autoReplyTextAr,
            }
          : {}),
      },
      tabs: {
        defaultTab: validDefaultTab,
        items: mergedTabs,
      },
      stories: {
        ...DEFAULT_SITE_CONFIG.stories,
        ...parsed.stories,
        autoExpire24hDefault:
          parsed.stories?.autoExpire24hDefault ?? DEFAULT_SITE_CONFIG.stories.autoExpire24hDefault,
        highlightsEnabled:
          parsed.stories?.highlightsEnabled ?? DEFAULT_SITE_CONFIG.stories.highlightsEnabled,
        highlights: Array.isArray(parsed.stories?.highlights)
          ? parsed.stories.highlights
          : DEFAULT_SITE_CONFIG.stories.highlights,
        items: Array.isArray(parsed.stories?.items)
          ? parsed.stories.items
          : DEFAULT_SITE_CONFIG.stories.items,
      },
      personal: {
        ...DEFAULT_SITE_CONFIG.personal,
        ...parsed.personal,
        customFields: Array.isArray(parsed.personal?.customFields)
          ? parsed.personal.customFields
          : DEFAULT_SITE_CONFIG.personal.customFields,
      },
      socials: Array.isArray(parsed.socials) ? parsed.socials : DEFAULT_SITE_CONFIG.socials,
      footer: { ...DEFAULT_SITE_CONFIG.footer, ...parsed.footer },
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

function loadSavedThreads(): ChatThread[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_CHAT_THREADS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatThread[]) : [];
  } catch {
    return [];
  }
}

function loadSavedActiveThreadId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_ACTIVE_THREAD_KEY);
  } catch {
    return null;
  }
}

export default function App() {
  const [config, setConfig] = useState<SiteConfig>(loadSavedConfig);
  const [history, setHistory] = useState<SiteConfig[]>([]);
  const [future, setFuture] = useState<SiteConfig[]>([]);

  const [chatThreads, setChatThreads] = useState<ChatThread[]>(loadSavedThreads);
  const [activeVisitorThreadId, setActiveVisitorThreadId] = useState<string | null>(
    loadSavedActiveThreadId
  );
  const [chatOpen, setChatOpen] = useState(false);

  const [theme, setTheme] = useState<Theme>(() => config.appearance.defaultTheme);
  const [lang, setLang] = useState<Lang>(() => config.appearance.defaultLang);
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const h = window.location.hash.slice(1);
    if (h === 'personal' || h === 'socials') {
      return h;
    }
    return config.tabs.defaultTab;
  });

  const [panelOpen, setPanelOpen] = useState(false);
  const [settingsUnlocked, setSettingsUnlocked] = useState(() => {
    try {
      return window.sessionStorage.getItem(STORAGE_UNLOCKED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const toastTimerRef = useRef<number | null>(null);

  const [autoReplyTypingThreadId, setAutoReplyTypingThreadId] = useState<string | null>(null);
  const autoReplyTimerRef = useRef<number | null>(null);
  const latestConfigRef = useRef(config);
  const latestLangRef = useRef(lang);
  const chatThreadsRef = useRef(chatThreads);

  latestConfigRef.current = config;
  latestLangRef.current = lang;
  chatThreadsRef.current = chatThreads;

  useEffect(() => {
    return () => {
      if (autoReplyTimerRef.current) window.clearTimeout(autoReplyTimerRef.current);
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastOpen(false);
    }, 2500);
  };

  const handleRequestOpenSettings = useCallback(() => {
    if (!config.security.requirePassword || !config.security.password) {
      setPanelOpen(true);
      return;
    }
    if (config.security.rememberSession && settingsUnlocked) {
      setPanelOpen(true);
      return;
    }
    setPasswordModalOpen(true);
  }, [config.security.requirePassword, config.security.password, config.security.rememberSession, settingsUnlocked]);

  const handleUnlockSuccess = useCallback(() => {
    if (config.security.rememberSession) {
      setSettingsUnlocked(true);
      try {
        window.sessionStorage.setItem(STORAGE_UNLOCKED_KEY, '1');
      } catch {
        // Ignore storage errors
      }
    }
    setPasswordModalOpen(false);
    setPanelOpen(true);
  }, [config.security.rememberSession]);

  const handleLockNow = () => {
    setSettingsUnlocked(false);
    try {
      window.sessionStorage.removeItem(STORAGE_UNLOCKED_KEY);
    } catch {
      // Ignore storage errors
    }
    setPanelOpen(false);
    showToast(lang === 'ar' ? 'تم قفل الإعدادات' : 'Settings locked');
  };

  const updateConfig = (next: SiteConfig) => {
    setHistory((prev) => [...prev.slice(-29), config]);
    setFuture([]);
    setConfig(next);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setFuture((prev) => [config, ...prev]);
    setConfig(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setHistory((prev) => [...prev, config]);
    setConfig(next);
  };

  const storageQuotaWarnedRef = useRef(false);

  // Sync config to localStorage and live CSS custom properties
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(config));
      storageQuotaWarnedRef.current = false;
    } catch {
      if (!storageQuotaWarnedRef.current) {
        storageQuotaWarnedRef.current = true;
        setToastMsg(
          lang === 'ar'
            ? 'مساحة التخزين في المتصفح ممتلئة! استخدم روابط خارجية للملفات الكبيرة أو صدّر نسخة JSON.'
            : 'Browser storage quota exceeded! Use external URLs for large media or export JSON.'
        );
        setToastOpen(true);
        if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = window.setTimeout(() => setToastOpen(false), 3800);
      }
    }

    const root = document.documentElement;
    root.style.setProperty('--brand', config.appearance.brandColor);
    root.style.setProperty('--brand2', config.appearance.brandColor2);
    root.style.setProperty('--grad-angle', `${config.appearance.gradientAngle}deg`);
    root.style.setProperty('--card-radius', `${config.appearance.cardRadiusPx}px`);
    root.style.setProperty('--site-font', `'${config.appearance.fontFamily}'`);
    root.style.setProperty('--bg-dark', config.appearance.bgDark);
    root.style.setProperty('--surface-dark', config.appearance.surfaceDark);
    root.style.setProperty('--bg-light', config.appearance.bgLight);
    root.style.setProperty('--surface-light', config.appearance.surfaceLight);
    root.dataset.grain = config.appearance.enableGrain ? 'on' : 'off';

    const title = config.hero.brandName || 'AlaaDev';
    const descBase = lang === 'ar' ? config.hero.tagAr : config.hero.tagEn;
    const desc = config.hero.tagSuffix ? `${descBase} · ${config.hero.tagSuffix}` : descBase;
    document.title = title;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && desc) metaDesc.setAttribute('content', desc);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && desc) ogDesc.setAttribute('content', desc);
  }, [config, lang]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_CHAT_THREADS_KEY, JSON.stringify(chatThreads));
    } catch {
      // Ignore storage errors
    }
  }, [chatThreads]);

  useEffect(() => {
    try {
      if (activeVisitorThreadId) {
        window.localStorage.setItem(STORAGE_ACTIVE_THREAD_KEY, activeVisitorThreadId);
      } else {
        window.localStorage.removeItem(STORAGE_ACTIVE_THREAD_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeVisitorThreadId]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_CHAT_THREADS_KEY && e.newValue) {
        try {
          setChatThreads(JSON.parse(e.newValue) as ChatThread[]);
        } catch {
          // Ignore parse errors
        }
      }
      if (e.key === STORAGE_CONFIG_KEY && e.newValue) {
        setConfig(loadSavedConfig());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    const visibleTabs = config.tabs.items.filter((t) => t.visible);
    if (visibleTabs.length > 0 && !visibleTabs.some((t) => t.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [config.tabs.items, activeTab]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        if (panelOpen) {
          setPanelOpen(false);
        } else {
          handleRequestOpenSettings();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [panelOpen, handleRequestOpenSettings]);

  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `#${tab}`);
  };

  const handleSendVisitorMessage = useCallback(
    (
      visitorName: string,
      visitorTag: string,
      text: string,
      attachment?: ChatAttachment,
      replyTo?: ChatReplyRef
    ) => {
      const now = new Date().toISOString();
      const msg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'visitor',
        text,
        createdAt: now,
        readByOwner: false,
        readByVisitor: true,
        ...(attachment ? { attachment } : {}),
        ...(replyTo ? { replyTo } : {}),
      };

      const existingInRef = activeVisitorThreadId
        ? chatThreadsRef.current.find((t) => t.id === activeVisitorThreadId)
        : undefined;
      const targetThreadId = existingInRef ? existingInRef.id : `thread-${Date.now()}`;

      setChatThreads((prev) => {
        const existing = prev.find((t) => t.id === targetThreadId);
        if (existing) {
          return [
            {
              ...existing,
              updatedAt: now,
              messages: [...existing.messages, msg],
            },
            ...prev.filter((t) => t.id !== existing.id),
          ];
        }

        const color = VISITOR_COLORS[prev.length % VISITOR_COLORS.length];
        const newThread: ChatThread = {
          id: targetThreadId,
          visitorName,
          visitorTag,
          avatarColor: color,
          createdAt: now,
          updatedAt: now,
          messages: [msg],
        };
        setActiveVisitorThreadId(targetThreadId);
        return [newThread, ...prev];
      });

      const cfg = latestConfigRef.current;
      if (cfg.chat.autoReplyEnabled) {
        const replyText =
          latestLangRef.current === 'ar'
            ? cfg.chat.autoReplyTextAr.trim()
            : cfg.chat.autoReplyTextEn.trim();
        if (replyText) {
          if (autoReplyTimerRef.current) window.clearTimeout(autoReplyTimerRef.current);
          setAutoReplyTypingThreadId(targetThreadId);
          const delayMs = Math.max(1, Math.min(15, cfg.chat.autoReplyDelaySec || 2)) * 1000;
          autoReplyTimerRef.current = window.setTimeout(() => {
            const replyIso = new Date().toISOString();
            const currentCfg = latestConfigRef.current;
            const currentReplyText = (
              latestLangRef.current === 'ar'
                ? currentCfg.chat.autoReplyTextAr
                : currentCfg.chat.autoReplyTextEn
            ).trim();
            setAutoReplyTypingThreadId(null);
            if (!currentCfg.chat.autoReplyEnabled || !currentReplyText) return;

            setChatThreads((prev) =>
              prev.map((t) => {
                if (t.id !== targetThreadId) return t;
                const last = t.messages[t.messages.length - 1];
                if (
                  last &&
                  last.sender === 'owner' &&
                  last.text === currentReplyText &&
                  Date.now() - new Date(last.createdAt).getTime() < 20000
                ) {
                  return t;
                }
                const autoMsg: ChatMessage = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  sender: 'owner',
                  text: currentReplyText,
                  createdAt: replyIso,
                  readByOwner: true,
                  readByVisitor: false,
                };
                return {
                  ...t,
                  updatedAt: replyIso,
                  messages: [
                    ...t.messages.map((m) =>
                      m.sender === 'visitor' ? { ...m, readByOwner: true } : m
                    ),
                    autoMsg,
                  ],
                };
              })
            );
          }, delayMs);
        }
      }
    },
    [activeVisitorThreadId]
  );

  const handleSendOwnerReply = useCallback(
    (
      threadId: string,
      text: string,
      attachment?: ChatAttachment,
      replyTo?: ChatReplyRef
    ) => {
      if (autoReplyTimerRef.current && autoReplyTypingThreadId === threadId) {
        window.clearTimeout(autoReplyTimerRef.current);
        setAutoReplyTypingThreadId(null);
      }
      const now = new Date().toISOString();
      const reply: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        sender: 'owner',
        text,
        createdAt: now,
        readByOwner: true,
        readByVisitor: false,
        ...(attachment ? { attachment } : {}),
        ...(replyTo ? { replyTo } : {}),
      };

      setChatThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                updatedAt: now,
                messages: [
                  ...t.messages.map((m) =>
                    m.sender === 'visitor' ? { ...m, readByOwner: true } : m
                  ),
                  reply,
                ],
              }
            : t
        )
      );
    },
    [autoReplyTypingThreadId]
  );

  const handleToggleMessageReaction = useCallback(
    (threadId: string, messageId: string, emoji: string, by: 'visitor' | 'owner') => {
      setChatThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          return {
            ...t,
            messages: t.messages.map((m) => {
              if (m.id !== messageId) return m;
              const current = { ...(m.reactions ?? {}) };
              const list = current[emoji] ?? [];
              const exists = list.includes(by);
              const nextList = exists ? list.filter((r) => r !== by) : [...list, by];
              if (nextList.length === 0) {
                delete current[emoji];
              } else {
                current[emoji] = nextList;
              }
              return { ...m, reactions: current };
            }),
          };
        })
      );
    },
    []
  );

  const handleEditMessage = useCallback(
    (threadId: string, messageId: string, newText: string) => {
      const clean = newText.trim();
      if (!clean) return;
      const now = new Date().toISOString();
      setChatThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? {
                ...t,
                messages: t.messages.map((m) =>
                  m.id === messageId ? { ...m, text: clean, editedAt: now } : m
                ),
              }
            : t
        )
      );
    },
    []
  );

  const handleDeleteMessage = useCallback((threadId: string, messageId: string) => {
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: t.messages.filter((m) => m.id !== messageId),
            }
          : t
      )
    );
  }, []);

  const handleMarkOwnerRead = useCallback((threadId: string) => {
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.sender === 'visitor' && !m.readByOwner
                  ? { ...m, readByOwner: true }
                  : m
              ),
            }
          : t
      )
    );
  }, []);

  const handleMarkVisitorRead = useCallback((threadId: string) => {
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === threadId
          ? {
              ...t,
              messages: t.messages.map((m) =>
                m.sender === 'owner' && !m.readByVisitor
                  ? { ...m, readByVisitor: true }
                  : m
              ),
            }
          : t
      )
    );
  }, []);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      setChatThreads((prev) => prev.filter((t) => t.id !== threadId));
      if (activeVisitorThreadId === threadId) {
        setActiveVisitorThreadId(null);
      }
    },
    [activeVisitorThreadId]
  );

  const handleStartNewChatSession = useCallback(() => {
    setActiveVisitorThreadId(null);
  }, []);

  const handleReset = () => {
    updateConfig(DEFAULT_SITE_CONFIG);
    setTheme(DEFAULT_SITE_CONFIG.appearance.defaultTheme);
    setLang(DEFAULT_SITE_CONFIG.appearance.defaultLang);
    setActiveTab(DEFAULT_SITE_CONFIG.tabs.defaultTab);
    setSettingsUnlocked(false);
    try {
      window.sessionStorage.removeItem(STORAGE_UNLOCKED_KEY);
      window.localStorage.removeItem(STORAGE_CONFIG_KEY);
      window.localStorage.removeItem('alaadev_site_config_v7');
      window.localStorage.removeItem('alaadev_site_config_v6');
      window.localStorage.removeItem('alaadev_site_config_v5');
      window.localStorage.removeItem('alaadev_site_config_v4');
      window.localStorage.removeItem('alaadev_site_config_v3');
      window.localStorage.removeItem('alaadev_site_config_v2');
      window.localStorage.removeItem('alaadev_site_config_v1');
    } catch {
      // Ignore storage errors
    }
  };

  const activeVisitorThread =
    (activeVisitorThreadId
      ? chatThreads.find((t) => t.id === activeVisitorThreadId)
      : null) ?? null;

  const unreadOwnerCount = chatThreads.reduce(
    (sum, t) =>
      sum + t.messages.filter((m) => m.sender === 'visitor' && !m.readByOwner).length,
    0
  );

  return (
    <>
      <SiteView
        config={config}
        theme={theme}
        lang={lang}
        activeTab={activeTab}
        onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        onToggleLang={() => setLang((prev) => (prev === 'en' ? 'ar' : 'en'))}
        onSelectTab={handleSelectTab}
        onOpenSettings={handleRequestOpenSettings}
        onNotify={showToast}
        unreadOwnerCount={unreadOwnerCount}
        activeThread={activeVisitorThread}
        chatOpen={chatOpen}
        onToggleChatOpen={setChatOpen}
        onSendVisitorMessage={handleSendVisitorMessage}
        onStartNewChatSession={handleStartNewChatSession}
        onMarkVisitorRead={handleMarkVisitorRead}
        onToggleMessageReaction={handleToggleMessageReaction}
        onEditMessage={handleEditMessage}
        onDeleteMessage={handleDeleteMessage}
        ownerTyping={Boolean(
          activeVisitorThread && autoReplyTypingThreadId === activeVisitorThread.id
        )}
      />

      <SecurityLockModal
        isOpen={passwordModalOpen}
        lang={lang}
        config={config}
        onUnlockSuccess={handleUnlockSuccess}
        onClose={() => setPasswordModalOpen(false)}
      />

      <div
        className={`alaa-toast ${toastOpen ? 'show' : ''}`}
        role="status"
        aria-live="polite"
      >
        <Check
          className="w-4 h-4"
          style={{ color: config.appearance.brandColor }}
          aria-hidden="true"
        />
        <span>{toastMsg}</span>
      </div>

      {panelOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            onLockNow={handleLockNow}
            config={config}
            theme={theme}
            lang={lang}
            activeTab={activeTab}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onChange={updateConfig}
            onReset={handleReset}
            onPreviewTheme={setTheme}
            onPreviewLang={setLang}
            onPreviewTab={handleSelectTab}
            onNotify={showToast}
            chatThreads={chatThreads}
            activeVisitorThread={activeVisitorThread}
            chatOpen={chatOpen}
            onToggleChatOpen={setChatOpen}
            onSendVisitorMessage={handleSendVisitorMessage}
            onStartNewChatSession={handleStartNewChatSession}
            onMarkVisitorRead={handleMarkVisitorRead}
            onSendOwnerReply={handleSendOwnerReply}
            onMarkOwnerRead={handleMarkOwnerRead}
            onDeleteThread={handleDeleteThread}
            onToggleMessageReaction={handleToggleMessageReaction}
            onEditMessage={handleEditMessage}
            onDeleteMessage={handleDeleteMessage}
            ownerTyping={Boolean(
              activeVisitorThread && autoReplyTypingThreadId === activeVisitorThread.id
            )}
          />
        </Suspense>
      )}
    </>
  );
}
