import { ChangeEvent, FormEvent, KeyboardEvent as ReactKeyboardEvent, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  FileText,
  Link2,
  Mic,
  Paperclip,
  Pencil,
  Reply,
  RotateCcw,
  Send,
  Smile,
  SmilePlus,
  Square,
  Trash2,
  User,
  X,
} from 'lucide-react';
import {
  ChatAttachment,
  ChatMessage,
  ChatReplyRef,
  ChatThread,
  Lang,
  SiteConfig,
  Theme,
} from '../types/siteConfig';
import { ActiveVoiceRecorder, startRealVoiceRecording } from '../utils/voiceRecorder';
import { ChatAttachmentCard } from './ChatAttachmentCard';

interface ChatWidgetProps {
  config: SiteConfig;
  theme: Theme;
  lang: Lang;
  activeThread: ChatThread | null;
  isOpen: boolean;
  onClose: () => void;
  onSendVisitorMessage: (
    visitorName: string,
    visitorTag: string,
    text: string,
    attachment?: ChatAttachment,
    replyTo?: ChatReplyRef
  ) => void;
  onStartNewSession: () => void;
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

const EMOJI_CHOICES = ['👋', '😊', '🚀', '💡', '🔥', '🎮', '🤝', '❤️', '✨', '👍', '🎉', '🙏'];
const QUICK_REACTION_EMOJIS = ['❤️', '🔥', '👍', '😂', '😮', '🙏'];

function formatTime(iso: string, lang: Lang): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '09:17 AM';
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${Math.max(1, bytes)}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ChatWidget({
  config,
  lang,
  activeThread,
  isOpen,
  onClose,
  onSendVisitorMessage,
  onStartNewSession,
  onMarkVisitorRead,
  onToggleMessageReaction,
  onEditMessage,
  onDeleteMessage,
  ownerTyping = false,
  isPreview = false,
}: ChatWidgetProps) {
  const [visitorName, setVisitorName] = useState(
    () => activeThread?.visitorName ?? ''
  );
  const [visitorTag, setVisitorTag] = useState(
    () => activeThread?.visitorTag ?? ''
  );
  const [showIdentityEditor, setShowIdentityEditor] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkImageUrl, setLinkImageUrl] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [liveMicLevel, setLiveMicLevel] = useState(24);
  const [micError, setMicError] = useState('');
  const [draft, setDraft] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatReplyRef | null>(null);
  const [reactionMenuMsgId, setReactionMenuMsgId] = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState('');
  const [confirmDeleteMsgId, setConfirmDeleteMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const voiceRecorderRef = useRef<ActiveVoiceRecorder | null>(null);

  useEffect(() => {
    if (activeThread) {
      setVisitorName(activeThread.visitorName);
      setVisitorTag(activeThread.visitorTag);
      setShowIdentityEditor(false);
    }
    setReplyingTo(null);
    setReactionMenuMsgId(null);
    setEditingMsgId(null);
    setConfirmDeleteMsgId(null);
  }, [activeThread?.id]);

  useEffect(() => {
    if (isOpen && activeThread) {
      const hasUnread = activeThread.messages.some(
        (m) => m.sender === 'owner' && !m.readByVisitor
      );
      if (hasUnread) {
        onMarkVisitorRead(activeThread.id);
      }
    }
  }, [isOpen, activeThread, onMarkVisitorRead]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, activeThread?.messages.length, draft.length, ownerTyping]);

  useEffect(() => {
    if (!isOpen || isPreview) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, isPreview, onClose]);

  useEffect(() => {
    return () => {
      voiceRecorderRef.current?.cancel();
      voiceRecorderRef.current = null;
    };
  }, []);

  if (!config.chat.enabled || !isOpen) return null;

  const isAr = lang === 'ar';
  const brand1 = config.appearance.brandColor;
  const brand2 = config.appearance.brandColor2;
  const fallbackVisitorName = isAr ? 'زائر الموقع' : 'User name';
  const displayVisitorName = visitorName.trim() || fallbackVisitorName;
  const partnerName = config.hero.brandName || (isAr ? 'شريك المحادثة' : 'Chat partner');
  const headerTitle =
    (isAr ? config.chat.headerTitleAr : config.chat.headerTitleEn) || partnerName;
  const headerSub =
    (isAr ? config.chat.headerSubAr : config.chat.headerSubEn) ||
    (isAr ? 'متاح للرد السريع' : 'Ready to reply');
  const welcomeText = isAr ? config.chat.welcomeAr : config.chat.welcomeEn;
  const isTyping = draft.trim().length > 0;

  const sendMessage = (text: string, attachment?: ChatAttachment) => {
    onSendVisitorMessage(
      displayVisitorName,
      visitorTag.trim(),
      text,
      attachment,
      replyingTo ?? undefined
    );
    setReplyingTo(null);
  };

  const buildReplyRef = (msg: ChatMessage): ChatReplyRef => {
    let attachmentLabel: string | undefined;
    if (msg.attachment?.type === 'audio') {
      attachmentLabel = isAr ? '🎙️ رسالة صوتية' : '🎙️ Voice note';
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

  const scrollToMessage = (messageId: string) => {
    const el = document.getElementById(`chat-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const clean = draft.trim();
    if (!clean) return;
    sendMessage(clean);
    setDraft('');
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
  };

  const handleInputKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  };

  const handleFilePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      sendMessage('', {
        type: 'file',
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileUrl: dataUrl || undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowAttachMenu(false);
  };

  const handleImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      if (dataUrl) {
        setLinkImageUrl(dataUrl);
        if (!linkTitle.trim()) {
          setLinkTitle(file.name.replace(/\.[^.]+$/, ''));
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendLinkCard = (e: FormEvent) => {
    e.preventDefault();
    if (!linkTitle.trim() && !linkUrl.trim() && !linkImageUrl) return;
    sendMessage('', {
      type: 'link',
      title: linkTitle.trim() || (isAr ? 'مرفق مشارك' : 'Shared attachment'),
      url: linkUrl.trim(),
      imageUrl: linkImageUrl || undefined,
    });
    setLinkTitle('');
    setLinkUrl('');
    setLinkImageUrl('');
    setShowLinkForm(false);
    setShowAttachMenu(false);
  };

  const handleStartVoiceRecord = async () => {
    setShowAttachMenu(false);
    setShowEmojiPicker(false);
    setMicError('');
    setRecordSeconds(0);
    setLiveMicLevel(24);

    try {
      const active = await startRealVoiceRecording((sec, level) => {
        setRecordSeconds(sec);
        setLiveMicLevel(level);
      });
      voiceRecorderRef.current = active;
      setIsRecording(true);
    } catch {
      setIsRecording(false);
      setMicError(
        isAr
          ? 'تعذر تشغيل الميكروفون. تأكد من توصيل المايك والسماح بصلاحية الصوت في المتصفح.'
          : 'Could not access microphone. Please allow mic permission in your browser.'
      );
    }
  };

  const handleCancelVoiceRecord = () => {
    voiceRecorderRef.current?.cancel();
    voiceRecorderRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
  };

  const handleStopAndSendVoiceRecord = async () => {
    const active = voiceRecorderRef.current;
    voiceRecorderRef.current = null;
    setIsRecording(false);
    setRecordSeconds(0);
    if (!active) return;
    const result = await active.stopAndSave();
    if (result) {
      sendMessage('', {
        type: 'audio',
        durationSec: result.durationSec,
        audioUrl: result.audioUrl,
        waveform: result.waveform,
      });
    }
  };

  const availability = config.chat.availabilityStatus ?? 'online';
  const availabilityColor =
    availability === 'online'
      ? '#10b981'
      : availability === 'busy'
      ? '#f59e0b'
      : '#94a3b8';
  const availabilityText =
    availability === 'online'
      ? isAr
        ? 'متاح الآن'
        : 'Online'
      : availability === 'busy'
      ? isAr
        ? 'مشغول'
        : 'Busy'
      : isAr
      ? 'غير متاح'
      : 'Away';

  const messages = activeThread?.messages ?? [];
  type MessageGroup = {
    id: string;
    sender: 'owner' | 'visitor';
    timestamp: string;
    items: ChatMessage[];
  };

  const groups: MessageGroup[] = [];
  if (welcomeText) {
    groups.push({
      id: 'welcome-group',
      sender: 'owner',
      timestamp: messages[0]?.createdAt ?? new Date().toISOString(),
      items: [
        {
          id: 'welcome-msg',
          sender: 'owner',
          text: welcomeText,
          createdAt: messages[0]?.createdAt ?? new Date().toISOString(),
          readByOwner: true,
          readByVisitor: true,
        },
      ],
    });
  }

  for (const msg of messages) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.sender === msg.sender) {
      lastGroup.items.push(msg);
    } else {
      groups.push({
        id: `grp-${msg.id}`,
        sender: msg.sender,
        timestamp: msg.createdAt,
        items: [msg],
      });
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={headerTitle}
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className={`${
        isPreview ? 'absolute' : 'fixed'
      } inset-0 z-[75] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-2.5 sm:p-5`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="alaa-chat-in relative flex flex-col w-full overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#0B101B] text-[#F1F5F9] shadow-[0_32px_90px_rgba(0,0,0,0.72)]"
        style={{
          maxWidth: isPreview ? '340px' : '468px',
          height: isPreview
            ? 'min(480px, calc(100% - 14px))'
            : 'min(650px, calc(100vh - 36px))',
        }}
      >
        {/* Top Subtle Accent Line */}
        <div
          className="h-[2px] w-full shrink-0 opacity-85"
          style={{ background: `linear-gradient(90deg, ${brand1}, ${brand2})` }}
        />

        {/* Modern Dark Header */}
        <header className="flex items-center justify-between gap-3 border-b border-white/[0.07] bg-[#101726]/95 px-5 py-3.5 shrink-0 backdrop-blur-md">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="h-10 w-10 shrink-0 rounded-full p-[2px]"
              style={{ background: `linear-gradient(135deg, ${brand1}, ${brand2})` }}
            >
              <div className="h-full w-full overflow-hidden rounded-full bg-[#0B101B] flex items-center justify-center text-xs font-bold text-white">
                {config.hero.avatarImage ? (
                  <img
                    src={config.hero.avatarImage}
                    alt={partnerName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{partnerName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="text-[15px] font-extrabold tracking-tight text-[#F8FAFC] truncate">
                  {headerTitle}
                </h3>
                <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.08] bg-[#161F30] px-1.5 py-0.5 text-[10px] font-bold text-slate-300 shrink-0">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: availabilityColor }}
                  />
                  <span>{availabilityText}</span>
                </span>
              </div>
              <p className="text-[11.5px] font-medium truncate mt-0.5 transition-colors duration-200">
                {ownerTyping ? (
                  <span style={{ color: brand1 }}>
                    {isAr ? 'يكتب الرد الآن...' : 'Typing a reply...'}
                  </span>
                ) : isTyping ? (
                  <span style={{ color: brand1 }}>
                    {isAr ? 'جاري كتابة رسالة...' : 'Typing a message...'}
                  </span>
                ) : (
                  <span className="text-[#94A3B8]">{headerSub}</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowIdentityEditor((prev) => !prev)}
              title={isAr ? 'اسمك وبياناتك' : 'Your display name'}
              aria-label={isAr ? 'تعديل اسمك' : 'Edit name'}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-bold transition-colors duration-150 cursor-pointer ${
                showIdentityEditor
                  ? 'border-[var(--brand)] bg-white/[0.08] text-white'
                  : 'border-white/[0.08] bg-[#161F30] text-slate-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <User className="h-3.5 w-3.5" style={{ color: brand1 }} />
              <span className="max-w-[78px] truncate">{displayVisitorName}</span>
            </button>

            {activeThread && (
              <button
                type="button"
                onClick={onStartNewSession}
                title={isAr ? 'بدء محادثة جديدة' : 'New conversation'}
                aria-label={isAr ? 'بدء محادثة جديدة' : 'New conversation'}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#161F30] text-slate-400 transition-colors duration-150 hover:border-white/20 hover:text-white cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق الشات' : 'Close chat'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-[#161F30] text-slate-400 transition-colors duration-150 hover:border-white/20 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Optional Visitor Identity Drawer */}
        {showIdentityEditor && (
          <div className="alaa-msg-in border-b border-white/[0.07] bg-[#101726] px-5 py-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                placeholder={isAr ? 'اسمك الظاهر...' : 'Your name...'}
                className="h-9 rounded-lg border border-white/[0.1] bg-[#0B101B] px-3 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[var(--brand)] focus:outline-none"
              />
              <input
                type="text"
                value={visitorTag}
                onChange={(e) => setVisitorTag(e.target.value)}
                placeholder={isAr ? 'بريد / حساب تواصل' : 'Email / handle'}
                className="h-9 rounded-lg border border-white/[0.1] bg-[#0B101B] px-3 text-xs text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[var(--brand)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Eye-Comfort Modern Dark Feed */}
        <div
          className="alaa-scroll-thin flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5"
          style={{
            background:
              'radial-gradient(ellipse 85% 45% at 50% 0%, rgba(30, 41, 59, 0.28), transparent 70%), #0B101B',
          }}
        >
          {groups.map((group, groupIdx) => {
            const isOwner = group.sender === 'owner';
            const showTodayDividerBefore = groupIdx === 1 && messages.length > 0;

            return (
              <div key={group.id} className="space-y-4">
                {showTodayDividerBefore && (
                  <div className="flex items-center gap-3 py-1">
                    <div className="h-px flex-1 bg-white/[0.07]" />
                    <span className="text-[11px] font-medium text-[#64748B]">
                      {isAr ? 'اليوم' : 'Today'}
                    </span>
                    <div className="h-px flex-1 bg-white/[0.07]" />
                  </div>
                )}

                <div
                  className={`flex flex-col gap-2 ${
                    isOwner ? 'items-start' : 'items-end'
                  }`}
                >
                  {/* Sender Header Row */}
                  {isOwner ? (
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#161F30] border border-white/10 flex items-center justify-center text-[11px] font-bold text-slate-200">
                        {config.hero.avatarImage ? (
                          <img
                            src={config.hero.avatarImage}
                            alt={partnerName}
                            referrerPolicy="no-referrer"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{partnerName.slice(0, 1).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-[12px] font-bold text-[#E2E8F0]">
                        {partnerName}
                      </span>
                      <span className="text-[11px] font-medium text-[#64748B] tabular-nums">
                        {formatTime(group.timestamp, lang)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-[#64748B] tabular-nums">
                        {formatTime(group.timestamp, lang)}
                      </span>
                      <span className="text-[12px] font-bold text-[#E2E8F0]">
                        {displayVisitorName}
                      </span>
                      <div
                        className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-[#070B14]"
                        style={{
                          background: `linear-gradient(135deg, ${brand1}, ${brand2})`,
                        }}
                      >
                        {displayVisitorName.slice(0, 1).toUpperCase()}
                      </div>
                    </div>
                  )}

                  {/* Stacked Sophisticated Message Bubbles */}
                  <div
                    className={`flex flex-col gap-1.5 max-w-[85%] ${
                      isOwner ? 'items-start ps-9' : 'items-end pe-9'
                    }`}
                  >
                    {group.items.map((msg, idx) => {
                      const isFirst = idx === 0;
                      const isWelcome = msg.id === 'welcome-msg';
                      const cornerClass = isOwner
                        ? isFirst
                          ? 'rounded-ss-[4px]'
                          : ''
                        : isFirst
                        ? 'rounded-ee-[4px]'
                        : '';
                      const reactionEntries = Object.entries(msg.reactions ?? {}).filter(
                        ([, reactors]) => reactors.length > 0
                      );
                      const canReact = Boolean(activeThread && !isWelcome && onToggleMessageReaction);
                      const canReply = !isWelcome;
                      const canEdit = Boolean(activeThread && !isWelcome && !isOwner && msg.text && onEditMessage);
                      const canDelete = Boolean(activeThread && !isWelcome && !isOwner && onDeleteMessage);
                      const isEditingThis = editingMsgId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          id={`chat-msg-${msg.id}`}
                          className={`group alaa-msg-in flex flex-col gap-1 max-w-full ${
                            isOwner ? 'items-start' : 'items-end'
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
                                  variant={isOwner ? 'dark' : 'accent'}
                                  cornerClass={cornerClass}
                                />
                              )}

                              {(msg.text || msg.replyTo) && (
                                <div
                                  style={
                                    !isOwner
                                      ? {
                                          background: `linear-gradient(135deg, color-mix(in srgb, ${brand1} 24%, #131C30), color-mix(in srgb, ${brand2} 22%, #0F172A))`,
                                          borderColor: `color-mix(in srgb, ${brand1} 40%, rgba(255,255,255,0.1))`,
                                        }
                                      : undefined
                                  }
                                  className={`rounded-2xl ${cornerClass} px-4 py-2.5 text-[13.5px] leading-[1.6] tracking-[0.005em] whitespace-pre-wrap break-words ${
                                    isOwner
                                      ? 'bg-[#161F30] text-[#E2E8F0] border border-white/[0.08] shadow-[0_4px_16px_rgba(0,0,0,0.22)]'
                                      : 'text-[#F8FAFC] border shadow-[0_6px_20px_rgba(0,0,0,0.24)]'
                                  }`}
                                >
                                  {msg.replyTo && (
                                    <button
                                      type="button"
                                      onClick={() => scrollToMessage(msg.replyTo!.messageId)}
                                      className="mb-2 flex w-full flex-col items-start rounded-lg border-s-2 bg-black/25 px-2.5 py-1.5 text-start hover:bg-black/35 transition-colors cursor-pointer"
                                      style={{ borderInlineStartColor: brand1 }}
                                    >
                                      <span
                                        className="text-[10px] font-extrabold"
                                        style={{ color: brand1 }}
                                      >
                                        {msg.replyTo.sender === 'owner'
                                          ? partnerName
                                          : displayVisitorName}
                                      </span>
                                      <span className="text-[11px] text-slate-300 line-clamp-1">
                                        {msg.replyTo.text || msg.replyTo.attachmentLabel || ''}
                                      </span>
                                    </button>
                                  )}

                                  {isEditingThis ? (
                                    <div className="space-y-2 min-w-[200px]">
                                      <input
                                        type="text"
                                        value={editingDraft}
                                        onChange={(e) => setEditingDraft(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter' && editingDraft.trim() && activeThread) {
                                            e.preventDefault();
                                            onEditMessage?.(activeThread.id, msg.id, editingDraft);
                                            setEditingMsgId(null);
                                          } else if (e.key === 'Escape') {
                                            setEditingMsgId(null);
                                          }
                                        }}
                                        autoFocus
                                        className="h-8 w-full rounded-lg border border-white/20 bg-[#0B101B] px-2.5 text-xs text-white focus:border-[var(--brand)] focus:outline-none"
                                      />
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setEditingMsgId(null)}
                                          className="rounded-md border border-white/15 px-2 py-1 text-[10.5px] font-bold text-slate-300 hover:text-white cursor-pointer"
                                        >
                                          {isAr ? 'إلغاء' : 'Cancel'}
                                        </button>
                                        <button
                                          type="button"
                                          disabled={!editingDraft.trim()}
                                          onClick={() => {
                                            if (activeThread && editingDraft.trim()) {
                                              onEditMessage?.(activeThread.id, msg.id, editingDraft);
                                              setEditingMsgId(null);
                                            }
                                          }}
                                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[10.5px] font-extrabold text-[#070B14] disabled:opacity-40 cursor-pointer"
                                          style={{ background: `linear-gradient(135deg, ${brand1}, ${brand2})` }}
                                        >
                                          <Check className="h-3 w-3" />
                                          <span>{isAr ? 'حفظ' : 'Save'}</span>
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      {msg.text && <span>{msg.text}</span>}
                                      {msg.editedAt && (
                                        <span className="block text-[9.5px] text-slate-400/85 mt-1">
                                          {isAr ? 'تم التعديل' : 'Edited'}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Per-Message Quick Actions (React, Reply, Edit, Delete) */}
                            {!isWelcome && !isEditingThis && (
                              <div
                                className={`relative flex items-center gap-0.5 shrink-0 transition-opacity duration-150 ${
                                  reactionMenuMsgId === msg.id || confirmDeleteMsgId === msg.id
                                    ? 'opacity-100'
                                    : 'opacity-70 sm:opacity-0 sm:group-hover:opacity-100'
                                }`}
                              >
                                {canReact && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDeleteMsgId(null);
                                      setReactionMenuMsgId((prev) => (prev === msg.id ? null : msg.id));
                                    }}
                                    title={isAr ? 'تفاعل' : 'React'}
                                    aria-label={isAr ? 'تفاعل برمز تعبيري' : 'React'}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                  >
                                    <SmilePlus className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {canReply && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReactionMenuMsgId(null);
                                      setConfirmDeleteMsgId(null);
                                      setReplyingTo(buildReplyRef(msg));
                                      inputRef.current?.focus();
                                    }}
                                    title={isAr ? 'رد' : 'Reply'}
                                    aria-label={isAr ? 'رد على الرسالة' : 'Reply to message'}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReactionMenuMsgId(null);
                                      setConfirmDeleteMsgId(null);
                                      setEditingMsgId(msg.id);
                                      setEditingDraft(msg.text);
                                    }}
                                    title={isAr ? 'تعديل' : 'Edit'}
                                    aria-label={isAr ? 'تعديل الرسالة' : 'Edit message'}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                )}

                                {canDelete && (
                                  confirmDeleteMsgId === msg.id ? (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (activeThread) {
                                          onDeleteMessage?.(activeThread.id, msg.id);
                                        }
                                        setConfirmDeleteMsgId(null);
                                      }}
                                      className="inline-flex h-6 items-center rounded-md bg-rose-500/20 border border-rose-500/40 px-1.5 text-[10px] font-bold text-rose-300 hover:bg-rose-500/30 cursor-pointer"
                                    >
                                      {isAr ? 'حذف؟' : 'Delete?'}
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReactionMenuMsgId(null);
                                        setConfirmDeleteMsgId(msg.id);
                                      }}
                                      title={isAr ? 'حذف' : 'Delete'}
                                      aria-label={isAr ? 'حذف الرسالة' : 'Delete message'}
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-rose-500/15 hover:text-rose-300 cursor-pointer"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )
                                )}

                                {reactionMenuMsgId === msg.id && activeThread && (
                                  <div
                                    className={`alaa-msg-in absolute bottom-8 z-20 flex items-center gap-1 rounded-xl border border-white/15 bg-[#101726] p-1 shadow-xl ${
                                      isOwner ? 'start-0' : 'end-0'
                                    }`}
                                  >
                                    {QUICK_REACTION_EMOJIS.map((em) => {
                                      const reacted = (msg.reactions?.[em] ?? []).includes('visitor');
                                      return (
                                        <button
                                          key={em}
                                          type="button"
                                          onClick={() => {
                                            onToggleMessageReaction?.(activeThread.id, msg.id, em, 'visitor');
                                            setReactionMenuMsgId(null);
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

                          {/* Reaction Pills Row */}
                          {reactionEntries.length > 0 && activeThread && (
                            <div className="flex flex-wrap items-center gap-1 px-1">
                              {reactionEntries.map(([em, reactors]) => {
                                const mine = reactors.includes('visitor');
                                return (
                                  <button
                                    key={em}
                                    type="button"
                                    onClick={() =>
                                      onToggleMessageReaction?.(activeThread.id, msg.id, em, 'visitor')
                                    }
                                    style={
                                      mine
                                        ? { borderColor: brand1, backgroundColor: `color-mix(in srgb, ${brand1} 16%, #101726)` }
                                        : undefined
                                    }
                                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold transition-colors cursor-pointer ${
                                      mine
                                        ? 'text-white'
                                        : 'border-white/10 bg-[#161F30] text-slate-300 hover:border-white/25'
                                    }`}
                                  >
                                    <span>{em}</span>
                                    <span className="tabular-nums text-[10px]">{reactors.length}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {!isOwner && idx === group.items.length - 1 && (
                            <div className="flex items-center justify-end gap-1 px-1 text-[10px] text-[#64748B]">
                              <span>{msg.readByOwner ? (isAr ? 'تمت القراءة' : 'Seen') : (isAr ? 'تم الإرسال' : 'Sent')}</span>
                              <CheckCheck
                                className="h-3 w-3"
                                style={{ color: msg.readByOwner ? brand1 : '#64748B' }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {messages.length === 0 && (
            <div className="flex items-center gap-3 pt-1">
              <div className="h-px flex-1 bg-white/[0.07]" />
              <span className="text-[11px] font-medium text-[#64748B]">
                {isAr ? 'اليوم' : 'Today'}
              </span>
              <div className="h-px flex-1 bg-white/[0.07]" />
            </div>
          )}

          {/* Simulated Owner Auto-Reply Typing Bubble */}
          {ownerTyping && (
            <div className="alaa-msg-in flex items-center justify-start gap-2.5 pt-1">
              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-[#161F30] border border-white/10 flex items-center justify-center text-[11px] font-bold text-slate-200">
                {config.hero.avatarImage ? (
                  <img
                    src={config.hero.avatarImage}
                    alt={partnerName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{partnerName.slice(0, 1).toUpperCase()}</span>
                )}
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-ss-[4px] border border-white/[0.09] bg-[#161F30] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
                <span
                  className="alaa-typing-dot h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: brand1, animationDelay: '0ms' }}
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

          {/* Smooth Animated Visitor Typing Indicator */}
          {isTyping && (
            <div className="alaa-msg-in flex items-center justify-end gap-2.5 pt-1">
              <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-ee-[4px] border border-white/[0.09] bg-[#161F30] px-3.5 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
                <span
                  className="alaa-typing-dot h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: brand1, animationDelay: '0ms' }}
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
              <div
                className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-[11px] font-bold text-[#070B14]"
                style={{
                  background: `linear-gradient(135deg, ${brand1}, ${brand2})`,
                }}
              >
                {displayVisitorName.slice(0, 1).toUpperCase()}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Attachment Menu / Link Card / Emoji Popover */}
        {(showAttachMenu || showEmojiPicker) && (
          <div className="alaa-msg-in relative border-t border-white/[0.07] bg-[#101726] px-4 py-3 shrink-0">
            {showAttachMenu && !showLinkForm && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#161F30] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[var(--brand)] hover:text-white transition-colors cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" style={{ color: brand1 }} />
                  <span>{isAr ? 'مستند / ملف' : 'Document'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowLinkForm(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#161F30] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[var(--brand)] hover:text-white transition-colors cursor-pointer"
                >
                  <Link2 className="h-3.5 w-3.5" style={{ color: brand1 }} />
                  <span>{isAr ? 'رابط / صورة' : 'Link / Image'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleStartVoiceRecord}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#161F30] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-[var(--brand)] hover:text-white transition-colors cursor-pointer"
                >
                  <Mic className="h-3.5 w-3.5" style={{ color: brand1 }} />
                  <span>{isAr ? 'تسجيل صوتي' : 'Record voice'}</span>
                </button>
              </div>
            )}

            {showAttachMenu && showLinkForm && (
              <form onSubmit={handleSendLinkCard} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">
                    {isAr ? 'إرسال بطاقة رابط أو صورة' : 'Send link or image card'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLinkForm(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    {isAr ? 'رجوع' : 'Back'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={linkTitle}
                    onChange={(e) => setLinkTitle(e.target.value)}
                    placeholder={isAr ? 'عنوان الرابط أو الصورة' : 'Card title'}
                    className="h-9 rounded-lg border border-white/[0.1] bg-[#0B101B] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[var(--brand)] focus:outline-none"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-9 rounded-lg border border-white/[0.1] bg-[#0B101B] px-3 text-xs text-white placeholder:text-slate-500 focus:border-[var(--brand)] focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/[0.1] bg-[#161F30] px-2.5 text-[11px] font-semibold text-slate-300 hover:border-[var(--brand)] cursor-pointer"
                  >
                    <span>
                      {linkImageUrl
                        ? isAr
                          ? 'تم اختيار صورة ✓'
                          : 'Image ready ✓'
                        : isAr
                        ? 'رفع صورة (اختياري)'
                        : 'Upload image'}
                    </span>
                  </button>
                  <button
                    type="submit"
                    style={{ background: `linear-gradient(135deg, ${brand1}, ${brand2})` }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-extrabold text-[#070B14] hover:opacity-95 cursor-pointer"
                  >
                    <span>{isAr ? 'إرسال البطاقة' : 'Send Card'}</span>
                  </button>
                </div>
              </form>
            )}

            {showEmojiPicker && (
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_CHOICES.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => {
                      setDraft((prev) => prev + em);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                    className="h-8 w-8 rounded-lg border border-white/[0.08] bg-[#161F30] text-base hover:border-[var(--brand)] transition-colors cursor-pointer"
                  >
                    {em}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFilePick}
          className="hidden"
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={handleImagePick}
          className="hidden"
        />

        {/* Modern Dark Bottom Composer */}
        <form
          onSubmit={handleSubmit}
          className="border-t border-white/[0.07] bg-[#101726] px-4 py-3.5 shrink-0 space-y-2.5"
        >
          {replyingTo && (
            <div
              className="alaa-msg-in flex items-center justify-between gap-2.5 rounded-xl border border-white/[0.08] border-s-2 bg-[#0B101B] px-3 py-2"
              style={{ borderInlineStartColor: brand1 }}
            >
              <div className="min-w-0">
                <div className="text-[11px] font-extrabold" style={{ color: brand1 }}>
                  {isAr ? 'الرد على' : 'Replying to'}{' '}
                  {replyingTo.sender === 'owner' ? partnerName : displayVisitorName}
                </div>
                <div className="text-[11.5px] text-slate-300 truncate">
                  {replyingTo.text || replyingTo.attachmentLabel || ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                aria-label={isAr ? 'إلغاء الرد' : 'Cancel reply'}
                className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {micError && (
            <div className="alaa-msg-in flex items-center justify-between gap-2 rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-[11.5px] font-semibold text-rose-200">
              <span>{micError}</span>
              <button
                type="button"
                onClick={() => setMicError('')}
                className="shrink-0 text-rose-300 hover:text-white cursor-pointer"
                aria-label={isAr ? 'إغلاق التنبيه' : 'Dismiss'}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {isRecording ? (
            <div className="flex items-center justify-between gap-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-rose-200 tabular-nums shrink-0">
                  {Math.floor(recordSeconds / 60)}:{(recordSeconds % 60).toString().padStart(2, '0')}
                </span>
                <div className="flex items-center gap-[3px] h-5" aria-hidden="true">
                  {[0.45, 0.72, 1, 0.85, 0.6, 0.95, 0.7, 0.5].map((mult, idx) => (
                    <span
                      key={idx}
                      className="w-[3px] rounded-full bg-rose-400 transition-all duration-100"
                      style={{
                        height: `${Math.max(24, Math.min(100, Math.round(liveMicLevel * mult)))}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCancelVoiceRecord}
                  aria-label={isAr ? 'إلغاء التسجيل' : 'Cancel recording'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-[#0B101B] text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleStopAndSendVoiceRecord}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-rose-500 px-3 text-xs font-bold text-white hover:bg-rose-600 cursor-pointer"
                >
                  <Square className="h-3 w-3 fill-current" />
                  <span>{isAr ? 'إرسال' : 'Send'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-white/[0.09] bg-[#0B101B] px-3.5 py-2 transition-colors focus-within:border-[var(--brand)]">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={isAr ? 'اكتب رسالتك هنا...' : 'Message...'}
                className="h-7 flex-1 min-w-0 bg-transparent text-[13.5px] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none"
              />

              <button
                type="button"
                onClick={handleStartVoiceRecord}
                title={isAr ? 'تسجيل رسالة صوتية بالميكروفون' : 'Record voice message'}
                aria-label={isAr ? 'تسجيل صوتي' : 'Record voice message'}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] hover:text-[var(--brand)] transition-colors duration-150 cursor-pointer"
              >
                <Mic className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu((prev) => !prev);
                  setShowLinkForm(false);
                  setShowEmojiPicker(false);
                }}
                aria-label={isAr ? 'إرفاق' : 'Attach'}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 cursor-pointer ${
                  showAttachMenu
                    ? 'bg-white/[0.1] text-white'
                    : 'text-[#64748B] hover:text-slate-200'
                }`}
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker((prev) => !prev);
                  setShowAttachMenu(false);
                }}
                aria-label={isAr ? 'رموز تعبيرية' : 'Emoji'}
                className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 cursor-pointer ${
                  showEmojiPicker
                    ? 'bg-white/[0.1] text-white'
                    : 'text-[#64748B] hover:text-slate-200'
                }`}
              >
                <Smile className="h-4 w-4" />
              </button>

              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label={isAr ? 'إرسال' : 'Send'}
                style={
                  draft.trim()
                    ? { background: `linear-gradient(135deg, ${brand1}, ${brand2})` }
                    : undefined
                }
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150 active:scale-95 cursor-pointer disabled:cursor-not-allowed ${
                  draft.trim()
                    ? 'text-[#070B14] shadow-sm hover:opacity-95'
                    : 'bg-white/[0.06] text-[#475569]'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
