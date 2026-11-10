import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

const NAV_LINKS = [
  { href: '/bars', label: '尋找酒吧' },
  { href: '/bars?type=cigar', label: '雪茄吧' },
  { href: '/bars?type=whisky', label: '威士忌吧' },
];

/**
 * 全站頁首。
 * Phase 1 會在此加入 UserMenu（頭像、登出、Admin 入口、收藏數）。
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-surface-border/80 bg-[#0b0a0d]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        {/* 品牌 */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15 text-lg">
            🥃
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-wide text-foreground">{SITE_NAME}</span>
            <span className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Cigar · Whisky · HK
            </span>
          </span>
        </Link>

        {/* 桌面版導覽 */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-brand-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-secondary">
            登入
          </Link>
        </div>
      </div>

      {/* 手機版導覽 */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-surface-border/60 px-4 py-2 md:hidden">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-brand-300"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
