import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: '忘記密碼',
  description: '輸入註冊電郵，我們會寄出重設密碼連結。',
};

/** Phase 1：Firebase 重設密碼電郵 */
export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">忘記密碼</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          輸入註冊時使用的電郵，我們會寄出重設密碼連結。
        </p>
      </div>

      <div className="card p-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
