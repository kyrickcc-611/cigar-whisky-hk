/**
 * 全站型別統一出口。
 * 其他檔案一律 `import type { Bar } from '@/types';`，方便日後重構。
 */
export type {
  Bar,
  BarFilters,
  BarInput,
  BarLocation,
  BarRatings,
  BarSortOption,
  BarType,
  BarWithMeta,
  DayHours,
  OpeningHours,
  StoredImage,
  WeekdayKey,
} from './bar';
export type { AppUser, UserProfileInput, UserRole } from './user';
export type { ContentStatus, Review, ReviewInput, ReviewRatings } from './review';
export type { Post, PostInput } from './post';

/** 用戶對一間酒吧的投票值：1 = Like、-1 = Dislike */
export type VoteValue = 1 | -1;

/** 舉報（Phase 8 使用，先在型別層預留） */
export type ReportTargetType = 'bar' | 'review' | 'post';
export type ReportStatus = 'open' | 'resolved';
