import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Timestamp } from 'firebase/firestore';

/**
 * 合併 Tailwind class（clsx 處理條件式，tailwind-merge 處理衝突覆寫）。
 * 用法：cn('px-2', isActive && 'bg-amber-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Firestore Timestamp / Date → Date */
export function toDate(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  return value instanceof Date ? value : value.toDate();
}

/** 格式化日期，預設 zh-HK，例如 2026/11/10 */
export function formatDate(
  value: Timestamp | Date | null | undefined,
  locale = 'zh-HK',
): string {
  const date = toDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** 相對時間，例如「3 日前」 */
export function formatRelativeTime(value: Timestamp | Date | null | undefined): string {
  const date = toDate(value);
  if (!date) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小時前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 日前`;
  return formatDate(date);
}

/** 截短文字並加上省略號 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()}…`;
}

/** 簡單 URL 檢查（後台表單驗證用） */
export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** 產生 Google Maps 一鍵導航連結 */
export function buildMapsDirectionsLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/** 產生 Google Maps 地點連結 */
export function buildMapsPlaceLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** 移除重複值 */
export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

/** 數字限制在範圍內 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
