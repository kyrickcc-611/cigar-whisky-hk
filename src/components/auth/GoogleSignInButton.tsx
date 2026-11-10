'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { loginWithGoogle } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/authErrors';

interface GoogleSignInButtonProps {
  /** 登入成功後前往的路徑 */
  redirectTo?: string;
  /** 父層正在處理其他動作時停用 */
  disabled?: boolean;
  /** 額外的錯誤回報（讓表單統一顯示錯誤） */
  onError?: (message: string) => void;
}

/** Google 登入按鈕（彈出視窗）；Google 帳號本身已驗證電郵 */
export function GoogleSignInButton({
  redirectTo = '/',
  disabled = false,
  onError,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await loginWithGoogle();
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (onError) onError(message);
      else console.error('[auth] Google 登入失敗', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className="btn-secondary w-full"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.2 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.82 6.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
          />
        </svg>
      )}
      使用 Google 帳號登入
    </button>
  );
}
