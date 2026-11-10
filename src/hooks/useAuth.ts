'use client';

import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthProvider';

/**
 * 讀取登入狀態與權限。
 * 必須在 <AuthProvider>（已加在 app/layout.tsx）之內使用。
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 <AuthProvider> 內使用');
  }
  return context;
}
