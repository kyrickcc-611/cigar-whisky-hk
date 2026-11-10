'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Heart, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { logout } from '@/lib/firebase/auth';

/**
 * 頁首用戶選單。
 * 未登入 → 登入／註冊按鈕；已登入 → 頭像 + 下拉選單（收藏、後台、登出）。
 */
export function UserMenu() {
  const router = useRouter();
  const { user, profile, loading, isSuperAdmin, isConfigured } = useAuth();

  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // 點擊選單以外地方或按 Esc 關閉
  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await logout();
      setOpen(false);
      router.push('/');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  // 首次載入中：顯示佔位，避免版面跳動
  if (loading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-surface-raised" aria-hidden="true" />;
  }

  // 未登入
  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="btn-secondary">
          登入
        </Link>
        {isConfigured ? (
          <Link href="/register" className="btn-primary hidden sm:inline-flex">
            註冊
          </Link>
        ) : null}
      </div>
    );
  }

  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || '用戶';
  const photoURL = profile?.photoURL ?? user.photoURL;
  const favoritesCount = profile?.favorites.length ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface-raised px-2 py-1.5 text-sm text-foreground transition-colors hover:border-brand-500/60"
      >
        {photoURL ? (
          // Firebase Storage 圖片：用原生 img 避免 next/image 需要 remotePatterns 設定
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoURL}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/20 text-xs font-semibold text-brand-200">
            {displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[8rem] truncate sm:inline">{displayName}</span>
        <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-60 animate-fade-in overflow-hidden rounded-xl border border-surface-border bg-surface p-1.5 shadow-card"
        >
          <div className="border-b border-surface-border/70 px-2.5 pb-2 pt-1.5">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
            {isSuperAdmin ? (
              <span className="badge mt-1.5 border-brand-500/40 text-brand-200">
                <ShieldCheck className="h-3 w-3" />
                超級管理員
              </span>
            ) : null}
          </div>

          {isSuperAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 hover:text-brand-300"
            >
              <LayoutDashboard className="h-4 w-4" />
              後台管理
            </Link>
          ) : null}

          <Link
            href="/me/favorites"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 hover:text-brand-300"
          >
            <span className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              我的收藏
            </span>
            {favoritesCount > 0 ? (
              <span className="text-xs text-zinc-500">{favoritesCount}</span>
            ) : null}
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-zinc-200 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" />
            {loggingOut ? '登出中…' : '登出'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
