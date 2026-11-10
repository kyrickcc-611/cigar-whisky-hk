import Link from 'next/link';
import { SITE_NAME } from '@/lib/constants';

/** 全站頁尾 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-surface-border/80 bg-[#0b0a0d]/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <p className="text-sm font-semibold text-foreground">{SITE_NAME}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            香港雪茄吧及威士忌吧發現平台。資料由管理員及用戶提供，營業時間或有變動，出發前建議先致電確認。
          </p>
        </div>

        <div className="flex gap-10 text-xs text-zinc-400">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-300">探索</span>
            <Link href="/bars" className="hover:text-brand-300">
              全部酒吧
            </Link>
            <Link href="/bars?openNow=1" className="hover:text-brand-300">
              現在營業中
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium text-zinc-300">帳號</span>
            <Link href="/login" className="hover:text-brand-300">
              登入
            </Link>
            <Link href="/register" className="hover:text-brand-300">
              註冊
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border/60 px-4 py-4 text-center text-[11px] text-zinc-600">
        © {year} {SITE_NAME}. 理性飲酒，禁止酒後駕駛。未滿 18 歲人士不得購買或飲用酒精飲品。
      </div>
    </footer>
  );
}
