'use client';

import { useEffect, useState } from 'react';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { resendVerificationEmail } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/authErrors';

/**
 * 未驗證電郵提示橫幅。
 * 未驗證用戶仍可瀏覽及收藏，但不可 Like / Dislike、寫感想或發貼文（由 Security Rules 強制）。
 */
export function VerifyEmailBanner() {
  const { user, isEmailVerified, reloadUser } = useAuth();

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 重發冷卻倒數
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!user || isEmailVerified) return null;

  async function handleResend() {
    setError(null);
    setNotice(null);
    setSending(true);
    try {
      await resendVerificationEmail();
      setCooldown(60);
      setNotice('驗證信已寄出，請檢查收件箱及垃圾郵件箱。');
    } catch (resendError) {
      setError(getAuthErrorMessage(resendError));
    } finally {
      setSending(false);
    }
  }

  async function handleCheckVerified() {
    setError(null);
    setNotice(null);
    setChecking(true);
    try {
      await reloadUser();
      setNotice('已重新檢查驗證狀態。');
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="border-b border-amber-500/25 bg-amber-500/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 leading-relaxed text-amber-100">
          <Mail className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            你的電郵 <span className="font-medium">{user.email}</span> 尚未驗證。
            完成驗證後才可 Like / Dislike、撰寫感想及發表貼文。
            {notice ? <span className="ml-1 text-amber-200/90">{notice}</span> : null}
            {error ? <span className="ml-1 text-red-300">{error}</span> : null}
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleResend}
            disabled={sending || cooldown > 0}
            className="rounded-lg border border-amber-500/40 px-2.5 py-1 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : null}
            {cooldown > 0 ? `重發（${cooldown}s）` : '重發驗證信'}
          </button>
          <button
            type="button"
            onClick={handleCheckVerified}
            disabled={checking}
            className="rounded-lg bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-100 transition-colors hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {checking ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : null}
            我已驗證
          </button>
        </div>
      </div>
    </div>
  );
}
