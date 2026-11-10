'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, EyeOff, Loader2, Plus } from 'lucide-react';
import { listBars } from '@/lib/repositories/bars';
import { formatDate } from '@/lib/utils';
import type { Bar } from '@/types';

/** 後台儀表板：酒吧統計與最近新增 */
export default function AdminDashboardPage() {
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await listBars({ includeInactive: true });
        if (!cancelled) setBars(loaded);
      } catch (loadError) {
        console.error('[admin] 讀取酒吧統計失敗', loadError);
        if (!cancelled) setError('讀取酒吧資料失敗，請稍後重新整理頁面。');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const total = bars?.length ?? 0;
  const activeCount = bars?.filter((bar) => bar.isActive).length ?? 0;
  const recent = bars
    ? [...bars]
        .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
        .slice(0, 5)
    : [];

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Building2 className="h-4 w-4" />} label="酒吧總數" value={total} />
        <StatCard icon={<Eye className="h-4 w-4" />} label="已公開" value={activeCount} />
        <StatCard
          icon={<EyeOff className="h-4 w-4" />}
          label="已下架"
          value={Math.max(total - activeCount, 0)}
        />
      </div>

      <section className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-brand-200">最近新增</h2>
          <Link href="/admin/bars/new" className="btn-primary px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            新增酒吧
          </Link>
        </div>

        {bars === null ? (
          <p className="flex items-center gap-2 text-sm text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
            載入中…
          </p>
        ) : recent.length === 0 ? (
          <p className="text-sm text-zinc-400">
            資料庫暫時未有酒吧。按「新增酒吧」開始建立第一間吧。
          </p>
        ) : (
          <ul className="divide-y divide-surface-border/60">
            {recent.map((bar) => (
              <li key={bar.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <Link
                    href={`/admin/bars/${bar.id}/edit`}
                    className="truncate text-sm text-foreground hover:text-brand-300"
                  >
                    {bar.name || '（未命名）'}
                  </Link>
                  <p className="text-xs text-zinc-500">
                    {formatDate(bar.createdAt)} · {bar.district}
                  </p>
                </div>
                <span className={bar.isActive ? 'badge text-emerald-300' : 'badge text-zinc-400'}>
                  {bar.isActive ? '已公開' : '已下架'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-relaxed text-zinc-500">
        提示：刪除酒吧會即時從網站消失；只想暫時隱藏請在編輯頁取消「公開顯示」。
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="card">
      <p className="flex items-center gap-2 text-xs text-zinc-400">
        <span className="text-brand-300">{icon}</span>
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
