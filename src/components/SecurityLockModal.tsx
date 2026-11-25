import { FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, HelpCircle, Lock, X } from 'lucide-react';
import { Lang, SiteConfig } from '../types/siteConfig';

interface SecurityLockModalProps {
  isOpen: boolean;
  lang: Lang;
  config: SiteConfig;
  onUnlockSuccess: () => void;
  onClose: () => void;
}

function getContrastInk(hex: string): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  if (full.length !== 6) return '#111827';
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return '#111827';
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '#111827' : '#FFFFFF';
}

export function SecurityLockModal({
  isOpen,
  lang,
  config,
  onUnlockSuccess,
  onClose,
}: SecurityLockModalProps) {
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shakeTick, setShakeTick] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setPasswordError('');
      setShowPasswordText(false);
      setShowHint(false);
      setShakeTick(0);
    }
  }, [isOpen]);

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
  const brand1 = config.appearance.brandColor;
  const brand2 = config.appearance.brandColor2;
  const accentInk = getContrastInk(brand1);
  const hasHint = Boolean(config.security.passwordHint?.trim());

  const triggerError = () => {
    setPasswordError(
      isAr
        ? 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.'
        : 'Incorrect password. Please check and try again.'
    );
    setShakeTick((prev) => prev + 1);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      triggerError();
      return;
    }
    if (passwordInput === config.security.password) {
      onUnlockSuccess();
      return;
    }
    triggerError();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="security-gate-title"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={onClose}
      className="fixed inset-0 z-[85] flex items-center justify-center p-4 backdrop-blur-md"
      style={{
        backgroundColor: `color-mix(in srgb, ${brand1} 16%, rgba(8, 12, 22, 0.72))`,
      }}
    >
      <div
        key={shakeTick}
        onClick={(e) => e.stopPropagation()}
        className={`alaa-pop-in ${
          shakeTick > 0 ? 'alaa-shake' : ''
        } relative w-full max-w-[404px] rounded-[24px] bg-white px-8 py-9 sm:px-10 sm:py-10 text-[#111827] shadow-[0_24px_64px_rgba(0,0,0,0.22)]`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={isAr ? 'إغلاق' : 'Close'}
          className="absolute top-4 end-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-[#9CA3AF] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Centered Site-Color Squircle Lock Badge */}
        <div className="flex flex-col items-center text-center">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-[12px] shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${brand1}, ${brand2})`,
              color: accentInk,
            }}
          >
            <Lock className="h-5 w-5" strokeWidth={2.2} aria-hidden="true" />
          </div>

          <h3
            id="security-gate-title"
            className="mt-4 text-[22px] font-bold tracking-tight text-[#111827]"
          >
            {isAr ? 'محمي بكلمة مرور' : 'Password Protected'}
          </h3>

          <p className="mt-2 max-w-[290px] text-[12.5px] leading-relaxed text-[#6B7280]">
            {isAr
              ? 'أدخل كلمة المرور الخاصة بك للوصول إلى لوحة التحكم وإعدادات الموقع.'
              : 'Enter your password to unlock the site control panel and settings.'}
          </p>
        </div>

        {/* Password Field + Pill Submit Button */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <div className="space-y-2.5">
            <label
              htmlFor="security-password-input"
              className="block text-[12px] font-semibold text-[#111827]"
            >
              {isAr ? 'كلمة المرور' : 'Password'} <span className="text-[#111827]">*</span>
            </label>

            <div className="relative">
              <input
                id="security-password-input"
                type={showPasswordText ? 'text' : 'password'}
                dir="ltr"
                autoFocus
                autoComplete="current-password"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                placeholder="••••••••••••"
                style={{
                  borderColor: passwordError ? '#EF4444' : undefined,
                }}
                className="h-11 w-full rounded-[10px] border border-[#E5E7EB] bg-white px-3.5 pe-16 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-[var(--brand)] focus:outline-none transition-colors"
              />

              <div className="absolute top-1/2 -translate-y-1/2 end-2.5 flex items-center gap-1">
                {passwordInput.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordText((prev) => !prev)}
                    aria-label={showPasswordText ? 'Hide password' : 'Show password'}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#4B5563] transition-colors cursor-pointer"
                  >
                    {showPasswordText ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowHint((prev) => !prev)}
                  aria-label={isAr ? 'تلميح كلمة المرور' : 'Password help'}
                  title={isAr ? 'تلميح كلمة المرور' : 'Password hint'}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#4B5563] transition-colors cursor-pointer"
                >
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showHint && (
              <p className="text-[11.5px] text-[#6B7280] pt-1">
                {hasHint
                  ? `${isAr ? 'تلميح: ' : 'Hint: '}${config.security.passwordHint}`
                  : isAr
                  ? 'يمكنك تعديل كلمة المرور من قسم الأمان داخل لوحة الإعدادات.'
                  : 'You can change this password inside the Security tab in Settings.'}
              </p>
            )}

            {passwordError && (
              <p className="text-[11.5px] font-medium text-rose-600 pt-1">
                {passwordError}
              </p>
            )}
          </div>

          <div className="pt-3">
            <button
              type="submit"
              style={{
                background: `linear-gradient(135deg, ${brand1}, ${brand2})`,
                color: accentInk,
              }}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[13.5px] font-bold shadow-sm transition-all duration-150 hover:opacity-95 active:scale-[0.99] cursor-pointer"
            >
              <span>{isAr ? 'تأكيد الدخول' : 'Submit Now'}</span>
              <span
                className="inline-flex h-[18px] w-[18px] items-center justify-center rounded-full"
                style={{
                  backgroundColor: accentInk,
                  color: brand1,
                }}
              >
                {isAr ? (
                  <ArrowLeft className="h-3 w-3" strokeWidth={2.7} aria-hidden="true" />
                ) : (
                  <ArrowRight className="h-3 w-3" strokeWidth={2.7} aria-hidden="true" />
                )}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
