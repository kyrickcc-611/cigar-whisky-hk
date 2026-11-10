import type { Timestamp } from 'firebase/firestore';

/** 用戶角色。'superadmin' 只可以經由 Firebase Console 或 scripts/grant-admin.mjs 設定 */
export type UserRole = 'user' | 'superadmin';

/**
 * Firestore `users/{uid}`。
 * 登入憑證（密碼等）由 Firebase Authentication 托管，這裡只存放顯示用 profile。
 */
export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  /** 已收藏的 barId 陣列 */
  favorites: string[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

/** 註冊／登入後建立 users 文件所需的初始資料 */
export type UserProfileInput = Pick<AppUser, 'uid' | 'email' | 'displayName' | 'photoURL'>;
