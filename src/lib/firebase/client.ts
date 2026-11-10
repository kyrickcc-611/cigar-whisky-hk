import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Firebase Web App 設定。
 * 這些值全部來自 NEXT_PUBLIC_* 環境變數 —— 它們是「公開識別碼」，不是秘密。
 * 真正的安全防護來自 Firestore / Storage Security Rules 及 Auth 授權網域設定。
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** 未填 .env.local 時顯示的錯誤訊息 */
export const MISSING_FIREBASE_ENV_MESSAGE =
  'Firebase 尚未設定：請將 .env.local.example 複製為 .env.local，並填入 Firebase Console 的 Web App 設定值，然後重新啟動 dev server。';

/** 是否已填好必要的 Firebase 環境變數 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

/**
 * 是否顯示「使用 Google 帳號登入」按鈕。
 * Google provider 必須先在 Firebase Console → Authentication → Sign-in method 啟用，
 * 否則按下只會得到 auth/operation-not-allowed。啟用後在 .env.local 設
 * NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN=true 即會顯示（記得重啟 dev server）。
 */
export const isGoogleLoginEnabled =
  process.env.NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN === 'true';

let cachedApp: FirebaseApp | null = null;
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;
let cachedStorage: FirebaseStorage | null = null;

/**
 * 取得（並快取）Firebase App。
 * 採 lazy init：即使未設定 env，首頁仍可正常顯示提示，而不會整站白畫面。
 */
export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(MISSING_FIREBASE_ENV_MESSAGE);
  }
  if (!cachedApp) {
    const existingApps = getApps();
    cachedApp = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
  }
  return cachedApp;
}

/** Firebase Authentication 實例 */
export function getFirebaseAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(getFirebaseApp());
  return cachedAuth;
}

/** Cloud Firestore 實例 */
export function getFirebaseDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(getFirebaseApp());
  return cachedDb;
}

/** Cloud Storage 實例 */
export function getFirebaseStorage(): FirebaseStorage {
  if (!cachedStorage) cachedStorage = getStorage(getFirebaseApp());
  return cachedStorage;
}
