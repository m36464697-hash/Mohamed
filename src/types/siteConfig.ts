export type TabId = 'personal' | 'socials';
export type Lang = 'en' | 'ar';
export type Theme = 'dark' | 'light';
export type SiteFontFamily = 'Tajawal' | 'Cairo' | 'Readex Pro' | 'IBM Plex Sans Arabic';

export type AvatarShape =
  | 'circle'
  | 'squircle'
  | 'rounded'
  | 'hexagon'
  | 'octagon'
  | 'arch'
  | 'diamond'
  | 'shield'
  | 'starburst'
  | 'leaf'
  | 'clover'
  | 'pentagon';

export type AvatarDesign =
  | 'classic'
  | 'neon'
  | 'glass'
  | 'gradient-spin'
  | 'minimal'
  | 'double-halo'
  | 'gold-luxe'
  | 'cyber-glitch'
  | 'aurora-glow'
  | 'shadow-3d';

export type BannerDesign =
  | 'classic'
  | 'fade-bottom'
  | 'card'
  | 'wave'
  | 'double-wave'
  | 'angled'
  | 'chevron'
  | 'notched'
  | 'arch-top'
  | 'framed'
  | 'cyber-corners'
  | 'split-glow'
  | 'floating'
  | 'polaroid';

export type BannerOverlay =
  | 'scrim'
  | 'bottom-fade'
  | 'gradient'
  | 'duotone'
  | 'grid'
  | 'scanlines'
  | 'vignette'
  | 'clean';

export type BackdropStyle = 'clean' | 'mesh' | 'aurora' | 'grid' | 'dots';
export type CardMaterial = 'solid' | 'glass' | 'bordered' | 'elevated';
export type TabBarStyle = 'segmented' | 'pills' | 'underline' | 'floating';
export type ContentWidth = 'compact' | 'normal' | 'wide';
export type UiDensity = 'cozy' | 'compact' | 'spacious';

export type SocialIconType =
  | 'youtube'
  | 'tiktok'
  | 'discord'
  | 'github'
  | 'instagram'
  | 'twitter'
  | 'twitch'
  | 'globe';

export type PersonalFieldIcon =
  | 'user'
  | 'cake'
  | 'graduation'
  | 'book'
  | 'map'
  | 'globe'
  | 'building'
  | 'languages'
  | 'sparkles'
  | 'calendar';

export interface PersonalCustomField {
  id: string;
  labelEn: string;
  labelAr: string;
  valueEn: string;
  valueAr: string;
  icon: PersonalFieldIcon;
  visible: boolean;
}

export interface PersonalInfoConfig {
  sectionTitleEn: string;
  sectionTitleAr: string;
  showCardHeader: boolean;
  headlineEn: string;
  headlineAr: string;
  quoteEn: string;
  quoteAr: string;
  showFullName: boolean;
  fullNameEn: string;
  fullNameAr: string;
  showAge: boolean;
  ageEn: string;
  ageAr: string;
  showGrade: boolean;
  gradeEn: string;
  gradeAr: string;
  showStage: boolean;
  stageEn: string;
  stageAr: string;
  showCountry: boolean;
  countryEn: string;
  countryAr: string;
  showCity: boolean;
  cityEn: string;
  cityAr: string;
  showSchool: boolean;
  schoolEn: string;
  schoolAr: string;
  showLanguages: boolean;
  languagesEn: string;
  languagesAr: string;
  showBirthdate: boolean;
  birthdateEn: string;
  birthdateAr: string;
  showHobbies: boolean;
  hobbiesTitleEn: string;
  hobbiesTitleAr: string;
  hobbiesEn: string[];
  hobbiesAr: string[];
  customFields: PersonalCustomField[];
}

export type ChatAttachment =
  | {
      type: 'link';
      title: string;
      url: string;
      imageUrl?: string;
    }
  | {
      type: 'audio';
      durationSec: number;
      audioUrl?: string;
      waveform?: number[];
    }
  | {
      type: 'file';
      fileName: string;
      fileSize: string;
      fileUrl?: string;
    };

export interface ChatReplyRef {
  messageId: string;
  sender: 'visitor' | 'owner';
  text: string;
  attachmentLabel?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'visitor' | 'owner';
  text: string;
  createdAt: string;
  readByOwner: boolean;
  readByVisitor: boolean;
  attachment?: ChatAttachment;
  reactions?: Record<string, ('visitor' | 'owner')[]>;
  replyTo?: ChatReplyRef;
  editedAt?: string;
}

export interface ChatThread {
  id: string;
  visitorName: string;
  visitorTag: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface SocialItem {
  id: string;
  name: string;
  subEn: string;
  subAr: string;
  href: string;
  icon: SocialIconType;
  accentColor: string;
  visible: boolean;
}

export interface TabConfig {
  id: TabId;
  labelEn: string;
  labelAr: string;
  visible: boolean;
}

export type StoryMediaType = 'image' | 'video' | 'text';
export type StoryRingStyle = 'instagram' | 'tiktok' | 'brand';

export interface StoryMusic {
  title: string;
  artist?: string;
  audioUrl: string;
  startSec: number;
  clipDurationSec: number;
  totalDurationSec?: number;
  volume?: number;
}

export interface StoryItem {
  id: string;
  type: StoryMediaType;
  mediaUrl: string;
  bgGradient?: string;
  captionEn: string;
  captionAr: string;
  durationSec: number;
  createdAt: string;
  expiresAt?: string;
  visible: boolean;
  music?: StoryMusic;
}

export interface StoryHighlight {
  id: string;
  titleEn: string;
  titleAr: string;
  coverUrl: string;
  accentColor?: string;
  storyIds: string[];
  visible: boolean;
}

export interface StoriesConfig {
  enabled: boolean;
  ringStyle: StoryRingStyle;
  autoExpire24hDefault: boolean;
  highlightsEnabled: boolean;
  highlights: StoryHighlight[];
  items: StoryItem[];
}

export type ThemeCategory = 'neon' | 'luxury' | 'nature' | 'light' | 'classic';

export interface ThemePreset {
  id: string;
  name: string;
  mode: Theme;
  category: ThemeCategory;
  brand: string;
  brand2: string;
  bgDark: string;
  surfaceDark: string;
  bgLight: string;
  surfaceLight: string;
  gradientAngle: number;
}

export interface SiteConfig {
  appearance: {
    defaultTheme: Theme;
    defaultLang: Lang;
    fontFamily: SiteFontFamily;
    brandColor: string;
    brandColor2: string;
    gradientAngle: number;
    cardRadiusPx: number;
    bgDark: string;
    surfaceDark: string;
    bgLight: string;
    surfaceLight: string;
    backdropStyle: BackdropStyle;
    cardMaterial: CardMaterial;
    tabStyle: TabBarStyle;
    contentWidth: ContentWidth;
    uiDensity: UiDensity;
    fontSizeScale: number;
    enableGrain: boolean;
    showScrollProgress: boolean;
    enableAnimations: boolean;
    showThemeBtn: boolean;
    showLangBtn: boolean;
    showShareBtn: boolean;
    tiltCards: boolean;
    stickyTabs: boolean;
    cursorGlow: boolean;
    cursorGlowSizePx: number;
  };
  security: {
    requirePassword: boolean;
    password: string;
    passwordHint: string;
    rememberSession: boolean;
  };
  spotlight: {
    enabled: boolean;
    badgeEn: string;
    badgeAr: string;
    textEn: string;
    textAr: string;
    href: string;
  };
  hero: {
    bannerImage: string;
    bannerMode: 'image' | 'slideshow' | 'video';
    bannerSlides: string[];
    bannerSlideIntervalSec: number;
    bannerVideoUrl: string;
    avatarImage: string;
    bannerHeightRem: number;
    bannerBlurPx: number;
    bannerSaturation: number;
    bannerBrightness: number;
    bannerPositionY: number;
    bannerParallax: boolean;
    bannerParallaxSpeed: number;
    avatarShape: AvatarShape;
    avatarDesign: AvatarDesign;
    avatarSizeRem: number;
    avatarOffsetRem: number;
    avatarZoom: number;
    bannerDesign: BannerDesign;
    bannerOverlay: BannerOverlay;
    showVerifiedBadge: boolean;
    showAvatarStatusDot: boolean;
    avatarRing: boolean;
    profileLayout: 'start' | 'center';
    showHeroGlow: boolean;
    showProfileBadges: boolean;
    profileBadge1En: string;
    profileBadge1Ar: string;
    profileBadge2En: string;
    profileBadge2Ar: string;
    brandName: string;
    tagEn: string;
    tagAr: string;
    tagSuffix: string;
    showTagDot: boolean;
    cornerMark: string;
    showCornerMark: boolean;
  };
  chat: {
    enabled: boolean;
    labelEn: string;
    labelAr: string;
    headerTitleEn: string;
    headerTitleAr: string;
    headerSubEn: string;
    headerSubAr: string;
    welcomeEn: string;
    welcomeAr: string;
    availabilityStatus: 'online' | 'busy' | 'away';
    autoReplyEnabled: boolean;
    autoReplyDelaySec: number;
    autoReplyTextEn: string;
    autoReplyTextAr: string;
  };
  tabs: {
    defaultTab: TabId;
    items: TabConfig[];
  };
  stories: StoriesConfig;
  personal: PersonalInfoConfig;
  socials: SocialItem[];
  footer: {
    visible: boolean;
    showStatus: boolean;
    statusDotColor: string;
    statusPulse: boolean;
    statusEn: string;
    statusAr: string;
    copyrightName: string;
    signature: string;
    showSignature: boolean;
  };
}

export const DEFAULT_PROFILE_BANNER = '/src/assets/images/profile_banner_1795523867988.jpg';
export const DEFAULT_PROFILE_AVATAR = '/src/assets/images/profile_avatar_1795523867255.jpg';

export const FONT_OPTIONS: { value: SiteFontFamily; label: string }[] = [
  { value: 'Tajawal', label: 'Tajawal (الأصلي)' },
  { value: 'Cairo', label: 'Cairo (حديث)' },
  { value: 'Readex Pro', label: 'Readex Pro (هندسي)' },
  { value: 'IBM Plex Sans Arabic', label: 'IBM Plex (تقني)' },
];

export const THEME_PRESETS: ThemePreset[] = [
  // Classic & Dark Signatures (10)
  {
    id: 'cyan-original',
    name: 'أزرق سماوي (الأصلي)',
    mode: 'dark',
    category: 'classic',
    brand: '#00d2ff',
    brand2: '#3a7bd5',
    bgDark: '#0a0e17',
    surfaceDark: '#121a28',
    bgLight: '#f4f6fa',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'deep-sapphire',
    name: 'ياقوتي عميق',
    mode: 'dark',
    category: 'classic',
    brand: '#38bdf8',
    brand2: '#1d4ed8',
    bgDark: '#080e1a',
    surfaceDark: '#101a2e',
    bgLight: '#eff6ff',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'midnight-indigo',
    name: 'نيلي منتصف الليل',
    mode: 'dark',
    category: 'classic',
    brand: '#818cf8',
    brand2: '#38bdf8',
    bgDark: '#070917',
    surfaceDark: '#11162c',
    bgLight: '#eef2ff',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'titanium-slate',
    name: 'تيتانيوم معدني',
    mode: 'dark',
    category: 'classic',
    brand: '#cbd5e1',
    brand2: '#64748b',
    bgDark: '#0b0d12',
    surfaceDark: '#161a22',
    bgLight: '#f8fafc',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'obsidian-carbon',
    name: 'أوبسيديان كربوني',
    mode: 'dark',
    category: 'classic',
    brand: '#60a5fa',
    brand2: '#2563eb',
    bgDark: '#050608',
    surfaceDark: '#101218',
    bgLight: '#f3f4f6',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'nordic-ice',
    name: 'جليد الشمال',
    mode: 'dark',
    category: 'classic',
    brand: '#88c0d0',
    brand2: '#5e81ac',
    bgDark: '#0f141c',
    surfaceDark: '#19212e',
    bgLight: '#eceff4',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'cobalt-pro',
    name: 'كوبالت احترافي',
    mode: 'dark',
    category: 'classic',
    brand: '#3b82f6',
    brand2: '#06b6d4',
    bgDark: '#060c18',
    surfaceDark: '#0e192d',
    bgLight: '#eff6ff',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'steel-blue',
    name: 'فولاذي أزرق',
    mode: 'dark',
    category: 'classic',
    brand: '#7dd3fc',
    brand2: '#0284c7',
    bgDark: '#091017',
    surfaceDark: '#121e2b',
    bgLight: '#f0f9ff',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'slate-emerald',
    name: 'رمادي زمردي',
    mode: 'dark',
    category: 'classic',
    brand: '#34d399',
    brand2: '#0f766e',
    bgDark: '#0b0f13',
    surfaceDark: '#151c22',
    bgLight: '#f0fdf4',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'graphite-amber',
    name: 'جرافيت كهرماني',
    mode: 'dark',
    category: 'classic',
    brand: '#fbbf24',
    brand2: '#78716c',
    bgDark: '#0c0c0e',
    surfaceDark: '#17171b',
    bgLight: '#fafaf9',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },

  // Neon & Cyber (14)
  {
    id: 'emerald-neon',
    name: 'زمردي نيون',
    mode: 'dark',
    category: 'neon',
    brand: '#10b981',
    brand2: '#059669',
    bgDark: '#071310',
    surfaceDark: '#0e1f1a',
    bgLight: '#f0fdf7',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'electric-violet',
    name: 'بنفسجي كهربائي',
    mode: 'dark',
    category: 'neon',
    brand: '#a855f7',
    brand2: '#6366f1',
    bgDark: '#0d0a18',
    surfaceDark: '#171229',
    bgLight: '#f6f3ff',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'cyber-pink',
    name: 'سايبربانك وردي',
    mode: 'dark',
    category: 'neon',
    brand: '#ff2a85',
    brand2: '#7928ca',
    bgDark: '#120713',
    surfaceDark: '#1e0e22',
    bgLight: '#fdf2f8',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'crimson-fury',
    name: 'أحمر قرمزي',
    mode: 'dark',
    category: 'neon',
    brand: '#ef4444',
    brand2: '#b91c1c',
    bgDark: '#14080a',
    surfaceDark: '#220f12',
    bgLight: '#fef2f2',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'matrix-green',
    name: 'ماتريكس المبرمجين',
    mode: 'dark',
    category: 'neon',
    brand: '#22c55e',
    brand2: '#14b8a6',
    bgDark: '#040d07',
    surfaceDark: '#0b1a10',
    bgLight: '#f0fdf4',
    surfaceLight: '#ffffff',
    gradientAngle: 140,
  },
  {
    id: 'galaxy-magenta',
    name: 'أرجواني المجرة',
    mode: 'dark',
    category: 'neon',
    brand: '#e879f9',
    brand2: '#8b5cf6',
    bgDark: '#110817',
    surfaceDark: '#1d0f27',
    bgLight: '#fdf4ff',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'synthwave-2077',
    name: 'سينث ويف 2077',
    mode: 'dark',
    category: 'neon',
    brand: '#f43f5e',
    brand2: '#00d2ff',
    bgDark: '#0b0618',
    surfaceDark: '#160d2b',
    bgLight: '#fdf2f8',
    surfaceLight: '#ffffff',
    gradientAngle: 115,
  },
  {
    id: 'laser-lime',
    name: 'ليزر ليموني',
    mode: 'dark',
    category: 'neon',
    brand: '#a3e635',
    brand2: '#10b981',
    bgDark: '#071005',
    surfaceDark: '#101f0b',
    bgLight: '#f7fee7',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'hyper-cyan',
    name: 'سماوي فائق',
    mode: 'dark',
    category: 'neon',
    brand: '#22d3ee',
    brand2: '#a855f7',
    bgDark: '#060a16',
    surfaceDark: '#0f162b',
    bgLight: '#ecfeff',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'plasma-blue',
    name: 'بلازما زرقاء',
    mode: 'dark',
    category: 'neon',
    brand: '#00f5d4',
    brand2: '#00bbf9',
    bgDark: '#040b14',
    surfaceDark: '#0a1829',
    bgLight: '#ecfeff',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'neon-tangerine',
    name: 'يوسفي متوهج',
    mode: 'dark',
    category: 'neon',
    brand: '#ff6b35',
    brand2: '#f7c59f',
    bgDark: '#140905',
    surfaceDark: '#23110a',
    bgLight: '#fff7ed',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'arcade-pulse',
    name: 'أركيد ريترو',
    mode: 'dark',
    category: 'neon',
    brand: '#f472b6',
    brand2: '#38bdf8',
    bgDark: '#0c0818',
    surfaceDark: '#17112b',
    bgLight: '#fdf2f8',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'ultraviolet-core',
    name: 'فوق البنفسجي',
    mode: 'dark',
    category: 'neon',
    brand: '#7c3aed',
    brand2: '#ec4899',
    bgDark: '#090514',
    surfaceDark: '#140c29',
    bgLight: '#f5f3ff',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'acid-mint',
    name: 'نعناع سايبر',
    mode: 'dark',
    category: 'neon',
    brand: '#00ffa3',
    brand2: '#03e1ff',
    bgDark: '#041010',
    surfaceDark: '#0a1f1f',
    bgLight: '#f0fdfa',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },

  // Luxury & Rich Dark (10)
  {
    id: 'royal-gold',
    name: 'ذهبي ملكي فاخر',
    mode: 'dark',
    category: 'luxury',
    brand: '#facc15',
    brand2: '#d97706',
    bgDark: '#0f0d07',
    surfaceDark: '#1b170c',
    bgLight: '#fefce8',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'amber-gold',
    name: 'عنبر ذهبي',
    mode: 'dark',
    category: 'luxury',
    brand: '#f59e0b',
    brand2: '#ea580c',
    bgDark: '#130e08',
    surfaceDark: '#20180e',
    bgLight: '#fffbeb',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'champagne-noir',
    name: 'شامبين أسود',
    mode: 'dark',
    category: 'luxury',
    brand: '#e6c28b',
    brand2: '#b6894b',
    bgDark: '#0c0b09',
    surfaceDark: '#181511',
    bgLight: '#faf8f5',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'rose-gold-luxe',
    name: 'روز جولد فاخر',
    mode: 'dark',
    category: 'luxury',
    brand: '#fda4af',
    brand2: '#e11d48',
    bgDark: '#140a0e',
    surfaceDark: '#221118',
    bgLight: '#fff1f2',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'velvet-plum',
    name: 'مخمل أرجواني',
    mode: 'dark',
    category: 'luxury',
    brand: '#d8b4fe',
    brand2: '#9333ea',
    bgDark: '#100816',
    surfaceDark: '#1c1026',
    bgLight: '#faf5ff',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'platinum-silver',
    name: 'بلاتينيوم فضي',
    mode: 'dark',
    category: 'luxury',
    brand: '#f8fafc',
    brand2: '#94a3b8',
    bgDark: '#090a0d',
    surfaceDark: '#14161c',
    bgLight: '#f8fafc',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'ruby-imperial',
    name: 'ياقوت أحمر إمبراطوري',
    mode: 'dark',
    category: 'luxury',
    brand: '#fb7185',
    brand2: '#be123c',
    bgDark: '#14070b',
    surfaceDark: '#240d14',
    bgLight: '#fff1f2',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'emerald-crown',
    name: 'تاج الزمرد الملكي',
    mode: 'dark',
    category: 'luxury',
    brand: '#6ee7b7',
    brand2: '#047857',
    bgDark: '#05110c',
    surfaceDark: '#0c2017',
    bgLight: '#ecfdf5',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'bronze-empire',
    name: 'برونزي عتيق',
    mode: 'dark',
    category: 'luxury',
    brand: '#fdba74',
    brand2: '#9a3412',
    bgDark: '#120b07',
    surfaceDark: '#1f140d',
    bgLight: '#fff7ed',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'espresso-mocha',
    name: 'إسبريسو دافئ',
    mode: 'dark',
    category: 'luxury',
    brand: '#d6a87c',
    brand2: '#8b5e3c',
    bgDark: '#100b08',
    surfaceDark: '#1c140f',
    bgLight: '#fdf8f4',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },

  // Nature & Sunset (8)
  {
    id: 'coral-glow',
    name: 'مرجاني متوهج',
    mode: 'dark',
    category: 'nature',
    brand: '#ff5e62',
    brand2: '#ff9966',
    bgDark: '#140b0e',
    surfaceDark: '#211217',
    bgLight: '#fff5f5',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'mint-frost',
    name: 'نعناعي بارد',
    mode: 'dark',
    category: 'nature',
    brand: '#2dd4bf',
    brand2: '#0ea5e9',
    bgDark: '#071417',
    surfaceDark: '#0f2329',
    bgLight: '#f0fdfa',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'lava-orange',
    name: 'برتقالي بركاني',
    mode: 'dark',
    category: 'nature',
    brand: '#fb923c',
    brand2: '#e11d48',
    bgDark: '#150908',
    surfaceDark: '#241210',
    bgLight: '#fff7ed',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'dreamy-lavender',
    name: 'لافندر حالم',
    mode: 'dark',
    category: 'nature',
    brand: '#c084fc',
    brand2: '#f472b6',
    bgDark: '#110b19',
    surfaceDark: '#1c1328',
    bgLight: '#faf5ff',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'ocean-teal',
    name: 'فيروزي أعماق البحار',
    mode: 'dark',
    category: 'nature',
    brand: '#06b6d4',
    brand2: '#0f766e',
    bgDark: '#051216',
    surfaceDark: '#0c2026',
    bgLight: '#ecfeff',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
  {
    id: 'aurora-borealis',
    name: 'الشفق القطبي',
    mode: 'dark',
    category: 'nature',
    brand: '#34d399',
    brand2: '#818cf8',
    bgDark: '#061116',
    surfaceDark: '#0e1e26',
    bgLight: '#f0f9ff',
    surfaceLight: '#ffffff',
    gradientAngle: 115,
  },
  {
    id: 'desert-dune',
    name: 'كثبان الصحراء',
    mode: 'dark',
    category: 'nature',
    brand: '#f59e0b',
    brand2: '#b45309',
    bgDark: '#120d06',
    surfaceDark: '#1e170c',
    bgLight: '#fefce8',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'pine-mist',
    name: 'ضباب الصنوبر',
    mode: 'dark',
    category: 'nature',
    brand: '#4ade80',
    brand2: '#0d9488',
    bgDark: '#06100b',
    surfaceDark: '#0d1d15',
    bgLight: '#f0fdf4',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },

  // Light Mode Themes (8)
  {
    id: 'clean-sky-light',
    name: 'سحابي نقي (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#0284c7',
    brand2: '#2563eb',
    bgDark: '#0a0e17',
    surfaceDark: '#121a28',
    bgLight: '#f1f5f9',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'warm-sand-light',
    name: 'رمال دافئة (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#d97706',
    brand2: '#ea580c',
    bgDark: '#130e08',
    surfaceDark: '#20180e',
    bgLight: '#fdf8f3',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'sakura-blossom-light',
    name: 'زهور الساكورا (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#ec4899',
    brand2: '#8b5cf6',
    bgDark: '#120713',
    surfaceDark: '#1e0e22',
    bgLight: '#fdf2f8',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'sage-forest-light',
    name: 'غابة هادئة (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#059669',
    brand2: '#0d9488',
    bgDark: '#071310',
    surfaceDark: '#0e1f1a',
    bgLight: '#f0f7f4',
    surfaceLight: '#ffffff',
    gradientAngle: 130,
  },
  {
    id: 'lavender-milk-light',
    name: 'لافندر حليبي (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#7c3aed',
    brand2: '#6366f1',
    bgDark: '#0d0a18',
    surfaceDark: '#171229',
    bgLight: '#f5f3ff',
    surfaceLight: '#ffffff',
    gradientAngle: 125,
  },
  {
    id: 'aqua-breeze-light',
    name: 'نسيم البحر (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#0891b2',
    brand2: '#0284c7',
    bgDark: '#051216',
    surfaceDark: '#0c2026',
    bgLight: '#ecfeff',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'peach-cream-light',
    name: 'خوخي ناعم (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#e11d48',
    brand2: '#f97316',
    bgDark: '#140b0e',
    surfaceDark: '#211217',
    bgLight: '#fff5f5',
    surfaceLight: '#ffffff',
    gradientAngle: 120,
  },
  {
    id: 'minimal-paper-light',
    name: 'ورقي أبيض كلاسيك (فاتح)',
    mode: 'light',
    category: 'light',
    brand: '#111827',
    brand2: '#4b5563',
    bgDark: '#0b0d12',
    surfaceDark: '#161a22',
    bgLight: '#f8fafc',
    surfaceLight: '#ffffff',
    gradientAngle: 135,
  },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  appearance: {
    defaultTheme: 'dark',
    defaultLang: 'en',
    fontFamily: 'Tajawal',
    brandColor: '#00d2ff',
    brandColor2: '#3a7bd5',
    gradientAngle: 120,
    cardRadiusPx: 16,
    bgDark: '#0a0e17',
    surfaceDark: '#121a28',
    bgLight: '#f4f6fa',
    surfaceLight: '#ffffff',
    backdropStyle: 'mesh',
    cardMaterial: 'solid',
    tabStyle: 'segmented',
    contentWidth: 'normal',
    uiDensity: 'cozy',
    fontSizeScale: 1,
    enableGrain: true,
    showScrollProgress: true,
    enableAnimations: true,
    showThemeBtn: true,
    showLangBtn: true,
    showShareBtn: true,
    tiltCards: true,
    stickyTabs: true,
    cursorGlow: true,
    cursorGlowSizePx: 380,
  },
  security: {
    requirePassword: true,
    password: '1234',
    passwordHint: '',
    rememberSession: true,
  },
  spotlight: {
    enabled: false,
    badgeEn: 'NEW',
    badgeAr: 'جديد',
    textEn: 'Check out my latest Godot devlog & game release!',
    textAr: 'شاهد أحدث حلقة تطوير ألعاب وتجربة الإصدار الجديد!',
    href: 'https://youtube.com/@alaa-dev',
  },
  hero: {
    bannerImage: DEFAULT_PROFILE_BANNER,
    bannerMode: 'image',
    bannerSlides: [DEFAULT_PROFILE_BANNER],
    bannerSlideIntervalSec: 4,
    bannerVideoUrl: '',
    avatarImage: DEFAULT_PROFILE_AVATAR,
    bannerHeightRem: 13.5,
    bannerBlurPx: 0,
    bannerSaturation: 105,
    bannerBrightness: 100,
    bannerPositionY: 50,
    bannerParallax: true,
    bannerParallaxSpeed: 0.38,
    avatarShape: 'circle',
    avatarDesign: 'classic',
    avatarSizeRem: 7.5,
    avatarOffsetRem: -3.75,
    avatarZoom: 1,
    bannerDesign: 'fade-bottom',
    bannerOverlay: 'scrim',
    showVerifiedBadge: true,
    showAvatarStatusDot: true,
    avatarRing: true,
    profileLayout: 'start',
    showHeroGlow: true,
    showProfileBadges: true,
    profileBadge1En: 'Game Dev',
    profileBadge1Ar: 'مطوّر ألعاب',
    profileBadge2En: 'Egypt',
    profileBadge2Ar: 'مصر',
    brandName: 'AlaaDev',
    tagEn: 'Content creator & game developer',
    tagAr: 'صانع محتوى ومطوّر ألعاب',
    tagSuffix: 'egyptian',
    showTagDot: true,
    cornerMark: '</>',
    showCornerMark: true,
  },
  chat: {
    enabled: true,
    labelEn: 'Contact me',
    labelAr: 'تواصل معي',
    headerTitleEn: 'Direct Chat',
    headerTitleAr: 'تواصل معي مباشرة',
    headerSubEn: 'Usually replies quickly',
    headerSubAr: 'متاح للرد على رسائلك',
    welcomeEn: 'Hey there! Have a question, project idea, or collab? Message me here.',
    welcomeAr: 'أهلاً بك! عندك استفسار، فكرة مشروع، أو تعاون؟ اكتب رسالتك هنا وسأرد عليك.',
    availabilityStatus: 'online',
    autoReplyEnabled: false,
    autoReplyDelaySec: 2,
    autoReplyTextEn: 'Thanks for reaching out! I received your message and will get back to you soon.',
    autoReplyTextAr: 'شكراً لتواصلك معي! وصلتني رسالتك وسأرد عليك في أقرب وقت ممكن.',
  },
  tabs: {
    defaultTab: 'personal',
    items: [
      { id: 'personal', labelEn: 'Personal Info', labelAr: 'معلوماتي', visible: true },
      { id: 'socials', labelEn: 'Socials', labelAr: 'التواصل الاجتماعي', visible: true },
    ],
  },
  stories: {
    enabled: true,
    ringStyle: 'instagram',
    autoExpire24hDefault: false,
    highlightsEnabled: true,
    highlights: [
      {
        id: 'hl-dev',
        titleEn: 'Game Dev',
        titleAr: 'تطوير الألعاب',
        coverUrl: DEFAULT_PROFILE_BANNER,
        accentColor: '#00d2ff',
        storyIds: ['story-dev-2'],
        visible: true,
      },
      {
        id: 'hl-updates',
        titleEn: 'Updates',
        titleAr: 'تحديثات',
        coverUrl: DEFAULT_PROFILE_AVATAR,
        accentColor: '#a855f7',
        storyIds: ['story-welcome-1'],
        visible: true,
      },
    ],
    items: [
      {
        id: 'story-welcome-1',
        type: 'text',
        mediaUrl: '',
        bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #00d2ff 100%)',
        captionEn: 'Working on something new & exciting right now! Feel free to message me anytime.',
        captionAr: 'أعمل حالياً على مشروع جديد ومميز! يسعدني تواصلك معي في أي وقت.',
        durationSec: 6,
        createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        visible: true,
      },
      {
        id: 'story-dev-2',
        type: 'image',
        mediaUrl: DEFAULT_PROFILE_BANNER,
        captionEn: 'Late night setup & creative coding vibes.',
        captionAr: 'أجواء البرمجة والتصميم الليلية وتطوير الألعاب.',
        durationSec: 6,
        createdAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
        visible: true,
      },
    ],
  },
  personal: {
    sectionTitleEn: 'Personal Information',
    sectionTitleAr: 'معلوماتي الشخصية',
    showCardHeader: true,
    headlineEn: 'Student & Indie Game Developer',
    headlineAr: 'طالب ومطوّر ألعاب مستقل',
    quoteEn: 'Passionate about building games, learning new tech, and sharing creative projects.',
    quoteAr: 'شغوف بتطوير الألعاب، تعلّم التقنيات الحديثة، ومشاركة المشاريع الإبداعية.',
    showFullName: true,
    fullNameEn: 'Alaa',
    fullNameAr: 'علاء',
    showAge: true,
    ageEn: '16 years old',
    ageAr: '16 سنة',
    showGrade: true,
    gradeEn: '1st Year Secondary (Class A)',
    gradeAr: 'الصف الأول الثانوي — فصل 1/أ',
    showStage: true,
    stageEn: 'High School',
    stageAr: 'المرحلة الثانوية',
    showCountry: true,
    countryEn: 'Egypt',
    countryAr: 'مصر',
    showCity: true,
    cityEn: 'Cairo',
    cityAr: 'القاهرة',
    showSchool: true,
    schoolEn: 'STEM / High School',
    schoolAr: 'المدرسة الثانوية',
    showLanguages: true,
    languagesEn: 'Arabic (Native), English',
    languagesAr: 'العربية، الإنجليزية',
    showBirthdate: false,
    birthdateEn: '2010',
    birthdateAr: '2010',
    showHobbies: true,
    hobbiesTitleEn: 'Hobbies & Interests',
    hobbiesTitleAr: 'الهوايات والاهتمامات',
    hobbiesEn: ['Game Development', 'Programming', 'Content Creation', 'Pixel Art', 'Gaming'],
    hobbiesAr: ['تطوير الألعاب', 'البرمجة', 'صناعة المحتوى', 'الرسم البكسلي', 'الألعاب'],
    customFields: [],
  },
  socials: [
    {
      id: 'social-yt',
      name: 'YouTube',
      subEn: '@alaa-dev',
      subAr: '@alaa-dev',
      href: 'https://youtube.com/@alaa-dev',
      icon: 'youtube',
      accentColor: '#ff4d4d',
      visible: true,
    },
    {
      id: 'social-tt',
      name: 'TikTok',
      subEn: '@alaadev.official',
      subAr: '@alaadev.official',
      href: 'https://tiktok.com/@alaadev.official',
      icon: 'tiktok',
      accentColor: '#00f2fe',
      visible: true,
    },
    {
      id: 'social-dc',
      name: 'Discord',
      subEn: 'Developers & designers community',
      subAr: 'مجتمع المطورين والمصممين',
      href: 'https://discord.gg/Tk43w7xc9c',
      icon: 'discord',
      accentColor: '#5865f2',
      visible: true,
    },
  ],
  footer: {
    visible: true,
    showStatus: true,
    statusDotColor: '#22c55e',
    statusPulse: true,
    statusEn: 'online — building something',
    statusAr: 'متصل — أبني شيئاً ما',
    copyrightName: 'AlaaDev',
    signature: '// made with too much coffee',
    showSignature: true,
  },
};
