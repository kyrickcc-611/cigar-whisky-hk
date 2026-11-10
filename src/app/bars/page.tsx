import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BarsBrowser } from '@/components/bars/BarsBrowser';

export const metadata: Metadata = { title: '尋找酒吧' };

/**
 * 酒吧列表（首頁的搜尋表單及快速連結會帶 query 參數到這裡）。
 * 篩選條件改由 BarsBrowser 以 useSearchParams() 讀取 ——
 * 靜態匯出（Firebase Hosting）不支援 server 端的 searchParams。
 */
export default function BarsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">尋找酒吧</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
          收錄全港雪茄吧及威士忌吧。以地區、類型、營業狀態篩選，或直接搜尋名稱及特色。
        </p>
      </header>

      <Suspense
        fallback={
          <p className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-400">
            正在載入酒吧…
          </p>
        }
      >
        <BarsBrowser />
      </Suspense>
    </div>
  );
}

