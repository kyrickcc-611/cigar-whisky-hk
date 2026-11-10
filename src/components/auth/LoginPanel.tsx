'use client';

import { useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/auth/LoginForm';

/** 只接受站內相對路徑，避免 open redirect */
function sanitizeRedirect(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

/**
 * 登入表單外殼（client component）。
 * 靜態匯出下無法使用 server 的 searchParams，故以 useSearchParams() 讀取 ?redirect=。
 */
export function LoginPanel() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirect(searchParams.get('redirect'));

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">歡迎回來</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          登入後即可 Like / Dislike、撰寫感想及收藏酒吧。
        </p>
      </div>

      <div className="card p-6">
        <LoginForm redirectTo={redirectTo} />
      </div>
    </div>
  );
}