'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useAuth } from '@/hooks/useAuth';
import { loginWithEmail } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/authErrors';
import { loginSchema, validateForm, type LoginInput } from '@/lib/validators/auth';
import type { FieldErrors } from '@/lib/validators/auth';

interface LoginFormProps {
  /** 登入成功後前往的路徑（由 /login?redirect=... 傳入） */
  redirectTo?: string;
}

export function LoginForm({ redirectTo = '/' }: LoginFormProps) {
  const router = useRouter();
  const { isConfigured, configError } = useAuth();

  const [values, setValues] = useState<LoginInput>({ email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function updateField(field: keyof LoginInput, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = validateForm(loginSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await loginWithEmail(result.data.email, result.data.password);
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
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
          <label htmlFor="login-email" className="label">
            電郵
          </label>
          <input
            id="login-email"
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
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="label">
              密碼
            </label>
            <Link
              href="/forgot-password"
              className="mb-1.5 text-xs text-brand-300 transition-colors hover:text-brand-200"
            >
              忘記密碼？
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-10"
              placeholder="請輸入密碼"
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

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !isConfigured}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? '登入中…' : '登入'}
        </button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-surface-border" />
        <span className="text-xs text-zinc-500">或</span>
        <span className="h-px flex-1 bg-surface-border" />
      </div>

      <GoogleSignInButton
        redirectTo={redirectTo}
        disabled={!isConfigured}
        onError={setFormError}
      />

      <p className="text-center text-sm text-zinc-400">
        還未有用戶？
        <Link href="/register" className="ml-1 text-brand-300 hover:text-brand-200">
          立即註冊
        </Link>
      </p>
    </div>
  );
}
