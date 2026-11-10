import Link from 'next/link';
import { Clock, MapPin, Star, ThumbsUp } from 'lucide-react';
import { BAR_TYPES, DISTRICTS } from '@/lib/constants';
import { formatDayHours, getDayHours, isBarOpenNow } from '@/lib/openingHours';
import { formatRating, overallRating } from '@/lib/ratings';
import { resolveImageUrl, resolveImageUrls } from '@/lib/services/images';
import { cn } from '@/lib/utils';
import type { Bar } from '@/types';

/** 酒吧卡片（/bars 列表用） */
export function BarCard({ bar }: { bar: Bar }) {
  const coverUrl = resolveImageUrl(bar.coverImage) ?? resolveImageUrls(bar.images)[0] ?? null;
  const openNow = isBarOpenNow(bar);
  const rating = overallRating(bar.ratings);
  const typeLabel = BAR_TYPES.find((option) => option.value === bar.type)?.labelZh ?? '酒吧';
  const districtLabel =
    DISTRICTS.find((option) => option.value === bar.district)?.labelZh ?? bar.district;

  return (
    <Link
      href={`/bars/detail?id=${bar.id}`}
      className="card group flex flex-col overflow-hidden p-0 transition-colors hover:border-brand-500/60"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-raised">
        {coverUrl ? (
          // 用戶提供的任意圖片網址，無法預先設定 next/image 的 remotePatterns
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={bar.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">
            暫無圖片
          </div>
        )}

        <span
          className={cn(
            'absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium',
            openNow ? 'bg-emerald-500/90 text-black' : 'bg-black/70 text-zinc-300',
          )}
        >
          {openNow ? '營業中' : '已休息'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground transition-colors group-hover:text-brand-300">
            {bar.name}
          </h3>
          <span className="badge shrink-0">{typeLabel}</span>
        </div>

        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <MapPin className="h-3 w-3 shrink-0" />
          {districtLabel}
        </p>
        <p className="flex items-center gap-1 text-xs text-zinc-500">
          <Clock className="h-3 w-3 shrink-0" />
          今日 {formatDayHours(getDayHours(bar.openingHours))}
        </p>

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="flex items-center gap-1 text-xs text-brand-300">
            <Star className="h-3.5 w-3.5" />
            {formatRating(rating)}
            {bar.ratings.reviewCount > 0 ? (
              <span className="text-zinc-500">（{bar.ratings.reviewCount}）</span>
            ) : null}
          </span>
          <span className="flex items-center gap-1 text-xs text-zinc-500">
            <ThumbsUp className="h-3 w-3" />
            {bar.likes + bar.likesOffset}
          </span>
        </div>
      </div>
    </Link>
  );
}
