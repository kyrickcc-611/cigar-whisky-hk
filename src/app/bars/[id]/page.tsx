import type { Metadata } from 'next';
import { BarDetail } from '@/components/bars/BarDetail';

export const metadata: Metadata = { title: '酒吧詳情' };

/** 酒吧詳情（資料由 client SDK 讀取，見 BarDetail） */
export default function BarDetailPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <BarDetail />
    </div>
  );
}
