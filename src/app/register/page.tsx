import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { SITE_NAME } from '@/lib/constants';

export const metadata: Metadata = {
  title: '註冊',
  description: `建立 ${SITE_NAME} 帳號，收藏心水雪茄吧及威士忌吧、撰寫感想、與其他酒友交流。`,
};

/** Phase 1：電郵註冊 + 驗證信 + Google 快速註冊 */
export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-foreground">建立帳號</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          註冊後會收到驗證電郵。完成驗證即可 Like / Dislike、撰寫感想、收藏酒吧及上傳相片。
        </p>
      </div>

      <div className="card p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
