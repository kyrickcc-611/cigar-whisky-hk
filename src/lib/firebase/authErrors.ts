import { FirebaseError } from 'firebase/app';

/**
 * Firebase Auth 常見錯誤碼 → 香港用語中文提示。
 * 完整錯誤碼列表：https://firebase.google.com/docs/reference/js/auth#autherrorcodes
 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  // 登入
  'auth/invalid-email': '電郵格式不正確。',
  'auth/missing-email': '請輸入電郵。',
  'auth/user-not-found': '找不到此電郵的帳號，請先註冊。',
  'auth/wrong-password': '密碼不正確。',
  'auth/invalid-credential': '電郵或密碼不正確。',
  'auth/invalid-login-credentials': '電郵或密碼不正確。',
  'auth/user-disabled': '此帳號已被停用，請聯絡管理員。',

  // 註冊
  'auth/email-already-in-use': '此電郵已被註冊，請直接登入。',
  'auth/weak-password': '密碼太弱，請至少使用 8 個字元。',
  'auth/operation-not-allowed': '此登入方式尚未啟用，請聯絡管理員。',
  'auth/configuration-not-found':
    '登入服務尚未啟用：請在 Firebase Console → Authentication 按「開始使用」，並啟用「電子郵件／密碼」登入方式。',

  // Google 登入
  'auth/popup-closed-by-user': '登入視窗已關閉，請再試一次。',
  'auth/cancelled-popup-request': '登入程序已被取消。',
  'auth/popup-blocked': '瀏覽器封鎖了彈出視窗，請允許彈出視窗後再試。',
  'auth/account-exists-with-different-credential':
    '此電郵已用其他方式註冊，請改用該方式登入。',
  'auth/unauthorized-domain': '此網域未獲授權使用 Firebase 登入，請在 Firebase Console 加入授權網域。',

  // 其他
  'auth/too-many-requests': '嘗試次數過多，請稍後再試。',
  'auth/network-request-failed': '網絡連線失敗，請檢查網絡後再試。',
  'auth/requires-recent-login': '此操作需要重新登入以確認身份。',
  'auth/internal-error': '系統錯誤，請稍後再試。',

  // Firestore（rules 拒絕時）
  'permission-denied': '沒有權限執行此操作。',
  unavailable: '無法連接伺服器，請稍後再試。',
  'failed-precondition': '資料狀態有變，請重新整理頁面再試。',
};

const FALLBACK_MESSAGE = '發生未預期的錯誤，請稍後再試。';

/**
 * 將任何錯誤轉為可直接顯示的中文訊息。
 * lib/firebase/client.ts 拋出的「Firebase 尚未設定…」會原樣顯示，方便開發者排查。
 */
export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    return AUTH_ERROR_MESSAGES[error.code] ?? FALLBACK_MESSAGE;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return FALLBACK_MESSAGE;
}
