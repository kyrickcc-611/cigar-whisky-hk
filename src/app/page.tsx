import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Circle, MapPin, Search, Sparkles } from 'lucide-react';
import { BAR_TYPES, SITE_NAME } from '@/lib/constants';
import { isFirebaseConfigured } from '@/lib/firebase/client';

/** 首頁：品牌介紹 + 快速搜尋 + 目前建置狀態 */
export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative pb-12 pt-16 sm:pt-24">
        <span className="badge">
          <Sparkles className="h-3 w-3 text-brand-400" />
          香港雪茄吧・威士忌吧發現平台
        </span>

        <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight text-balance sm:text-5xl">
          搵今晚嘅
          <span className="text-brand-400"> 雪茄與威士忌</span>
          <br />
          由一間好酒吧開始
        </h1>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          收錄全港雪茄吧及威士忌吧，支援地區篩選、距離排序、即時營業狀態、多角度評分與用戶相片牆。
        </p>

        {/* 搜尋（漸進增強：沒有 JS 亦可提交到 /bars） */}
        <form action="/bars" method="get" className="mt-8 flex max-w-2xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              name="q"
              placeholder="搜尋酒吧名稱、地址、特色（例如：中環 humidor）"
              className="input h-11 pl-9"
              aria-label="搜尋酒吧"
            />
          </div>
          <button type="submit" className="btn-primary h-11">
            搜尋
          </button>
        </form>

        {/* 快速入口 */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500">熱門：</span>
          <Link href="/bars?district=central" className="badge hover:border-brand-500/60 hover:text-brand-300">
            <MapPin className="h-3 w-3" />
            中環
          </Link>
          <Link
            href="/bars?district=tsim-sha-tsui"
            className="badge hover:border-brand-500/60 hover:text-brand-300"
          >
            <MapPin className="h-3 w-3" />
            尖沙咀
          </Link>
          <Link
            href="/bars?district=causeway-bay"
            className="badge hover:border-brand-500/60 hover:text-brand-300"
          >
            <MapPin className="h-3 w-3" />
            銅鑼灣
          </Link>
          <Link href="/bars?openNow=1" className="badge hover:border-brand-500/60 hover:text-brand-300">
            現在營業中
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ 類型入口 */}
      <section className="grid gap-4 sm:grid-cols-3">
        {BAR_TYPES.map((type) => (
          <Link
            key={type.value}
            href={`/bars?type=${type.value}`}
            className="card group transition-colors hover:border-brand-500/60"
          >
            <p className="text-lg font-semibold text-foreground group-hover:text-brand-300">
              {type.labelZh}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-zinc-500">{type.labelEn}</p>
          </Link>
        ))}
      </section>

      {/* --------------------------------------------------------- Firebase 狀態 */}
      <section className="mt-12 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="text-sm font-semibold text-foreground">Firebase 連線狀態</h2>
          {isFirebaseConfigured ? (
            <div className="mt-3 flex items-start gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="break-all">
                已偵測到 Firebase 環境變數（project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}）
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2 text-sm text-amber-400">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>尚未設定 Firebase，請完成以下步驟後重新啟動 dev server：</p>
              </div>
              <ol className="ml-6 list-decimal space-y-1 text-xs text-zinc-400">
                <li>
                  將 <code className="text-brand-300">.env.local.example</code> 複製為{' '}
                  <code className="text-brand-300">.env.local</code>
                </li>
                <li>在 Firebase Console 建立專案並取得 Web App 設定值</li>
                <li>填入 6 個 NEXT_PUBLIC_FIREBASE_* 值，再執行 npm run dev</li>
              </ol>
            </div>
          )}
        </div>

        {/* 建置進度 */}
        <div className="card">
          <h2 className="text-sm font-semibold text-foreground">開發進度</h2>
          <ul className="mt-3 space-y-2 text-xs text-zinc-400">
            {[
              { label: 'Phase 0：專案架構、型別、工具函數', done: true },
              { label: 'Phase 1：Firebase 設定 + 登入 / 註冊', done: false },
              { label: 'Phase 2：Admin 酒吧 CRUD + 相片上傳', done: false },
              { label: 'Phase 3：列表、搜尋、地圖、詳情頁', done: false },
              { label: 'Phase 4：Like / Dislike 投票', done: false },
            ].map((item) => (
              <li key={item.label} className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-zinc-600" />
                )}
                <span className={item.done ? 'text-zinc-300' : undefined}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-zinc-600">
        {SITE_NAME} · 理性飲酒，禁止酒後駕駛
      </p>
    </div>
  );
}
