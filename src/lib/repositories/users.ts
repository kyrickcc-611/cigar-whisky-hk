import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { getFirebaseDb } from '@/lib/firebase/client';
import { COLLECTION } from '@/lib/constants';
import type { AppUser, UserRole } from '@/types';

/**
 * `users/{uid}` 存取層。
 * 登入憑證由 Firebase Auth 托管；這裡只處理 profile、role 與收藏清單。
 */

function userRef(uid: string) {
  return doc(getFirebaseDb(), COLLECTION.users, uid);
}

/** Firestore 原始資料 → AppUser */
function mapUser(uid: string, data: Record<string, unknown>): AppUser {
  return {
    uid,
    email: typeof data.email === 'string' ? data.email : '',
    displayName: typeof data.displayName === 'string' ? data.displayName : '',
    photoURL: typeof data.photoURL === 'string' ? data.photoURL : null,
    role: (data.role as UserRole | undefined) ?? 'user',
    favorites: Array.isArray(data.favorites) ? (data.favorites as string[]) : [],
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

/** 讀取 profile；文件不存在（例如從未登入過）時回傳 null */
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snapshot = await getDoc(userRef(uid));
  if (!snapshot.exists()) return null;
  return mapUser(uid, snapshot.data());
}

/**
 * 確保 users/{uid} 存在，不存在則建立。
 * 建立時 role 固定為 'user'（Security Rules 亦禁止用戶自行提升權限）。
 */
export async function ensureUserProfile(user: User): Promise<AppUser> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const profile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName?.trim() || (user.email ?? '').split('@')[0] || '無名用戶',
    photoURL: user.photoURL ?? null,
    role: 'user' as UserRole,
    favorites: [] as string[],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef(user.uid), profile);
  return mapUser(user.uid, { ...profile, createdAt: null, updatedAt: null });
}

/** 即時訂閱 profile（管理員改 role 後前端會自動反映） */
export function subscribeUserProfile(
  uid: string,
  onChange: (profile: AppUser | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    userRef(uid),
    (snapshot) => {
      onChange(snapshot.exists() ? mapUser(uid, snapshot.data()) : null);
    },
    (error) => {
      console.error('[users] profile 訂閱失敗', error);
      onError?.(error);
    },
  );
}

/** 更新自己的顯示資料（role / uid / createdAt 不可改，rules 亦會阻擋） */
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; photoURL?: string | null },
): Promise<void> {
  await updateDoc(userRef(uid), { ...data, updatedAt: serverTimestamp() });
}

/** 收藏／取消收藏一間酒吧 */
export async function setFavoriteBar(
  uid: string,
  barId: string,
  isFavorite: boolean,
): Promise<void> {
  await updateDoc(userRef(uid), {
    favorites: isFavorite ? arrayUnion(barId) : arrayRemove(barId),
    updatedAt: serverTimestamp(),
  });
}
