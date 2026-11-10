import type { BarType, OpeningHours, WeekdayKey } from '@/types';

/** 站點名稱（同時用作 metadata 標題） */
export const SITE_NAME = 'Cigar & Whisky HK';
export const SITE_DESCRIPTION =
  '香港雪茄吧及威士忌吧發現平台：搜尋附近酒吧、查看營業時間、比較評分、撰寫感想。';

/** Firestore collection 名稱集中管理，避免手寫字串出錯 */
export const COLLECTION = {
  bars: 'bars',
  users: 'users',
  reviews: 'reviews',
  posts: 'posts',
  reports: 'reports',
  /** bars/{barId}/votes/{uid} 子集合 */
  votes: 'votes',
} as const;

/** 每頁載入的酒吧數量（MVP 一次載入 500 間已足夠全港使用） */
export const BARS_PAGE_SIZE = 500;

/* -------------------------------------------------------------------------
 * 選項資料（value 儲存到 Firestore，labelZh / labelEn 供介面顯示）
 * ---------------------------------------------------------------------- */

export interface SelectOption<T extends string = string> {
  value: T;
  labelZh: string;
  labelEn: string;
}

/** 酒吧類型 */
export const BAR_TYPES: SelectOption<BarType>[] = [
  { value: 'cigar', labelZh: '雪茄吧', labelEn: 'Cigar Bar' },
  { value: 'whisky', labelZh: '威士忌吧', labelEn: 'Whisky Bar' },
  { value: 'both', labelZh: '雪茄・威士忌', labelEn: 'Cigar & Whisky' },
];

/** 香港 18 區 + 熱門酒吧集中地（以 key 儲存，方便日後翻譯） */
export const DISTRICTS: SelectOption[] = [
  { value: 'central', labelZh: '中環', labelEn: 'Central' },
  { value: 'sheung-wan', labelZh: '上環', labelEn: 'Sheung Wan' },
  { value: 'sai-ying-pun', labelZh: '西營盤', labelEn: 'Sai Ying Pun' },
  { value: 'admiralty', labelZh: '金鐘', labelEn: 'Admiralty' },
  { value: 'wan-chai', labelZh: '灣仔', labelEn: 'Wan Chai' },
  { value: 'causeway-bay', labelZh: '銅鑼灣', labelEn: 'Causeway Bay' },
  { value: 'tin-hau', labelZh: '天后', labelEn: 'Tin Hau' },
  { value: 'north-point', labelZh: '北角', labelEn: 'North Point' },
  { value: 'quarry-bay', labelZh: '鰂魚涌', labelEn: 'Quarry Bay' },
  { value: 'tai-kok-tsui', labelZh: '大角咀', labelEn: 'Tai Kok Tsui' },
  { value: 'mong-kok', labelZh: '旺角', labelEn: 'Mong Kok' },
  { value: 'yau-ma-tei', labelZh: '油麻地', labelEn: 'Yau Ma Tei' },
  { value: 'jordan', labelZh: '佐敦', labelEn: 'Jordan' },
  { value: 'tsim-sha-tsui', labelZh: '尖沙咀', labelEn: 'Tsim Sha Tsui' },
  { value: 'sham-shui-po', labelZh: '深水埗', labelEn: 'Sham Shui Po' },
  { value: 'kowloon-tong', labelZh: '九龍塘', labelEn: 'Kowloon Tong' },
  { value: 'hung-hom', labelZh: '紅磡', labelEn: 'Hung Hom' },
  { value: 'kwun-tong', labelZh: '觀塘', labelEn: 'Kwun Tong' },
  { value: 'tsuen-wan', labelZh: '荃灣', labelEn: 'Tsuen Wan' },
  { value: 'sha-tin', labelZh: '沙田', labelEn: 'Sha Tin' },
  { value: 'tai-po', labelZh: '大埔', labelEn: 'Tai Po' },
  { value: 'yuen-long', labelZh: '元朗', labelEn: 'Yuen Long' },
  { value: 'tung-chung', labelZh: '東涌', labelEn: 'Tung Chung' },
  { value: 'other', labelZh: '其他地區', labelEn: 'Other' },
];

/** 酒吧特色標籤（Phase 2 後台表單以 multi-select 呈現） */
export const BAR_TAGS: SelectOption[] = [
  { value: 'humidor', labelZh: '專業雪茄保濕房', labelEn: 'Walk-in Humidor' },
  { value: 'single-malt', labelZh: '單一麥芽', labelEn: 'Single Malt' },
  { value: 'japanese-whisky', labelZh: '日本威士忌', labelEn: 'Japanese Whisky' },
  { value: 'scotch', labelZh: '蘇格蘭威士忌', labelEn: 'Scotch' },
  { value: 'bourbon', labelZh: '波本 / 美國威士忌', labelEn: 'Bourbon' },
  { value: 'cocktails', labelZh: '專業調酒', labelEn: 'Craft Cocktails' },
  { value: 'private-room', labelZh: '私人包廂', labelEn: 'Private Room' },
  { value: 'outdoor', labelZh: '戶外座位', labelEn: 'Outdoor Seating' },
  { value: 'sea-view', labelZh: '海景', labelEn: 'Sea View' },
  { value: 'live-music', labelZh: '現場音樂', labelEn: 'Live Music' },
  { value: 'cigar-pairing', labelZh: '雪茄配對服務', labelEn: 'Cigar Pairing' },
  { value: 'membership', labelZh: '會員制', labelEn: 'Membership' },
  { value: 'no-corkage', labelZh: '免開瓶費', labelEn: 'No Corkage' },
  { value: 'late-night', labelZh: '深夜營業', labelEn: 'Late Night' },
  { value: 'date-night', labelZh: '適合約會', labelEn: 'Date Night' },
  { value: 'business', labelZh: '商務聚會', labelEn: 'Business' },
  { value: 'parking', labelZh: '泊車方便', labelEn: 'Parking' },
];

/** 四個評分維度（詳情頁、感想表單共用） */
export const RATING_DIMENSIONS = [
  { key: 'ambience', labelZh: '環境', labelEn: 'Ambience' },
  { key: 'service', labelZh: '服務', labelEn: 'Service' },
  { key: 'selection', labelZh: '選擇', labelEn: 'Selection' },
  { key: 'value', labelZh: '性價比', labelEn: 'Value' },
] as const;

/** 排序選項 */
export const SORT_OPTIONS = [
  { value: 'default', labelZh: '預設排序', labelEn: 'Recommended' },
  { value: 'distance', labelZh: '距離最近', labelEn: 'Nearest' },
  { value: 'rating', labelZh: '評分最高', labelEn: 'Top Rated' },
  { value: 'likes', labelZh: '最多 Like', labelEn: 'Most Liked' },
] as const;

/* -------------------------------------------------------------------------
 * 營業時間
 * ---------------------------------------------------------------------- */

/** 一週七日的顯示順序（星期一為第一日，符合香港習慣） */
export const WEEKDAYS: { key: WeekdayKey; labelZh: string; labelEn: string }[] = [
  { key: 'mon', labelZh: '星期一', labelEn: 'Mon' },
  { key: 'tue', labelZh: '星期二', labelEn: 'Tue' },
  { key: 'wed', labelZh: '星期三', labelEn: 'Wed' },
  { key: 'thu', labelZh: '星期四', labelEn: 'Thu' },
  { key: 'fri', labelZh: '星期五', labelEn: 'Fri' },
  { key: 'sat', labelZh: '星期六', labelEn: 'Sat' },
  { key: 'sun', labelZh: '星期日', labelEn: 'Sun' },
];

/** JS getDay() 的索引（0 = 星期日）對應到 WeekdayKey */
export const JS_DAY_TO_KEY: WeekdayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** 新酒吧預設營業時間（每晚 18:00 – 02:00，跨午夜） */
export const DEFAULT_OPENING_HOURS: OpeningHours = {
  mon: { closed: false, open: '18:00', close: '02:00' },
  tue: { closed: false, open: '18:00', close: '02:00' },
  wed: { closed: false, open: '18:00', close: '02:00' },
  thu: { closed: false, open: '18:00', close: '02:00' },
  fri: { closed: false, open: '18:00', close: '02:00' },
  sat: { closed: false, open: '18:00', close: '02:00' },
  sun: { closed: true, open: '18:00', close: '02:00' },
};

/** 圖片上傳限制（與 storage.rules 保持一致） */
export const MAX_IMAGE_SIZE_MB = 5;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
