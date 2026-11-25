import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Camera,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clapperboard,
  Clock,
  Compass,
  Download,
  Eye,
  EyeOff,
  FileText,
  Film,
  GraduationCap,
  Heart,
  IdCard,
  Image as ImageIcon,
  Inbox,
  KeyRound,
  Layers,
  Lock,
  Menu,
  MessageCircle,
  Mic,
  Monitor,
  Moon,
  Music2,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Redo2,
  Reply,
  RotateCcw,
  Search,
  Send,
  Settings,
  Shapes,
  Share2,
  ShieldCheck,
  Sliders,
  Smartphone,
  SmilePlus,
  Sparkles,
  Square,
  Sun,
  Trash2,
  Type,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import {
  AvatarDesign,
  AvatarShape,
  BackdropStyle,
  BannerDesign,
  BannerOverlay,
  CardMaterial,
  ChatAttachment,
  ChatMessage,
  ChatReplyRef,
  ChatThread,
  ContentWidth,
  DEFAULT_PROFILE_AVATAR,
  DEFAULT_PROFILE_BANNER,
  DEFAULT_SITE_CONFIG,
  FONT_OPTIONS,
  Lang,
  PersonalCustomField,
  PersonalFieldIcon,
  SiteConfig,
  SocialIconType,
  SocialItem,
  StoryHighlight,
  StoryItem,
  StoryMediaType,
  StoryMusic,
  StoryRingStyle,
  THEME_PRESETS,
  TabBarStyle,
  TabId,
  Theme,
  ThemeCategory,
  UiDensity,
} from '../types/siteConfig';
import { formatAudioTime } from '../utils/storyAudio';
import { formatStoryExpiryRemaining, isStoryExpired } from '../utils/storyUtils';
import { ActiveVoiceRecorder, startRealVoiceRecording } from '../utils/voiceRecorder';
import { ChatAttachmentCard } from './ChatAttachmentCard';
import { renderSocialIcon } from './Icons';
import { SiteView } from './SiteView';
import { StoryMusicPicker } from './StoryMusicPicker';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockNow?: () => void;
  config: SiteConfig;
  theme: Theme;
  lang: Lang;
  activeTab: TabId;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onChange: (next: SiteConfig) => void;
  onReset: () => void;
  onPreviewTheme: (theme: Theme) => void;
  onPreviewLang: (lang: Lang) => void;
  onPreviewTab: (tab: TabId) => void;
  onNotify: (msg: string) => void;
  chatThreads: ChatThread[];
  activeVisitorThread: ChatThread | null;
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
  onSendOwnerReply: (
    threadId: string,
    text: string,
    attachment?: ChatAttachment,
    replyTo?: ChatReplyRef
  ) => void;
  onMarkOwnerRead: (threadId: string) => void;
  onDeleteThread: (threadId: string) => void;
  onToggleMessageReaction: (
    threadId: string,
    messageId: string,
    emoji: string,
    by: 'visitor' | 'owner'
  ) => void;
  onEditMessage: (threadId: string, messageId: string, newText: string) => void;
  onDeleteMessage: (threadId: string, messageId: string) => void;
  ownerTyping?: boolean;
}

type SettingsSection =
  | 'profile'
  | 'stories'
  | 'appearance'
  | 'personal'
  | 'socials'
  | 'messages'
  | 'security'
  | 'system';

type ProfileSubTab = 'identity' | 'avatar' | 'banner';
type AppearanceSubTab = 'themes' | 'layout' | 'colors';
type PersonalSubTab = 'fields' | 'hobbies' | 'tabs';

const AVATAR_SHAPE_OPTIONS: { value: AvatarShape; label: string; radiusClass: string; clip?: string }[] = [
  { value: 'circle', label: 'دائري', radiusClass: 'rounded-full' },
  { value: 'squircle', label: 'سكويركل', radiusClass: 'rounded-[28%]' },
  { value: 'rounded', label: 'مربع ناعم', radiusClass: 'rounded-xl' },
  { value: 'arch', label: 'قوس معماري', radiusClass: 'rounded-t-full rounded-b-xl' },
  { value: 'leaf', label: 'ورقة شجر', radiusClass: 'rounded-tl-[44%] rounded-br-[44%] rounded-tr-[14%] rounded-bl-[14%]' },
  { value: 'clover', label: 'جوهرة مائلة', radiusClass: 'rounded-tl-full rounded-br-full rounded-tr-[18%] rounded-bl-[18%]' },
  {
    value: 'hexagon',
    label: 'سداسي',
    radiusClass: 'rounded-none',
    clip: 'polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
  },
  {
    value: 'octagon',
    label: 'مثمن',
    radiusClass: 'rounded-none',
    clip: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
  },
  {
    value: 'diamond',
    label: 'ماسة',
    radiusClass: 'rounded-none',
    clip: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  },
  {
    value: 'shield',
    label: 'درع ملكي',
    radiusClass: 'rounded-none',
    clip: 'polygon(50% 0%, 96% 14%, 92% 64%, 50% 100%, 8% 64%, 4% 14%)',
  },
  {
    value: 'starburst',
    label: 'ختم نجمي',
    radiusClass: 'rounded-none',
    clip: 'polygon(50% 0%, 63% 12%, 80% 6%, 84% 24%, 98% 35%, 91% 52%, 98% 68%, 84% 79%, 80% 94%, 63% 89%, 50% 100%, 37% 89%, 20% 94%, 16% 79%, 2% 68%, 9% 52%, 2% 35%, 16% 24%, 20% 6%, 37% 12%)',
  },
  {
    value: 'pentagon',
    label: 'خماسي',
    radiusClass: 'rounded-none',
    clip: 'polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)',
  },
];

const AVATAR_DESIGN_OPTIONS: { value: AvatarDesign; label: string; desc: string }[] = [
  { value: 'classic', label: 'كلاسيكي', desc: 'إطار فيسبوك الأنيق' },
  { value: 'neon', label: 'نيون متوهج', desc: 'إضاءة ساطعة حول الصورة' },
  { value: 'glass', label: 'زجاجي', desc: 'إطار شفاف ضبابي مزدوج' },
  { value: 'gradient-spin', label: 'تدرج ملكي', desc: 'حلقة متعددة الألوان' },
  { value: 'double-halo', label: 'هالة مزدوجة', desc: 'حلقتان متباعدتان أنيقتان' },
  { value: 'gold-luxe', label: 'ذهبي فاخر', desc: 'برواز ذهبي معدني لامع' },
  { value: 'cyber-glitch', label: 'سايبر جليتش', desc: 'إزاحة لونية سيان ونيون' },
  { value: 'aurora-glow', label: 'شفق قطبي', desc: 'طيف زمردي وأزرق وبنفسجي' },
  { value: 'shadow-3d', label: 'ظل ثلاثي', desc: 'عمق بارز وإطار متوهج' },
  { value: 'minimal', label: 'بسيط', desc: 'حافة رفيعة هادئة' },
];

const BANNER_DESIGN_OPTIONS: { value: BannerDesign; label: string; desc: string }[] = [
  { value: 'fade-bottom', label: 'تدرج ظلال من أسفل لأعلى', desc: 'تلاشي وظلال متدرجة تندمج مع الخلفية' },
  { value: 'classic', label: 'فيسبوك الكلاسيكي', desc: 'غلاف مستطيل بحواف ناعمة' },
  { value: 'card', label: 'بطاقة مدمجة', desc: 'البانر والاسم داخل بطاقة واحدة' },
  { value: 'wave', label: 'قصّة موجية', desc: 'حافة سفلية مموجة عصرية' },
  { value: 'double-wave', label: 'موجة مزدوجة', desc: 'طبقتان من الأمواج المتدرجة' },
  { value: 'angled', label: 'قصّة مائلة', desc: 'انحناء قطري ديناميكي' },
  { value: 'chevron', label: 'سهم V حاد', desc: 'قصّة هندسية متناظرة للوسط' },
  { value: 'notched', label: 'قوس منحنٍ', desc: 'تقوّس ناعم أسفل الغلاف' },
  { value: 'arch-top', label: 'قوس علوي', desc: 'أركان علوية مقوسة بشكل فخم' },
  { value: 'framed', label: 'إطار متدرج', desc: 'برواز ملون حول الغلاف' },
  { value: 'cyber-corners', label: 'زوايا سايبر', desc: 'زوايا مقطوعة بأسلوب تقني' },
  { value: 'split-glow', label: 'خط مضيء سفلي', desc: 'شريط إضاءة بارز أسفل البانر' },
  { value: 'floating', label: 'بطاقة عائمة 3D', desc: 'عمق ثلاثي وظل سينمائي' },
  { value: 'polaroid', label: 'إطار بولارويد', desc: 'إطار صورة فوتوغرافية بارز' },
];

const BANNER_OVERLAY_OPTIONS: { value: BannerOverlay; label: string }[] = [
  { value: 'scrim', label: 'تظليل ناعم' },
  { value: 'bottom-fade', label: 'ظل سفلي عميق' },
  { value: 'gradient', label: 'صبغة الثيم' },
  { value: 'duotone', label: 'ثنائي اللون' },
  { value: 'grid', label: 'شبكة تقنية' },
  { value: 'scanlines', label: 'خطوط CRT' },
  { value: 'vignette', label: 'سينمائي' },
  { value: 'clean', label: 'صافي' },
];

const PERSONAL_ICON_OPTIONS: { value: PersonalFieldIcon; label: string }[] = [
  { value: 'user', label: 'شخصي' },
  { value: 'cake', label: 'عمر' },
  { value: 'graduation', label: 'دراسة' },
  { value: 'book', label: 'فصل' },
  { value: 'globe', label: 'دولة' },
  { value: 'map', label: 'موقع' },
  { value: 'building', label: 'مدرسة' },
  { value: 'languages', label: 'لغات' },
  { value: 'calendar', label: 'تاريخ' },
  { value: 'sparkles', label: 'مميز' },
];

const STATUS_PRESETS = [
  {
    label: 'متصل — أبني شيئاً ما',
    en: 'online — building something',
    ar: 'متصل — أبني شيئاً ما',
    color: '#22c55e',
  },
  {
    label: 'أطوّر لعبة جديدة',
    en: 'coding a new indie game',
    ar: 'أطوّر لعبة مستقلة جديدة',
    color: '#00d2ff',
  },
  {
    label: 'متاح للتعاون والإعلان',
    en: 'open for collabs & ads',
    ar: 'متاح للتعاون والإعلانات',
    color: '#a855f7',
  },
  {
    label: 'في استراحة قهوة',
    en: 'coffee break — back soon',
    ar: 'في استراحة قهوة — أعود قريباً',
    color: '#f59e0b',
  },
];

const SOCIAL_ICON_OPTIONS: { value: SocialIconType; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'discord', label: 'Discord' },
  { value: 'github', label: 'GitHub' },
  { value: 'instagram', label: 'Insta' },
  { value: 'twitter', label: 'X' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'globe', label: 'Web' },
];

const QUICK_SEARCH_INDEX: {
  label: string;
  keywords: string;
  section: SettingsSection;
  subTab?: string;
  previewTab?: TabId;
}[] = [
  { label: 'الصورة الشخصية، البانر والهوية', keywords: 'صورة بروفايل بانر غلاف فيسبوك اسم توثيق شارة avatar banner cover brand verified', section: 'profile', subTab: 'identity' },
  { label: 'أشكال وإطارات الصورة الشخصية (12 شكل + 10 تصاميم)', keywords: 'شكل ديزاين قصه سداسي ماسة درع حجم تقريب shape frame zoom size', section: 'profile', subTab: 'avatar' },
  { label: 'تصميم البانر وتدرج الظلال والفلاتر', keywords: 'بانر غلاف تدرج ظلال fade bottom blur saturation brightness', section: 'profile', subTab: 'banner' },
  { label: 'نظام القصص والحالات (Stories - إنستجرام وتيك توك)', keywords: 'قصة قصص حالة حالات ستوري انستجرام تيك توك حلقة stories story status ring', section: 'stories' },
  { label: 'معرض الثيمات الجاهزة (50 ثيم)', keywords: 'الوان لون ثيم ثيمات نيون فاخر فاتح داكن theme presets', section: 'appearance', subTab: 'themes' },
  { label: 'هندسة الواجهة، الخامات، الزجاج والكثافة', keywords: 'خلفية زجاج شريط التمرير كثافة عرض تبويبات glass backdrop density width progress', section: 'appearance', subTab: 'layout' },
  { label: 'الألوان المخصصة والخطوط', keywords: 'خط خطوط تدرج لون مخصص font color gradient', section: 'appearance', subTab: 'colors' },
  { label: 'معلوماتي الشخصية (الاسم، العمر، الصف، البلد)', keywords: 'معلومات شخصية اسمي عمري فصلي مرحلة دراسية بلد الاقامة school age grade country', section: 'personal', subTab: 'fields', previewTab: 'personal' },
  { label: 'الهوايات والحقول الشخصية المخصصة', keywords: 'هوايات اهتمامات حقل مخصص hobbies custom fields', section: 'personal', subTab: 'hobbies', previewTab: 'personal' },
  { label: 'إدارة التبويبين (معلوماتي / التواصل الاجتماعي)', keywords: 'تبويبات ترتيب اخفاء مسميات tabs order visibility', section: 'personal', subTab: 'tabs' },
  { label: 'روابط التواصل الاجتماعي', keywords: 'يوتيوب تيك توك ديسكورد تواصل socials links', section: 'socials', previewTab: 'socials' },
  { label: 'صندوق الرسائل والرد على الزوار', keywords: 'رسائل شات محادثة صندوق الوارد تواصل معي inbox chat reply', section: 'messages' },
  { label: 'الأمان وحماية الإعدادات بكلمة المرور', keywords: 'كلمة سر باسورد قفل امان حماية password lock security', section: 'security' },
  { label: 'الحالة المتصلة، التذييل والنسخ الاحتياطي', keywords: 'حالة تذييل تصدير استيراد footer json backup reset', section: 'system' },
];

function SettingGroupCard({
  title,
  subtitle,
  icon,
  rightSlot,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#0b101b] p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4 border-b border-white/[0.07] pb-4 sm:pb-5">
        <div className="flex items-start gap-3 sm:gap-3.5 min-w-0">
          {icon && (
            <div className="mt-0.5 flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#00d2ff]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h3 className="text-[13px] sm:text-sm font-extrabold text-white tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] sm:text-xs text-slate-400 mt-1 sm:mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightSlot}
      </div>
      {children}
    </section>
  );
}

function SettingSwitch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-white/[0.07] bg-[#070b14] px-3.5 py-3 sm:px-5 sm:py-4 transition-colors hover:border-white/15">
      <div className="min-w-0">
        <div className="text-xs sm:text-[13px] font-bold text-slate-100 leading-snug">{label}</div>
        {hint && <div className="text-[11px] text-slate-400 mt-1 sm:mt-1.5 leading-relaxed">{hint}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00d2ff] ${
          checked
            ? 'bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] shadow-[0_0_12px_rgba(0,210,255,0.28)]'
            : 'bg-white/15'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? '-translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (val: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 sm:gap-1.5 rounded-2xl border border-white/[0.08] bg-[#060912] p-1 sm:p-1.5">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 min-w-[92px] sm:min-w-[115px] inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              active
                ? 'bg-white/[0.11] text-white border border-white/15 shadow-xs'
                : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-white/[0.04]'
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function RangeSliderField({
  label,
  valueText,
  min,
  max,
  step = 1,
  value,
  onChange,
}: {
  label: string;
  valueText: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#070b14] p-3.5 sm:p-5 space-y-2.5 sm:space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-300">{label}</span>
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] font-bold text-[#00d2ff] tabular-nums">
          {valueText}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#00d2ff] cursor-pointer"
      />
    </div>
  );
}

function ColorSwatchInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#070b14] p-3.5 sm:p-5">
      <div className="text-[11px] font-semibold text-slate-400 mb-3">{label}</div>
      <div className="flex items-center gap-2.5">
        <label className="relative h-9 w-10 shrink-0 overflow-hidden rounded-lg border border-white/15 cursor-pointer shadow-inner">
          <span className="absolute inset-0" style={{ backgroundColor: value }} />
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="opacity-0 h-full w-full cursor-pointer"
          />
        </label>
        <input
          type="text"
          dir="ltr"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-full rounded-lg border border-white/[0.08] bg-[#04070d] px-2.5 text-xs font-mono text-slate-100 focus:border-[#00d2ff] focus:outline-none"
        />
      </div>
    </div>
  );
}

export function SettingsModal({
  isOpen,
  onClose,
  onLockNow,
  config,
  theme,
  lang,
  activeTab,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onChange,
  onReset,
  onPreviewTheme,
  onPreviewLang,
  onPreviewTab,
  onNotify,
  chatThreads,
  activeVisitorThread,
  chatOpen,
  onToggleChatOpen,
  onSendVisitorMessage,
  onStartNewChatSession,
  onMarkVisitorRead,
  onSendOwnerReply,
  onMarkOwnerRead,
  onDeleteThread,
  onToggleMessageReaction,
  onEditMessage,
  onDeleteMessage,
  ownerTyping = false,
}: SettingsModalProps) {
  const [section, setSection] = useState<SettingsSection>('profile');
  const [profileSubTab, setProfileSubTab] = useState<ProfileSubTab>('identity');
  const [appearanceSubTab, setAppearanceSubTab] = useState<AppearanceSubTab>('themes');
  const [personalSubTab, setPersonalSubTab] = useState<PersonalSubTab>('fields');
  const [messagesSubTab, setMessagesSubTab] = useState<'inbox' | 'chatSettings'>('inbox');

  const [showLivePreview, setShowLivePreview] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<'editor' | 'preview'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [expandedSocialId, setExpandedSocialId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newHobbyAr, setNewHobbyAr] = useState('');
  const [newHobbyEn, setNewHobbyEn] = useState('');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light' | ThemeCategory>('all');
  const [themeSearch, setThemeSearch] = useState('');
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showSecurityPasswords, setShowSecurityPasswords] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [importError, setImportError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [exportedFeedback, setExportedFeedback] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [ownerReplyingTo, setOwnerReplyingTo] = useState<ChatReplyRef | null>(null);
  const [ownerReactionMsgId, setOwnerReactionMsgId] = useState<string | null>(null);
  const [ownerEditingMsgId, setOwnerEditingMsgId] = useState<string | null>(null);
  const [ownerEditingDraft, setOwnerEditingDraft] = useState('');
  const [ownerConfirmDeleteMsgId, setOwnerConfirmDeleteMsgId] = useState<string | null>(null);
  const [isOwnerRecording, setIsOwnerRecording] = useState(false);
  const [ownerRecordSec, setOwnerRecordSec] = useState(0);
  const [ownerMicLevel, setOwnerMicLevel] = useState(24);
  const [newBannerSlideUrl, setNewBannerSlideUrl] = useState('');
  const [newStoryType, setNewStoryType] = useState<StoryMediaType>('text');
  const [newStoryUrl, setNewStoryUrl] = useState('');
  const [newStoryGradient, setNewStoryGradient] = useState(
    'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #00d2ff 100%)'
  );
  const [newStoryCaptionAr, setNewStoryCaptionAr] = useState('');
  const [newStoryCaptionEn, setNewStoryCaptionEn] = useState('');
  const [newStoryDuration, setNewStoryDuration] = useState(6);
  const [newStoryAutoExpire, setNewStoryAutoExpire] = useState(
    () => config.stories.autoExpire24hDefault ?? false
  );
  const [newStoryMusic, setNewStoryMusic] = useState<StoryMusic | undefined>(undefined);
  const [expandedMusicStoryId, setExpandedMusicStoryId] = useState<string | null>(null);
  const [newHlTitleAr, setNewHlTitleAr] = useState('');
  const [newHlTitleEn, setNewHlTitleEn] = useState('');
  const [newHlCoverUrl, setNewHlCoverUrl] = useState('');
  const [newHlAccentColor, setNewHlAccentColor] = useState(config.appearance.brandColor);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const ownerAttachInputRef = useRef<HTMLInputElement | null>(null);
  const ownerReplyInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const ownerVoiceRecorderRef = useRef<ActiveVoiceRecorder | null>(null);

  useEffect(() => {
    return () => {
      ownerVoiceRecorderRef.current?.cancel();
      ownerVoiceRecorderRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileNavOpen) {
          setMobileNavOpen(false);
          return;
        }
        onClose();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          if (canRedo) {
            e.preventDefault();
            onRedo();
          }
        } else if (canUndo) {
          e.preventDefault();
          onUndo();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, mobileNavOpen, onClose, canUndo, canRedo, onUndo, onRedo]);

  useEffect(() => {
    if (chatThreads.length === 0) {
      setSelectedThreadId(null);
      return;
    }
    if (!selectedThreadId || !chatThreads.some((t) => t.id === selectedThreadId)) {
      setSelectedThreadId(chatThreads[0].id);
    }
  }, [chatThreads, selectedThreadId]);

  useEffect(() => {
    setOwnerReplyingTo(null);
    setOwnerReactionMsgId(null);
    setOwnerEditingMsgId(null);
    setOwnerConfirmDeleteMsgId(null);
  }, [selectedThreadId]);

  useEffect(() => {
    if (section === 'messages' && messagesSubTab === 'inbox' && selectedThreadId) {
      const th = chatThreads.find((t) => t.id === selectedThreadId);
      if (th && th.messages.some((m) => m.sender === 'visitor' && !m.readByOwner)) {
        onMarkOwnerRead(selectedThreadId);
      }
    }
  }, [section, messagesSubTab, selectedThreadId, chatThreads, onMarkOwnerRead]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return QUICK_SEARCH_INDEX.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  const filteredThemes = useMemo(() => {
    const q = themeSearch.trim().toLowerCase();
    return THEME_PRESETS.filter((preset) => {
      const matchesFilter =
        themeFilter === 'all' ||
        preset.mode === themeFilter ||
        preset.category === themeFilter;
      const matchesSearch =
        !q ||
        preset.name.toLowerCase().includes(q) ||
        preset.id.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [themeFilter, themeSearch]);

  if (!isOpen) return null;

  const totalUnreadForOwner = chatThreads.reduce(
    (sum, t) => sum + t.messages.filter((m) => m.sender === 'visitor' && !m.readByOwner).length,
    0
  );

  const navGroups: {
    groupTitle: string;
    items: {
      id: SettingsSection;
      label: string;
      icon: typeof Sparkles;
      count?: number;
      badgeHot?: boolean;
    }[];
  }[] = [
    {
      groupTitle: 'الهوية والمظهر',
      items: [
        { id: 'profile', label: 'الملف الشخصي والبانر', icon: ImageIcon },
        {
          id: 'stories',
          label: 'القصص والحالات (Stories)',
          icon: Clapperboard,
          count: config.stories.items.filter((s) => s.visible).length,
        },
        {
          id: 'appearance',
          label: 'الثيمات والخطوط',
          icon: Palette,
          count: THEME_PRESETS.length,
        },
      ],
    },
    {
      groupTitle: 'الأقسام المعتمدة',
      items: [
        {
          id: 'personal',
          label: 'معلوماتي الشخصية',
          icon: IdCard,
        },
        {
          id: 'socials',
          label: 'التواصل الاجتماعي',
          icon: Share2,
          count: config.socials.length,
        },
      ],
    },
    {
      groupTitle: 'التواصل والأمان',
      items: [
        {
          id: 'messages',
          label: 'صندوق الرسائل والشات',
          icon: Inbox,
          count: totalUnreadForOwner > 0 ? totalUnreadForOwner : chatThreads.length,
          badgeHot: totalUnreadForOwner > 0,
        },
        { id: 'security', label: 'الأمان وكلمة المرور', icon: Lock },
        { id: 'system', label: 'التذييل والنسخ الاحتياطي', icon: Sliders },
      ],
    },
  ];

  const moveItem = <T,>(arr: T[], index: number, dir: -1 | 1): T[] => {
    const nextIdx = index + dir;
    if (nextIdx < 0 || nextIdx >= arr.length) return arr;
    const copy = [...arr];
    const [removed] = copy.splice(index, 1);
    copy.splice(nextIdx, 0, removed);
    return copy;
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alaadev-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportedFeedback(true);
    window.setTimeout(() => setExportedFeedback(false), 1800);
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as SiteConfig;
        if (!parsed.hero || !parsed.appearance || !parsed.personal) {
          setImportError('ملف الإعدادات غير صالح أو ناقص.');
          return;
        }
        setImportError('');
        onChange(parsed);
      } catch {
        setImportError('تعذر قراءة الملف. تأكد أنه بصيغة JSON صحيحة.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleHeroImageUpload = (
    field: 'bannerImage' | 'avatarImage',
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      onChange({
        ...config,
        hero: {
          ...config.hero,
          [field]: dataUrl,
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleNewStoryUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      onNotify('يفضل اختيار ملف أصغر من 3.5 ميجابايت لضمان حفظه في المتصفح.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) setNewStoryUrl(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePublishStory = (e: FormEvent) => {
    e.preventDefault();
    if (newStoryType !== 'text' && !newStoryUrl.trim()) {
      onNotify('يرجى رفع ملف أو لصق رابط القصة أولاً.');
      return;
    }
    if (newStoryType === 'text' && !newStoryCaptionAr.trim() && !newStoryCaptionEn.trim()) {
      onNotify('يرجى كتابة نص الحالة أولاً.');
      return;
    }
    const nextStory: StoryItem = {
      id: `story-${Date.now()}`,
      type: newStoryType,
      mediaUrl: newStoryType === 'text' ? '' : newStoryUrl.trim(),
      bgGradient: newStoryType === 'text' ? newStoryGradient : undefined,
      captionAr: newStoryCaptionAr.trim() || newStoryCaptionEn.trim(),
      captionEn: newStoryCaptionEn.trim() || newStoryCaptionAr.trim(),
      durationSec: newStoryDuration,
      createdAt: new Date().toISOString(),
      expiresAt: newStoryAutoExpire
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : undefined,
      visible: true,
      music: newStoryMusic,
    };
    onChange({
      ...config,
      stories: {
        ...config.stories,
        enabled: true,
        items: [nextStory, ...config.stories.items],
      },
    });
    setNewStoryUrl('');
    setNewStoryCaptionAr('');
    setNewStoryCaptionEn('');
    setNewStoryMusic(undefined);
    onNotify('تم نشر القصة وإضافتها إلى صورتك الشخصية!');
  };

  const handleHighlightCoverUpload = (
    highlightId: string | null,
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      if (highlightId === null) {
        setNewHlCoverUrl(dataUrl);
      } else {
        onChange({
          ...config,
          stories: {
            ...config.stories,
            highlights: (config.stories.highlights ?? []).map((hl) =>
              hl.id === highlightId ? { ...hl, coverUrl: dataUrl } : hl
            ),
          },
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateHighlight = (e: FormEvent) => {
    e.preventDefault();
    const ar = newHlTitleAr.trim();
    const en = newHlTitleEn.trim();
    if (!ar && !en) {
      onNotify('يرجى إدخال اسم ألبوم القصص أولاً.');
      return;
    }
    const nextHighlight: StoryHighlight = {
      id: `hl-${Date.now()}`,
      titleAr: ar || en,
      titleEn: en || ar,
      coverUrl: newHlCoverUrl.trim() || config.hero.avatarImage,
      accentColor: newHlAccentColor || config.appearance.brandColor,
      storyIds: config.stories.items[0] ? [config.stories.items[0].id] : [],
      visible: true,
    };
    onChange({
      ...config,
      stories: {
        ...config.stories,
        highlightsEnabled: true,
        highlights: [...(config.stories.highlights ?? []), nextHighlight],
      },
    });
    setNewHlTitleAr('');
    setNewHlTitleEn('');
    setNewHlCoverUrl('');
    onNotify('تم إنشاء ألبوم قصص دائم جديد!');
  };

  const buildOwnerReplyRef = (msg: ChatMessage): ChatReplyRef => {
    let attachmentLabel: string | undefined;
    if (msg.attachment?.type === 'audio') {
      attachmentLabel = '🎙️ رسالة صوتية';
    } else if (msg.attachment?.type === 'file') {
      attachmentLabel = `📎 ${msg.attachment.fileName}`;
    } else if (msg.attachment?.type === 'link') {
      attachmentLabel = `🔗 ${msg.attachment.title}`;
    }
    return {
      messageId: msg.id,
      sender: msg.sender,
      text: msg.text,
      attachmentLabel,
    };
  };

  const scrollToOwnerMsg = (messageId: string) => {
    const el = document.getElementById(`owner-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleOwnerReplySubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyDraft.trim()) return;
    onSendOwnerReply(selectedThreadId, replyDraft.trim(), undefined, ownerReplyingTo ?? undefined);
    setReplyDraft('');
    setOwnerReplyingTo(null);
  };

  const handleOwnerFileAttach = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedThreadId) return;
    const sizeLabel =
      file.size < 1024
        ? `${Math.max(1, file.size)}B`
        : file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)}KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)}MB`;
    const reader = new FileReader();
    reader.onload = () => {
      onSendOwnerReply(
        selectedThreadId,
        '',
        {
          type: 'file',
          fileName: file.name,
          fileSize: sizeLabel,
          fileUrl: String(reader.result || '') || undefined,
        },
        ownerReplyingTo ?? undefined
      );
      setOwnerReplyingTo(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerSlideUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      onChange({
        ...config,
        hero: {
          ...config.hero,
          bannerSlides: [...(config.hero.bannerSlides ?? []), dataUrl],
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBannerVideoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3.5 * 1024 * 1024) {
      onNotify('يفضل اختيار فيديو أصغر من 3.5 ميجابايت لضمان حفظه في المتصفح.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (!dataUrl) return;
      onChange({
        ...config,
        hero: {
          ...config.hero,
          bannerMode: 'video',
          bannerVideoUrl: dataUrl,
        },
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartOwnerVoiceRecord = async () => {
    if (!selectedThreadId) return;
    setOwnerRecordSec(0);
    setOwnerMicLevel(24);
    try {
      const active = await startRealVoiceRecording((sec, level) => {
        setOwnerRecordSec(sec);
        setOwnerMicLevel(level);
      });
      ownerVoiceRecorderRef.current = active;
      setIsOwnerRecording(true);
    } catch {
      setIsOwnerRecording(false);
      onNotify('تعذر الوصول إلى الميكروفون. يرجى السماح بصلاحية المايك في المتصفح.');
    }
  };

  const handleCancelOwnerVoiceRecord = () => {
    ownerVoiceRecorderRef.current?.cancel();
    ownerVoiceRecorderRef.current = null;
    setIsOwnerRecording(false);
    setOwnerRecordSec(0);
  };

  const handleStopAndSendOwnerVoiceRecord = async () => {
    const active = ownerVoiceRecorderRef.current;
    ownerVoiceRecorderRef.current = null;
    setIsOwnerRecording(false);
    setOwnerRecordSec(0);
    if (!active || !selectedThreadId) return;
    const result = await active.stopAndSave();
    if (result) {
      onSendOwnerReply(
        selectedThreadId,
        '',
        {
          type: 'audio',
          durationSec: result.durationSec,
          audioUrl: result.audioUrl,
          waveform: result.waveform,
        },
        ownerReplyingTo ?? undefined
      );
      setOwnerReplyingTo(null);
    }
  };

  const selectedThread = chatThreads.find((t) => t.id === selectedThreadId) ?? null;

  const addSocial = () => {
    const id = `social-${Date.now()}`;
    const nextItem: SocialItem = {
      id,
      name: 'GitHub',
      subEn: '@username',
      subAr: '@username',
      href: 'https://github.com',
      icon: 'github',
      accentColor: config.appearance.brandColor,
      visible: true,
    };
    onChange({ ...config, socials: [...config.socials, nextItem] });
    setExpandedSocialId(id);
    onPreviewTab('socials');
  };

  const addPersonalCustomField = () => {
    const id = `pf-${Date.now()}`;
    const nextField: PersonalCustomField = {
      id,
      labelEn: 'Custom Info',
      labelAr: 'معلومة إضافية',
      valueEn: 'Details here',
      valueAr: 'التفاصيل هنا',
      icon: 'sparkles',
      visible: true,
    };
    onChange({
      ...config,
      personal: {
        ...config.personal,
        customFields: [...config.personal.customFields, nextField],
      },
    });
    onPreviewTab('personal');
  };

  const addHobbyTag = () => {
    const ar = newHobbyAr.trim();
    const en = newHobbyEn.trim();
    if (!ar && !en) return;
    onChange({
      ...config,
      personal: {
        ...config.personal,
        hobbiesAr: ar ? [...config.personal.hobbiesAr, ar] : config.personal.hobbiesAr,
        hobbiesEn: en ? [...config.personal.hobbiesEn, en] : config.personal.hobbiesEn,
      },
    });
    setNewHobbyAr('');
    setNewHobbyEn('');
  };

  const passwordStrength = (() => {
    const p = newPasswordInput.trim();
    if (!p) return 0;
    let score = 0;
    if (p.length >= 4) score += 1;
    if (p.length >= 8) score += 1;
    if (/[A-Z]/.test(p) || /[^a-zA-Z0-9]/.test(p)) score += 1;
    if (/[0-9]/.test(p) && /[a-zA-Z]/.test(p)) score += 1;
    return Math.min(4, Math.max(1, score));
  })();

  const inputClass =
    'h-11 w-full rounded-xl border border-white/[0.09] bg-[#060912] px-3.5 text-xs sm:text-[13px] text-white placeholder:text-slate-500 focus:border-[#00d2ff] focus:ring-2 focus:ring-[#00d2ff]/15 focus:outline-none transition-all';
  const labelClass = 'block text-xs font-semibold text-slate-300 mb-2';

  const corePersonalFields: {
    key: string;
    title: string;
    showKey: keyof typeof config.personal;
    arKey: keyof typeof config.personal;
    enKey: keyof typeof config.personal;
  }[] = [
    { key: 'fullName', title: 'الاسم الكامل', showKey: 'showFullName', arKey: 'fullNameAr', enKey: 'fullNameEn' },
    { key: 'age', title: 'العمر', showKey: 'showAge', arKey: 'ageAr', enKey: 'ageEn' },
    { key: 'grade', title: 'الفصل / الصف الدراسي', showKey: 'showGrade', arKey: 'gradeAr', enKey: 'gradeEn' },
    { key: 'stage', title: 'المرحلة الدراسية', showKey: 'showStage', arKey: 'stageAr', enKey: 'stageEn' },
    { key: 'country', title: 'بلد الإقامة', showKey: 'showCountry', arKey: 'countryAr', enKey: 'countryEn' },
    { key: 'city', title: 'المدينة / المحافظة', showKey: 'showCity', arKey: 'cityAr', enKey: 'cityEn' },
    { key: 'school', title: 'المدرسة / الجامعة', showKey: 'showSchool', arKey: 'schoolAr', enKey: 'schoolEn' },
    { key: 'languages', title: 'اللغات', showKey: 'showLanguages', arKey: 'languagesAr', enKey: 'languagesEn' },
    { key: 'birthdate', title: 'سنة / تاريخ الميلاد', showKey: 'showBirthdate', arKey: 'birthdateAr', enKey: 'birthdateEn' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      dir="rtl"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#020409]/92 backdrop-blur-2xl lg:p-4 text-slate-100"
    >
      {/* Main Elevated Control Studio */}
      <div
        className="alaa-pop-in flex flex-col w-full h-full max-w-[1540px] lg:rounded-3xl border border-white/[0.09] bg-[#070b14] shadow-[0_32px_100px_rgba(0,0,0,0.88)] overflow-hidden"
      >
        {/* Top Command Header */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between gap-2 sm:gap-3 border-b border-white/[0.08] bg-[#0a0f1c] px-3 sm:px-6 z-20">
          {/* Brand & Title + Sidebar Collapsible Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label={mobileNavOpen ? 'إغلاق قائمة الأقسام' : 'فتح قائمة الأقسام'}
              aria-expanded={mobileNavOpen}
              className="md:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.1] bg-[#050810] text-slate-200 hover:border-[#00d2ff]/50 hover:text-[#00d2ff] cursor-pointer transition-colors"
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              title={sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              aria-label={sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
              aria-expanded={!sidebarCollapsed}
              className="hidden md:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.09] bg-[#050810] text-slate-300 hover:border-[#00d2ff]/50 hover:text-[#00d2ff] cursor-pointer transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PanelRightClose className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
            <div
              className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-[#070b14] shadow-[0_6px_18px_rgba(0,210,255,0.28)]"
              style={{
                background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
              }}
            >
              <Settings className="h-4.5 w-4.5 sm:h-5 sm:w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2
                  id="settings-title"
                  className="text-xs sm:text-base font-extrabold truncate text-white"
                >
                  استوديو الإعدادات
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>حفظ تلقائي</span>
                </span>
              </div>
              <p className="hidden md:block text-[11px] text-slate-400 truncate mt-0.5">
                إدارة الملف الشخصي، الثيمات، معلوماتك، التواصل، والرسائل
              </p>
            </div>
          </div>

          {/* Center: Command Search */}
          <div className="relative hidden md:block w-64 lg:w-96">
            <Search
              className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أي إعداد... (صورة، ثيم، كلمة سر)"
              className="h-10 w-full rounded-xl border border-white/[0.09] bg-[#050810] pr-10 pl-12 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#00d2ff] focus:outline-none"
            />
            <kbd className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              ⌘K
            </kbd>
            {searchResults.length > 0 && (
              <div className="absolute top-12 inset-x-0 rounded-2xl border border-white/15 bg-[#0b1220] p-1.5 shadow-2xl z-40 space-y-0.5">
                {searchResults.map((res) => (
                  <button
                    key={res.label}
                    type="button"
                    onClick={() => {
                      setSection(res.section);
                      if (res.section === 'profile' && res.subTab) {
                        setProfileSubTab(res.subTab as ProfileSubTab);
                      }
                      if (res.section === 'appearance' && res.subTab) {
                        setAppearanceSubTab(res.subTab as AppearanceSubTab);
                      }
                      if (res.section === 'personal' && res.subTab) {
                        setPersonalSubTab(res.subTab as PersonalSubTab);
                      }
                      if (res.previewTab) onPreviewTab(res.previewTab);
                      setSearchQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-right text-xs font-semibold text-slate-200 hover:bg-white/[0.06] hover:text-white cursor-pointer"
                  >
                    <span>{res.label}</span>
                    <Compass className="h-3.5 w-3.5 text-[#00d2ff] shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Mobile Switch */}
            <div className="flex lg:hidden items-center gap-0.5 rounded-xl border border-white/10 bg-[#050810] p-0.5 sm:p-1">
              <button
                type="button"
                onClick={() => {
                  setMobilePane('editor');
                }}
                className={`rounded-lg px-2 sm:px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  mobilePane === 'editor' ? 'bg-white/12 text-white' : 'text-slate-400'
                }`}
              >
                الإعدادات
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobilePane('preview');
                  setMobileNavOpen(false);
                }}
                className={`rounded-lg px-2 sm:px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                  mobilePane === 'preview' ? 'bg-white/12 text-white' : 'text-slate-400'
                }`}
              >
                المعاينة
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowLivePreview((prev) => !prev)}
              title={showLivePreview ? 'إخفاء المعاينة الجانبية' : 'إظهار المعاينة الجانبية'}
              className={`hidden lg:inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors ${
                showLivePreview
                  ? 'border-[#00d2ff]/40 bg-[#00d2ff]/12 text-[#00d2ff]'
                  : 'border-white/[0.09] bg-[#050810] text-slate-300 hover:border-white/25'
              }`}
            >
              {showLivePreview ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeftOpen className="h-4 w-4" />
              )}
              <span>المعاينة الحية</span>
            </button>

            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                title="تراجع (Ctrl+Z)"
                aria-label="تراجع"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-[#050810] text-slate-300 disabled:opacity-30 hover:border-[#00d2ff]/50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title="إعادة (Ctrl+Shift+Z)"
                aria-label="إعادة"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.09] bg-[#050810] text-slate-300 disabled:opacity-30 hover:border-[#00d2ff]/50 cursor-pointer disabled:cursor-not-allowed"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            {config.security.requirePassword && onLockNow && (
              <button
                type="button"
                onClick={onLockNow}
                title="قفل لوحة الإعدادات الآن"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-2.5 sm:px-3 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer whitespace-nowrap"
              >
                <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">قفل</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl px-2.5 sm:px-4 text-xs font-extrabold text-[#070b14] shadow-[0_4px_14px_rgba(0,210,255,0.25)] hover:opacity-95 cursor-pointer whitespace-nowrap"
              style={{
                background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
              }}
            >
              <span className="hidden xs:inline sm:inline">إغلاق</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        {/* Mobile Compact Section & Undo Bar (replaces fixed sidebar on small screens to maximize workspace) */}
        {mobilePane === 'editor' && (
          <div className="md:hidden flex items-center justify-between gap-2 border-b border-white/[0.06] bg-[#060a13] px-3 py-2 shrink-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.09] bg-[#0b101b] px-3 py-1.5 text-xs font-bold text-slate-100 hover:border-[#00d2ff]/40 cursor-pointer min-w-0"
            >
              {(() => {
                const activeNavItem = navGroups
                  .flatMap((g) => g.items)
                  .find((i) => i.id === section);
                const ActiveIcon = activeNavItem?.icon ?? Settings;
                return (
                  <>
                    <ActiveIcon className="h-3.5 w-3.5 text-[#00d2ff] shrink-0" aria-hidden="true" />
                    <span className="truncate">{activeNavItem?.label ?? 'الأقسام'}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                  </>
                );
              })()}
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {totalUnreadForOwner > 0 && section !== 'messages' && (
                <button
                  type="button"
                  onClick={() => setSection('messages')}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/35 px-2 text-[11px] font-bold text-rose-300 cursor-pointer"
                >
                  <Inbox className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{totalUnreadForOwner}</span>
                </button>
              )}
              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="تراجع"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-[#0b101b] text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="إعادة"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.09] bg-[#0b101b] text-slate-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile Collapsible Navigation Drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-40 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
            />
            <nav
              aria-label="أقسام الإعدادات"
              className="relative z-10 flex h-full w-[285px] max-w-[85vw] flex-col justify-between border-l border-white/[0.1] bg-[#060912] p-4 shadow-2xl overflow-y-auto alaa-scroll-thin"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.07]">
                  <span className="text-xs font-extrabold text-white">أقسام لوحة التحكم</span>
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(false)}
                    aria-label="طي القائمة"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-300 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Mobile Search */}
                <div className="relative">
                  <Search
                    className="h-3.5 w-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن أي إعداد..."
                    className="h-9 w-full rounded-xl border border-white/[0.09] bg-[#0b101b] pr-9 pl-3 text-xs text-slate-100 placeholder:text-slate-500 focus:border-[#00d2ff] focus:outline-none"
                  />
                  {searchResults.length > 0 && (
                    <div className="mt-1.5 rounded-xl border border-white/15 bg-[#0b1220] p-1 space-y-0.5">
                      {searchResults.map((res) => (
                        <button
                          key={res.label}
                          type="button"
                          onClick={() => {
                            setSection(res.section);
                            if (res.section === 'profile' && res.subTab) {
                              setProfileSubTab(res.subTab as ProfileSubTab);
                            }
                            if (res.section === 'appearance' && res.subTab) {
                              setAppearanceSubTab(res.subTab as AppearanceSubTab);
                            }
                            if (res.section === 'personal' && res.subTab) {
                              setPersonalSubTab(res.subTab as PersonalSubTab);
                            }
                            if (res.previewTab) onPreviewTab(res.previewTab);
                            setSearchQuery('');
                            setMobilePane('editor');
                            setMobileNavOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-right text-[11px] font-semibold text-slate-200 hover:bg-white/[0.06] cursor-pointer"
                        >
                          <span>{res.label}</span>
                          <Compass className="h-3.5 w-3.5 text-[#00d2ff] shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {navGroups.map((group) => (
                    <div key={group.groupTitle} className="space-y-1.5">
                      <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        {group.groupTitle}
                      </div>
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = section === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSection(item.id);
                              if (item.id === 'personal') onPreviewTab('personal');
                              if (item.id === 'socials') onPreviewTab('socials');
                              setMobilePane('editor');
                              setMobileNavOpen(false);
                            }}
                            className={`group flex w-full items-center justify-between gap-2.5 rounded-xl px-3 py-2.5 text-right transition-all cursor-pointer ${
                              isActive
                                ? 'bg-white/[0.09] text-white border border-white/12 shadow-xs'
                                : 'text-slate-400 border border-transparent hover:bg-white/[0.04] hover:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                                  isActive
                                    ? 'bg-[#00d2ff]/20 text-[#00d2ff]'
                                    : 'bg-white/[0.04] text-slate-400'
                                }`}
                              >
                                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                              </span>
                              <span className="text-xs font-bold leading-tight truncate">
                                {item.label}
                              </span>
                            </div>
                            {typeof item.count === 'number' && (
                              <span
                                className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                                  item.badgeHot
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'bg-white/[0.07] text-slate-300'
                                }`}
                              >
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-white/[0.07]">
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-[#0b101b] px-3 py-2 text-xs font-semibold text-slate-200 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{exportedFeedback ? 'تم تنزيل النسخة' : 'تصدير نسخة (JSON)'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-[#0b101b] px-3 py-2 text-xs font-semibold text-slate-300 cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>استيراد JSON</span>
                </button>
              </div>
            </nav>
          </div>
        )}

        {/* Workspace Grid */}
        <div
          className={`flex-1 min-h-0 grid grid-cols-1 transition-[grid-template-columns] duration-200 ${
            sidebarCollapsed
              ? showLivePreview
                ? 'md:grid-cols-[72px_1fr] lg:grid-cols-[72px_1fr_385px] xl:grid-cols-[72px_1fr_445px]'
                : 'md:grid-cols-[72px_1fr]'
              : showLivePreview
              ? 'md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_385px] xl:grid-cols-[250px_1fr_445px]'
              : 'md:grid-cols-[255px_1fr]'
          }`}
        >
          {/* Tablet & Desktop Collapsible Navigation Sidebar */}
          <nav
            aria-label="أقسام الإعدادات"
            className={`hidden md:flex alaa-scroll-thin flex-col justify-between overflow-y-auto border-l border-white/[0.07] bg-[#060912] gap-4 shrink-0 transition-all duration-200 ${
              sidebarCollapsed ? 'p-2.5 items-center' : 'p-3.5'
            }`}
          >
            <div className="flex flex-col gap-5 w-full">
              {navGroups.map((group) => (
                <div
                  key={group.groupTitle}
                  className={`flex flex-col gap-1.5 ${sidebarCollapsed ? 'items-center' : ''}`}
                >
                  {!sidebarCollapsed && (
                    <div className="px-2.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {group.groupTitle}
                    </div>
                  )}
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = section === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        title={item.label}
                        aria-label={item.label}
                        onClick={() => {
                          setSection(item.id);
                          if (item.id === 'personal') onPreviewTab('personal');
                          if (item.id === 'socials') onPreviewTab('socials');
                        }}
                        className={`group relative flex items-center rounded-xl transition-all cursor-pointer ${
                          sidebarCollapsed
                            ? 'h-11 w-11 justify-center p-0'
                            : 'w-full justify-between gap-2.5 px-3 py-2.5 text-right'
                        } ${
                          isActive
                            ? 'bg-white/[0.09] text-white border border-white/12 shadow-xs'
                            : 'text-slate-400 border border-transparent hover:bg-white/[0.04] hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isActive
                                ? 'bg-[#00d2ff]/20 text-[#00d2ff]'
                                : 'bg-white/[0.04] text-slate-400 group-hover:text-slate-200'
                            }`}
                          >
                            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                          </span>
                          {!sidebarCollapsed && (
                            <span className="text-xs font-bold leading-tight truncate">
                              {item.label}
                            </span>
                          )}
                        </div>
                        {!sidebarCollapsed && typeof item.count === 'number' && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                              item.badgeHot
                                ? 'bg-rose-500 text-white animate-pulse'
                                : 'bg-white/[0.07] text-slate-300'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {sidebarCollapsed && item.badgeHot && (
                          <span className="absolute top-1.5 left-1.5 h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Sidebar Footer Summary */}
            <div className="flex flex-col gap-2 pt-3 border-t border-white/[0.07] w-full">
              {!sidebarCollapsed && (
                <>
                  <div className="rounded-xl border border-white/[0.07] bg-[#0b101b] p-3 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>الخط النشط</span>
                      <span className="font-bold text-[#00d2ff]">
                        {config.appearance.fontFamily}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>رسائل غير مقروءة</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          totalUnreadForOwner > 0 ? 'text-rose-400' : 'text-slate-200'
                        }`}
                      >
                        {totalUnreadForOwner}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-[#0b101b] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[#00d2ff]/40 cursor-pointer"
                  >
                    {exportedFeedback ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>تم تنزيل النسخة</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>تصدير نسخة (JSON)</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-[#0b101b] px-3 py-2 text-xs font-semibold text-slate-300 hover:border-[#00d2ff]/40 hover:text-white cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>استيراد JSON</span>
                  </button>

                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="flex items-center justify-center gap-2 rounded-xl border border-rose-500/25 bg-rose-500/5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/15 cursor-pointer"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>إعادة ضبط المصنع</span>
                    </button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onReset();
                          setConfirmReset(false);
                        }}
                        className="flex-1 rounded-xl bg-rose-600 py-2 text-[11px] font-bold text-white cursor-pointer"
                      >
                        تأكيد
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 rounded-xl border border-white/15 py-2 text-[11px] text-slate-300 cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  )}
                </>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                onChange={handleImportJson}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                title={sidebarCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
                className={`flex items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-[#00d2ff]/45 hover:text-[#00d2ff] cursor-pointer transition-colors ${
                  sidebarCollapsed ? 'h-10 w-10 mx-auto' : 'px-3 py-2 text-xs font-semibold'
                }`}
              >
                {sidebarCollapsed ? (
                  <PanelRightOpen className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <>
                    <PanelRightClose className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>طي القائمة الجانبية</span>
                  </>
                )}
              </button>
            </div>
          </nav>

          {/* Center Editor Pane */}
          <div
            className={`${
              mobilePane === 'preview' ? 'hidden lg:block' : 'block'
            } alaa-scroll-thin overflow-y-auto p-3.5 sm:p-6 lg:p-9 space-y-5 sm:space-y-8 bg-[#070b14] min-w-0`}
          >
            {importError && (
              <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-xs font-semibold text-rose-300">
                {importError}
              </div>
            )}

            {/* 1. PROFILE & BANNER */}
            {section === 'profile' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SegmentedControl
                  value={profileSubTab}
                  onChange={setProfileSubTab}
                  options={[
                    { value: 'identity', label: 'الصور والهوية', icon: <Camera className="h-3.5 w-3.5" /> },
                    { value: 'avatar', label: 'أشكال وإطارات الصورة', icon: <Shapes className="h-3.5 w-3.5" /> },
                    { value: 'banner', label: 'تصميم البانر والفلاتر', icon: <Layers className="h-3.5 w-3.5" /> },
                  ]}
                />

                {profileSubTab === 'identity' && (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="الصورة الشخصية وصورة البانر"
                      subtitle="ارفع صورك مباشرة من جهازك أو الصق رابطاً خارجياً"
                      icon={<Camera className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Avatar Card */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white">الصورة الشخصية</span>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, avatarImage: DEFAULT_PROFILE_AVATAR },
                                })
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-[#00d2ff] cursor-pointer"
                            >
                              استعادة الافتراضية
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <img
                              src={config.hero.avatarImage}
                              alt="Avatar preview"
                              referrerPolicy="no-referrer"
                              className="h-14 w-14 shrink-0 rounded-full object-cover border-2 border-[#00d2ff]/50"
                            />
                            <label className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-3 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer">
                              <Upload className="h-4 w-4 shrink-0" />
                              <span>رفع صورة جديدة</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleHeroImageUpload('avatarImage', e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div>
                            <label className={labelClass}>أو رابط الصورة</label>
                            <input
                              type="url"
                              dir="ltr"
                              value={config.hero.avatarImage}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, avatarImage: e.target.value },
                                })
                              }
                              placeholder="https://..."
                              className={inputClass}
                            />
                          </div>
                        </div>

                        {/* Banner Card */}
                        <div className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white">صورة البانر (الغلاف)</span>
                            <button
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, bannerImage: DEFAULT_PROFILE_BANNER },
                                })
                              }
                              className="text-[11px] font-semibold text-slate-400 hover:text-[#00d2ff] cursor-pointer"
                            >
                              استعادة الافتراضية
                            </button>
                          </div>
                          <div className="flex items-center gap-3">
                            <img
                              src={config.hero.bannerImage}
                              alt="Banner preview"
                              referrerPolicy="no-referrer"
                              className="h-14 w-24 shrink-0 rounded-xl object-cover border border-white/15"
                            />
                            <label className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-3 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer">
                              <Upload className="h-4 w-4 shrink-0" />
                              <span>رفع بانر جديد</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleHeroImageUpload('bannerImage', e)}
                                className="hidden"
                              />
                            </label>
                          </div>
                          <div>
                            <label className={labelClass}>أو رابط البانر</label>
                            <input
                              type="url"
                              dir="ltr"
                              value={config.hero.bannerImage}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, bannerImage: e.target.value },
                                })
                              }
                              placeholder="https://..."
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="الاسم، النبذة، وشارات البروفايل"
                      icon={<BadgeCheck className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className={labelClass}>الاسم الرئيسي</label>
                          <input
                            type="text"
                            value={config.hero.brandName}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, brandName: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>المحاذاة</label>
                          <SegmentedControl
                            value={config.hero.profileLayout}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, profileLayout: val },
                              })
                            }
                            options={[
                              { value: 'start', label: 'محاذاة فيسبوك' },
                              { value: 'center', label: 'توسيط كامل' },
                            ]}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الوصف المختصر (عربي)</label>
                          <input
                            type="text"
                            value={config.hero.tagAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, tagAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الوصف المختصر (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.hero.tagEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, tagEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الكلمة الإضافية (Suffix)</label>
                          <input
                            type="text"
                            value={config.hero.tagSuffix}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, tagSuffix: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>علامة الزاوية في البانر</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.hero.cornerMark}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, cornerMark: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <SettingSwitch
                          label="علامة التوثيق بجانب الاسم"
                          checked={config.hero.showVerifiedBadge}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, showVerifiedBadge: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="توهج ضوئي خلف البانر"
                          checked={config.hero.showHeroGlow}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, showHeroGlow: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="عرض علامة الزاوية"
                          checked={config.hero.showCornerMark}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, showCornerMark: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="إظهار الشارات أسفل النبذة"
                          checked={config.hero.showProfileBadges}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, showProfileBadges: val },
                            })
                          }
                        />
                      </div>

                      {config.hero.showProfileBadges && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className={labelClass}>الشارة الأولى (AR)</label>
                            <input
                              type="text"
                              value={config.hero.profileBadge1Ar}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, profileBadge1Ar: e.target.value },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>الشارة الأولى (EN)</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={config.hero.profileBadge1En}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, profileBadge1En: e.target.value },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>الشارة الثانية (AR)</label>
                            <input
                              type="text"
                              value={config.hero.profileBadge2Ar}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, profileBadge2Ar: e.target.value },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>الشارة الثانية (EN)</label>
                            <input
                              type="text"
                              dir="ltr"
                              value={config.hero.profileBadge2En}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, profileBadge2En: e.target.value },
                                })
                              }
                              className={inputClass}
                            />
                          </div>
                        </div>
                      )}
                    </SettingGroupCard>
                  </div>
                )}

                {profileSubTab === 'avatar' && (
                  <SettingGroupCard
                    title="أشكال وتصاميم الصورة الشخصية"
                    subtitle="اختر من بين 12 شكلاً هندسياً و 10 إطارات فنية مع التحكم بالحجم والتقريب"
                    icon={<Shapes className="h-4 w-4" />}
                  >
                    <div className="space-y-4">
                      <div className="text-xs font-extrabold text-white">
                        1. الشكل الهندسي للصورة (12 شكل)
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {AVATAR_SHAPE_OPTIONS.map((opt) => {
                          const selected = config.hero.avatarShape === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, avatarShape: opt.value },
                                })
                              }
                              className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                                  : 'border-white/[0.08] bg-[#070b14] text-slate-400 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              <span
                                className={`h-8 w-8 border-2 ${opt.radiusClass} ${
                                  selected
                                    ? 'border-[#00d2ff] bg-[#00d2ff]/25'
                                    : 'border-slate-500 bg-white/5'
                                }`}
                                style={opt.clip ? { clipPath: opt.clip } : undefined}
                              />
                              <span className="text-[11px] font-bold leading-tight">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 pt-3">
                      <div className="text-xs font-extrabold text-white">
                        2. تصميم الإطار والهالة (10 تصاميم)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {AVATAR_DESIGN_OPTIONS.map((opt) => {
                          const selected = config.hero.avatarDesign === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, avatarDesign: opt.value },
                                })
                              }
                              className={`flex flex-col items-start rounded-xl border p-4 text-right transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                                  : 'border-white/[0.08] bg-[#070b14] text-slate-300 hover:border-white/25'
                              }`}
                            >
                              <span className="text-xs font-extrabold">{opt.label}</span>
                              <span className="text-[11px] text-slate-400 mt-1">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                      <RangeSliderField
                        label="حجم الصورة"
                        valueText={`${config.hero.avatarSizeRem.toFixed(1)}rem`}
                        min={5.5}
                        max={10}
                        step={0.25}
                        value={config.hero.avatarSizeRem}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, avatarSizeRem: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="تداخلها مع البانر"
                        valueText={`${config.hero.avatarOffsetRem.toFixed(1)}rem`}
                        min={-6}
                        max={-1.5}
                        step={0.25}
                        value={config.hero.avatarOffsetRem}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, avatarOffsetRem: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="تكبير الصورة (Zoom)"
                        valueText={`${Math.round((config.hero.avatarZoom ?? 1) * 100)}%`}
                        min={1}
                        max={1.6}
                        step={0.05}
                        value={config.hero.avatarZoom ?? 1}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, avatarZoom: val },
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SettingSwitch
                        label="حلقة الثيم الملونة (الكلاسيكي)"
                        checked={config.hero.avatarRing}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, avatarRing: val },
                          })
                        }
                      />
                      <SettingSwitch
                        label="نقطة النشاط الخضراء"
                        checked={config.hero.showAvatarStatusDot}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, showAvatarStatusDot: val },
                          })
                        }
                      />
                    </div>
                  </SettingGroupCard>
                )}

                {profileSubTab === 'banner' && (
                  <SettingGroupCard
                    title="البانر المتحرك، تدرج الظلال، والفلاتر"
                    subtitle="حوّل الغلاف لصورة ثابتة أو عرض شرائح متقلب أو فيديو، واضبط التصميم والألوان"
                    icon={<Layers className="h-4 w-4" />}
                  >
                    <div className="space-y-4 pb-2 border-b border-white/[0.07]">
                      <div className="text-xs font-extrabold text-white">
                        0. نمط عرض الغلاف (صورة / عرض شرائح / فيديو متحرك)
                      </div>
                      <SegmentedControl
                        value={config.hero.bannerMode ?? 'image'}
                        onChange={(val: 'image' | 'slideshow' | 'video') =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerMode: val },
                          })
                        }
                        options={[
                          { value: 'image', label: 'صورة ثابتة', icon: <ImageIcon className="h-3.5 w-3.5" /> },
                          { value: 'slideshow', label: 'صور متقلبة', icon: <Layers className="h-3.5 w-3.5" /> },
                          { value: 'video', label: 'فيديو متحرك', icon: <Film className="h-3.5 w-3.5" /> },
                        ]}
                      />

                      {(config.hero.bannerMode ?? 'image') === 'slideshow' && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#070b14] p-4 space-y-4">
                          <RangeSliderField
                            label="سرعة التبديل بين الصور"
                            valueText={`${config.hero.bannerSlideIntervalSec ?? 4} ثواني`}
                            min={2}
                            max={12}
                            step={1}
                            value={config.hero.bannerSlideIntervalSec ?? 4}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                hero: { ...config.hero, bannerSlideIntervalSec: val },
                              })
                            }
                          />

                          <div className="space-y-2.5">
                            <div className="text-xs font-bold text-slate-300">
                              صور العرض ({(config.hero.bannerSlides ?? []).length})
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {(config.hero.bannerSlides ?? []).map((slideUrl, sIdx) => (
                                <div
                                  key={`${sIdx}-${slideUrl.slice(0, 24)}`}
                                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#0b101b] p-2"
                                >
                                  <img
                                    src={slideUrl}
                                    alt={`Slide ${sIdx + 1}`}
                                    referrerPolicy="no-referrer"
                                    className="h-12 w-16 shrink-0 rounded-lg object-cover border border-white/10"
                                  />
                                  <span className="text-xs font-semibold text-slate-300 flex-1 truncate">
                                    شريحة #{sIdx + 1}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={(config.hero.bannerSlides ?? []).length <= 1}
                                    onClick={() =>
                                      onChange({
                                        ...config,
                                        hero: {
                                          ...config.hero,
                                          bannerSlides: (config.hero.bannerSlides ?? []).filter(
                                            (_, idx) => idx !== sIdx
                                          ),
                                        },
                                      })
                                    }
                                    aria-label="حذف الشريحة"
                                    className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 disabled:opacity-30 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-4 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer shrink-0">
                              <Upload className="h-4 w-4" />
                              <span>رفع صورة جديدة للعرض</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleBannerSlideUpload}
                                className="hidden"
                              />
                            </label>
                            <div className="flex flex-1 gap-2">
                              <input
                                type="url"
                                dir="ltr"
                                value={newBannerSlideUrl}
                                onChange={(e) => setNewBannerSlideUrl(e.target.value)}
                                placeholder="أو الصق رابط صورة لإضافتها..."
                                className={inputClass}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const clean = newBannerSlideUrl.trim();
                                  if (!clean) return;
                                  onChange({
                                    ...config,
                                    hero: {
                                      ...config.hero,
                                      bannerSlides: [...(config.hero.bannerSlides ?? []), clean],
                                    },
                                  });
                                  setNewBannerSlideUrl('');
                                }}
                                className="inline-flex h-11 items-center gap-1 rounded-xl bg-white/10 px-3.5 text-xs font-bold text-white hover:bg-white/15 cursor-pointer shrink-0"
                              >
                                <Plus className="h-4 w-4" />
                                <span>إضافة</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {config.hero.bannerMode === 'video' && (
                        <div className="rounded-xl border border-white/[0.08] bg-[#070b14] p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-4 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer shrink-0">
                              <Upload className="h-4 w-4" />
                              <span>رفع فيديو MP4 / WebM</span>
                              <input
                                type="file"
                                accept="video/*"
                                onChange={handleBannerVideoUpload}
                                className="hidden"
                              />
                            </label>
                            <input
                              type="url"
                              dir="ltr"
                              value={config.hero.bannerVideoUrl ?? ''}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, bannerVideoUrl: e.target.value },
                                })
                              }
                              placeholder="https://example.com/banner-loop.mp4"
                              className={inputClass}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400">
                            يعمل الفيديو تلقائياً بشكل صامت ومتكرر (Loop) كخلفية بانر احترافية، وتظهر صورة البانر كاحتياط أثناء التحميل.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="text-xs font-extrabold text-white">
                        1. قصّة وتصميم البانر (14 تصميم)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {BANNER_DESIGN_OPTIONS.map((opt) => {
                          const selected = config.hero.bannerDesign === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, bannerDesign: opt.value },
                                })
                              }
                              className={`flex flex-col items-start rounded-xl border p-4 text-right transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                                  : 'border-white/[0.08] bg-[#070b14] text-slate-300 hover:border-white/25'
                              }`}
                            >
                              <div className="flex w-full items-center justify-between gap-2">
                                <span className="text-xs font-extrabold">{opt.label}</span>
                                {opt.value === 'fade-bottom' && (
                                  <span className="rounded-md bg-[#00d2ff]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#00d2ff]">
                                    مميز
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 mt-1">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4 pt-3">
                      <div className="text-xs font-extrabold text-white">
                        2. طبقة الإضاءة والتأثير فوق البانر (8 تأثيرات)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {BANNER_OVERLAY_OPTIONS.map((opt) => {
                          const selected = config.hero.bannerOverlay === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  hero: { ...config.hero, bannerOverlay: opt.value },
                                })
                              }
                              className={`rounded-xl border px-3 py-3 text-xs font-bold transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                                  : 'border-white/[0.08] bg-[#070b14] text-slate-400 hover:border-white/25 hover:text-white'
                              }`}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-3">
                      <RangeSliderField
                        label="ارتفاع البانر"
                        valueText={`${config.hero.bannerHeightRem.toFixed(1)}rem`}
                        min={9}
                        max={22}
                        step={0.5}
                        value={config.hero.bannerHeightRem}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerHeightRem: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="موضع الصورة عمودياً"
                        valueText={`${config.hero.bannerPositionY ?? 50}%`}
                        min={0}
                        max={100}
                        step={1}
                        value={config.hero.bannerPositionY ?? 50}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerPositionY: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="تضبيب (Blur)"
                        valueText={`${config.hero.bannerBlurPx ?? 0}px`}
                        min={0}
                        max={12}
                        step={1}
                        value={config.hero.bannerBlurPx ?? 0}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerBlurPx: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="تشبّع الألوان"
                        valueText={`${config.hero.bannerSaturation ?? 100}%`}
                        min={50}
                        max={170}
                        step={5}
                        value={config.hero.bannerSaturation ?? 100}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerSaturation: val },
                          })
                        }
                      />
                      <RangeSliderField
                        label="السطوع"
                        valueText={`${config.hero.bannerBrightness ?? 100}%`}
                        min={50}
                        max={135}
                        step={5}
                        value={config.hero.bannerBrightness ?? 100}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerBrightness: val },
                          })
                        }
                      />
                    </div>

                    <div className="pt-4 border-t border-white/[0.06] space-y-4">
                      <SettingSwitch
                        label="تأثير التمرير العميق (Parallax Scroll) للبانر"
                        hint="يتحرك البانر بانسيابية وبعمق مختلف عن باقي الصفحة أثناء التمرير"
                        checked={config.hero.bannerParallax ?? true}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            hero: { ...config.hero, bannerParallax: val },
                          })
                        }
                      />
                      {(config.hero.bannerParallax ?? true) && (
                        <RangeSliderField
                          label="شدة عمق الحركة (Parallax)"
                          valueText={`${Math.round((config.hero.bannerParallaxSpeed ?? 0.38) * 100)}%`}
                          min={15}
                          max={65}
                          step={5}
                          value={Math.round((config.hero.bannerParallaxSpeed ?? 0.38) * 100)}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              hero: { ...config.hero, bannerParallaxSpeed: val / 100 },
                            })
                          }
                        />
                      )}
                    </div>
                  </SettingGroupCard>
                )}
              </div>
            )}

            {/* 1.5 STORIES & STATUS SYSTEM */}
            {section === 'stories' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SettingGroupCard
                  title="نظام القصص والحالات (Stories)"
                  subtitle="عند وجود قصة نشطة، تظهر حلقة ملونة حول صورتك الشخصية مع خيار رؤية الصورة أو القصة عند الضغط عليها"
                  icon={<Clapperboard className="h-4 w-4" />}
                >
                  <SettingSwitch
                    label="تفعيل نظام القصص على الصورة الشخصية"
                    hint="إظهار حلقة الحالة وخيارات (رؤية الصورة / رؤية القصة) للزوار"
                    checked={config.stories.enabled}
                    onChange={(val) =>
                      onChange({
                        ...config,
                        stories: { ...config.stories, enabled: val },
                      })
                    }
                  />

                  <SettingSwitch
                    label="انتهاء صلاحية القصص الجديدة تلقائياً بعد 24 ساعة"
                    hint="تختفي القصة تلقائياً من الصورة الشخصية بعد 24 ساعة (وتبقى محفوظة في الـ Highlights إذا أضفتها)"
                    checked={config.stories.autoExpire24hDefault ?? false}
                    onChange={(val) => {
                      setNewStoryAutoExpire(val);
                      onChange({
                        ...config,
                        stories: { ...config.stories, autoExpire24hDefault: val },
                      });
                    }}
                  />

                  <div>
                    <label className={labelClass}>تصميم حلقة القصة حول الصورة الشخصية</label>
                    <SegmentedControl
                      value={config.stories.ringStyle}
                      onChange={(val: StoryRingStyle) =>
                        onChange({
                          ...config,
                          stories: { ...config.stories, ringStyle: val },
                        })
                      }
                      options={[
                        { value: 'instagram', label: 'تدرج إنستجرام' },
                        { value: 'tiktok', label: 'نيون تيك توك' },
                        { value: 'brand', label: 'ألوان الثيم' },
                      ]}
                    />
                  </div>
                </SettingGroupCard>

                <SettingGroupCard
                  title="نشر قصة جديدة"
                  subtitle="أضف صورة أو فيديو قصيراً أو بطاقة نصية ملونة تظهر فوراً في قصصك"
                  icon={<Plus className="h-4 w-4" />}
                >
                  <form onSubmit={handlePublishStory} className="space-y-6">
                    <div>
                      <label className={labelClass}>نوع القصة</label>
                      <SegmentedControl
                        value={newStoryType}
                        onChange={(val: StoryMediaType) => {
                          setNewStoryType(val);
                          setNewStoryUrl('');
                        }}
                        options={[
                          { value: 'text', label: 'حالة نصية', icon: <Type className="h-3.5 w-3.5" /> },
                          { value: 'image', label: 'صورة', icon: <ImageIcon className="h-3.5 w-3.5" /> },
                          { value: 'video', label: 'فيديو قصير', icon: <Film className="h-3.5 w-3.5" /> },
                        ]}
                      />
                    </div>

                    {newStoryType === 'text' ? (
                      <div className="space-y-3">
                        <label className={labelClass}>خلفية البطاقة النصية</label>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {[
                            'linear-gradient(135deg, #0f172a 0%, #1d4ed8 50%, #00d2ff 100%)',
                            'linear-gradient(45deg, #f09433 0%, #dc2743 50%, #bc1888 100%)',
                            'linear-gradient(135deg, #0b101b 0%, #7c3aed 55%, #fe2c55 100%)',
                            'linear-gradient(135deg, #064e3b 0%, #10b981 55%, #38bdf8 100%)',
                            'linear-gradient(135deg, #1e1b4b 0%, #9333ea 55%, #f472b6 100%)',
                            'linear-gradient(135deg, #18181b 0%, #b45309 55%, #facc15 100%)',
                          ].map((grad) => {
                            const selected = newStoryGradient === grad;
                            return (
                              <button
                                key={grad}
                                type="button"
                                onClick={() => setNewStoryGradient(grad)}
                                className={`h-12 rounded-xl border-2 transition-transform cursor-pointer ${
                                  selected
                                    ? 'border-white scale-105 shadow-md'
                                    : 'border-white/15 opacity-80 hover:opacity-100'
                                }`}
                                style={{ background: grad }}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-4 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer shrink-0">
                            <Upload className="h-4 w-4" />
                            <span>
                              {newStoryType === 'video' ? 'رفع فيديو من جهازك' : 'رفع صورة من جهازك'}
                            </span>
                            <input
                              type="file"
                              accept={newStoryType === 'video' ? 'video/*' : 'image/*'}
                              onChange={handleNewStoryUpload}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="url"
                            dir="ltr"
                            value={newStoryUrl}
                            onChange={(e) => setNewStoryUrl(e.target.value)}
                            placeholder={
                              newStoryType === 'video'
                                ? 'أو الصق رابط فيديو MP4...'
                                : 'أو الصق رابط الصورة...'
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>
                          {newStoryType === 'text' ? 'نص الحالة (AR)' : 'تعليق على القصة (AR)'}
                        </label>
                        <input
                          type="text"
                          value={newStoryCaptionAr}
                          onChange={(e) => setNewStoryCaptionAr(e.target.value)}
                          placeholder="اكتب جملة جميلة أو تحديثاً..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>
                          {newStoryType === 'text' ? 'نص الحالة (EN)' : 'تعليق على القصة (EN)'}
                        </label>
                        <input
                          type="text"
                          dir="ltr"
                          value={newStoryCaptionEn}
                          onChange={(e) => setNewStoryCaptionEn(e.target.value)}
                          placeholder="Write a status or caption..."
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <RangeSliderField
                      label="مدة بقاء القصة"
                      valueText={`${newStoryDuration} ثواني`}
                      min={3}
                      max={15}
                      step={1}
                      value={newStoryDuration}
                      onChange={setNewStoryDuration}
                    />

                    <SettingSwitch
                      label="تنتهي هذه القصة تلقائياً بعد 24 ساعة"
                      hint="عند التعطيل تبقى القصة ظاهرة بشكل دائم حتى تخفيها أو تحذفها"
                      checked={newStoryAutoExpire}
                      onChange={setNewStoryAutoExpire}
                    />

                    <StoryMusicPicker
                      value={newStoryMusic}
                      storyDurationSec={newStoryDuration}
                      onChange={setNewStoryMusic}
                      onNotify={onNotify}
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-5 text-xs font-extrabold text-[#070b14] shadow-md hover:opacity-95 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>نشر القصة الآن</span>
                      </button>
                    </div>
                  </form>
                </SettingGroupCard>

                <SettingGroupCard
                  title={`القصص المنشورة (${config.stories.items.length})`}
                  subtitle="رتّب القصص أو فعّل انتهاء الـ 24 ساعة أو جدّدها — عند إخفاء أو انتهاء جميع القصص يفتح الضغط على الصورة الشخصية مباشرة"
                  icon={<Play className="h-4 w-4" />}
                >
                  {config.stories.items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-[#070b14] p-7 text-center text-xs text-slate-400">
                      لا توجد قصص حالياً. أضف قصة جديدة من الأعلى لتفعيل حلقة القصص على صورتك الشخصية.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {config.stories.items.map((st, idx) => {
                        const expired = isStoryExpired(st);
                        const expiryText = formatStoryExpiryRemaining(st, 'ar');
                        return (
                          <div
                            key={st.id}
                            className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {st.type === 'text' ? (
                                  <div
                                    className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 text-white"
                                    style={{ background: st.bgGradient }}
                                  >
                                    <Type className="h-4 w-4" />
                                  </div>
                                ) : st.type === 'video' ? (
                                  <div className="flex h-12 w-10 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-slate-900 text-[#00d2ff]">
                                    <Film className="h-4 w-4" />
                                  </div>
                                ) : (
                                  <img
                                    src={st.mediaUrl}
                                    alt={st.captionAr || 'Story'}
                                    referrerPolicy="no-referrer"
                                    className="h-12 w-10 shrink-0 rounded-lg object-cover border border-white/15"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="text-xs font-extrabold text-white truncate">
                                    {st.captionAr || st.captionEn || 'قصة بدون نص'}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                                    <span>
                                      {st.type === 'text'
                                        ? 'حالة نصية'
                                        : st.type === 'video'
                                        ? 'فيديو'
                                        : 'صورة'}{' '}
                                      · {st.durationSec} ث
                                    </span>
                                    {st.expiresAt ? (
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                          expired
                                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        }`}
                                      >
                                        <Clock className="h-2.5 w-2.5" />
                                        <span>{expiryText}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                        دائمة
                                      </span>
                                    )}
                                    {st.music?.audioUrl && (
                                      <span className="inline-flex items-center gap-1 rounded-md border border-[#00d2ff]/30 bg-[#00d2ff]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#00d2ff] tabular-nums">
                                        <Music2 className="h-2.5 w-2.5" />
                                        <span className="max-w-[110px] truncate">
                                          {st.music.title}
                                        </span>
                                        <span>
                                          ({formatAudioTime(st.music.startSec)}–
                                          {formatAudioTime(
                                            st.music.startSec + st.music.clipDurationSec
                                          )}
                                          )
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedMusicStoryId((prev) =>
                                      prev === st.id ? null : st.id
                                    )
                                  }
                                  className={`h-8 inline-flex items-center gap-1 rounded-lg border px-2 text-[10.5px] font-bold cursor-pointer ${
                                    expandedMusicStoryId === st.id || st.music?.audioUrl
                                      ? 'border-[#00d2ff]/40 bg-[#00d2ff]/12 text-[#00d2ff]'
                                      : 'border-white/10 text-slate-300 hover:border-white/25'
                                  }`}
                                >
                                  <Music2 className="h-3 w-3" />
                                  <span>{st.music?.audioUrl ? 'تعديل المقطع' : 'إضافة أغنية'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: config.stories.items.map((x) =>
                                          x.id === st.id
                                            ? {
                                                ...x,
                                                expiresAt: x.expiresAt
                                                  ? undefined
                                                  : new Date(
                                                      Date.now() + 24 * 60 * 60 * 1000
                                                    ).toISOString(),
                                              }
                                            : x
                                        ),
                                      },
                                    })
                                  }
                                  className={`h-8 inline-flex items-center gap-1 rounded-lg border px-2 text-[10.5px] font-bold cursor-pointer ${
                                    st.expiresAt
                                      ? 'border-amber-500/35 bg-amber-500/12 text-amber-300'
                                      : 'border-white/10 text-slate-300 hover:border-white/25'
                                  }`}
                                >
                                  <Clock className="h-3 w-3" />
                                  <span>{st.expiresAt ? 'جعلها دائمة' : 'تفعيل 24س'}</span>
                                </button>

                                {st.expiresAt && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({
                                        ...config,
                                        stories: {
                                          ...config.stories,
                                          items: config.stories.items.map((x) =>
                                            x.id === st.id
                                              ? {
                                                  ...x,
                                                  expiresAt: new Date(
                                                    Date.now() + 24 * 60 * 60 * 1000
                                                  ).toISOString(),
                                                  visible: true,
                                                }
                                              : x
                                          ),
                                        },
                                      })
                                    }
                                    className="h-8 inline-flex items-center gap-1 rounded-lg border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-2 text-[10.5px] font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer"
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                    <span>تجديد 24س</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: moveItem(config.stories.items, idx, -1),
                                      },
                                    })
                                  }
                                  disabled={idx === 0}
                                  aria-label="تحريك لأعلى"
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: moveItem(config.stories.items, idx, 1),
                                      },
                                    })
                                  }
                                  disabled={idx === config.stories.items.length - 1}
                                  aria-label="تحريك لأسفل"
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: config.stories.items.map((x) =>
                                          x.id === st.id ? { ...x, visible: !x.visible } : x
                                        ),
                                      },
                                    })
                                  }
                                  className={`h-8 inline-flex items-center rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer ${
                                    st.visible
                                      ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                      : 'border-white/10 text-slate-400'
                                  }`}
                                >
                                  {st.visible ? 'نشطة' : 'مخفية'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: config.stories.items.filter((x) => x.id !== st.id),
                                      },
                                    })
                                  }
                                  aria-label="حذف القصة"
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className={labelClass}>التعليق (AR)</label>
                                <input
                                  type="text"
                                  value={st.captionAr}
                                  onChange={(e) =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: config.stories.items.map((x) =>
                                          x.id === st.id ? { ...x, captionAr: e.target.value } : x
                                        ),
                                      },
                                    })
                                  }
                                  className={inputClass}
                                />
                              </div>
                              <div>
                                <label className={labelClass}>التعليق (EN)</label>
                                <input
                                  type="text"
                                  dir="ltr"
                                  value={st.captionEn}
                                  onChange={(e) =>
                                    onChange({
                                      ...config,
                                      stories: {
                                        ...config.stories,
                                        items: config.stories.items.map((x) =>
                                          x.id === st.id ? { ...x, captionEn: e.target.value } : x
                                        ),
                                      },
                                    })
                                  }
                                  className={inputClass}
                                />
                              </div>
                            </div>

                            {expandedMusicStoryId === st.id && (
                              <StoryMusicPicker
                                compact
                                value={st.music}
                                storyDurationSec={st.durationSec}
                                onChange={(nextMusic) =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      items: config.stories.items.map((x) =>
                                        x.id === st.id ? { ...x, music: nextMusic } : x
                                      ),
                                    },
                                  })
                                }
                                onNotify={onNotify}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </SettingGroupCard>

                {/* Story Highlights Manager */}
                <SettingGroupCard
                  title="ألبومات القصص الدائمة (Story Highlights)"
                  subtitle="أنشئ حلقات دائرية دائمة أسفل أزرار الملف الشخصي لتجميع أفضل قصصك حتى لو انتهت صلاحيتها في البروفايل"
                  icon={<Sparkles className="h-4 w-4" />}
                >
                  <SettingSwitch
                    label="عرض شريط الألبومات (Highlights) أسفل البروفايل"
                    hint="يظهر تلقائياً الألبومات المرئية التي تحتوي على قصة واحدة على الأقل"
                    checked={config.stories.highlightsEnabled ?? true}
                    onChange={(val) =>
                      onChange({
                        ...config,
                        stories: { ...config.stories, highlightsEnabled: val },
                      })
                    }
                  />

                  <form
                    onSubmit={handleCreateHighlight}
                    className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                  >
                    <div className="text-xs font-extrabold text-white">إنشاء ألبوم جديد</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>اسم الألبوم (AR)</label>
                        <input
                          type="text"
                          value={newHlTitleAr}
                          onChange={(e) => setNewHlTitleAr(e.target.value)}
                          placeholder="مثال: مشاريعي، سفرياتي..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>اسم الألبوم (EN)</label>
                        <input
                          type="text"
                          dir="ltr"
                          value={newHlTitleEn}
                          onChange={(e) => setNewHlTitleEn(e.target.value)}
                          placeholder="e.g. Projects, Updates..."
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                      <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-4 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer shrink-0">
                        <Upload className="h-4 w-4" />
                        <span>صورة الغلاف</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleHighlightCoverUpload(null, e)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        dir="ltr"
                        value={newHlCoverUrl}
                        onChange={(e) => setNewHlCoverUrl(e.target.value)}
                        placeholder="أو الصق رابط صورة الغلاف (اختياري)..."
                        className={inputClass}
                      />
                      <label className="relative h-11 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 cursor-pointer">
                        <span
                          className="absolute inset-0"
                          style={{ backgroundColor: newHlAccentColor }}
                        />
                        <input
                          type="color"
                          value={newHlAccentColor}
                          onChange={(e) => setNewHlAccentColor(e.target.value)}
                          aria-label="لون حلقة الألبوم"
                          className="opacity-0 h-full w-full cursor-pointer"
                        />
                      </label>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 text-xs font-extrabold text-[#070b14] hover:opacity-95 cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>إضافة الألبوم</span>
                      </button>
                    </div>
                  </form>

                  {(config.stories.highlights ?? []).length > 0 && (
                    <div className="space-y-4">
                      {(config.stories.highlights ?? []).map((hl, idx) => (
                        <div
                          key={hl.id}
                          className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="h-12 w-12 shrink-0 rounded-full p-[2px]"
                                style={{
                                  background: `linear-gradient(135deg, ${
                                    hl.accentColor || config.appearance.brandColor
                                  }, ${config.appearance.brandColor2})`,
                                }}
                              >
                                <img
                                  src={hl.coverUrl || config.hero.avatarImage}
                                  alt={hl.titleAr || hl.titleEn}
                                  referrerPolicy="no-referrer"
                                  className="h-full w-full rounded-full object-cover border-2 border-[#070b14]"
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-extrabold text-white truncate">
                                  {hl.titleAr || hl.titleEn}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {hl.storyIds.length} قصة مرتبطة
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: moveItem(
                                        config.stories.highlights ?? [],
                                        idx,
                                        -1
                                      ),
                                    },
                                  })
                                }
                                disabled={idx === 0}
                                aria-label="تحريك لأعلى"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: moveItem(
                                        config.stories.highlights ?? [],
                                        idx,
                                        1
                                      ),
                                    },
                                  })
                                }
                                disabled={idx === (config.stories.highlights ?? []).length - 1}
                                aria-label="تحريك لأسفل"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: (config.stories.highlights ?? []).map((x) =>
                                        x.id === hl.id ? { ...x, visible: !x.visible } : x
                                      ),
                                    },
                                  })
                                }
                                className={`h-8 inline-flex items-center rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer ${
                                  hl.visible
                                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                    : 'border-white/10 text-slate-400'
                                }`}
                              >
                                {hl.visible ? 'ظاهر' : 'مخفي'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: (config.stories.highlights ?? []).filter(
                                        (x) => x.id !== hl.id
                                      ),
                                    },
                                  })
                                }
                                aria-label="حذف الألبوم"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className={labelClass}>اسم الألبوم (AR)</label>
                              <input
                                type="text"
                                value={hl.titleAr}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: (config.stories.highlights ?? []).map((x) =>
                                        x.id === hl.id ? { ...x, titleAr: e.target.value } : x
                                      ),
                                    },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>اسم الألبوم (EN)</label>
                              <input
                                type="text"
                                dir="ltr"
                                value={hl.titleEn}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: (config.stories.highlights ?? []).map((x) =>
                                        x.id === hl.id ? { ...x, titleEn: e.target.value } : x
                                      ),
                                    },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <label className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#0b101b] px-3.5 text-xs font-bold text-slate-200 hover:border-[#00d2ff]/50 cursor-pointer shrink-0">
                              <Upload className="h-3.5 w-3.5 text-[#00d2ff]" />
                              <span>تغيير الغلاف</span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleHighlightCoverUpload(hl.id, e)}
                                className="hidden"
                              />
                            </label>
                            <input
                              type="url"
                              dir="ltr"
                              value={hl.coverUrl}
                              onChange={(e) =>
                                onChange({
                                  ...config,
                                  stories: {
                                    ...config.stories,
                                    highlights: (config.stories.highlights ?? []).map((x) =>
                                      x.id === hl.id ? { ...x, coverUrl: e.target.value } : x
                                    ),
                                  },
                                })
                              }
                              placeholder="رابط صورة الغلاف..."
                              className={inputClass}
                            />
                            <label className="relative h-11 w-12 shrink-0 overflow-hidden rounded-xl border border-white/15 cursor-pointer">
                              <span
                                className="absolute inset-0"
                                style={{
                                  backgroundColor:
                                    hl.accentColor || config.appearance.brandColor,
                                }}
                              />
                              <input
                                type="color"
                                value={hl.accentColor || config.appearance.brandColor}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    stories: {
                                      ...config.stories,
                                      highlights: (config.stories.highlights ?? []).map((x) =>
                                        x.id === hl.id ? { ...x, accentColor: e.target.value } : x
                                      ),
                                    },
                                  })
                                }
                                aria-label="لون حلقة الألبوم"
                                className="opacity-0 h-full w-full cursor-pointer"
                              />
                            </label>
                          </div>

                          <div className="space-y-2">
                            <div className="text-[11px] font-bold text-slate-300">
                              اختر القصص المضافة لهذا الألبوم:
                            </div>
                            {config.stories.items.length === 0 ? (
                              <div className="text-[11px] text-slate-500">
                                أضف قصصاً أولاً لربطها بهذا الألبوم.
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {config.stories.items.map((st) => {
                                  const linked = hl.storyIds.includes(st.id);
                                  return (
                                    <button
                                      key={st.id}
                                      type="button"
                                      onClick={() =>
                                        onChange({
                                          ...config,
                                          stories: {
                                            ...config.stories,
                                            highlights: (config.stories.highlights ?? []).map(
                                              (x) =>
                                                x.id === hl.id
                                                  ? {
                                                      ...x,
                                                      storyIds: linked
                                                        ? x.storyIds.filter((id) => id !== st.id)
                                                        : [...x.storyIds, st.id],
                                                    }
                                                  : x
                                            ),
                                          },
                                        })
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${
                                        linked
                                          ? 'border-[#00d2ff]/55 bg-[#00d2ff]/15 text-white'
                                          : 'border-white/10 bg-[#0b101b] text-slate-400 hover:border-white/25'
                                      }`}
                                    >
                                      {linked && <Check className="h-3 w-3 text-[#00d2ff]" />}
                                      <span className="max-w-[160px] truncate">
                                        {st.captionAr || st.captionEn || 'قصة بدون نص'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </SettingGroupCard>
              </div>
            )}

            {/* 2. APPEARANCE & THEMES */}
            {section === 'appearance' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SegmentedControl
                  value={appearanceSubTab}
                  onChange={setAppearanceSubTab}
                  options={[
                    { value: 'themes', label: `معرض الثيمات (${THEME_PRESETS.length})`, icon: <Palette className="h-3.5 w-3.5" /> },
                    { value: 'layout', label: 'هندسة الواجهة والخامات', icon: <Sliders className="h-3.5 w-3.5" /> },
                    { value: 'colors', label: 'الألوان والخطوط', icon: <Type className="h-3.5 w-3.5" /> },
                  ]}
                />

                {appearanceSubTab === 'themes' && (
                  <SettingGroupCard
                    title={`معرض الثيمات الاحترافي (${THEME_PRESETS.length} ثيم)`}
                    subtitle="اختر ثيماً جاهزاً لتطبيق ألوانه ونظامه الداكن أو الفاتح بضغطة واحدة"
                    icon={<Palette className="h-4 w-4" />}
                  >
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search
                          className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                          aria-hidden="true"
                        />
                        <input
                          type="search"
                          value={themeSearch}
                          onChange={(e) => setThemeSearch(e.target.value)}
                          placeholder="ابحث باسم الثيم... (ذهبي، نيون، فاتح، زمردي)"
                          className={`${inputClass} pr-9`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(
                        [
                          { id: 'all', label: `الكل (${THEME_PRESETS.length})` },
                          { id: 'classic', label: 'كلاسيكي' },
                          { id: 'neon', label: 'نيون وسايبر' },
                          { id: 'luxury', label: 'فخامة وذهبي' },
                          { id: 'nature', label: 'طبيعة وغروب' },
                          { id: 'light', label: 'ثيمات فاتحة' },
                        ] as const
                      ).map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setThemeFilter(cat.id)}
                          className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            themeFilter === cat.id
                              ? 'border-[#00d2ff] bg-[#00d2ff]/15 text-white'
                              : 'border-white/[0.08] bg-[#070b14] text-slate-400 hover:border-white/20 hover:text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[430px] overflow-y-auto alaa-scroll-thin pe-1">
                      {filteredThemes.map((preset) => {
                        const isSelected =
                          config.appearance.brandColor.toLowerCase() === preset.brand.toLowerCase() &&
                          config.appearance.brandColor2.toLowerCase() === preset.brand2.toLowerCase() &&
                          config.appearance.defaultTheme === preset.mode;

                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => {
                              onChange({
                                ...config,
                                appearance: {
                                  ...config.appearance,
                                  defaultTheme: preset.mode,
                                  brandColor: preset.brand,
                                  brandColor2: preset.brand2,
                                  bgDark: preset.bgDark,
                                  surfaceDark: preset.surfaceDark,
                                  bgLight: preset.bgLight,
                                  surfaceLight: preset.surfaceLight,
                                  gradientAngle: preset.gradientAngle,
                                },
                              });
                              onPreviewTheme(preset.mode);
                            }}
                            className={`flex items-center gap-3 rounded-xl border p-3 text-right transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white shadow-sm'
                                : 'border-white/[0.08] bg-[#070b14] text-slate-200 hover:border-white/25'
                            }`}
                          >
                            <div
                              className="h-9 w-9 shrink-0 rounded-xl border border-white/15 shadow-inner"
                              style={{
                                background: `linear-gradient(${preset.gradientAngle}deg, ${preset.brand}, ${preset.brand2})`,
                              }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-extrabold truncate">{preset.name}</div>
                              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span>{preset.mode === 'light' ? 'وضع فاتح' : 'وضع داكن'}</span>
                                <span>·</span>
                                <span className="font-mono uppercase">{preset.brand}</span>
                              </div>
                            </div>
                            {isSelected && (
                              <Check className="h-4 w-4 text-[#00d2ff] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </SettingGroupCard>
                )}

                {appearanceSubTab === 'layout' && (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="نمط الخلفية، خامة البطاقات، وشكل التبويبات"
                      icon={<Sliders className="h-4 w-4" />}
                    >
                      <div className="space-y-5">
                        <div>
                          <label className={labelClass}>خلفية الصفحة</label>
                          <SegmentedControl
                            value={config.appearance.backdropStyle}
                            onChange={(val: BackdropStyle) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, backdropStyle: val },
                              })
                            }
                            options={[
                              { value: 'mesh', label: 'ضبابي Mesh' },
                              { value: 'aurora', label: 'شفق علوي' },
                              { value: 'grid', label: 'شبكة هندسية' },
                              { value: 'dots', label: 'نقاط تقنية' },
                              { value: 'clean', label: 'صافي' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>خامة البطاقات</label>
                          <SegmentedControl
                            value={config.appearance.cardMaterial}
                            onChange={(val: CardMaterial) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, cardMaterial: val },
                              })
                            }
                            options={[
                              { value: 'solid', label: 'صلب قياسي' },
                              { value: 'glass', label: 'زجاجي شفاف' },
                              { value: 'bordered', label: 'إطار مفرّغ' },
                              { value: 'elevated', label: 'ظل بارز' },
                            ]}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>تصميم شريط التبويبات</label>
                          <SegmentedControl
                            value={config.appearance.tabStyle}
                            onChange={(val: TabBarStyle) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, tabStyle: val },
                              })
                            }
                            options={[
                              { value: 'segmented', label: 'كبسولات مدمجة' },
                              { value: 'pills', label: 'أزرار منفصلة' },
                              { value: 'underline', label: 'خط سفلي' },
                              { value: 'floating', label: 'شريط عائم' },
                            ]}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>عرض المحتوى</label>
                            <SegmentedControl
                              value={config.appearance.contentWidth}
                              onChange={(val: ContentWidth) =>
                                onChange({
                                  ...config,
                                  appearance: { ...config.appearance, contentWidth: val },
                                })
                              }
                              options={[
                                { value: 'compact', label: 'مدمج' },
                                { value: 'normal', label: 'متوازن' },
                                { value: 'wide', label: 'عريض' },
                              ]}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>كثافة المسافات</label>
                            <SegmentedControl
                              value={config.appearance.uiDensity}
                              onChange={(val: UiDensity) =>
                                onChange({
                                  ...config,
                                  appearance: { ...config.appearance, uiDensity: val },
                                })
                              }
                              options={[
                                { value: 'compact', label: 'متقارب' },
                                { value: 'cozy', label: 'مريح' },
                                { value: 'spacious', label: 'واسع' },
                              ]}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <RangeSliderField
                            label="استدارة البطاقات"
                            valueText={`${config.appearance.cardRadiusPx}px`}
                            min={6}
                            max={28}
                            step={1}
                            value={config.appearance.cardRadiusPx}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, cardRadiusPx: val },
                              })
                            }
                          />
                          <RangeSliderField
                            label="حجم الخط العام"
                            valueText={`${Math.round((config.appearance.fontSizeScale ?? 1) * 100)}%`}
                            min={0.9}
                            max={1.15}
                            step={0.02}
                            value={config.appearance.fontSizeScale ?? 1}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, fontSizeScale: val },
                              })
                            }
                          />
                        </div>
                      </div>
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="خيارات التفاعل والأزرار العلوية"
                      icon={<Sparkles className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-4">
                        <div>
                          <label className={labelClass}>الوضع الافتراضي للموقع</label>
                          <SegmentedControl
                            value={config.appearance.defaultTheme}
                            onChange={(val) => {
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, defaultTheme: val },
                              });
                              onPreviewTheme(val);
                            }}
                            options={[
                              { value: 'dark', label: 'داكن', icon: <Moon className="h-3.5 w-3.5" /> },
                              { value: 'light', label: 'فاتح', icon: <Sun className="h-3.5 w-3.5" /> },
                            ]}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>اللغة الافتراضية</label>
                          <SegmentedControl
                            value={config.appearance.defaultLang}
                            onChange={(val) => {
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, defaultLang: val },
                              });
                              onPreviewLang(val);
                            }}
                            options={[
                              { value: 'ar', label: 'العربية' },
                              { value: 'en', label: 'English' },
                            ]}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SettingSwitch
                          label="شريط تقدم التمرير العلوي"
                          checked={config.appearance.showScrollProgress}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, showScrollProgress: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="خامة تحبيب الورق (Grain)"
                          checked={config.appearance.enableGrain}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, enableGrain: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="تفعيل الحركات الانتقالية"
                          checked={config.appearance.enableAnimations}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, enableAnimations: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="تثبيت التبويبات عند التمرير"
                          checked={config.appearance.stickyTabs}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, stickyTabs: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="زر تبديل الوضع (شمس/قمر)"
                          checked={config.appearance.showThemeBtn}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, showThemeBtn: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="زر تغيير اللغة"
                          checked={config.appearance.showLangBtn}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, showLangBtn: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="زر مشاركة الرابط العلوي"
                          checked={config.appearance.showShareBtn}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, showShareBtn: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="حركة ميلان الأيقونات"
                          checked={config.appearance.tiltCards}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, tiltCards: val },
                            })
                          }
                        />
                        <SettingSwitch
                          label="هالة ضوئية تتبع المؤشر"
                          hint="تأثير ضوئي ناعم يتبع حركة الماوس على الكمبيوتر"
                          checked={config.appearance.cursorGlow ?? true}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, cursorGlow: val },
                            })
                          }
                        />
                      </div>

                      {(config.appearance.cursorGlow ?? true) && (
                        <div className="pt-2">
                          <RangeSliderField
                            label="حجم الهالة الضوئية حول المؤشر"
                            valueText={`${config.appearance.cursorGlowSizePx ?? 380}px`}
                            min={200}
                            max={600}
                            step={20}
                            value={config.appearance.cursorGlowSizePx ?? 380}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                appearance: { ...config.appearance, cursorGlowSizePx: val },
                              })
                            }
                          />
                        </div>
                      )}
                    </SettingGroupCard>
                  </div>
                )}

                {appearanceSubTab === 'colors' && (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="ألوان الهوية والتدرج المخصصة"
                      icon={<Palette className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ColorSwatchInput
                          label="اللون الرئيسي الأول"
                          value={config.appearance.brandColor}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, brandColor: val },
                            })
                          }
                        />
                        <ColorSwatchInput
                          label="اللون الثانوي للتدرج"
                          value={config.appearance.brandColor2}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, brandColor2: val },
                            })
                          }
                        />
                        <ColorSwatchInput
                          label="خلفية الوضع الداكن"
                          value={config.appearance.bgDark}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, bgDark: val },
                            })
                          }
                        />
                        <ColorSwatchInput
                          label="بطاقات الوضع الداكن"
                          value={config.appearance.surfaceDark}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, surfaceDark: val },
                            })
                          }
                        />
                        <ColorSwatchInput
                          label="خلفية الوضع الفاتح"
                          value={config.appearance.bgLight}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, bgLight: val },
                            })
                          }
                        />
                        <ColorSwatchInput
                          label="بطاقات الوضع الفاتح"
                          value={config.appearance.surfaceLight}
                          onChange={(val) =>
                            onChange({
                              ...config,
                              appearance: { ...config.appearance, surfaceLight: val },
                            })
                          }
                        />
                      </div>

                      <RangeSliderField
                        label="زاوية التدرج اللوني"
                        valueText={`${config.appearance.gradientAngle}°`}
                        min={0}
                        max={360}
                        step={5}
                        value={config.appearance.gradientAngle}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            appearance: { ...config.appearance, gradientAngle: val },
                          })
                        }
                      />
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="نوع الخط العربي والإنجليزي"
                      icon={<Type className="h-4 w-4" />}
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {FONT_OPTIONS.map((f) => {
                          const selected = config.appearance.fontFamily === f.value;
                          return (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() =>
                                onChange({
                                  ...config,
                                  appearance: { ...config.appearance, fontFamily: f.value },
                                })
                              }
                              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-xs font-bold transition-all cursor-pointer ${
                                selected
                                  ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                                  : 'border-white/[0.08] bg-[#070b14] text-slate-300 hover:border-white/25'
                              }`}
                              style={{ fontFamily: f.value }}
                            >
                              <span>{f.label}</span>
                              {selected && <Check className="h-4 w-4 text-[#00d2ff]" />}
                            </button>
                          );
                        })}
                      </div>
                    </SettingGroupCard>
                  </div>
                )}
              </div>
            )}

            {/* 3. PERSONAL INFO */}
            {section === 'personal' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SegmentedControl
                  value={personalSubTab}
                  onChange={setPersonalSubTab}
                  options={[
                    { value: 'fields', label: 'البيانات الشخصية', icon: <IdCard className="h-3.5 w-3.5" /> },
                    { value: 'hobbies', label: 'الهوايات والإضافات', icon: <Heart className="h-3.5 w-3.5" /> },
                    { value: 'tabs', label: 'إدارة التبويبين', icon: <Layers className="h-3.5 w-3.5" /> },
                  ]}
                />

                {personalSubTab === 'fields' && (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="بطاقة الترحيب والعنوان التعريفي"
                      subtitle="تظهر أعلى تبويب معلوماتي الشخصية"
                      icon={<IdCard className="h-4 w-4" />}
                    >
                      <SettingSwitch
                        label="إظهار البطاقة الترحيبية أعلى القسم"
                        checked={config.personal.showCardHeader}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            personal: { ...config.personal, showCardHeader: val },
                          })
                        }
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>عنوان القسم (AR)</label>
                          <input
                            type="text"
                            value={config.personal.sectionTitleAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, sectionTitleAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>عنوان القسم (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.personal.sectionTitleEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, sectionTitleEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الصفة أو اللقب (AR)</label>
                          <input
                            type="text"
                            value={config.personal.headlineAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, headlineAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الصفة أو اللقب (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.personal.headlineEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, headlineEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>جملة تعريفية قصيرة (AR)</label>
                          <input
                            type="text"
                            value={config.personal.quoteAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, quoteAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>جملة تعريفية قصيرة (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.personal.quoteEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, quoteEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="تفاصيل البطاقة الشخصية"
                      subtitle="فعّل الحقول التي تريد عرضها وعدّل قيمتها بالعربية والإنجليزية"
                      icon={<GraduationCap className="h-4 w-4" />}
                    >
                      <div className="space-y-4">
                        {corePersonalFields.map((field) => {
                          const isShown = Boolean(config.personal[field.showKey]);
                          const arVal = String(config.personal[field.arKey] ?? '');
                          const enVal = String(config.personal[field.enKey] ?? '');
                          return (
                            <div
                              key={field.key}
                              className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <span className="text-xs sm:text-[13px] font-extrabold text-white">
                                  {field.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      personal: {
                                        ...config.personal,
                                        [field.showKey]: !isShown,
                                      },
                                    })
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold cursor-pointer transition-colors ${
                                    isShown
                                      ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                      : 'border-white/10 bg-white/[0.04] text-slate-400'
                                  }`}
                                >
                                  {isShown ? (
                                    <>
                                      <Eye className="h-3.5 w-3.5" />
                                      <span>ظاهر</span>
                                    </>
                                  ) : (
                                    <>
                                      <EyeOff className="h-3.5 w-3.5" />
                                      <span>مخفي</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelClass}>القيمة بالعربية</label>
                                  <input
                                    type="text"
                                    value={arVal}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          [field.arKey]: e.target.value,
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>القيمة بالإنجليزية</label>
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={enVal}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          [field.enKey]: e.target.value,
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </SettingGroupCard>
                  </div>
                )}

                {personalSubTab === 'hobbies' && (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="الهوايات والاهتمامات"
                      icon={<Heart className="h-4 w-4" />}
                    >
                      <SettingSwitch
                        label="إظهار قسم الهوايات"
                        checked={config.personal.showHobbies}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            personal: { ...config.personal, showHobbies: val },
                          })
                        }
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className={labelClass}>عنوان الهوايات (AR)</label>
                          <input
                            type="text"
                            value={config.personal.hobbiesTitleAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, hobbiesTitleAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>عنوان الهوايات (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.personal.hobbiesTitleEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                personal: { ...config.personal, hobbiesTitleEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 items-end">
                        <div>
                          <label className={labelClass}>هواية جديدة (AR)</label>
                          <input
                            type="text"
                            value={newHobbyAr}
                            onChange={(e) => setNewHobbyAr(e.target.value)}
                            placeholder="مثال: الشطرنج"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>هواية جديدة (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={newHobbyEn}
                            onChange={(e) => setNewHobbyEn(e.target.value)}
                            placeholder="e.g. Chess"
                            className={inputClass}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={addHobbyTag}
                          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 text-xs font-extrabold text-[#070b14] cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="h-4 w-4" />
                          <span>إضافة</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400">الهوايات (العربية)</div>
                          <div className="flex flex-wrap gap-1.5">
                            {config.personal.hobbiesAr.map((h, idx) => (
                              <span
                                key={`${h}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#070b14] px-2.5 py-1 text-xs font-semibold text-slate-200"
                              >
                                <span>{h}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      personal: {
                                        ...config.personal,
                                        hobbiesAr: config.personal.hobbiesAr.filter((_, i) => i !== idx),
                                      },
                                    })
                                  }
                                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                                  aria-label="حذف"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="text-[11px] font-bold text-slate-400">الهوايات (English)</div>
                          <div className="flex flex-wrap gap-1.5" dir="ltr">
                            {config.personal.hobbiesEn.map((h, idx) => (
                              <span
                                key={`${h}-${idx}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#070b14] px-2.5 py-1 text-xs font-semibold text-slate-200"
                              >
                                <span>{h}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    onChange({
                                      ...config,
                                      personal: {
                                        ...config.personal,
                                        hobbiesEn: config.personal.hobbiesEn.filter((_, i) => i !== idx),
                                      },
                                    })
                                  }
                                  className="text-slate-400 hover:text-rose-400 cursor-pointer"
                                  aria-label="Delete"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="حقول إضافية مخصصة"
                      subtitle="أضف أي معلومات أخرى تريد ظهورها في بطاقتك الشخصية"
                      icon={<Sparkles className="h-4 w-4" />}
                      rightSlot={
                        <button
                          type="button"
                          onClick={addPersonalCustomField}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-3.5 text-xs font-extrabold text-[#070b14] cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>إضافة حقل</span>
                        </button>
                      }
                    >
                      {config.personal.customFields.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/15 bg-[#070b14] p-6 text-center text-xs text-slate-400">
                          لا توجد حقول إضافية حالياً. اضغط «إضافة حقل» لإضافة معلومة جديدة.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {config.personal.customFields.map((cf) => (
                            <div
                              key={cf.id}
                              className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap gap-1.5">
                                  {PERSONAL_ICON_OPTIONS.map((ico) => (
                                    <button
                                      key={ico.value}
                                      type="button"
                                      onClick={() =>
                                        onChange({
                                          ...config,
                                          personal: {
                                            ...config.personal,
                                            customFields: config.personal.customFields.map((x) =>
                                              x.id === cf.id ? { ...x, icon: ico.value } : x
                                            ),
                                          },
                                        })
                                      }
                                      className={`rounded-lg border px-2 py-1 text-[10px] font-bold cursor-pointer ${
                                        cf.icon === ico.value
                                          ? 'border-[#00d2ff] bg-[#00d2ff]/15 text-white'
                                          : 'border-white/10 text-slate-400 hover:text-white'
                                      }`}
                                    >
                                      {ico.label}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.map((x) =>
                                            x.id === cf.id ? { ...x, visible: !x.visible } : x
                                          ),
                                        },
                                      })
                                    }
                                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-bold text-slate-300 cursor-pointer"
                                  >
                                    {cf.visible ? 'ظاهر' : 'مخفي'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.filter(
                                            (x) => x.id !== cf.id
                                          ),
                                        },
                                      })
                                    }
                                    aria-label="حذف الحقل"
                                    className="rounded-lg border border-rose-500/25 bg-rose-500/10 p-1.5 text-rose-300 cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className={labelClass}>عنوان الحقل (AR)</label>
                                  <input
                                    type="text"
                                    value={cf.labelAr}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.map((x) =>
                                            x.id === cf.id ? { ...x, labelAr: e.target.value } : x
                                          ),
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>عنوان الحقل (EN)</label>
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={cf.labelEn}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.map((x) =>
                                            x.id === cf.id ? { ...x, labelEn: e.target.value } : x
                                          ),
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>القيمة (AR)</label>
                                  <input
                                    type="text"
                                    value={cf.valueAr}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.map((x) =>
                                            x.id === cf.id ? { ...x, valueAr: e.target.value } : x
                                          ),
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>القيمة (EN)</label>
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={cf.valueEn}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        personal: {
                                          ...config.personal,
                                          customFields: config.personal.customFields.map((x) =>
                                            x.id === cf.id ? { ...x, valueEn: e.target.value } : x
                                          ),
                                        },
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </SettingGroupCard>
                  </div>
                )}

                {personalSubTab === 'tabs' && (
                  <SettingGroupCard
                    title="تنظيم التبويبين (معلوماتي / التواصل الاجتماعي)"
                    subtitle="اختر التبويب الافتراضي عند فتح الموقع وعدّل الأسماء والترتيب"
                    icon={<Layers className="h-4 w-4" />}
                  >
                    <div>
                      <label className={labelClass}>التبويب الافتراضي عند فتح الموقع</label>
                      <SegmentedControl
                        value={config.tabs.defaultTab}
                        onChange={(val) => {
                          onChange({
                            ...config,
                            tabs: { ...config.tabs, defaultTab: val },
                          });
                          onPreviewTab(val);
                        }}
                        options={config.tabs.items.map((t) => ({
                          value: t.id,
                          label: t.labelAr,
                        }))}
                      />
                    </div>

                    <div className="space-y-4">
                      {config.tabs.items.map((tab, idx) => (
                        <div
                          key={tab.id}
                          className="rounded-xl border border-white/[0.08] bg-[#070b14] p-5 space-y-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-white">
                              {tab.id === 'personal' ? 'تبويب معلوماتي (Personal Info)' : 'تبويب التواصل الاجتماعي (Socials)'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    tabs: {
                                      ...config.tabs,
                                      items: moveItem(config.tabs.items, idx, -1),
                                    },
                                  })
                                }
                                disabled={idx === 0}
                                aria-label="تحريك لأعلى"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    tabs: {
                                      ...config.tabs,
                                      items: moveItem(config.tabs.items, idx, 1),
                                    },
                                  })
                                }
                                disabled={idx === config.tabs.items.length - 1}
                                aria-label="تحريك لأسفل"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    tabs: {
                                      ...config.tabs,
                                      items: config.tabs.items.map((x) =>
                                        x.id === tab.id ? { ...x, visible: !x.visible } : x
                                      ),
                                    },
                                  })
                                }
                                className={`h-8 inline-flex items-center gap-1 rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer ${
                                  tab.visible
                                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                    : 'border-white/10 bg-white/[0.04] text-slate-400'
                                }`}
                              >
                                {tab.visible ? 'ظاهر' : 'مخفي'}
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className={labelClass}>اسم التبويب (AR)</label>
                              <input
                                type="text"
                                value={tab.labelAr}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    tabs: {
                                      ...config.tabs,
                                      items: config.tabs.items.map((x) =>
                                        x.id === tab.id ? { ...x, labelAr: e.target.value } : x
                                      ),
                                    },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>اسم التبويب (EN)</label>
                              <input
                                type="text"
                                dir="ltr"
                                value={tab.labelEn}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    tabs: {
                                      ...config.tabs,
                                      items: config.tabs.items.map((x) =>
                                        x.id === tab.id ? { ...x, labelEn: e.target.value } : x
                                      ),
                                    },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SettingGroupCard>
                )}
              </div>
            )}

            {/* 4. SOCIALS */}
            {section === 'socials' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SettingGroupCard
                  title="حسابات التواصل الاجتماعي"
                  subtitle="أضف منصاتك ورتّبها وخصص لون الأيقونة لكل منصة"
                  icon={<Share2 className="h-4 w-4" />}
                  rightSlot={
                    <button
                      type="button"
                      onClick={addSocial}
                      className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 text-xs font-extrabold text-[#070b14] cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>إضافة منصة</span>
                    </button>
                  }
                >
                  <div className="space-y-4">
                    {config.socials.map((item, idx) => {
                      const expanded = expandedSocialId === item.id;
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border border-white/[0.08] bg-[#070b14] overflow-hidden"
                        >
                          <div className="flex items-center justify-between gap-3 p-3.5">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedSocialId(expanded ? null : item.id)
                              }
                              className="flex items-center gap-3 min-w-0 flex-1 text-right cursor-pointer"
                            >
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                                style={{
                                  color: item.accentColor,
                                  backgroundColor: `${item.accentColor}22`,
                                }}
                              >
                                {renderSocialIcon(item.icon, 'w-5 h-5')}
                              </span>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-[13px] font-extrabold text-white truncate">
                                  {item.name}
                                </div>
                                <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                                  {item.subAr}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    socials: moveItem(config.socials, idx, -1),
                                  })
                                }
                                disabled={idx === 0}
                                aria-label="تحريك لأعلى"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    socials: moveItem(config.socials, idx, 1),
                                  })
                                }
                                disabled={idx === config.socials.length - 1}
                                aria-label="تحريك لأسفل"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    socials: config.socials.map((s) =>
                                      s.id === item.id ? { ...s, visible: !s.visible } : s
                                    ),
                                  })
                                }
                                className={`h-8 inline-flex items-center rounded-lg border px-2.5 text-[11px] font-bold cursor-pointer ${
                                  item.visible
                                    ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                                    : 'border-white/10 text-slate-400'
                                }`}
                              >
                                {item.visible ? 'ظاهر' : 'مخفي'}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onChange({
                                    ...config,
                                    socials: config.socials.filter((s) => s.id !== item.id),
                                  })
                                }
                                aria-label="حذف"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-rose-500/25 bg-rose-500/10 text-rose-300 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedSocialId(expanded ? null : item.id)
                                }
                                aria-label="تعديل"
                                className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/10 text-slate-300 cursor-pointer"
                              >
                                {expanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {expanded && (
                            <div className="border-t border-white/[0.07] p-5 space-y-5 bg-[#060912]">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <label className={labelClass}>اسم المنصة</label>
                                  <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        socials: config.socials.map((s) =>
                                          s.id === item.id ? { ...s, name: e.target.value } : s
                                        ),
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>الرابط الكامل</label>
                                  <input
                                    type="url"
                                    dir="ltr"
                                    value={item.href}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        socials: config.socials.map((s) =>
                                          s.id === item.id ? { ...s, href: e.target.value } : s
                                        ),
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>الوصف (AR)</label>
                                  <input
                                    type="text"
                                    value={item.subAr}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        socials: config.socials.map((s) =>
                                          s.id === item.id ? { ...s, subAr: e.target.value } : s
                                        ),
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                                <div>
                                  <label className={labelClass}>الوصف (EN)</label>
                                  <input
                                    type="text"
                                    dir="ltr"
                                    value={item.subEn}
                                    onChange={(e) =>
                                      onChange({
                                        ...config,
                                        socials: config.socials.map((s) =>
                                          s.id === item.id ? { ...s, subEn: e.target.value } : s
                                        ),
                                      })
                                    }
                                    className={inputClass}
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                                <div>
                                  <label className={labelClass}>الأيقونة</label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {SOCIAL_ICON_OPTIONS.map((ico) => (
                                      <button
                                        key={ico.value}
                                        type="button"
                                        onClick={() =>
                                          onChange({
                                            ...config,
                                            socials: config.socials.map((s) =>
                                              s.id === item.id ? { ...s, icon: ico.value } : s
                                            ),
                                          })
                                        }
                                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                                          item.icon === ico.value
                                            ? 'border-[#00d2ff] bg-[#00d2ff]/15 text-white'
                                            : 'border-white/10 text-slate-400 hover:text-white'
                                        }`}
                                      >
                                        {renderSocialIcon(ico.value, 'w-3.5 h-3.5')}
                                        <span>{ico.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                <ColorSwatchInput
                                  label="لون التمييز"
                                  value={item.accentColor}
                                  onChange={(val) =>
                                    onChange({
                                      ...config,
                                      socials: config.socials.map((s) =>
                                        s.id === item.id ? { ...s, accentColor: val } : s
                                      ),
                                    })
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </SettingGroupCard>
              </div>
            )}

            {/* 5. MESSAGES INBOX & DIRECT CHAT SETTINGS */}
            {section === 'messages' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SegmentedControl
                  value={messagesSubTab}
                  onChange={setMessagesSubTab}
                  options={[
                    {
                      value: 'inbox',
                      label: `صندوق الوارد والردود (${chatThreads.length})`,
                      icon: <Inbox className="h-3.5 w-3.5" />,
                    },
                    {
                      value: 'chatSettings',
                      label: 'إعدادات زر "تواصل معي" والترحيب',
                      icon: <MessageCircle className="h-3.5 w-3.5" />,
                    },
                  ]}
                />

                {messagesSubTab === 'inbox' ? (
                  <SettingGroupCard
                    title="استقبال رسائل الزوار والرد عليها"
                    subtitle="جميع المحادثات التي يبدأها الزوار من زر «تواصل معي» في واجهة الملف الشخصي تصل هنا"
                    icon={<Inbox className="h-4 w-4" />}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => onToggleChatOpen(true)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#00d2ff]/35 bg-[#00d2ff]/12 px-3.5 text-xs font-bold text-[#00d2ff] hover:bg-[#00d2ff]/20 cursor-pointer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>فتح نافذة الشات</span>
                      </button>
                    }
                  >
                    {chatThreads.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/15 bg-[#070b14] p-8 text-center space-y-3">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00d2ff]/12 text-[#00d2ff]">
                          <MessageCircle className="h-6 w-6" />
                        </div>
                        <div className="text-sm font-bold text-white">
                          صندوق الوارد فارغ حالياً
                        </div>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                          عندما يضغط الزائر على زر &quot;{config.chat.labelAr}&quot; في ملفك الشخصي ويرسل رسالة ستظهر هنا فوراً للرد عليها.
                        </p>
                        <button
                          type="button"
                          onClick={() => onToggleChatOpen(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 py-2.5 text-xs font-extrabold text-[#070b14] cursor-pointer"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>جرّب إرسال رسالة الآن</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 min-h-[450px]">
                        <div className="alaa-scroll-thin space-y-2 border-b md:border-b-0 md:border-l border-white/[0.08] pb-3 md:pb-0 md:pl-3 max-h-[450px] overflow-y-auto">
                          {chatThreads.map((thread) => {
                            const lastMsg = thread.messages[thread.messages.length - 1];
                            const lastPreview =
                              lastMsg?.text ||
                              (lastMsg?.attachment?.type === 'audio'
                                ? '🎙️ رسالة صوتية'
                                : lastMsg?.attachment?.type === 'file'
                                ? `📎 ${lastMsg.attachment.fileName}`
                                : lastMsg?.attachment?.type === 'link'
                                ? `🔗 ${lastMsg.attachment.title}`
                                : '');
                            const unread = thread.messages.filter(
                              (m) => m.sender === 'visitor' && !m.readByOwner
                            ).length;
                            const isSelected = thread.id === selectedThreadId;
                            return (
                              <div
                                key={thread.id}
                                className={`group flex items-start justify-between gap-2 rounded-xl border p-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[var(--brand)]/55 bg-[#131C30]'
                                    : 'border-white/[0.07] bg-[#0B101B] hover:border-white/20'
                                }`}
                                onClick={() => {
                                  setSelectedThreadId(thread.id);
                                  onMarkOwnerRead(thread.id);
                                }}
                              >
                                <div className="flex items-start gap-2.5 min-w-0">
                                  <span
                                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                                    style={{ backgroundColor: thread.avatarColor }}
                                  >
                                    {thread.visitorName.slice(0, 1).toUpperCase()}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-white truncate">
                                        {thread.visitorName}
                                      </span>
                                      {unread > 0 && (
                                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                      {lastPreview}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteThread(thread.id);
                                  }}
                                  aria-label="حذف المحادثة"
                                  className="opacity-60 hover:opacity-100 text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {selectedThread ? (
                          <div className="flex flex-col rounded-2xl border border-white/[0.09] bg-[#0B101B] text-[#F1F5F9] overflow-hidden h-[450px] shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
                            <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#101726] px-4 py-3 shrink-0">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-[#F8FAFC] truncate">
                                  {selectedThread.visitorName}
                                </div>
                                <div className="text-[11px] truncate mt-0.5">
                                  {replyDraft.trim().length > 0 ? (
                                    <span style={{ color: config.appearance.brandColor }}>
                                      جاري كتابة الرد...
                                    </span>
                                  ) : selectedThread.visitorTag ? (
                                    <span className="font-mono text-[#94A3B8]">
                                      {selectedThread.visitorTag}
                                    </span>
                                  ) : (
                                    <span className="text-[#64748B]">محادثة مباشرة</span>
                                  )}
                                </div>
                              </div>
                              <span className="text-[11px] font-medium text-[#64748B] tabular-nums">
                                {selectedThread.messages.length} رسالة
                              </span>
                            </div>

                            <div
                              className="alaa-scroll-thin flex-1 overflow-y-auto p-4 space-y-4"
                              style={{
                                background:
                                  'radial-gradient(ellipse 85% 45% at 50% 0%, rgba(30, 41, 59, 0.25), transparent 70%), #0B101B',
                              }}
                            >
                              {selectedThread.messages.map((msg) => {
                                const isOwner = msg.sender === 'owner';
                                const timeLabel = (() => {
                                  try {
                                    return new Date(msg.createdAt).toLocaleTimeString('ar-EG', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    });
                                  } catch {
                                    return '';
                                  }
                                })();
                                const cornerClass = isOwner
                                  ? 'rounded-ss-[4px]'
                                  : 'rounded-ee-[4px]';

                                return (
                                  <div
                                    key={msg.id}
                                    id={`owner-msg-${msg.id}`}
                                    className={`group alaa-msg-in flex flex-col gap-1.5 ${
                                      isOwner ? 'items-start' : 'items-end'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isOwner ? (
                                        <>
                                          <div className="h-6 w-6 shrink-0 rounded-full bg-[#161F30] border border-white/10 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-200">
                                            {config.hero.avatarImage ? (
                                              <img
                                                src={config.hero.avatarImage}
                                                alt={config.hero.brandName}
                                                referrerPolicy="no-referrer"
                                                className="h-full w-full object-cover"
                                              />
                                            ) : (
                                              <span>{config.hero.brandName.slice(0, 1).toUpperCase()}</span>
                                            )}
                                          </div>
                                          <span className="text-[11px] font-bold text-[#E2E8F0]">
                                            {config.hero.brandName} (أنت)
                                          </span>
                                          <span className="text-[10px] text-[#64748B] tabular-nums">
                                            {timeLabel}
                                          </span>
                                          <CheckCheck
                                            className="h-3 w-3"
                                            style={{
                                              color: msg.readByVisitor
                                                ? config.appearance.brandColor
                                                : '#64748B',
                                            }}
                                          />
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-[10px] text-[#64748B] tabular-nums">
                                            {timeLabel}
                                          </span>
                                          <span className="text-[11px] font-bold text-[#E2E8F0]">
                                            {selectedThread.visitorName}
                                          </span>
                                          <div
                                            className="h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                                            style={{ backgroundColor: selectedThread.avatarColor }}
                                          >
                                            {selectedThread.visitorName.slice(0, 1).toUpperCase()}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    <div
                                      className={`max-w-[88%] flex flex-col gap-1 ${
                                        isOwner ? 'items-start ps-8' : 'items-end pe-8'
                                      }`}
                                    >
                                      <div
                                        className={`flex items-end gap-1.5 max-w-full ${
                                          isOwner ? 'flex-row' : 'flex-row-reverse'
                                        }`}
                                      >
                                        <div className="space-y-1.5 min-w-0 max-w-full">
                                          {msg.attachment && (
                                            <ChatAttachmentCard
                                              attachment={msg.attachment}
                                              variant={isOwner ? 'accent' : 'dark'}
                                              cornerClass={cornerClass}
                                            />
                                          )}

                                          {(msg.text || msg.replyTo) && (
                                            <div
                                              style={
                                                isOwner
                                                  ? {
                                                      background: `linear-gradient(135deg, color-mix(in srgb, ${config.appearance.brandColor} 24%, #131C30), color-mix(in srgb, ${config.appearance.brandColor2} 22%, #0F172A))`,
                                                      borderColor: `color-mix(in srgb, ${config.appearance.brandColor} 40%, rgba(255,255,255,0.1))`,
                                                    }
                                                  : undefined
                                              }
                                              className={`rounded-2xl ${cornerClass} px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap break-words ${
                                                isOwner
                                                  ? 'border text-[#F8FAFC] shadow-[0_6px_18px_rgba(0,0,0,0.24)]'
                                                  : 'border border-white/[0.08] bg-[#161F30] text-[#E2E8F0] shadow-[0_4px_14px_rgba(0,0,0,0.2)]'
                                              }`}
                                            >
                                              {msg.replyTo && (
                                                <button
                                                  type="button"
                                                  onClick={() => scrollToOwnerMsg(msg.replyTo!.messageId)}
                                                  className="mb-2 flex w-full flex-col items-start rounded-lg border-s-2 bg-black/25 px-2.5 py-1.5 text-start hover:bg-black/35 transition-colors cursor-pointer"
                                                  style={{
                                                    borderInlineStartColor: config.appearance.brandColor,
                                                  }}
                                                >
                                                  <span
                                                    className="text-[10px] font-extrabold"
                                                    style={{ color: config.appearance.brandColor }}
                                                  >
                                                    {msg.replyTo.sender === 'owner'
                                                      ? `${config.hero.brandName} (أنت)`
                                                      : selectedThread.visitorName}
                                                  </span>
                                                  <span className="text-[11px] text-slate-300 line-clamp-1">
                                                    {msg.replyTo.text || msg.replyTo.attachmentLabel || ''}
                                                  </span>
                                                </button>
                                              )}

                                              {ownerEditingMsgId === msg.id ? (
                                                <div className="space-y-2 min-w-[190px]">
                                                  <input
                                                    type="text"
                                                    value={ownerEditingDraft}
                                                    onChange={(e) => setOwnerEditingDraft(e.target.value)}
                                                    onKeyDown={(e) => {
                                                      if (e.key === 'Enter' && ownerEditingDraft.trim()) {
                                                        e.preventDefault();
                                                        onEditMessage(
                                                          selectedThread.id,
                                                          msg.id,
                                                          ownerEditingDraft
                                                        );
                                                        setOwnerEditingMsgId(null);
                                                      } else if (e.key === 'Escape') {
                                                        setOwnerEditingMsgId(null);
                                                      }
                                                    }}
                                                    autoFocus
                                                    className="h-8 w-full rounded-lg border border-white/20 bg-[#0B101B] px-2.5 text-xs text-white focus:border-[var(--brand)] focus:outline-none"
                                                  />
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                      type="button"
                                                      onClick={() => setOwnerEditingMsgId(null)}
                                                      className="rounded-md border border-white/15 px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white cursor-pointer"
                                                    >
                                                      إلغاء
                                                    </button>
                                                    <button
                                                      type="button"
                                                      disabled={!ownerEditingDraft.trim()}
                                                      onClick={() => {
                                                        if (ownerEditingDraft.trim()) {
                                                          onEditMessage(
                                                            selectedThread.id,
                                                            msg.id,
                                                            ownerEditingDraft
                                                          );
                                                          setOwnerEditingMsgId(null);
                                                        }
                                                      }}
                                                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-extrabold text-[#070B14] disabled:opacity-40 cursor-pointer"
                                                      style={{
                                                        background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
                                                      }}
                                                    >
                                                      <Check className="h-3 w-3" />
                                                      <span>حفظ</span>
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <>
                                                  {msg.text && <span>{msg.text}</span>}
                                                  {msg.editedAt && (
                                                    <span className="block text-[9.5px] text-slate-400/85 mt-1">
                                                      تم التعديل
                                                    </span>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          )}
                                        </div>

                                        {ownerEditingMsgId !== msg.id && (
                                          <div
                                            className={`relative flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
                                              ownerReactionMsgId === msg.id ||
                                              ownerConfirmDeleteMsgId === msg.id
                                                ? 'opacity-100'
                                                : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
                                            }`}
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setOwnerConfirmDeleteMsgId(null);
                                                setOwnerReactionMsgId((prev) =>
                                                  prev === msg.id ? null : msg.id
                                                );
                                              }}
                                              title="تفاعل"
                                              aria-label="تفاعل برمز تعبيري"
                                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                            >
                                              <SmilePlus className="h-3.5 w-3.5" />
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => {
                                                setOwnerReactionMsgId(null);
                                                setOwnerConfirmDeleteMsgId(null);
                                                setOwnerReplyingTo(buildOwnerReplyRef(msg));
                                                ownerReplyInputRef.current?.focus();
                                              }}
                                              title="رد"
                                              aria-label="رد على الرسالة"
                                              className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                            >
                                              <Reply className="h-3.5 w-3.5" />
                                            </button>

                                            {isOwner && msg.text && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOwnerReactionMsgId(null);
                                                  setOwnerConfirmDeleteMsgId(null);
                                                  setOwnerEditingMsgId(msg.id);
                                                  setOwnerEditingDraft(msg.text);
                                                }}
                                                title="تعديل"
                                                aria-label="تعديل الرسالة"
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                              >
                                                <Pencil className="h-3 w-3" />
                                              </button>
                                            )}

                                            {ownerConfirmDeleteMsgId === msg.id ? (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  onDeleteMessage(selectedThread.id, msg.id);
                                                  setOwnerConfirmDeleteMsgId(null);
                                                }}
                                                className="inline-flex h-6 items-center rounded-md bg-rose-500/20 border border-rose-500/40 px-1.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                                              >
                                                حذف؟
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setOwnerReactionMsgId(null);
                                                  setOwnerConfirmDeleteMsgId(msg.id);
                                                }}
                                                title="حذف"
                                                aria-label="حذف الرسالة"
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                              </button>
                                            )}

                                            {ownerReactionMsgId === msg.id && (
                                              <div
                                                className={`alaa-msg-in absolute bottom-8 z-20 flex items-center gap-1 rounded-xl border border-white/15 bg-[#101726] p-1 shadow-xl ${
                                                  isOwner ? 'start-0' : 'end-0'
                                                }`}
                                              >
                                                {['❤️', '🔥', '👍', '😂', '😮', '🙏'].map((em) => {
                                                  const reacted = (
                                                    msg.reactions?.[em] ?? []
                                                  ).includes('owner');
                                                  return (
                                                    <button
                                                      key={em}
                                                      type="button"
                                                      onClick={() => {
                                                        onToggleMessageReaction(
                                                          selectedThread.id,
                                                          msg.id,
                                                          em,
                                                          'owner'
                                                        );
                                                        setOwnerReactionMsgId(null);
                                                      }}
                                                      className={`h-7 w-7 rounded-lg text-sm transition-transform hover:scale-110 cursor-pointer ${
                                                        reacted ? 'bg-white/15' : 'hover:bg-white/10'
                                                      }`}
                                                    >
                                                      {em}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {Object.entries(msg.reactions ?? {}).some(
                                        ([, r]) => r.length > 0
                                      ) && (
                                        <div className="flex flex-wrap items-center gap-1 px-1">
                                          {Object.entries(msg.reactions ?? {})
                                            .filter(([, reactors]) => reactors.length > 0)
                                            .map(([em, reactors]) => {
                                              const mine = reactors.includes('owner');
                                              return (
                                                <button
                                                  key={em}
                                                  type="button"
                                                  onClick={() =>
                                                    onToggleMessageReaction(
                                                      selectedThread.id,
                                                      msg.id,
                                                      em,
                                                      'owner'
                                                    )
                                                  }
                                                  style={
                                                    mine
                                                      ? {
                                                          borderColor: config.appearance.brandColor,
                                                          backgroundColor: `color-mix(in srgb, ${config.appearance.brandColor} 16%, #101726)`,
                                                        }
                                                      : undefined
                                                  }
                                                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                                                    mine
                                                      ? 'text-white'
                                                      : 'border-white/10 bg-[#161F30] text-slate-300 hover:border-white/25'
                                                  }`}
                                                >
                                                  <span>{em}</span>
                                                  <span className="tabular-nums text-[10px]">
                                                    {reactors.length}
                                                  </span>
                                                </button>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {replyDraft.trim().length > 0 && (
                                <div className="alaa-msg-in flex items-center justify-start gap-2 pt-1">
                                  <div className="h-6 w-6 shrink-0 rounded-full bg-[#161F30] border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-300">
                                    {config.hero.brandName.slice(0, 1).toUpperCase()}
                                  </div>
                                  <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-ss-[4px] border border-white/[0.09] bg-[#161F30] px-3 py-2">
                                    <span
                                      className="alaa-typing-dot h-1.5 w-1.5 rounded-full"
                                      style={{
                                        backgroundColor: config.appearance.brandColor,
                                        animationDelay: '0ms',
                                      }}
                                    />
                                    <span
                                      className="alaa-typing-dot h-1.5 w-1.5 rounded-full bg-slate-300"
                                      style={{ animationDelay: '180ms' }}
                                    />
                                    <span
                                      className="alaa-typing-dot h-1.5 w-1.5 rounded-full bg-slate-500"
                                      style={{ animationDelay: '360ms' }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 overflow-x-auto border-t border-white/[0.06] bg-[#0D1320] px-3 py-2 shrink-0">
                              {[
                                'أهلاً بك! يسعدني مساعدتك 👋',
                                'تم استلام رسالتك وسأرد عليك بالتفصيل قريباً',
                                'تفضل بإرسال تفاصيل المشروع أو الفكرة هنا',
                              ].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setReplyDraft(preset)}
                                  className="shrink-0 rounded-lg border border-white/[0.09] bg-[#161F30] px-2.5 py-1 text-[11px] text-slate-300 hover:border-[var(--brand)] hover:text-white transition-colors cursor-pointer"
                                >
                                  {preset}
                                </button>
                              ))}
                            </div>

                            <input
                              ref={ownerAttachInputRef}
                              type="file"
                              onChange={handleOwnerFileAttach}
                              className="hidden"
                            />

                            <form
                              onSubmit={handleOwnerReplySubmit}
                              className="border-t border-white/[0.07] bg-[#101726] p-3 shrink-0 space-y-2"
                            >
                              {ownerReplyingTo && (
                                <div
                                  className="alaa-msg-in flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] border-s-2 bg-[#0B101B] px-3 py-1.5"
                                  style={{ borderInlineStartColor: config.appearance.brandColor }}
                                >
                                  <div className="min-w-0">
                                    <div
                                      className="text-[10.5px] font-extrabold"
                                      style={{ color: config.appearance.brandColor }}
                                    >
                                      الرد على{' '}
                                      {ownerReplyingTo.sender === 'owner'
                                        ? `${config.hero.brandName} (أنت)`
                                        : selectedThread.visitorName}
                                    </div>
                                    <div className="text-[11px] text-slate-300 truncate">
                                      {ownerReplyingTo.text || ownerReplyingTo.attachmentLabel || ''}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setOwnerReplyingTo(null)}
                                    aria-label="إلغاء الرد"
                                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}

                              {isOwnerRecording ? (
                                <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="font-mono text-xs font-bold text-rose-200 tabular-nums shrink-0">
                                      {Math.floor(ownerRecordSec / 60)}:
                                      {(ownerRecordSec % 60).toString().padStart(2, '0')}
                                    </span>
                                    <div className="flex items-center gap-[3px] h-4" aria-hidden="true">
                                      {[0.45, 0.72, 1, 0.85, 0.6, 0.95, 0.7].map((mult, idx) => (
                                        <span
                                          key={idx}
                                          className="w-[3px] rounded-full bg-rose-400 transition-all duration-100"
                                          style={{
                                            height: `${Math.max(
                                              24,
                                              Math.min(100, Math.round(ownerMicLevel * mult))
                                            )}%`,
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={handleCancelOwnerVoiceRecord}
                                      aria-label="إلغاء التسجيل"
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-[#0B101B] text-slate-300 hover:text-white cursor-pointer"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleStopAndSendOwnerVoiceRecord}
                                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-rose-500 px-2.5 text-[11px] font-bold text-white hover:bg-rose-600 cursor-pointer"
                                    >
                                      <Square className="h-2.5 w-2.5 fill-current" />
                                      <span>إرسال</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#0B101B] px-3 py-1.5 focus-within:border-[var(--brand)]">
                                  <input
                                    ref={ownerReplyInputRef}
                                    type="text"
                                    value={replyDraft}
                                    onChange={(e) => setReplyDraft(e.target.value)}
                                    placeholder="اكتب ردك هنا واضغط Enter..."
                                    className="h-7 flex-1 min-w-0 bg-transparent text-xs text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleStartOwnerVoiceRecord}
                                    title="تسجيل رسالة صوتية بالميكروفون"
                                    aria-label="تسجيل صوتي"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:text-[var(--brand)] transition-colors cursor-pointer"
                                  >
                                    <Mic className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => ownerAttachInputRef.current?.click()}
                                    aria-label="إرفاق ملف"
                                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#64748B] hover:text-white transition-colors cursor-pointer"
                                  >
                                    <Paperclip className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="submit"
                                    disabled={!replyDraft.trim()}
                                    aria-label="إرسال الرد"
                                    style={
                                      replyDraft.trim()
                                        ? {
                                            background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
                                          }
                                        : undefined
                                    }
                                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all cursor-pointer ${
                                      replyDraft.trim()
                                        ? 'text-[#070B14]'
                                        : 'bg-white/[0.06] text-[#475569]'
                                    }`}
                                  >
                                    <Send className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              )}
                            </form>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </SettingGroupCard>
                ) : (
                  <div className="space-y-7">
                    <SettingGroupCard
                      title="تخصيص زر ونظام «تواصل معي»"
                      subtitle="تخصيص زر الشات الموجود أسفل اسمك في البروفايل ورسالة الترحيب التلقائية"
                      icon={<MessageCircle className="h-4 w-4" />}
                    >
                      <SettingSwitch
                        label="تفعيل زر الشات في واجهة الملف الشخصي"
                        checked={config.chat.enabled}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            chat: { ...config.chat, enabled: val },
                          })
                        }
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className={labelClass}>نص الزر (AR)</label>
                          <input
                            type="text"
                            value={config.chat.labelAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, labelAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>نص الزر (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.chat.labelEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, labelEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>عنوان نافذة الشات (AR)</label>
                          <input
                            type="text"
                            value={config.chat.headerTitleAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, headerTitleAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>عنوان نافذة الشات (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.chat.headerTitleEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, headerTitleEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الوصف الفرعي بالرأس (AR)</label>
                          <input
                            type="text"
                            value={config.chat.headerSubAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, headerSubAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className={labelClass}>الوصف الفرعي بالرأس (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.chat.headerSubEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, headerSubEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>رسالة الترحيب التلقائية (AR)</label>
                          <input
                            type="text"
                            value={config.chat.welcomeAr}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, welcomeAr: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className={labelClass}>رسالة الترحيب التلقائية (EN)</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={config.chat.welcomeEn}
                            onChange={(e) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, welcomeEn: e.target.value },
                              })
                            }
                            className={inputClass}
                          />
                        </div>
                      </div>
                    </SettingGroupCard>

                    <SettingGroupCard
                      title="حالة التواجد والرد التلقائي الذكي"
                      subtitle="اعرض حالتك داخل نافذة المحادثة وأرسل رداً ذكياً تلقائياً بعد كتابة الزائر"
                      icon={<Sparkles className="h-4 w-4" />}
                    >
                      <div>
                        <label className={labelClass}>حالة التواجد في نافذة الشات</label>
                        <SegmentedControl
                          value={config.chat.availabilityStatus ?? 'online'}
                          onChange={(val: 'online' | 'busy' | 'away') =>
                            onChange({
                              ...config,
                              chat: { ...config.chat, availabilityStatus: val },
                            })
                          }
                          options={[
                            { value: 'online', label: 'متاح الآن' },
                            { value: 'busy', label: 'مشغول' },
                            { value: 'away', label: 'غير متاح مؤقتاً' },
                          ]}
                        />
                      </div>

                      <SettingSwitch
                        label="تفعيل الرد التلقائي الذكي (Auto-Reply)"
                        hint="عند إرسال الزائر رسالة يظهر مؤشر الكتابة ثم يُرسل ردك تلقائياً"
                        checked={config.chat.autoReplyEnabled ?? false}
                        onChange={(val) =>
                          onChange({
                            ...config,
                            chat: { ...config.chat, autoReplyEnabled: val },
                          })
                        }
                      />

                      {(config.chat.autoReplyEnabled ?? false) && (
                        <div className="space-y-4 pt-1">
                          <RangeSliderField
                            label="تأخير إرسال الرد (محاكاة الكتابة)"
                            valueText={`${config.chat.autoReplyDelaySec ?? 2} ثواني`}
                            min={1}
                            max={10}
                            step={1}
                            value={config.chat.autoReplyDelaySec ?? 2}
                            onChange={(val) =>
                              onChange({
                                ...config,
                                chat: { ...config.chat, autoReplyDelaySec: val },
                              })
                            }
                          />
                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className={labelClass}>نص الرد التلقائي (AR)</label>
                              <input
                                type="text"
                                value={config.chat.autoReplyTextAr}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    chat: { ...config.chat, autoReplyTextAr: e.target.value },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                            <div>
                              <label className={labelClass}>نص الرد التلقائي (EN)</label>
                              <input
                                type="text"
                                dir="ltr"
                                value={config.chat.autoReplyTextEn}
                                onChange={(e) =>
                                  onChange({
                                    ...config,
                                    chat: { ...config.chat, autoReplyTextEn: e.target.value },
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </SettingGroupCard>
                  </div>
                )}
              </div>
            )}

            {/* 6. SECURITY & PASSWORD LOCK */}
            {section === 'security' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SettingGroupCard
                  title="حماية زر الإعدادات وكلمة المرور"
                  subtitle="قفل لوحة الإعدادات بكلمة سر لمنع التعديل غير المصرح به مع إمكانية تغييرها في أي وقت"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  rightSlot={
                    onLockNow && config.security.requirePassword ? (
                      <button
                        type="button"
                        onClick={onLockNow}
                        className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/35 bg-amber-500/12 px-3.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 cursor-pointer"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>قفل الإعدادات الآن</span>
                      </button>
                    ) : undefined
                  }
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SettingSwitch
                      label="طلب كلمة سر عند فتح الإعدادات"
                      hint="تظهر بوابة تحقق احترافية عند الضغط على Settings"
                      checked={config.security.requirePassword}
                      onChange={(val) => {
                        onChange({
                          ...config,
                          security: { ...config.security, requirePassword: val },
                        });
                        setPasswordStatus({
                          type: 'success',
                          text: val
                            ? 'تم تفعيل حماية الإعدادات بكلمة المرور.'
                            : 'تم تعطيل طلب كلمة المرور عند فتح الإعدادات.',
                        });
                      }}
                    />
                    <SettingSwitch
                      label="تذكر فتح القفل خلال الجلسة"
                      hint="لن تُسأل مجدداً حتى إغلاق التبويب أو القفل يدوياً"
                      checked={config.security.rememberSession}
                      onChange={(val) =>
                        onChange({
                          ...config,
                          security: { ...config.security, rememberSession: val },
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>تلميح كلمة المرور (اختياري — يظهر في شاشة القفل)</label>
                    <input
                      type="text"
                      value={config.security.passwordHint}
                      onChange={(e) =>
                        onChange({
                          ...config,
                          security: { ...config.security, passwordHint: e.target.value },
                        })
                      }
                      placeholder="مثال: رقم هاتفي المفضل أو كلمة سر خاصة"
                      className={inputClass}
                    />
                  </div>
                </SettingGroupCard>

                <SettingGroupCard
                  title="تغيير كلمة مرور الإعدادات"
                  subtitle="كلمة المرور الافتراضية المبدئية هي 1234 — يُنصح بتغييرها لكلمة مرور قوية"
                  icon={<KeyRound className="h-4 w-4" />}
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowSecurityPasswords((prev) => !prev)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11px] font-bold text-slate-300 hover:border-[#00d2ff]/50 cursor-pointer"
                    >
                      {showSecurityPasswords ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5" />
                          <span>إخفاء</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>إظهار</span>
                        </>
                      )}
                    </button>
                  }
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (
                        config.security.requirePassword &&
                        config.security.password &&
                        currentPasswordInput !== config.security.password
                      ) {
                        setPasswordStatus({
                          type: 'error',
                          text: 'كلمة المرور الحالية غير صحيحة.',
                        });
                        return;
                      }
                      if (newPasswordInput.trim().length < 3) {
                        setPasswordStatus({
                          type: 'error',
                          text: 'يجب أن تتكون كلمة المرور الجديدة من 3 أحرف أو أرقام على الأقل.',
                        });
                        return;
                      }
                      if (newPasswordInput !== confirmPasswordInput) {
                        setPasswordStatus({
                          type: 'error',
                          text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين.',
                        });
                        return;
                      }
                      onChange({
                        ...config,
                        security: {
                          ...config.security,
                          requirePassword: true,
                          password: newPasswordInput,
                        },
                      });
                      setCurrentPasswordInput('');
                      setNewPasswordInput('');
                      setConfirmPasswordInput('');
                      setPasswordStatus({
                        type: 'success',
                        text: 'تم تحديث كلمة المرور بنجاح وحفظها فوراً!',
                      });
                      onNotify('تم تحديث كلمة مرور الإعدادات بنجاح');
                    }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className={labelClass}>كلمة المرور الحالية</label>
                        <input
                          type={showSecurityPasswords ? 'text' : 'password'}
                          dir="ltr"
                          value={currentPasswordInput}
                          onChange={(e) => {
                            setCurrentPasswordInput(e.target.value);
                            setPasswordStatus(null);
                          }}
                          placeholder="••••"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>كلمة المرور الجديدة</label>
                        <input
                          type={showSecurityPasswords ? 'text' : 'password'}
                          dir="ltr"
                          required
                          value={newPasswordInput}
                          onChange={(e) => {
                            setNewPasswordInput(e.target.value);
                            setPasswordStatus(null);
                          }}
                          placeholder="كلمة السر الجديدة"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>تأكيد كلمة المرور</label>
                        <input
                          type={showSecurityPasswords ? 'text' : 'password'}
                          dir="ltr"
                          required
                          value={confirmPasswordInput}
                          onChange={(e) => {
                            setConfirmPasswordInput(e.target.value);
                            setPasswordStatus(null);
                          }}
                          placeholder="أعد كتابتها"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {newPasswordInput.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">قوة كلمة المرور الجديدة</span>
                          <span className="font-bold text-slate-200">
                            {passwordStrength <= 1
                              ? 'ضعيفة'
                              : passwordStrength === 2
                              ? 'متوسطة'
                              : passwordStrength === 3
                              ? 'جيدة'
                              : 'قوية جداً'}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[1, 2, 3, 4].map((lvl) => (
                            <span
                              key={lvl}
                              className={`h-1.5 rounded-full transition-colors ${
                                lvl <= passwordStrength
                                  ? passwordStrength <= 1
                                    ? 'bg-rose-500'
                                    : passwordStrength === 2
                                    ? 'bg-amber-400'
                                    : 'bg-emerald-400'
                                  : 'bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {passwordStatus && (
                      <div
                        className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold ${
                          passwordStatus.type === 'success'
                            ? 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
                            : 'border-rose-500/35 bg-rose-500/12 text-rose-300'
                        }`}
                      >
                        {passwordStatus.text}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <span className="text-xs text-slate-400">
                        كلمة المرور المحفوظة حالياً:{' '}
                        <span className="font-mono text-slate-200">
                          {showSecurityPasswords
                            ? config.security.password
                            : '•'.repeat(Math.max(4, config.security.password.length))}
                        </span>
                      </span>
                      <button
                        type="submit"
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 text-xs font-extrabold text-[#070b14] cursor-pointer"
                      >
                        <KeyRound className="h-4 w-4" />
                        <span>حفظ كلمة المرور الجديدة</span>
                      </button>
                    </div>
                  </form>
                </SettingGroupCard>
              </div>
            )}

            {/* 7. SYSTEM & FOOTER */}
            {section === 'system' && (
              <div className="space-y-8 max-w-3xl mx-auto">
                <SettingGroupCard
                  title="الحالة والتذييل"
                  icon={<Sliders className="h-4 w-4" />}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {STATUS_PRESETS.map((preset) => {
                      const selected = config.footer.statusAr === preset.ar;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            onChange({
                              ...config,
                              footer: {
                                ...config.footer,
                                showStatus: true,
                                statusEn: preset.en,
                                statusAr: preset.ar,
                                statusDotColor: preset.color,
                              },
                            })
                          }
                          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-right text-xs font-bold transition-all cursor-pointer ${
                            selected
                              ? 'border-[#00d2ff] bg-[#00d2ff]/12 text-white'
                              : 'border-white/[0.08] bg-[#070b14] text-slate-300 hover:border-white/20'
                          }`}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <SettingSwitch
                      label="إظهار التذييل"
                      checked={config.footer.visible}
                      onChange={(val) =>
                        onChange({
                          ...config,
                          footer: { ...config.footer, visible: val },
                        })
                      }
                    />
                    <SettingSwitch
                      label="نبض النقطة المتصلة"
                      checked={config.footer.statusPulse}
                      onChange={(val) =>
                        onChange({
                          ...config,
                          footer: { ...config.footer, statusPulse: val },
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    <div>
                      <label className={labelClass}>اسم الحقوق</label>
                      <input
                        type="text"
                        value={config.footer.copyrightName}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            footer: { ...config.footer, copyrightName: e.target.value },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>التوقيع السفلي</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={config.footer.signature}
                        onChange={(e) =>
                          onChange({
                            ...config,
                            footer: { ...config.footer, signature: e.target.value },
                          })
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </SettingGroupCard>

                <SettingGroupCard
                  title="النسخ الاحتياطي (JSON)"
                  icon={<FileText className="h-4 w-4" />}
                >
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-l from-[#00d2ff] to-[#3a7bd5] px-4 text-xs font-extrabold text-[#070b14] cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>تصدير نسخة الإعدادات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/15 bg-[#070b14] px-4 text-xs font-semibold text-slate-200 hover:border-[#00d2ff]/50 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      <span>استيراد ملف JSON</span>
                    </button>
                  </div>
                </SettingGroupCard>
              </div>
            )}
          </div>

          {/* Right Live Preview Stage */}
          {(showLivePreview || mobilePane === 'preview') && (
            <aside
              className={`${
                mobilePane === 'preview' ? 'flex' : 'hidden lg:flex'
              } ${showLivePreview ? '' : 'lg:hidden'} flex-col border-r border-white/[0.07] bg-[#04060c] min-h-0`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.07] bg-[#090e1a] px-4 py-3 shrink-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-[#00d2ff]" />
                  <span>المعاينة الحية</span>
                </span>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-[#050810] p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold cursor-pointer ${
                        previewDevice === 'desktop'
                          ? 'bg-white/12 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Monitor className="h-3 w-3" />
                      <span>ويب</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`inline-flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-bold cursor-pointer ${
                        previewDevice === 'mobile'
                          ? 'bg-white/12 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>جوال</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onPreviewTheme(theme === 'dark' ? 'light' : 'dark')}
                    aria-label="تبديل المظهر"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-[#050810] text-slate-300 hover:border-[#00d2ff]/50 cursor-pointer"
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-3.5 w-3.5 text-amber-400" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-sky-400" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewLang(lang === 'en' ? 'ar' : 'en')}
                    className="inline-flex h-7 items-center justify-center rounded-lg border border-white/10 bg-[#050810] px-2 text-[11px] font-mono font-bold text-slate-200 hover:border-[#00d2ff]/50 cursor-pointer"
                  >
                    {lang === 'ar' ? 'AR' : 'EN'}
                  </button>
                </div>
              </div>

              <div className="alaa-scroll-thin flex-1 overflow-y-auto p-4 flex justify-center items-start">
                {previewDevice === 'desktop' ? (
                  <div className="w-full rounded-2xl overflow-hidden border border-white/12 shadow-[0_24px_60px_rgba(0,0,0,0.65)] bg-[#0a0e17]">
                    <div
                      dir="ltr"
                      className="flex h-8 items-center justify-between border-b border-white/[0.08] bg-[#0e1422] px-3"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                      </div>
                      <div className="rounded-md border border-white/[0.08] bg-[#070b13] px-3 py-0.5 text-[10px] font-mono text-slate-400">
                        alaadev.online/#{activeTab}
                      </div>
                      <div className="w-8" />
                    </div>
                    <div className="alaa-scroll-thin max-h-[calc(100vh-12rem)] overflow-y-auto relative">
                      <SiteView
                        config={config}
                        theme={theme}
                        lang={lang}
                        activeTab={activeTab}
                        onToggleTheme={() =>
                          onPreviewTheme(theme === 'dark' ? 'light' : 'dark')
                        }
                        onToggleLang={() =>
                          onPreviewLang(lang === 'en' ? 'ar' : 'en')
                        }
                        onSelectTab={onPreviewTab}
                        onNotify={onNotify}
                        activeThread={activeVisitorThread}
                        chatOpen={chatOpen}
                        onToggleChatOpen={onToggleChatOpen}
                        onSendVisitorMessage={onSendVisitorMessage}
                        onStartNewChatSession={onStartNewChatSession}
                        onMarkVisitorRead={onMarkVisitorRead}
                        onToggleMessageReaction={onToggleMessageReaction}
                        onEditMessage={onEditMessage}
                        onDeleteMessage={onDeleteMessage}
                        ownerTyping={ownerTyping}
                        isPreview
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-[345px] max-w-full rounded-[38px] border-[6px] border-[#1a2336] bg-[#050811] p-1.5 shadow-[0_28px_70px_rgba(0,0,0,0.75)]">
                    <div className="rounded-[30px] overflow-hidden border border-white/10 bg-[#0a0e17] flex flex-col">
                      <div className="flex h-7 items-center justify-center bg-black/50">
                        <div className="h-3.5 w-20 rounded-full bg-black border border-white/10" />
                      </div>
                      <div className="alaa-scroll-thin max-h-[calc(100vh-15rem)] overflow-y-auto relative">
                        <SiteView
                          config={config}
                          theme={theme}
                          lang={lang}
                          activeTab={activeTab}
                          onToggleTheme={() =>
                            onPreviewTheme(theme === 'dark' ? 'light' : 'dark')
                          }
                          onToggleLang={() =>
                            onPreviewLang(lang === 'en' ? 'ar' : 'en')
                          }
                          onSelectTab={onPreviewTab}
                          onNotify={onNotify}
                          activeThread={activeVisitorThread}
                          chatOpen={chatOpen}
                          onToggleChatOpen={onToggleChatOpen}
                          onSendVisitorMessage={onSendVisitorMessage}
                          onStartNewChatSession={onStartNewChatSession}
                          onMarkVisitorRead={onMarkVisitorRead}
                          onToggleMessageReaction={onToggleMessageReaction}
                          onEditMessage={onEditMessage}
                          onDeleteMessage={onDeleteMessage}
                          ownerTyping={ownerTyping}
                          isPreview
                        />
                      </div>
                      <div className="flex h-5 items-center justify-center bg-black/30">
                        <div className="h-1 w-24 rounded-full bg-white/25" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
