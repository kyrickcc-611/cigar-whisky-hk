'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { BAR_TYPES, DISTRICTS } from '@/lib/constants';
import { deleteBar, listBars, setBarActive } from '@/lib/repositories/bars';
import { cn, formatDate } from '@/lib/utils';
import type { Bar } from '@/types';

type StatusFilter = 'all' | 'active' | 'inactive';

/** 後台酒吧清單：搜尋、上下架、刪除 */
export default function AdminBarsPage() {
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const load = useCallback(async () => {
    setBars(await listBars({ includeInactive: true }));
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await listBars({ includeInactive: true });
        if (!cancelled) setBars(loaded);
      } catch (loadError) {
        console.error('[admin] 讀取酒吧清單失敗', loadError);
        if (!cancelled) setError('讀取酒吧清單失敗，請稍後再試。');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleActive(bar: Bar) {
    setBusyId(bar.id);
    setError(null);
    setNotice(null);
    try {
      await setBarActive(bar.id, !bar.isActive);
      await load();
      setNotice(`「${bar.name}」已${bar.isActive ? '下架' : '公開顯示'}。`);
    } catch (actionError) {
      console.error('[admin] 更新上下架狀態失敗', actionError);
      setError('更新失敗，請確認你仍具備管理員權限。');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(bar: Bar) {
    const confirmed = window.confirm(`確定永久刪除「${bar.name}」？此操作無法復原。`);
    if (!confirmed) return;

    setBusyId(bar.id);
    setError(null);
    setNotice(null);
    try {
      await deleteBar(bar.id);
      await load();
      setNotice(`「${bar.name}」已刪除。`);
    } catch (actionError) {
      console.error('[admin] 刪除酒吧失敗', actionError);
      setError('刪除失敗，請確認你仍具備管理員權限。');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReload() {
    setReloading(true);
    setError(null);
    try {
      await load();
    } catch (loadError) {
      console.error('[admin] 重新載入酒吧清單失敗', loadError);
      setError('重新載入失敗，請稍後再試。');
    } finally {
      setReloading(false);
    }
  }

  /** 新加入的排前面，方便即時看到剛剛建立的酒吧 */
  const filtered = useMemo(() => {
    if (!bars) return [];
    const term = keyword.trim().toLowerCase();

    return [...bars]
      .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
      .filter((bar) => {
        if (statusFilter === 'active' && !bar.isActive) return false;
        if (statusFilter === 'inactive' && bar.isActive) return false;
        if (!term) return true;
        return [bar.name, bar.nameEn, bar.address, bar.addressEn, bar.district]
          .join(' ')
          .toLowerCase()
          .includes(term);
      });
  }, [bars, keyword, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          酒吧管理
          {bars ? <span className="ml-2 text-xs text-zinc-500">共 {bars.length} 間</span> : null}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void handleReload()}
            className="btn-secondary px-3 py-1.5 text-xs"
            disabled={reloading}
          >
            {reloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            重新載入
          </button>
          <Link href="/admin/bars/new" className="btn-primary px-3 py-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" />
            新增酒吧
          </Link>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          className="input h-9 max-w-xs"
          placeholder="搜尋名稱、地址或地區"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          aria-label="搜尋酒吧"
        />
        <div className="flex gap-1.5">
          {(
            [
              { value: 'all', label: '全部' },
              { value: 'active', label: '已公開' },
              { value: 'inactive', label: '已下架' },
            ] as { value: StatusFilter; label: string }[]
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setStatusFilter(option.value)}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-xs transition-colors',
                statusFilter === option.value
                  ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                  : 'border-surface-border text-zinc-300 hover:border-brand-500/50',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-surface-border text-left text-xs text-zinc-500">
              <th className="py-2 pr-3 font-medium">名稱</th>
              <th className="py-2 pr-3 font-medium">類型</th>
              <th className="py-2 pr-3 font-medium">地區</th>
              <th className="py-2 pr-3 font-medium">狀態</th>
              <th className="py-2 pr-3 font-medium">建立日期</th>
              <th className="py-2 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60">
            {bars === null ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-zinc-400">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
                    載入中…
                  </span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sm text-zinc-400">
                  沒有符合條件的酒吧。
                </td>
              </tr>
            ) : (
              filtered.map((bar) => (
                <tr key={bar.id}>
                  <td className="py-2.5 pr-3">
                    <Link
                      href={`/admin/bars/${bar.id}/edit`}
                      className="text-foreground transition-colors hover:text-brand-300"
                    >
                      {bar.name || '（未命名）'}
                    </Link>
                    {bar.nameEn ? <p className="text-xs text-zinc-500">{bar.nameEn}</p> : null}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-300">
                    {BAR_TYPES.find((option) => option.value === bar.type)?.labelZh ?? bar.type}
                  </td>
                  <td className="py-2.5 pr-3 text-zinc-300">
                    {DISTRICTS.find((option) => option.value === bar.district)?.labelZh ??
                      bar.district}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={cn('badge', bar.isActive ? 'text-emerald-300' : 'text-zinc-400')}
                    >
                      {bar.isActive ? '已公開' : '已下架'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-xs text-zinc-500">{formatDate(bar.createdAt)}</td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link
                        href={`/admin/bars/${bar.id}/edit`}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        編輯
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(bar)}
                        disabled={busyId === bar.id}
                        className="btn-secondary px-2 py-1 text-xs"
                      >
                        {busyId === bar.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : bar.isActive ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                        {bar.isActive ? '下架' : '公開'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(bar)}
                        disabled={busyId === bar.id}
                        className="btn-secondary px-2 py-1 text-xs hover:border-red-500/60 hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
