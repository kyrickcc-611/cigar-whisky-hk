'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  Star,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import { BAR_TAGS, BAR_TYPES, DISTRICTS, RATING_DIMENSIONS, WEEKDAYS } from '@/lib/constants';
import { formatDayHours, getWeekdayKey, isBarOpenNow } from '@/lib/openingHours';
import { formatRating, overallRating } from '@/lib/ratings';
import { getBarById } from '@/lib/repositories/bars';
import { resolveImageUrl, resolveImageUrls } from '@/lib/services/images';
import { cn } from '@/lib/utils';
import type { Bar } from '@/types';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

/** 酒吧詳情（純 client 讀取 Firestore；下架酒吧會被 Security Rules 擋住 → 視為不存在） */
export function BarDetail() {
  const params = useParams();
  const barId = typeof params?.id === 'string' ? params.id : undefined;

  const [bar, setBar] = useState<Bar | null>(null);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    if (!barId) {
      setState('missing');
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const loaded = await getBarById(barId);
        if (cancelled) return;
        setBar(loaded);
        setState(loaded ? 'ready' : 'missing');
      } catch (error) {
        console.error('[bars] 讀取酒吧詳情失敗', error);
        if (!cancelled) setState('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [barId]);

  if (state === 'loading') {
    return (
      <p className="flex items-center justify-center gap-2 py-20 text-sm text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin text-brand-400" />
        正在載入酒吧資料…
      </p>
    );
  }

  if (state !== 'ready' || !bar) {
    return (
      <div className="card space-y-3 text-center">
        <p className="text-sm text-foreground">
          {state === 'missing'
            ? '找不到這間酒吧，可能已被下架或刪除。'
            : '讀取酒吧資料時發生問題，請稍後再試。'}
        </p>
        <Link href="/bars" className="btn-secondary mx-auto w-fit">
          <ArrowLeft className="h-4 w-4" />
          返回酒吧列表
        </Link>
      </div>
    );
  }

  const images = [resolveImageUrl(bar.coverImage), ...resolveImageUrls(bar.images)].filter(
    (url): url is string => Boolean(url),
  );
  const coverUrl = images[0] ?? null;
  const openNow = isBarOpenNow(bar);
  const todayKey = getWeekdayKey(new Date());
  const rating = overallRating(bar.ratings);
  const typeLabel = BAR_TYPES.find((option) => option.value === bar.type)?.labelZh ?? '酒吧';
  const districtLabel =
    DISTRICTS.find((option) => option.value === bar.district)?.labelZh ?? bar.district;

  return (
    <article className="space-y-6">
      <Link
        href="/bars"
        className="inline-flex items-center gap-1 text-xs text-zinc-400 transition-colors hover:text-brand-300"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回酒吧列表
      </Link>

      <div className="card overflow-hidden p-0">
        {coverUrl ? (
          // 用戶提供的任意圖片網址，無法預先設定 next/image 的 remotePatterns
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt={bar.name} className="h-56 w-full object-cover sm:h-72" />
        ) : (
          <div className="flex h-40 items-center justify-center bg-surface-raised text-xs text-zinc-600">
            暫無圖片
          </div>
        )}

        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{bar.name}</h1>
              {bar.nameEn ? <p className="mt-1 text-sm text-zinc-500">{bar.nameEn}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge">{typeLabel}</span>
              <span className="badge">{districtLabel}</span>
              <span
                className={cn(
                  'badge',
                  openNow ? 'border-emerald-500/50 text-emerald-300' : 'text-zinc-400',
                )}
              >
                {openNow ? '營業中' : '已休息'}
              </span>
            </div>
          </div>

          <div className="grid gap-2 text-sm text-zinc-300">
            <p className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>
                {bar.address}
                {bar.addressEn ? (
                  <span className="block text-xs text-zinc-500">{bar.addressEn}</span>
                ) : null}
              </span>
            </p>
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-brand-400" />
              今日 {formatDayHours(bar.openingHours[todayKey])}
              {bar.openingHoursNote ? (
                <span className="text-xs text-zinc-500">（{bar.openingHoursNote}）</span>
              ) : null}
            </p>
            {bar.phone ? (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-brand-400" />
                <a
                  href={`tel:${bar.phone.replace(/\s+/g, '')}`}
                  className="transition-colors hover:text-brand-300"
                >
                  {bar.phone}
                </a>
              </p>
            ) : null}
            <p className="flex items-center gap-2">
              <Star className="h-4 w-4 shrink-0 text-brand-400" />
              評分 {formatRating(rating)}
              <span className="text-xs text-zinc-500">
                {bar.ratings.reviewCount > 0
                  ? `（${bar.ratings.reviewCount} 篇感想）`
                  : '（暫未有人評分）'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={bar.googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              <Navigation className="h-4 w-4" />
              Google Maps 導航
            </a>
            {bar.phone ? (
              <a href={`tel:${bar.phone.replace(/\s+/g, '')}`} className="btn-secondary">
                <Phone className="h-4 w-4" />
                致電
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="card space-y-3">
          <h2 className="text-sm font-semibold text-brand-200">介紹</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-300">
            {bar.description || '暫未提供介紹。'}
          </p>

          {bar.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {bar.tags.map((tag) => (
                <span key={tag} className="badge">
                  {BAR_TAGS.find((option) => option.value === tag)?.labelZh ?? tag}
                </span>
              ))}
            </div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="card space-y-2">
            <h2 className="text-sm font-semibold text-brand-200">營業時間</h2>
            <ul className="divide-y divide-surface-border/60 text-sm">
              {WEEKDAYS.map((weekday) => (
                <li
                  key={weekday.key}
                  className={cn(
                    'flex items-center justify-between py-1.5',
                    weekday.key === todayKey ? 'text-brand-200' : 'text-zinc-300',
                  )}
                >
                  <span>{weekday.labelZh}</span>
                  <span className="text-xs">
                    {formatDayHours(bar.openingHours[weekday.key])}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card space-y-3">
            <h2 className="text-sm font-semibold text-brand-200">評分</h2>
            {bar.ratings.reviewCount > 0 ? (
              <ul className="space-y-2 text-xs text-zinc-400">
                {RATING_DIMENSIONS.map((dimension) => {
                  const value = bar.ratings[dimension.key];
                  return (
                    <li key={dimension.key} className="space-y-1">
                      <div className="flex justify-between">
                        <span>{dimension.labelZh}</span>
                        <span className="text-zinc-300">{formatRating(value)}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-raised">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.min(Math.max(value / 5, 0), 1) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-500">
                暫未有人評分。感想功能將於 Phase 4 推出。
              </p>
            )}
          </section>
        </div>
      </div>

      {images.length > 1 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-200">相片</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${url}-${index}`}
                src={url}
                alt={`${bar.name} 相片 ${index + 1}`}
                loading="lazy"
                className="h-32 w-full rounded-lg border border-surface-border object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm text-zinc-300">
          <span className="flex items-center gap-1.5">
            <ThumbsUp className="h-4 w-4 text-emerald-400" />
            {bar.likes + bar.likesOffset}
          </span>
          <span className="flex items-center gap-1.5">
            <ThumbsDown className="h-4 w-4 text-red-400" />
            {bar.dislikes + bar.dislikesOffset}
          </span>
        </div>
        <p className="text-xs text-zinc-500">Like / Dislike 投票功能將於 Phase 4 推出。</p>
      </section>
    </article>
  );
}
