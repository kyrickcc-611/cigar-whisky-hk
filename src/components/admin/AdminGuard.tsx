'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/**
 * 後台權限閘門（雙重保護）：
 * 1. 這裡只負責 UX（未登入 → 轉去 /login，非管理員 → 顯示無權限）；
 * 2. 真正的最後防線是 firestore.rules 的 isSuperAdmin()，即使繞過前端也寫不入資料。
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, profile, loading, isSuperAdmin, isConfigured, configError } = useAuth();

  // 未登入 → 導向登入頁，成功後返回原本想去的後台頁面（含 query 參數，例如 ?id=xxx）。
  // 用 window.location 而非 usePathname，是為了保留 search 且避免靜態匯出時的 Suspense 限制。
  useEffect(() => {
    if (!isConfigured || loading || user) return;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
    const { pathname: rawPath, search } = window.location;
    const path =
      basePath && rawPath.startsWith(basePath)
        ? rawPath.slice(basePath.length) || '/'
        : rawPath;
    const redirect = `${path}${search}` || '/admin';

    router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
  }, [isConfigured, loading, user, router]);

  if (!isConfigured) {
    return (
      <div className="card mx-auto max-w-lg space-y-2 text-sm leading-relaxed text-amber-200">
        <p className="font-semibold text-amber-100">Firebase 尚未設定</p>
        <p>{configError ?? '請先在 .env.local 填寫 Firebase 設定後重新啟動 dev server。'}</p>
      </div>
    );
  }

  if (loading || !user || !profile) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-sm text-zinc-400">
        <Loader2 className="h-5 w-5 animate-spin text-brand-400" />
        <p>正在檢查管理權限…</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="card mx-auto max-w-md space-y-4 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-300">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-foreground">沒有管理權限</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          帳號
          <span className="mx-1 text-zinc-200">{profile.email || profile.displayName}</span>
          不是管理員。如需管理酒吧資料，請聯絡站長為你開通權限。
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/" className="btn-secondary flex-1">
            返回首頁
          </Link>
          <Link href="/bars" className="btn-primary flex-1">
            瀏覽酒吧
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
