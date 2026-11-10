import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { getFirebaseAuth } from './client';

/** 建立 Google provider；prompt: 'select_account' 確保每次都可選帳號 */
function createGoogleProvider(): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return provider;
}

/** 寄驗證信。註冊流程即使寄信失敗也不應中斷（用戶可稍後在橫幅重發） */
async function trySendVerificationEmail(user: User): Promise<void> {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.warn('[auth] 驗證信寄出失敗，可稍後重發', error);
  }
}

export interface RegisterPayload {
  email: string;
  password: string;
  displayName: string;
}

/** 電郵註冊：建立帳號 → 寫入暱稱 → 寄出驗證信 */
export async function registerWithEmail({
  email,
  password,
  displayName,
}: RegisterPayload): Promise<User> {
  const auth = getFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await updateProfile(credential.user, { displayName: displayName.trim() });
  await trySendVerificationEmail(credential.user);
  return credential.user;
}

/** 電郵密碼登入 */
export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email.trim(),
    password,
  );
  return credential.user;
}

/** Google 彈出式登入（Google 帳號本身已驗證電郵） */
export async function loginWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(getFirebaseAuth(), createGoogleProvider());
  return credential.user;
}

/** 登出 */
export async function logout(): Promise<void> {
  await signOut(getFirebaseAuth());
}

/** 寄出重設密碼電郵 */
export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(getFirebaseAuth(), email.trim());
}

/** 重發驗證信（錯誤交由呼叫者顯示，例如 too-many-requests） */
export async function resendVerificationEmail(): Promise<void> {
  const current = getFirebaseAuth().currentUser;
  if (!current) throw new Error('請先登入。');
  await sendEmailVerification(current);
}

/**
 * 重新載入登入狀態並強制刷新 ID token。
 * 用戶在電郵驗證後必須刷新 token，Security Rules 的 email_verified 才會變成 true。
 */
export async function reloadCurrentUser(): Promise<User | null> {
  const auth = getFirebaseAuth();
  const current = auth.currentUser;
  if (!current) return null;
  await current.reload();
  await auth.currentUser?.getIdToken(true);
  return auth.currentUser;
}
