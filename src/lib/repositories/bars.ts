import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { BARS_PAGE_SIZE, COLLECTION } from '@/lib/constants';
import { getFirebaseDb } from '@/lib/firebase/client';
import { normalizeOpeningHours } from '@/lib/openingHours';
import { buildMapsDirectionsLink } from '@/lib/utils';
import type {
  Bar,
  BarInput,
  BarRatings,
  BarType,
  StoredImage,
} from '@/types';

/**
 * `bars` 集合存取層。
 * 權限完全由 firestore.rules 決定：只有 superadmin 可寫，訪客只可讀 isActive == true。
 */

function barsCollection() {
  return collection(getFirebaseDb(), COLLECTION.bars);
}

function barRef(barId: string) {
  return doc(getFirebaseDb(), COLLECTION.bars, barId);
}

/** Firestore 的 map 欄位 → StoredImage（容錯：任何缺漏都視為 null） */
function toStoredImage(value: unknown): StoredImage | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.url !== 'string' || record.url.trim() === '') return null;
  return {
    url: record.url,
    path: typeof record.path === 'string' ? record.path : null,
  };
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Firestore 原始資料 → Bar */
export function mapBar(id: string, data: DocumentData): Bar {
  const location = (data.location ?? {}) as Record<string, unknown>;
  const ratings = (data.ratings ?? {}) as Partial<BarRatings>;
  const lat = toNumber(location.lat);
  const lng = toNumber(location.lng);

  return {
    id,
    name: typeof data.name === 'string' ? data.name : '',
    nameEn: typeof data.nameEn === 'string' ? data.nameEn : '',
    type: (data.type as BarType | undefined) ?? 'both',
    district: typeof data.district === 'string' ? data.district : 'other',
    address: typeof data.address === 'string' ? data.address : '',
    addressEn: typeof data.addressEn === 'string' ? data.addressEn : '',
    phone: typeof data.phone === 'string' ? data.phone : '',
    googleMapsLink:
      typeof data.googleMapsLink === 'string' && data.googleMapsLink
        ? data.googleMapsLink
        : buildMapsDirectionsLink(lat, lng),
    location: { lat, lng },
    openingHours: normalizeOpeningHours(data.openingHours),
    openingHoursNote: typeof data.openingHoursNote === 'string' ? data.openingHoursNote : '',
    description: typeof data.description === 'string' ? data.description : '',
    tags: Array.isArray(data.tags)
      ? data.tags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    coverImage: toStoredImage(data.coverImage),
    images: Array.isArray(data.images)
      ? data.images
          .map(toStoredImage)
          .filter((image): image is StoredImage => image !== null)
      : [],
    likes: toNumber(data.likes),
    dislikes: toNumber(data.dislikes),
    likesOffset: toNumber(data.likesOffset),
    dislikesOffset: toNumber(data.dislikesOffset),
    ratings: {
      ambience: toNumber(ratings.ambience),
      service: toNumber(ratings.service),
      selection: toNumber(ratings.selection),
      value: toNumber(ratings.value),
      reviewCount: toNumber(ratings.reviewCount),
    },
    isActive: data.isActive !== false,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
    createdBy: typeof data.createdBy === 'string' ? data.createdBy : '',
  };
}

/** 按名稱排序（zh-HK 排序規則，中文名稱較自然） */
export function sortBarsByName(bars: Bar[]): Bar[] {
  return [...bars].sort((a, b) => a.name.localeCompare(b.name, 'zh-HK'));
}

export interface ListBarsOptions {
  /** superadmin 後台需要看到已下架的酒吧 */
  includeInactive?: boolean;
  max?: number;
}

/**
 * 讀取酒吧清單。
 * 排序刻意在前端做（Firestore 複合索引有限，酒吧數量規模細）。
 */
export async function listBars(options: ListBarsOptions = {}): Promise<Bar[]> {
  const base = options.includeInactive
    ? barsCollection()
    : query(barsCollection(), where('isActive', '==', true));

  const snapshot = await getDocs(query(base, limit(options.max ?? BARS_PAGE_SIZE)));
  return sortBarsByName(snapshot.docs.map((item) => mapBar(item.id, item.data())));
}

/** 讀取單一酒吧；不存在或無權限（已下架）時回傳 null */
export async function getBarById(barId: string): Promise<Bar | null> {
  const snapshot = await getDoc(barRef(barId));
  if (!snapshot.exists()) return null;
  return mapBar(snapshot.id, snapshot.data());
}

/**
 * 新增酒吧（僅 superadmin；Security Rules 會再檢查一次）。
 * 統計欄位一律由系統初始化，不接受表單輸入。
 */
export async function createBar(input: BarInput, createdBy: string): Promise<string> {
  const created = await addDoc(barsCollection(), {
    ...input,
    likes: 0,
    dislikes: 0,
    likesOffset: 0,
    dislikesOffset: 0,
    ratings: { ambience: 0, service: 0, selection: 0, value: 0, reviewCount: 0 },
    createdBy,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return created.id;
}

/** 更新酒吧資料（不影響 likes / ratings 等統計欄位） */
export async function updateBar(barId: string, input: BarInput): Promise<void> {
  await updateDoc(barRef(barId), { ...input, updatedAt: serverTimestamp() });
}

/** 上架／下架 */
export async function setBarActive(barId: string, isActive: boolean): Promise<void> {
  await updateDoc(barRef(barId), { isActive, updatedAt: serverTimestamp() });
}

/**
 * 管理員微調 Like / Dislike 顯示數。
 * 因為與用戶投票分開存放（likes + likesOffset），用戶投票不會蓋掉這裡的調整。
 */
export async function setBarVoteOffsets(
  barId: string,
  offsets: { likesOffset?: number; dislikesOffset?: number },
): Promise<void> {
  await updateDoc(barRef(barId), { ...offsets, updatedAt: serverTimestamp() });
}

/** 永久刪除酒吧（僅 superadmin）。注意：其 reviews / votes 子集合需另行清理。 */
export async function deleteBar(barId: string): Promise<void> {
  await deleteDoc(barRef(barId));
}

