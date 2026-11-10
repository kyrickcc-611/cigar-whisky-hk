import { Suspense } from 'react';
import type { Metadata } from 'next';
import { BarDetail } from '@/components/bars/BarDetail';

export const metadata: Metadata = { title: '酒吧詳情' };

/**
 * 酒吧詳情（靜態頁）。
 * 因為要支援靜態匯出（Firebase Hosting），網址由 /bars/[id] 改為
 * /bars/detail?id=<barId>，BarDetail 以 useSearchParams() 讀取 id。
 */
export default function BarDetailPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Suspense
        fallback={
          <p className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-400">
            正在載入酒吧資料…
          </p>
        }
      >
        <BarDetail />
      </Suspense>
    </div>
  );
}