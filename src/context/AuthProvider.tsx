'use client';

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  MISSING_FIREBASE_ENV_MESSAGE,
  getFirebaseAuth,
  isFirebaseConfigured,
} from '@/lib/firebase/client';
import { reloadCurrentUser } from '@/lib/firebase/auth';
import {
  ensureUserProfile,
  getUserProfile,
  subscribeUserProfile,
} from '@/lib/repositories/users';
import type { AppUser } from '@/types';

export interface AuthContextValue {
  /** Firebase Auth 使用者；未登入為 null */
  user: User | null;
  /** Firestore users/{uid}；登入後才會載入 */
  profile: AppUser | null;
  /** 首次判斷登入狀態中 */
  loading: boolean;
  /** 電郵是否已驗證（Google 登入一律為 true） */
  isEmailVerified: boolean;
  /** 是否 superadmin（唯一權限來源：users/{uid}.role） */
  isSuperAdmin: boolean;
  /** Firebase 環境變數是否已填寫 */
  isConfigured: boolean;
  /** 未設定 Firebase 時的提示訊息 */
  configError: string | null;
  /** 重新載入 Auth 使用者並刷新 ID token（電郵驗證後必須呼叫） */
  reloadUser: () => Promise<void>;
  /** 重新讀取 Firestore profile */
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  // 1) 監聽登入狀態
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setEmailVerified(nextUser?.emailVerified ?? false);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // 2) 登入後確保 users/{uid} 存在，並即時訂閱 profile（role 由管理員控制）
  useEffect(() => {
    if (!isFirebaseConfigured || !user) return;

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        const nextProfile = await ensureUserProfile(user);
        if (!cancelled) setProfile(nextProfile);
      } catch (error) {
        console.error('[auth] 建立／讀取用戶 profile 失敗', error);
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled) return;
      unsubscribe = subscribeUserProfile(user.uid, (nextProfile) => {
        if (!cancelled && nextProfile) setProfile(nextProfile);
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  const reloadUser = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    try {
      const nextUser = await reloadCurrentUser();
      setUser(nextUser);
      setEmailVerified(nextUser?.emailVerified ?? false);
    } catch (error) {
      console.error('[auth] 重新載入登入狀態失敗', error);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!isFirebaseConfigured) return;
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      setProfile(null);
      return;
    }
    setProfile(await getUserProfile(current.uid));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isEmailVerified: emailVerified,
      isSuperAdmin: profile?.role === 'superadmin',
      isConfigured: isFirebaseConfigured,
      configError: isFirebaseConfigured ? null : MISSING_FIREBASE_ENV_MESSAGE,
      reloadUser,
      refreshProfile,
    }),
    [user, profile, loading, emailVerified, reloadUser, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
