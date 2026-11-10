import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/ComingSoon';

export const metadata: Metadata = { title: '登入' };

/** Phase 1 會實作：Firebase Authentication 電郵登入 + Google 登入 */
export default function LoginPage() {
  return (
    <ComingSoon
      phase="Phase 1"
      title="登入功能施工中"
      description="登入由 Firebase Authentication 托管，支援電郵密碼及 Google 登入。完成後你可以在這裡 Like / Dislike、寫感想、收藏酒吧及上傳相片。"
    />
  );
}
