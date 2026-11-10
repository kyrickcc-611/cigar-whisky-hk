'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';
import { registerWithEmail } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/authErrors';
import { isGoogleLoginEnabled } from '@/lib/firebase/client';
import {
  registerSchema,
  validateForm,
  type FieldErrors,
  type RegisterInput,
} from '@/lib/validators/auth';

const INITIAL_VALUES: RegisterInput = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function RegisterForm() {
  const router = useRouter();
  const { isConfigured, configError } = useAuth();

  const [values, setValues] = useState<RegisterInput>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors<RegisterInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  /** 註冊成功後改為顯示「請驗證電郵」畫面 */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  function updateField(field: keyof RegisterInput, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = validateForm(registerSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await registerWithEmail({
        email: result.data.email,
        password: result.data.password,
        displayName: result.data.displayName,
      });
      setRegisteredEmail(result.data.email);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (registeredEmail) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">註冊成功，請驗證電郵</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          我們已寄出驗證信到
          <span className="mx-1 font-medium text-brand-300">{registeredEmail}</span>
          。請點擊信內連結完成驗證，之後便可以 Like / Dislike、撰寫感想及收藏酒吧。
        </p>
        <p className="text-xs leading-relaxed text-zinc-500">
          找不到郵件？請檢查垃圾郵件箱，或登入後在頁面頂部橫幅重發驗證信。
        </p>
        <div className="flex flex-col gap-2 pt-2 sm:flex-row">
          <button type="button" className="btn-primary flex-1" onClick={() => router.push('/')}>
            開始瀏覽
          </button>
          <Link href="/login" className="btn-secondary flex-1">
            前往登入
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {configError ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-200">
          {configError}
        </p>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300"
        >
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="register-name" className="label">
            暱稱
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="nickname"
            className="input"
            placeholder="顯示在感想及貼文上"
            value={values.displayName}
            onChange={(event) => updateField('displayName', event.target.value)}
            aria-invalid={Boolean(errors.displayName)}
          />
          {errors.displayName ? (
            <p className="mt-1.5 text-xs text-red-400">{errors.displayName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-email" className="label">
            電郵
          </label>
          <input
            id="register-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="input"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => updateField('email', event.target.value)}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-red-400">{errors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="register-password" className="label">
            密碼
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pr-10"
              placeholder="至少 8 個字元"
              value={values.password}
              onChange={(event) => updateField('password', event.target.value)}
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((previous) => !previous)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-brand-300"
              aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password ? (
            <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="register-confirm" className="label">
            確認密碼
          </label>
          <input
            id="register-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            className="input"
            placeholder="再次輸入密碼"
            value={values.confirmPassword}
            onChange={(event) => updateField('confirmPassword', event.target.value)}
            aria-invalid={Boolean(errors.confirmPassword)}
          />
          {errors.confirmPassword ? (
            <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword}</p>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !isConfigured}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? '建立帳號中…' : '建立帳號'}
        </button>
      </form>

      {isGoogleLoginEnabled ? (
        <>
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-surface-border" />
            <span className="text-xs text-zinc-500">或</span>
            <span className="h-px flex-1 bg-surface-border" />
          </div>

          <GoogleSignInButton disabled={!isConfigured} onError={setFormError} />
        </>
      ) : null}

      <p className="text-center text-sm text-zinc-400">
        已有帳號？
        <Link href="/login" className="ml-1 text-brand-300 hover:text-brand-200">
          直接登入
        </Link>
      </p>
    </div>
  );
}
