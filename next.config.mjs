/** @type {import('next').NextConfig} */

/**
 * 靜態匯出開關：由 .env.production 的 NEXT_STATIC_EXPORT=1 啟用。
 * `npm run dev`（development 模式）不會載入 .env.production，因此 dev server 行為不變；
 * `npm run build` 會輸出 out/ 供 Firebase Hosting 部署。
 */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1';

/**
 * 子目錄部署用（例如 GitHub Pages：NEXT_PUBLIC_BASE_PATH=/cigar-whisky-hk）。
 * Firebase Hosting 部署在網域根目錄，保持空字串即可。
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig = {
  output: isStaticExport ? 'export' : undefined,
  // 靜態匯出時每個路由輸出成 目錄/index.html，讓 Firebase Hosting 直接以目錄索引提供
  trailingSlash: isStaticExport,
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  images: {
    // 靜態匯出不能使用 Next.js 伺服端圖片最佳化
    unoptimized: isStaticExport,
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

