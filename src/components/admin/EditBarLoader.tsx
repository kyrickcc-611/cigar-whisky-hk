'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { BarForm } from '@/components/admin/BarForm';
import { getBarById } from '@/lib/repositories/bars';
import { barToFormValues, type BarFormValues } from '@/lib/validators/bar';

/**
 * 編輯酒吧的 client 載入器。
 * 用 client component 直接讀 Firestore（純 client SDK 架構），
 * 讀取失敗（無權限／已刪除）時顯示提示而不是白畫面。
 * 靜態匯出下網址為 /admin/bars/edit?id=<barId>，故以 useSearchParams() 取 id。
 */
export function EditBarLoader() {
  const searchParams = useSearchParams();
  const barId = searchParams.get('id') ?? undefined;

  const [values, setValues] = useState<BarFormValues | null>(null);
  const [barName, setBarName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!barId) {
      setError('網址缺少酒吧 ID。');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const bar = await getBarById(barId);
        if (cancelled) return;
        if (!bar) {
          setError('找不到這間酒吧，可能已被刪除。');
          return;
        }
        setBarName(bar.name);
        setValues(barToFormValues(bar));
      } catch (loadError) {
        console.error('[admin] 讀取酒吧失敗', loadError);
        if (!cancelled) setError('讀取酒吧資料失敗，請確認你仍具備管理員權限。');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [barId]);

  if (error) {
    return (
      <div className="card space-y-3 text-sm text-amber-200">
        <p className="flex items-center gap-2 font-semibold text-amber-100">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </p>
        <Link href="/admin/bars" className="btn-secondary w-fit">
          返回酒吧管理
        </Link>
      </div>
    );
  }

  if (!values || !barId) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center gap-2 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        正在載入酒吧資料…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">編輯：{barName || '未命名酒吧'}</h2>
        <p className="mt-1 text-xs text-zinc-500">
          文件 ID：<code className="text-brand-300">{barId}</code>
        </p>
      </div>

      <BarForm mode="edit" barId={barId} initialValues={values} />
    </div>
  );
}