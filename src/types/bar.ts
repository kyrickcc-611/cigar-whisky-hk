import type { Timestamp } from 'firebase/firestore';

/**
 * 酒吧類型
 * - cigar : 雪茄吧
 * - whisky: 威士忌吧
 * - both  : 兩者
 */
export type BarType = 'cigar' | 'whisky' | 'both';

/** 星期一至日的鍵值（用作 openingHours 的 object key） */
export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/**
 * 單日營業時間。
 * 若 close <= open，代表跨午夜營業（例如 18:00 – 02:00）。
 */
export interface DayHours {
  /** true = 當日休息 */
  closed: boolean;
  /** 開門時間，格式 'HH:mm' */
  open: string;
  /** 關門時間，格式 'HH:mm' */
  close: string;
}

/** 一週七日的營業時間 */
export type OpeningHours = Record<WeekdayKey, DayHours>;

/**
 * 圖片參照。
 * 現階段（Firebase Storage 需升級 Blaze）以後台「貼圖片網址」方式填寫，
 * 此時 path 為 null；日後改用 Storage 上傳時才會有 path（用於刪除檔案）。
 */
export interface StoredImage {
  /** 可公開讀取的圖片網址（http/https） */
  url: string;
  /** Storage 內的路徑，例如 bars/abc/cover.jpg；貼網址時為 null */
  path: string | null;
}

/**
 * 酒吧的四維評分（1–5 分）。
 * 採「移動平均」方式由 reviews 累加，reviewCount 為 0 時代表未有任何評分。
 */
export interface BarRatings {
  ambience: number;
  service: number;
  selection: number;
  value: number;
  reviewCount: number;
}

/** 經緯度（以 Firestore map 儲存，方便前端計算距離） */
export interface BarLocation {
  lat: number;
  lng: number;
}

/** Firestore `bars/{barId}` 的完整文件結構 */
export interface Bar {
  id: string;
  name: string;
  nameEn: string;
  type: BarType;
  /** 地區 key，對應 lib/constants.ts 的 DISTRICTS */
  district: string;
  address: string;
  addressEn: string;
  phone: string;
  /** 一鍵導航連結（Google Maps directions） */
  googleMapsLink: string;
  location: BarLocation;
  openingHours: OpeningHours;
  /** 顯示用備註，例如「公眾假期照常營業」 */
  openingHoursNote: string;
  description: string;
  /** 特色標籤，值為 lib/constants.ts 的 BAR_TAGS key */
  tags: string[];
  coverImage: StoredImage | null;
  images: StoredImage[];
  /** 用戶投票累計 */
  likes: number;
  dislikes: number;
  /** Super Admin 手動調整值，最終顯示 = likes + likesOffset */
  likesOffset: number;
  dislikesOffset: number;
  ratings: BarRatings;
  /** soft delete：false 代表已下架（後台仍可找回） */
  isActive: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
}

/**
 * 建立／編輯酒吧時的表單輸入。
 * 統計欄位（likes / ratings / offsets）由系統維護，不由表單輸入。
 */
export type BarInput = Omit<
  Bar,
  | 'id'
  | 'likes'
  | 'dislikes'
  | 'likesOffset'
  | 'dislikesOffset'
  | 'ratings'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
>;

/** 前端計算後附加的顯示資料（不會寫入 Firestore） */
export interface BarWithMeta extends Bar {
  /** 與用戶的距離（米），未取得定位時為 null */
  distanceMeters: number | null;
  /** 依 openingHours 即時計算 */
  isOpenNow: boolean;
  /** likes + likesOffset */
  totalLikes: number;
  /** dislikes + dislikesOffset */
  totalDislikes: number;
}

/** 搜尋／篩選條件 */
export interface BarFilters {
  keyword: string;
  district: string;
  type: BarType | 'all';
  openNowOnly: boolean;
  /** 'default' | 'distance' | 'rating' | 'likes' */
  sortBy: BarSortOption;
}

export type BarSortOption = 'default' | 'distance' | 'rating' | 'likes';
