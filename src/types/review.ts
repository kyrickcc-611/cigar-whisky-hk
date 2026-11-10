import type { Timestamp } from 'firebase/firestore';
import type { StoredImage } from './bar';

/** 內容狀態：admin 可將不當內容設為 hidden（前台不再顯示，但保留審核紀錄） */
export type ContentStatus = 'published' | 'hidden';

/** 一篇感想內的四維評分（1–5 整數） */
export interface ReviewRatings {
  ambience: number;
  service: number;
  selection: number;
  value: number;
}

/** Firestore `reviews/{reviewId}` */
export interface Review {
  id: string;
  barId: string;
  userId: string;
  /** 冗餘儲存，避免每次讀取都要 join users */
  userName: string;
  userPhotoURL: string | null;
  content: string;
  images: StoredImage[];
  ratings: ReviewRatings;
  status: ContentStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** 撰寫感想時的表單輸入 */
export type ReviewInput = Pick<Review, 'barId' | 'content' | 'images' | 'ratings'>;
