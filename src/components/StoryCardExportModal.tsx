import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Check, Copy, Download, Loader2, QrCode, X } from 'lucide-react';
import { Lang, SiteConfig, Theme } from '../types/siteConfig';

interface StoryCardExportModalProps {
  isOpen: boolean;
  lang: Lang;
  theme: Theme;
  config: SiteConfig;
  onNotify?: (msg: string) => void;
  onClose: () => void;
}

function loadImageSafe(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) {
      resolve(null);
      return;
    }
    const img = new Image();
    if (!src.startsWith('data:') && !src.startsWith('/')) {
      img.crossOrigin = 'anonymous';
    }
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function StoryCardExportModal({
  isOpen,
  lang,
  theme,
  config,
  onNotify,
  onClose,
}: StoryCardExportModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generationFailed, setGenerationFailed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const isAr = lang === 'ar';
  const shareUrl =
    typeof window !== 'undefined' ? window.location.href : 'https://alaadev.online';

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setGenerating(true);
    setGenerationFailed(false);

    const buildStoryCard = async () => {
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isLight = theme === 'light';
      const bgColor = isLight ? config.appearance.bgLight : config.appearance.bgDark;
      const surfaceColor = isLight
        ? config.appearance.surfaceLight
        : config.appearance.surfaceDark;
      const textColor = isLight ? '#111827' : '#F8FAFC';
      const mutedColor = isLight ? '#475569' : '#94A3B8';
      const b1 = config.appearance.brandColor;
      const b2 = config.appearance.brandColor2;

      // 1. Background
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, W, H);

      // Ambient radial glows
      const glow1 = ctx.createRadialGradient(W * 0.2, H * 0.16, 40, W * 0.2, H * 0.16, 620);
      glow1.addColorStop(0, `${b1}44`);
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, W, H);

      const glow2 = ctx.createRadialGradient(W * 0.85, H * 0.78, 40, W * 0.85, H * 0.78, 580);
      glow2.addColorStop(0, `${b2}38`);
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, W, H);

      // Subtle grid lines
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.04)' : 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 2;
      for (let x = 0; x < W; x += 72) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y < H; y += 72) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // 2. Main Story Container Card
      const cardX = 88;
      const cardY = 170;
      const cardW = W - 176;
      const cardH = 1580;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.38)';
      ctx.shadowBlur = 70;
      ctx.shadowOffsetY = 24;
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 52);
      ctx.fillStyle = surfaceColor;
      ctx.fill();
      ctx.restore();

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 52);
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.1)' : 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();

      // 3. Banner inside top of card
      const bannerH = 440;
      const [bannerImg, avatarImg, qrDataUrl] = await Promise.all([
        loadImageSafe(config.hero.bannerImage),
        loadImageSafe(config.hero.avatarImage),
        QRCode.toDataURL(shareUrl, {
          width: 420,
          margin: 1,
          color: {
            dark: '#0A0E17',
            light: '#FFFFFF',
          },
        }).catch(() => ''),
      ]);

      ctx.save();
      drawRoundedRect(ctx, cardX, cardY, cardW, bannerH, 52);
      ctx.clip();

      if (bannerImg) {
        const scale = Math.max(cardW / bannerImg.width, bannerH / bannerImg.height);
        const dw = bannerImg.width * scale;
        const dh = bannerImg.height * scale;
        ctx.drawImage(
          bannerImg,
          cardX + (cardW - dw) / 2,
          cardY + (bannerH - dh) / 2,
          dw,
          dh
        );
      } else {
        const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + bannerH);
        bgGrad.addColorStop(0, b1);
        bgGrad.addColorStop(1, b2);
        ctx.fillStyle = bgGrad;
        ctx.fillRect(cardX, cardY, cardW, bannerH);
      }

      // Fade banner bottom cleanly into surfaceColor
      const fadeGrad = ctx.createLinearGradient(0, cardY + 120, 0, cardY + bannerH);
      fadeGrad.addColorStop(0, 'transparent');
      fadeGrad.addColorStop(1, surfaceColor);
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(cardX, cardY, cardW, bannerH);
      ctx.restore();

      // 4. Centered Profile Avatar with Brand Ring
      const avatarR = 132;
      const avatarCx = W / 2;
      const avatarCy = cardY + bannerH - 12;

      const ringGrad = ctx.createLinearGradient(
        avatarCx - avatarR,
        avatarCy - avatarR,
        avatarCx + avatarR,
        avatarCy + avatarR
      );
      ringGrad.addColorStop(0, b1);
      ringGrad.addColorStop(1, b2);

      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR + 12, 0, Math.PI * 2);
      ctx.fillStyle = ringGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR + 5, 0, Math.PI * 2);
      ctx.fillStyle = surfaceColor;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarR - 3, 0, Math.PI * 2);
      ctx.clip();
      if (avatarImg) {
        const s = Math.max((avatarR * 2) / avatarImg.width, (avatarR * 2) / avatarImg.height);
        const dw = avatarImg.width * s;
        const dh = avatarImg.height * s;
        ctx.drawImage(avatarImg, avatarCx - dw / 2, avatarCy - dh / 2, dw, dh);
      } else {
        ctx.fillStyle = b1;
        ctx.fillRect(avatarCx - avatarR, avatarCy - avatarR, avatarR * 2, avatarR * 2);
      }
      ctx.restore();

      // 5. Name, Tagline, Badges
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.font = `800 66px "${config.appearance.fontFamily}", sans-serif`;
      ctx.fillText(config.hero.brandName, W / 2, avatarCy + avatarR + 96);

      const tag = isAr ? config.hero.tagAr : config.hero.tagEn;
      ctx.fillStyle = mutedColor;
      ctx.font = `600 34px "${config.appearance.fontFamily}", sans-serif`;
      ctx.fillText(tag, W / 2, avatarCy + avatarR + 158, cardW - 110);

      const badge1 = isAr ? config.hero.profileBadge1Ar : config.hero.profileBadge1En;
      const badge2 = isAr ? config.hero.profileBadge2Ar : config.hero.profileBadge2En;
      const subtitleLine = [badge1, badge2].filter(Boolean).join('  ·  ');
      if (subtitleLine) {
        ctx.fillStyle = b1;
        ctx.font = `700 30px "${config.appearance.fontFamily}", sans-serif`;
        ctx.fillText(subtitleLine, W / 2, avatarCy + avatarR + 216);
      }

      // Divider line
      const divY = avatarCy + avatarR + 275;
      ctx.strokeStyle = isLight ? 'rgba(15,23,42,0.09)' : 'rgba(255,255,255,0.1)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 90, divY);
      ctx.lineTo(cardX + cardW - 90, divY);
      ctx.stroke();

      // 6. QR Code Frame
      const qrBoxSize = 370;
      const qrBoxX = (W - qrBoxSize) / 2;
      const qrBoxY = divY + 62;

      ctx.save();
      drawRoundedRect(ctx, qrBoxX - 24, qrBoxY - 24, qrBoxSize + 48, qrBoxSize + 48, 36);
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.22)';
      ctx.shadowBlur = 32;
      ctx.fill();
      ctx.restore();

      if (qrDataUrl) {
        const qrImg = await loadImageSafe(qrDataUrl);
        if (qrImg) {
          ctx.drawImage(qrImg, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
        }
      }

      ctx.fillStyle = textColor;
      ctx.font = `700 32px "${config.appearance.fontFamily}", sans-serif`;
      ctx.fillText(
        isAr ? 'امسح الكود لزيارة ملفي الشخصي' : 'Scan QR to open my profile',
        W / 2,
        qrBoxY + qrBoxSize + 96
      );

      let displayHost = shareUrl.replace(/^https?:\/\//, '');
      if (displayHost.length > 40) displayHost = `${displayHost.slice(0, 37)}...`;
      ctx.fillStyle = b1;
      ctx.font = '600 26px "JetBrains Mono", monospace';
      ctx.fillText(displayHost, W / 2, qrBoxY + qrBoxSize + 150);

      if (active) {
        setPreviewUrl(canvas.toDataURL('image/png'));
        setGenerating(false);
      }
    };

    buildStoryCard().catch(() => {
      if (active) {
        setGenerating(false);
        setGenerationFailed(true);
      }
    });

    return () => {
      active = false;
    };
  }, [isOpen, config, theme, isAr, shareUrl]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `${(config.hero.brandName || 'profile').toLowerCase()}-story-card.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    onNotify?.(isAr ? 'تم تحميل بطاقة الستوري بنجاح!' : 'Story card PNG downloaded!');
  };

  const handleCopyUrl = async () => {
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
    if (copied) {
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 1800);
    }
    onNotify?.(
      copied
        ? isAr
          ? 'تم نسخ رابط الموقع!'
          : 'Profile link copied!'
        : isAr
        ? 'انسخ الرابط من شريط العنوان'
        : 'Copy link from address bar'
    );
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? 'تصدير بطاقة للستوري' : 'Export Story Card'}
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4 backdrop-blur-lg"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="alaa-pop-in relative w-full max-w-[400px] rounded-[24px] border border-white/10 bg-[#0b101b] p-6 text-slate-100 shadow-[0_30px_90px_rgba(0,0,0,0.75)] space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#070b14]"
              style={{
                background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
              }}
            >
              <QrCode className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-extrabold text-white">
                {isAr ? 'بطاقة التعريف للستوري' : 'Story Share Card'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'مقاس 9:16 جاهز للنشر مع رمز QR' : '9:16 story-ready card with QR code'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center">
          <div className="relative h-[380px] w-[214px] overflow-hidden rounded-[20px] border border-white/15 bg-[#060912] shadow-2xl flex items-center justify-center">
            {generationFailed ? (
              <div className="flex flex-col items-center gap-2 px-4 text-center text-xs text-rose-300">
                <span>
                  {isAr ? 'تعذر إنشاء البطاقة في هذا المتصفح.' : 'Could not render card preview.'}
                </span>
              </div>
            ) : generating || !previewUrl ? (
              <div className="flex flex-col items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-[#00d2ff]" />
                <span>{isAr ? 'جاري إنشاء البطاقة...' : 'Generating card...'}</span>
              </div>
            ) : (
              <img
                src={previewUrl}
                alt={isAr ? 'معاينة بطاقة الستوري' : 'Story card preview'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            disabled={!previewUrl || generating}
            onClick={handleDownload}
            style={{
              background: `linear-gradient(135deg, ${config.appearance.brandColor}, ${config.appearance.brandColor2})`,
            }}
            className="flex-1 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-extrabold text-[#070b14] shadow-md hover:opacity-95 disabled:opacity-40 cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>{isAr ? 'تحميل الصورة (PNG)' : 'Download PNG'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyUrl}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/12 bg-[#141c2c] px-4 text-xs font-bold text-slate-200 hover:border-white/30 cursor-pointer"
          >
            {copiedLink ? (
              <Check className="h-4 w-4 text-emerald-400" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            <span>{isAr ? 'نسخ الرابط' : 'Copy Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
