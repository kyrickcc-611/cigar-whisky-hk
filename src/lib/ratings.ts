import { RATING_DIMENSIONS } from './constants';
import type { BarRatings, ReviewRatings } from '@/types';

/** 空白評分（未曾有人評分） */
export const EMPTY_RATINGS: BarRatings = {
  ambience: 0,
  service: 0,
  selection: 0,
  value: 0,
  reviewCount: 0,
};

const round2 = (value: number) => Math.round(value * 100) / 100;

/** 四個維度的總平均（0 代表未有評分） */
export function overallRating(ratings?: BarRatings | null): number {
  if (!ratings || !ratings.reviewCount) return 0;
  const total = RATING_DIMENSIONS.reduce((sum, dimension) => sum + (ratings[dimension.key] || 0), 0);
  return total / RATING_DIMENSIONS.length;
}

/** 顯示用評分：4.3；未有評分顯示「—」 */
export function formatRating(value: number | null | undefined): string {
  if (!value || value <= 0) return '—';
  return value.toFixed(1);
}

/**
 * 把一篇新感想併入酒吧平均分（移動平均法）。
 * 注意：平均數會隨時間有輕微捨入誤差，MVP 可接受；
 * 若日後需要絕對精確，改為記錄 sum / count 或改用 Cloud Functions 重算。
 */
export function mergeRating(existing: BarRatings | null | undefined, incoming: ReviewRatings): BarRatings {
  const base = existing ?? EMPTY_RATINGS;
  const previousCount = base.reviewCount || 0;
  const nextCount = previousCount + 1;

  return {
    ambience: round2((base.ambience * previousCount + incoming.ambience) / nextCount),
    service: round2((base.service * previousCount + incoming.service) / nextCount),
    selection: round2((base.selection * previousCount + incoming.selection) / nextCount),
    value: round2((base.value * previousCount + incoming.value) / nextCount),
    reviewCount: nextCount,
  };
}

/** 刪除／隱藏一篇感想時，把它的評分從平均分移除 */
export function removeRating(existing: BarRatings | null | undefined, removed: ReviewRatings): BarRatings {
  const base = existing ?? EMPTY_RATINGS;
  const previousCount = base.reviewCount || 0;

  if (previousCount <= 1) return { ...EMPTY_RATINGS };

  const nextCount = previousCount - 1;
  return {
    ambience: round2((base.ambience * previousCount - removed.ambience) / nextCount),
    service: round2((base.service * previousCount - removed.service) / nextCount),
    selection: round2((base.selection * previousCount - removed.selection) / nextCount),
    value: round2((base.value * previousCount - removed.value) / nextCount),
    reviewCount: nextCount,
  };
}
