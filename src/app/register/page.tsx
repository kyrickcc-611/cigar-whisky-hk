import type { Metadata } from 'next';
import { ComingSoon } from '@/components/ui/ComingSoon';

export const metadata: Metadata = { title: '註冊' };

/** Phase 1 會實作：電郵註冊 + 驗證信 + Google 快速註冊 */
export default function RegisterPage() {
  return (
    <ComingSoon
      phase="Phase 1"
      title="帳號註冊施工中"
      description="註冊後會收到 Firebase 驗證電郵。完成驗證即可 Like / Dislike、撰寫感想、上傳相片及收藏酒吧。"
    />
  );
}
