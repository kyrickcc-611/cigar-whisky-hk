import { z } from 'zod';
import { BAR_TAGS, DEFAULT_OPENING_HOURS, DISTRICTS } from '@/lib/constants';
import { cloneOpeningHours, normalizeOpeningHours } from '@/lib/openingHours';
import { imageFromUrl } from '@/lib/services/images';
import { buildMapsDirectionsLink, isValidHttpUrl } from '@/lib/utils';
import type { Bar, BarInput } from '@/types';

/**
 * 後台酒吧表單驗證。
 * 表單以「字串」保存緯度／經度，送出前才轉成數字，方便輸入與顯示。
 */

/** 香港粗略邊界，用來擋住貼錯座標（例如貼了東京的座標） */
export const HK_LAT_RANGE = { min: 22.15, max: 22.56 } as const;
export const HK_LNG_RANGE = { min: 113.83, max: 114.44 } as const;

/** 最多可加入的相片數量（與 firestore.rules 的 reviews 上限概念一致） */
export const MAX_BAR_IMAGES = 8;

const TAG_VALUES: string[] = BAR_TAGS.map((tag) => tag.value);
const DISTRICT_VALUES: string[] = DISTRICTS.map((district) => district.value);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/** 'HH:mm' */
const timeField = z.string().regex(TIME_PATTERN, '時間格式必須為 HH:mm（例如 18:00）');

/** 可留空的網址欄位 */
function urlField(label: string) {
  return z
    .string()
    .trim()
    .max(1000, `${label}不可超過 1000 個字元`)
    .refine(
      (value) => value === '' || isValidHttpUrl(value),
      `${label}必須是完整網址（http:// 或 https://）`,
    );
}

/** 經緯度（以字串輸入） */
function coordinateField(label: string, min: number, max: number) {
  return z
    .string()
    .trim()
    .min(1, `請輸入${label}`)
    .refine((value) => Number.isFinite(Number(value)), `${label}必須是數字`)
    .refine((value) => {
      const parsed = Number(value);
      return parsed >= min && parsed <= max;
    }, `${label}需介乎 ${min} 至 ${max}（香港範圍）`);
}

const dayHoursSchema = z.object({
  closed: z.boolean(),
  open: timeField,
  close: timeField,
});

export const openingHoursSchema = z.object({
  mon: dayHoursSchema,
  tue: dayHoursSchema,
  wed: dayHoursSchema,
  thu: dayHoursSchema,
  fri: dayHoursSchema,
  sat: dayHoursSchema,
  sun: dayHoursSchema,
});

export const barFormSchema = z.object({
  name: z.string().trim().min(1, '請輸入酒吧名稱').max(80, '名稱不可超過 80 個字元'),
  nameEn: z.string().trim().max(120, '英文名稱不可超過 120 個字元'),
  type: z.enum(['cigar', 'whisky', 'both'], { message: '請選擇酒吧類型' }),
  district: z
    .string()
    .refine((value) => DISTRICT_VALUES.includes(value), '請選擇地區'),
  address: z.string().trim().min(1, '請輸入地址').max(200, '地址不可超過 200 個字元'),
  addressEn: z.string().trim().max(200, '英文地址不可超過 200 個字元'),
  phone: z.string().trim().max(30, '電話不可超過 30 個字元'),
  googleMapsLink: urlField('地圖連結'),
  lat: coordinateField('緯度', HK_LAT_RANGE.min, HK_LAT_RANGE.max),
  lng: coordinateField('經度', HK_LNG_RANGE.min, HK_LNG_RANGE.max),
  description: z.string().trim().max(2000, '介紹不可超過 2000 個字元'),
  openingHoursNote: z.string().trim().max(200, '備註不可超過 200 個字元'),
  tags: z
    .array(z.string())
    .max(BAR_TAGS.length, '標籤數量超出上限')
    .refine((values) => values.every((value) => TAG_VALUES.includes(value)), '包含無效的標籤'),
  openingHours: openingHoursSchema,
  coverImageUrl: urlField('封面圖片網址'),
  imageUrls: z
    .array(urlField('圖片網址'))
    .max(MAX_BAR_IMAGES, `最多只可加入 ${MAX_BAR_IMAGES} 張圖片`),
  isActive: z.boolean(),
});

export type BarFormValues = z.infer<typeof barFormSchema>;

/** 表單錯誤（key 可為 'openingHours.mon.open' 這種巢狀路徑） */
export type BarFormErrors = Record<string, string>;

/**
 * 驗證表單。與 validators/auth.ts 的 validateForm 不同之處：
 * 這裡保留完整巢狀路徑（例如 openingHours.mon.open），方便逐個營業日顯示錯誤。
 */
export function validateBarForm(
  values: BarFormValues,
):
  | { success: true; data: BarFormValues }
  | { success: false; errors: BarFormErrors } {
  const result = barFormSchema.safeParse(values);
  if (result.success) return { success: true, data: result.data };

  const errors: BarFormErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || 'form';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { success: false, errors };
}

/* -------------------------------------------------------------------------
 * 轉換：Bar ⇄ 表單值
 * ---------------------------------------------------------------------- */

/** 新酒吧表單預設值（座標預設為中環） */
export const EMPTY_BAR_FORM_VALUES: BarFormValues = {
  name: '',
  nameEn: '',
  type: 'both',
  district: 'central',
  address: '',
  addressEn: '',
  phone: '',
  googleMapsLink: '',
  lat: '22.2793',
  lng: '114.1628',
  description: '',
  openingHoursNote: '',
  tags: [],
  openingHours: cloneOpeningHours(DEFAULT_OPENING_HOURS),
  coverImageUrl: '',
  imageUrls: [],
  isActive: true,
};

/** Bar → 表單初始值（編輯用） */
export function barToFormValues(bar: Bar): BarFormValues {
  return {
    name: bar.name ?? '',
    nameEn: bar.nameEn ?? '',
    type: bar.type ?? 'both',
    district: bar.district || 'central',
    address: bar.address ?? '',
    addressEn: bar.addressEn ?? '',
    phone: bar.phone ?? '',
    googleMapsLink: bar.googleMapsLink ?? '',
    lat: typeof bar.location?.lat === 'number' ? String(bar.location.lat) : '',
    lng: typeof bar.location?.lng === 'number' ? String(bar.location.lng) : '',
    description: bar.description ?? '',
    openingHoursNote: bar.openingHoursNote ?? '',
    tags: Array.isArray(bar.tags) ? bar.tags.filter((tag) => TAG_VALUES.includes(tag)) : [],
    openingHours: normalizeOpeningHours(bar.openingHours),
    coverImageUrl: bar.coverImage?.url ?? '',
    imageUrls: Array.isArray(bar.images)
      ? bar.images.map((image) => image.url).filter((url) => Boolean(url))
      : [],
    isActive: bar.isActive !== false,
  };
}

/** 表單值 → 寫入 Firestore 的 BarInput */
export function formValuesToBarInput(values: BarFormValues): BarInput {
  const lat = Number(values.lat);
  const lng = Number(values.lng);
  const imageUrls = values.imageUrls.map((url) => url.trim()).filter(Boolean);
  const coverUrl = values.coverImageUrl.trim() || imageUrls[0] || '';

  return {
    name: values.name.trim(),
    nameEn: values.nameEn.trim(),
    type: values.type,
    district: values.district,
    address: values.address.trim(),
    addressEn: values.addressEn.trim(),
    phone: values.phone.trim(),
    // 未填地圖連結時，用座標自動產生（詳情頁「導航」按鈕用）
    googleMapsLink: values.googleMapsLink.trim() || buildMapsDirectionsLink(lat, lng),
    location: { lat, lng },
    openingHours: values.openingHours,
    openingHoursNote: values.openingHoursNote.trim(),
    description: values.description.trim(),
    tags: values.tags,
    coverImage: coverUrl ? imageFromUrl(coverUrl) : null,
    images: imageUrls.map((url) => imageFromUrl(url)),
    isActive: values.isActive,
  };
}

