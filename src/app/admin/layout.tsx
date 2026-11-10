import type { Metadata } from 'next';
import Link from 'next/link';
import { AdminGuard } from '@/components/admin/AdminGuard';

export const metadata: Metadata = {
  title: '後台管理',
  // 後台不應被搜尋引擎收錄
  robots: { index: false, follow: false },
};

const ADMIN_NAV = [
  { href: '/admin', label: '儀表板' },
  { href: '/admin/bars', label: '酒吧管理' },
  { href: '/admin/bars/new', label: '新增酒吧' },
];

/**
 * 後台外框：權限檢查 + 導覽。
 * 所有 /admin/** 頁面都會先經過 AdminGuard（未登入會轉去 /login）。
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <AdminGuard>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-foreground">後台管理</h1>
            <p className="mt-1 text-xs text-zinc-500">只有管理員（superadmin）可以進入此區域。</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="badge transition-colors hover:border-brand-500/60 hover:text-brand-200"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/bars"
              className="badge transition-colors hover:border-brand-500/60 hover:text-brand-200"
            >
              查看網站
            </Link>
          </nav>
        </div>

        {children}
      </AdminGuard>
    </div>
  );
}
