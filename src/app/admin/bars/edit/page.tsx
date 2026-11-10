import { Suspense } from 'react';
import type { Metadata } from 'next';
import { EditBarLoader } from '@/components/admin/EditBarLoader';

export const metadata: Metadata = { title: '編輯酒吧' };

/**
 * 編輯酒吧（靜態頁）。
 * 原本的 /admin/bars/[id]/edit 無法靜態匯出，故改為 /admin/bars/edit?id=<barId>。
 */
export default function EditBarPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-zinc-400">
          正在載入酒吧資料…
        </div>
      }
    >
      <EditBarLoader />
    </Suspense>
  );
}