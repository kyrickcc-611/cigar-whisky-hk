import { DEFAULT_OPENING_HOURS, JS_DAY_TO_KEY, WEEKDAYS } from './constants';
import type { Bar, DayHours, OpeningHours, WeekdayKey } from '@/types';

/** 'HH:mm' 轉成分鐘數；格式錯誤回傳 null */
export function toMinutes(value: string): number | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** 取得某日對應的營業時間 key */
export function getWeekdayKey(date: Date): WeekdayKey {
  return JS_DAY_TO_KEY[date.getDay()];
}

/**
 * 判斷某一刻是否營業中。
 * 支援跨午夜時段（close <= open，例如 20:00 – 03:00），會同時檢查前一日遺留的時段。
 */
export function isOpenAt(
  hours: OpeningHours | null | undefined,
  date: Date = new Date(),
): boolean {
  if (!hours) return false;

  const minutesNow = date.getHours() * 60 + date.getMinutes();

  // 1) 檢查今日時段
  const today = hours[getWeekdayKey(date)];
  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);

    if (open !== null && close !== null) {
      if (close > open) {
        if (minutesNow >= open && minutesNow < close) return true;
      } else if (minutesNow >= open) {
        // 跨午夜：今日開門後已進入明日凌晨部分
        return true;
      }
    }
  }

  // 2) 檢查昨日跨午夜時段是否仍在營業
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  const prev = hours[getWeekdayKey(yesterday)];
  if (prev && !prev.closed) {
    const open = toMinutes(prev.open);
    const close = toMinutes(prev.close);
    if (open !== null && close !== null && close <= open && minutesNow < close) {
      return true;
    }
  }

  return false;
}

/** 便利函數：直接傳入酒吧 */
export function isBarOpenNow(bar: Pick<Bar, 'openingHours'>, date: Date = new Date()): boolean {
  return isOpenAt(bar.openingHours, date);
}

/** 單日營業時間的顯示文字，例如「18:00 – 02:00」或「休息」 */
export function formatDayHours(day: DayHours | undefined | null): string {
  if (!day || day.closed) return '休息';
  return `${day.open} – ${day.close}`;
}

/** 取得今日營業時間（詳情頁「今日」高亮用） */
export function getDayHours(hours: OpeningHours, date: Date = new Date()): DayHours | null {
  return hours[getWeekdayKey(date)] ?? null;
}

/** 深層複製營業時間，避免表單修改污染 DEFAULT_OPENING_HOURS 常數 */
export function cloneOpeningHours(hours: OpeningHours): OpeningHours {
  return {
    mon: { ...hours.mon },
    tue: { ...hours.tue },
    wed: { ...hours.wed },
    thu: { ...hours.thu },
    fri: { ...hours.fri },
    sat: { ...hours.sat },
    sun: { ...hours.sun },
  };
}

/**
 * 補齊缺失的星期（舊資料、或直接在 Console 手動建立的文件可能不完整）。
 * 缺漏的日子一律視為「休息」，避免畫面出現 undefined。
 */
export function normalizeOpeningHours(hours: OpeningHours | null | undefined): OpeningHours {
  const base = cloneOpeningHours(DEFAULT_OPENING_HOURS);
  if (!hours) return base;
  return {
    mon: { ...base.mon, ...hours.mon },
    tue: { ...base.tue, ...hours.tue },
    wed: { ...base.wed, ...hours.wed },
    thu: { ...base.thu, ...hours.thu },
    fri: { ...base.fri, ...hours.fri },
    sat: { ...base.sat, ...hours.sat },
    sun: { ...base.sun, ...hours.sun },
  };
}

/** 一週摘要（列表卡片用），例如「每日 18:00 – 02:00」 */
export function formatWeekSummary(hours: OpeningHours): string {
  const openDays = WEEKDAYS.map((weekday) => hours[weekday.key]).filter((day) => !day.closed);

  if (openDays.length === 0) return '每日休息';
  if (openDays.length === 7) {
    const first = openDays[0];
    const sameTime = openDays.every((day) => day.open === first.open && day.close === first.close);
    return sameTime ? `每日 ${first.open} – ${first.close}` : '每日營業（時間各異）';
  }
  return `每週 ${openDays.length} 日營業`;
}
