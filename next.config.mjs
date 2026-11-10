/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // 允許 next/image 載入 Firebase Storage 及 Google 頭像
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  eslint: {
    // 讓 `next build` 不會因為 lint 警告而中斷（CI 仍會獨立跑 npm run lint）
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;

