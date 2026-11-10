import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: '登入',
  description: `登入 ${SITE_NAME}，即可 Like / Dislike、撰寫感想、收藏酒吧及上傳相片。`,
};

interface LoginPageProps {
  searchParams: { redirect?: string | string[] };
}

/** 只接受站內相對路徑，避免 open redirect */
function sanitizeRedirect(value?: string | string[]): string {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

/** Phase 1：Firebase Authentication 電郵登入 + Google 登入 */
export default function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = sanitizeRedirect(searchParams.redirect);

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
