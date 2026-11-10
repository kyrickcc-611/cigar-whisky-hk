'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, MailCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { sendPasswordReset } from '@/lib/firebase/auth';
import { getAuthErrorMessage } from '@/lib/firebase/authErrors';
import {
  forgotPasswordSchema,
  validateForm,
  type FieldErrors,
  type ForgotPasswordInput,
} from '@/lib/validators/auth';

export function ForgotPasswordForm() {
  const { isConfigured, configError } = useAuth();

  const [values, setValues] = useState<ForgotPasswordInput>({ email: '' });
  const [errors, setErrors] = useState<FieldErrors<ForgotPasswordInput>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const result = validateForm(forgotPasswordSchema, values);
    if (!result.success) {
      setErrors(result.errors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await sendPasswordReset(result.data.email);
      setSentEmail(result.data.email);
    } catch (error) {
      setFormError(getAuthErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  if (sentEmail) {
    return (
      <div className="space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-brand-300">
          <MailCheck className="h-6 w-6" />
        </span>
        <h2 className="text-lg font-semibold text-foreground">重設密碼郵件已寄出</h2>
        <p className="text-sm leading-relaxed text-zinc-400">
          請檢查
          <span className="mx-1 font-medium text-brand-300">{sentEmail}</span>
          的收件箱，點擊信中連結設定新密碼。
        </p>
        <Link href="/login" className="btn-secondary mx-auto">
          <ArrowLeft className="h-4 w-4" />
          返回登入
        </Link>
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

      <p className="text-sm leading-relaxed text-zinc-400">
        輸入註冊時使用的電郵，我們會寄出一封重設密碼連結。
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="label">
            電郵
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            inputMode="email"
            className="input"
            placeholder="you@example.com"
            value={values.email}
            onChange={(event) => {
              setValues({ email: event.target.value });
              setErrors({});
            }}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email ? <p className="mt-1.5 text-xs text-red-400">{errors.email}</p> : null}
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !isConfigured}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? '寄出中…' : '寄出重設密碼連結'}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-400">
        <Link href="/login" className="text-brand-300 hover:text-brand-200">
          返回登入
        </Link>
      </p>
    </div>
  );
}
