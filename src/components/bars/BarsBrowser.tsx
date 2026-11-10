'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import { BarCard } from '@/components/bars/BarCard';
import { BAR_TYPES, DISTRICTS } from '@/lib/constants';
import { isBarOpenNow } from '@/lib/openingHours';
import { overallRating } from '@/lib/ratings';
import { listBars } from '@/lib/repositories/bars';
import { cn } from '@/lib/utils';
import type { Bar } from '@/types';

type SortOption = 'default' | 'rating' | 'likes';

/** 只接受合法排序值，防止網址亂填入奇怪數值 */
function readSortOption(value: string | null): SortOption {
  return value === 'rating' || value === 'likes' ? value : 'default';
}

/**
 * 酒吧瀏覽器（Phase 2 版本）：關鍵字、地區、類型、營業中篩選 + 基本排序。
 * 篩選條件由 useSearchParams() 讀取（靜態匯出支援），首頁／頁尾的連結可直接帶參數。
 * Phase 3 會再加上距離排序（手機定位）與地圖模式。
 */
export function BarsBrowser() {
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();

  const [bars, setBars] = useState<Bar[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [keyword, setKeyword] = useState(() => searchParams.get('q') ?? '');
  const [district, setDistrict] = useState(() => searchParams.get('district') ?? 'all');
  const [type, setType] = useState(() => searchParams.get('type') ?? 'all');
  const [openNowOnly, setOpenNowOnly] = useState(() => searchParams.get('openNow') === '1');
  const [sortBy, setSortBy] = useState<SortOption>(() => readSortOption(searchParams.get('sort')));

  // 由其他頁面帶參數導航進來（例如首頁的 /bars?type=cigar）時，同步更新篩選條件
  useEffect(() => {
    const params = new URLSearchParams(paramsKey);
    setKeyword(params.get('q') ?? '');
    setDistrict(params.get('district') ?? 'all');
    setType(params.get('type') ?? 'all');
    setOpenNowOnly(params.get('openNow') === '1');
    setSortBy(readSortOption(params.get('sort')));
  }, [paramsKey]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await listBars();
        if (!cancelled) setBars(loaded);
      } catch (loadError) {
        console.error('[bars] 讀取酒吧清單失敗', loadError);
        if (!cancelled) setError('讀取酒吧清單失敗，請稍後重新整理頁面。');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!bars) return [];
    const term = keyword.trim().toLowerCase();

    const result = bars.filter((bar) => {
      if (district !== 'all' && bar.district !== district) return false;
      // 「雪茄・威士忌」酒吧同時符合雪茄及威士忌篩選
      if (type !== 'all' && bar.type !== type && bar.type !== 'both') return false;
      if (openNowOnly && !isBarOpenNow(bar)) return false;
      if (!term) return true;
      return [bar.name, bar.nameEn, bar.address, bar.addressEn, bar.tags.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });

    if (sortBy === 'rating') {
      result.sort((a, b) => overallRating(b.ratings) - overallRating(a.ratings));
    } else if (sortBy === 'likes') {
      result.sort((a, b) => b.likes + b.likesOffset - (a.likes + a.likesOffset));
    }
    return result;
  }, [bars, keyword, district, type, openNowOnly, sortBy]);

  const hasFilters =
    keyword.trim() !== '' ||
    district !== 'all' ||
    type !== 'all' ||
    openNowOnly ||
    sortBy !== 'default';

  function resetFilters() {
    setKeyword('');
    setDistrict('all');
    setType('all');
    setOpenNowOnly(false);
    setSortBy('default');
  }

  return (
    <div className="space-y-5">
      {/* 篩選列 */}
      <div className="card space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            className="input h-10 pl-9"
            placeholder="搜尋酒吧名稱、地址或特色"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            aria-label="搜尋酒吧"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            className="input h-9 w-auto min-w-[7.5rem]"
            value={district}
            onChange={(event) => setDistrict(event.target.value)}
            aria-label="地區"
          >
            <option value="all">全部地區</option>
            {DISTRICTS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.labelZh}
              </option>
            ))}
          </select>

          <select
            className="input h-9 w-auto min-w-[7.5rem]"
            value={type}
            onChange={(event) => setType(event.target.value)}
            aria-label="酒吧類型"
          >
            <option value="all">全部類型</option>
            {BAR_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.labelZh}
              </option>
            ))}
          </select>

          <select
            className="input h-9 w-auto min-w-[7.5rem]"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            aria-label="排序方式"
          >
            <option value="default">名稱排序</option>
            <option value="rating">評分最高</option>
            <option value="likes">最多 Like</option>
          </select>

          <button
            type="button"
            onClick={() => setOpenNowOnly((previous) => !previous)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs transition-colors',
              openNowOnly
                ? 'border-brand-500 bg-brand-500/10 text-brand-200'
                : 'border-surface-border text-zinc-300 hover:border-brand-500/50',
            )}
            aria-pressed={openNowOnly}
          >
            現在營業中
          </button>

          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="ml-auto flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-brand-300"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重設
            </button>
          ) : null}
        </div>
      </div>

      {/* 結果 */}
      {error ? (
        <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : bars === null ? (
        <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
          正在載入酒吧…
        </p>
      ) : filtered.length === 0 ? (
        <div className="card space-y-2 py-12 text-center">
          <p className="text-sm text-foreground">找不到符合條件的酒吧</p>
          <p className="text-xs text-zinc-500">
            {bars.length === 0
              ? '資料庫暫時未有酒吧，管理員可在後台新增。'
              : '試試清除部分篩選條件，或改用其他關鍵字。'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">共 {filtered.length} 間酒吧</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((bar) => (
              <BarCard key={bar.id} bar={bar} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
