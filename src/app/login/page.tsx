import { Suspense } from 'react';
import type { Metadata } from 'next';
import { LoginPanel } from '@/components/auth/LoginPanel';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: '登入',
  description: `登入 ${SITE_NAME}，即可 Like / Dislike、撰寫感想、收藏酒吧及上傳相片。`,
};

/**
 * Phase 1：Firebase Authentication 電郵登入 + Google 登入。
 * 靜態匯出下 ?redirect= 由 LoginPanel（client）以 useSearchParams() 讀取。
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col px-4 py-14">
          <div className="card p-6 text-sm text-zinc-400">正在載入登入表單…</div>
        </div>
      }
    >
      <LoginPanel />
    </Suspense>
  );
}
