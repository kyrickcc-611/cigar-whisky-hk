import type { Metadata } from 'next';
import { BarForm } from '@/components/admin/BarForm';

export const metadata: Metadata = { title: '新增酒吧' };

export default function NewBarPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">新增酒吧</h2>
        <p className="mt-1 text-xs text-zinc-500">
          * 為必填欄位。未勾選「公開顯示」的酒吧只有管理員可見。
        </p>
      </div>

      <BarForm mode="create" />
    </div>
  );
}
