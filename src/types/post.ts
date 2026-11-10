import type { Timestamp } from 'firebase/firestore';
import type { StoredImage } from './bar';
import type { ContentStatus } from './review';

/** Firestore `posts/{postId}`：用戶動態（可關聯到某間酒吧，也可以純分享） */
export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL: string | null;
  /** 可選：關聯的酒吧 */
  barId: string | null;
  barName: string | null;
  content: string;
  images: StoredImage[];
  status: ContentStatus;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** 發表貼文時的表單輸入 */
export type PostInput = Pick<Post, 'content' | 'images' | 'barId' | 'barName'>;
