import { isValidHttpUrl } from '@/lib/utils';
import type { StoredImage } from '@/types';

/**
 * 圖片存取抽象層。
 *
 * 現況：Firebase Storage 需要升級 Blaze 方案才能使用，因此現階段一律以
 * 「貼圖片網址」方式填寫（見後台 BarForm），StoredImage.path 為 null。
 *
 * 日後升級 Blaze 後，只需在此檔新增 uploadImage()，把上傳結果組成
 * { url: downloadURL, path: storagePath } 即可，其他頁面完全不用改。
 */

/** 是否支援「上傳檔案」（Firebase Storage 已開通＝true） */
export const IMAGE_UPLOAD_ENABLED = false;

/** 未開通 Storage 時，後台顯示的說明 */
export const IMAGE_UPLOAD_DISABLED_MESSAGE =
  '目前以「貼圖片網址」方式加入相片。如需直接上傳檔案，請先將 Firebase 專案升級至 Blaze 方案並啟用 Storage。';

/** 把字串網址轉成 StoredImage（path 為 null，代表不是由 Storage 上傳） */
export function imageFromUrl(url: string): StoredImage {
  return { url: url.trim(), path: null };
}

/**
 * 取得可安全顯示的圖片網址。
 * 只接受 http/https，其他（例如 javascript:）一律回傳 null，避免 XSS。
 */
export function resolveImageUrl(image: StoredImage | null | undefined): string | null {
  const url = image?.url?.trim();
  if (!url || !isValidHttpUrl(url)) return null;
  return url;
}

/** 批次轉換：過濾無效網址 */
export function resolveImageUrls(images: StoredImage[] | null | undefined): string[] {
  if (!images?.length) return [];
  return images
    .map((image) => resolveImageUrl(image))
    .filter((url): url is string => Boolean(url));
}
