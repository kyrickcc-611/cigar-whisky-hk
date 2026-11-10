# Cigar & Whisky Bar 發現平台（香港）

香港雪茄吧／威士忌吧的發現平台，類似 OpenRice 的搜尋體驗，但專注於雪茄與威士忌酒吧。

- 訪客可瀏覽所有內容（酒吧、相片、感想）
- 註冊用戶可 Like／Dislike、寫感想、上傳相片、收藏酒吧、發表貼文
- Super Admin 可管理酒吧資料（CRUD）、調整 Like／Dislike 數、刪除不當內容、查看統計

---

## 技術棧

| 層 | 技術 |
|---|---|
| 前端 | Next.js 14（App Router）、TypeScript、Tailwind CSS 3 |
| 認證 | Firebase Authentication（電郵密碼 + Google） |
| 資料庫 | Cloud Firestore |
| 檔案 | 圖片以「貼網址」方式儲存（Firebase Storage 需 Blaze 方案，待升級後可一鍵切換） |
| 地圖 | Google Maps JavaScript API（`@vis.gl/react-google-maps`） |
| 驗證 | Zod（表單與資料驗證） |
| 部署 | Vercel |
| 版本控制 | GitHub |

## 架構決策（重要）

**採用「純 Client SDK + 嚴格 Security Rules」（方案 A）**

```
瀏覽器 ── Firebase JS SDK ──┬── Authentication（登入、驗證、session）
                             ├── Firestore（透過 Security Rules 讀寫）
                             └── Storage（透過 Storage Rules 上傳相片）
```

原因：

1. **零伺服器密鑰** —— 前端只需 `NEXT_PUBLIC_*` 變數，不需要 service account JSON，Vercel 部署零額外設定。
2. **即時同步** —— Firestore 的 `onSnapshot` 可讓 Like 數、新感想即時更新。
3. **安全靠規則** —— 所有寫入權限由 `firestore.rules` / `storage.rules` 決定：
   - 只有本人可改自己的 `users/{uid}`，且 `role` 不可自行提升
   - 一般用戶不可寫 `bars`，只有 `role == 'superadmin'` 可以
   - 投票只能寫 `bars/{barId}/votes/{uid}`，值只能是 1 / -1
   - 上傳只可寫入 `users/{uid}/...` 及 `bars/...`（bars 僅 admin）
     ⚠️ Storage 需 Blaze 方案，目前暫未啟用；相片改以「貼網址」輸入（見「圖片策略」）

代價與限制（已評估並接受）：

- 詳情頁為 client-side 渲染，搜尋引擎收錄能力有限；日後如有 SEO 需要，可加一層 Admin SDK 的 SSR/ISR（資料存取已集中於 `src/lib/repositories/`，方便抽換）。
- 距離排序在瀏覽器計算（以香港酒吧數量規模完全足夠）。

> 為何 `NEXT_PUBLIC_FIREBASE_API_KEY` 放在前端不算外洩？
> 它只是 Firebase 專案的識別碼，不是秘密。真正權限控制靠 Security Rules、Auth 授權網域（Authorized domains）及配額限制。

---

## 快速開始

### 1. 環境需求

- Node.js **20 LTS 或 22 LTS**（本專案曾以 Node 24 建置成功，但 Next.js 14 官方支援至 Node 22；如遇異常請改用 20 LTS）
- npm 10+

### 2. 安裝

```bash
npm install
```

### 3. 設定環境變數

```bash
# Windows PowerShell
Copy-Item .env.local.example .env.local

# macOS / Linux
cp .env.local.example .env.local
```

然後按下一節步驟填入數值。**環境變數只在啟動時讀取，修改後必須重啟 `npm run dev`。**

### 4. 啟動

```bash
npm run dev       # http://localhost:3000
npm run build     # production build（含 TypeScript 型別檢查）
npm run lint      # ESLint
npm run typecheck # 只做型別檢查
```

若未填 `.env.local`，首頁會顯示琥珀色提示卡（不會白畫面）。

---

## Firebase 設定步驟（一次性，約 10 分鐘）

### 1. 建立專案

1. 到 <https://console.firebase.google.com> → **新增專案**
2. 專案名稱例如 `cigar-whisky-hk`；Google Analytics 可略過
3. **重要**：建立 **Firestore Database** 時，位置（location）請選 **asia-east2 (Hong Kong)**
   ⚠️ 一旦設定就**不能更改**，請勿選錯
4. 模式先選 **正式模式（production mode）**，稍後我們會用自訂規則覆蓋

### 2. 啟用 Authentication

1. 左側 **Build → Authentication → 開始使用**
2. **Sign-in method** 啟用：
   - **電子郵件/密碼**（Email/Password）：必須（已完成）
   - **Google**：可選；啟用後把 `.env.local` 的 `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN` 設為 `true`
     （預設 `false`，登入頁不會顯示 Google 按鈕，避免按下後報 `auth/operation-not-allowed`）
3. 到 **Settings → Authorized domains**（授權網域）確認有 `localhost`；
   日後部署 Vercel 後要把 `xxx.vercel.app` 及自訂網域加入

### 3. 啟用 Storage

**Build → Storage → 開始使用**（先用預設 bucket，之後套用 `storage.rules`）

### 4. 取得 Web App 設定值

1. 專案首頁 → ⚙️ **專案設定** → **你的應用程式** → 點 `</>`（Web）
2. 暱稱例如 `web`，**不需要**設定 Firebase Hosting
3. 複製 `firebaseConfig` 內容，對應填入 `.env.local`：

| firebaseConfig 欄位 | `.env.local` 變數 |
|---|---|
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

### 5. Security Rules（已部署）

`firestore.rules` 已部署至 Firestore（`asia-east2`），`firestore.indexes.json` 亦已同步。部署方式二選一：

**方法 A：Firebase CLI（建議）**

```bash
npx firebase-tools login
npx firebase-tools use --add          # 選擇你的專案，別名例如 default
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

**方法 B：Console 手動貼上**

- Firestore Database → **規則** → 貼上 `firestore.rules` 內容 → 發佈

> ⚠️ `storage.rules` 已寫好但**暫未部署**：Firebase Storage 需要 Blaze 方案才能建立 bucket，
> 在 Spark 方案下 Storage 頁面會要求升級。現階段圖片改為「貼網址」（見下方「圖片策略」）。

### 6. 建立 Super Admin（已提供腳本）

Security Rules 禁止任何用戶（包括自己）把 `role` 改成 `superadmin`，所以要由「專案擁有者」身份寫入。

1. 先在網站註冊並登入一次（登入後才會自動建立 `users/{uid}` 文件）
2. 在專案根目錄執行：

```bash
node scripts/grant-admin.mjs your@email.com            # 設為 superadmin
node scripts/grant-admin.mjs your@email.com --revoke   # 收回權限
```

腳本會讀取本機 Firebase CLI 的登入憑證（需先執行過 `firebase login`），換取 owner access token 後用
REST 寫入 `users/{uid}.role`，**不需要 service account 私鑰**。

手動替代方案：Firebase Console → **Firestore → users → 你的 uid** → 把 `role` 由 `user` 改成 `superadmin`，
重新整理頁面即可（`AuthProvider` 會即時訂閱 profile，選單會自動出現「管理後台」）。

---

## Google Maps API 設定

1. 到 <https://console.cloud.google.com>（選同一個專案）
2. **APIs & Services → Library**，啟用：
   - **Maps JavaScript API**（必需，地圖模式）
   - **Places API (New)**（可選，之後做地點搜尋／自動填入地址）
3. **APIs & Services → Credentials → Create credentials → API key**
4. 編輯該 key：
   - **Application restrictions** → `HTTP referrers (web sites)`
     - `http://localhost:3000/*`
     - `https://*.vercel.app/*`
     - `https://你的網域/*`
   - **API restrictions** → 只勾選 Maps JavaScript API（及 Places API）
5. 填入 `.env.local` 的 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

> Google Cloud 需要綁定信用卡（有每月免費額度），建議同時設定 **Budget alert**。

---

## 目錄結構

```
ver1 20261110/
├─ .env.local.example          # 環境變數範本（可 commit）
├─ .env.local                  # 你的真實金鑰（已在 .gitignore）
├─ next.config.mjs             # next/image 允許 Firebase Storage 網域
├─ tailwind.config.ts          # 深色主題、品牌色、共用陰影
├─ firebase.json               # （Phase 1）Rules / Indexes 部署設定
├─ firestore.rules             # （Phase 1）Firestore 權限規則
├─ firestore.indexes.json      # （Phase 1）複合索引
├─ storage.rules               # （Phase 1）Storage 權限規則
├─ scripts/                    # （Phase 1）設定 superadmin、種示範資料
└─ src/
   ├─ app/                     # App Router
   │  ├─ layout.tsx            # 全域佈局（頁首／頁尾／metadata）
   │  ├─ page.tsx              # 首頁
   │  ├─ globals.css           # Tailwind + 主題 + 共用 class
   │  ├─ bars/                 # 列表 + /bars/[id] 詳情（Phase 3 部分完成）
   │  ├─ login/ register/ forgot-password/   # 認證（Phase 1 完成）
   │  └─ admin/                # 後台：儀表板、酒吧管理、新增／編輯（Phase 2 完成）
   ├─ components/
   │  ├─ layout/               # SiteHeader、SiteFooter、UserMenu
   │  ├─ ui/                   # 通用元件（ComingSoon…）
   │  ├─ bars/                 # BarCard、BarsBrowser、BarDetail
   │  ├─ reviews/              # 感想與相片上傳（Phase 5）
   │  └─ admin/                # AdminGuard、BarForm、ImageUrlField
   ├─ lib/
   │  ├─ firebase/             # client.ts、auth.ts、authErrors.ts
   │  ├─ repositories/         # Firestore 讀寫：users.ts、bars.ts
   │  ├─ services/images.ts    # 圖片抽象（現為貼網址，日後可換 Storage）
   │  ├─ validators/           # Zod 表單驗證：auth.ts、bar.ts
   │  ├─ constants.ts          # 地區、類型、標籤、營業時間預設
   │  ├─ distance.ts           # Haversine 距離 + 顯示格式
   │  ├─ openingHours.ts       # 「現在營業中」計算（支援跨午夜）
   │  ├─ ratings.ts            # 四維評分聚合（移動平均）
   │  └─ utils.ts              # cn()、日期、Google Maps 連結
   ├─ hooks/                   # （Phase 1+）useAuth、useGeolocation…
   ├─ context/                 # （Phase 1）AuthProvider
   └─ types/                   # bar / user / review / post 型別定義
```

## 資料模型（Firestore）

```
bars/{barId}
  name, nameEn, type('cigar'|'whisky'|'both'), district, address, addressEn, phone
  googleMapsLink, location{lat,lng}
  openingHours{mon..sun:{closed,open,close}}, openingHoursNote
  description, tags[]
  coverImage{url,path}, images[{url,path}]
  likes, dislikes                 → 用戶投票累計
  likesOffset, dislikesOffset     → Super Admin 手動調整
  ratings{ambience,service,selection,value,reviewCount}
  isActive                        → soft delete（false = 已下架）
  createdAt, updatedAt, createdBy

users/{uid}
  email, displayName, photoURL, role('user'|'superadmin'), favorites[barId], createdAt, updatedAt

reviews/{reviewId}
  barId, userId, userName, userPhotoURL, content, images[], 
  ratings{ambience,service,selection,value}, status('published'|'hidden'), createdAt, updatedAt

posts/{postId}
  userId, userName, userPhotoURL, barId?, barName?, content, images[],
  status, createdAt, updatedAt

bars/{barId}/votes/{uid}
  value(1|-1), updatedAt          → 一人一票，可改票

reports/{reportId}                 → Phase 8
  targetType, targetId, reason, detail, reporterId, status, createdAt
```

**最終顯示的 Like 數 = `likes + likesOffset`**
如此 Super Admin 手動加減的數字不會被下一個用戶投票覆蓋。

---

## 圖片策略（ImageRef）

Firebase Storage 需要 Blaze 方案才能建立 bucket，故現階段後台以「貼圖片網址」加入相片：

- 資料格式：`coverImage { url, path }`、`images [{ url, path }]`；貼網址時 `path` 為 `null`
- 顯示前一律經 `resolveImageUrl()`（`src/lib/services/images.ts`）過濾，只接受 `http:` / `https:`，避免 XSS 與破圖
- 日後升級 Blaze：只需在該檔案加入 `uploadImage()`（回傳 `{ url, path }`）、把 `IMAGE_UPLOAD_ENABLED` 改為 `true`，
  後台表單就會多一個上傳按鈕，其他頁面完全不用改

---

## 後台管理（/admin）

| 路徑 | 功能 |
|---|---|
| `/admin` | 儀表板：酒吧總數、已公開／已下架數量、最近新增 |
| `/admin/bars` | 清單：關鍵字搜尋、狀態篩選、上架／下架、刪除 |
| `/admin/bars/new` | 新增酒吧（基本資料、地址與位置、營業時間、介紹與特色、圖片） |
| `/admin/bars/[id]/edit` | 編輯（同一份 `BarForm`） |

- 權限雙重保護：`AdminGuard` 只負責 UX（未登入會轉去 `/login?redirect=/admin`），
  真正防線是 `firestore.rules` 的 `isSuperAdmin()`
- 表單驗證（`src/lib/validators/bar.ts`）：名稱 1–80 字、類型／地區／標籤白名單、
  香港座標範圍（緯度 22.15–22.56、經度 113.83–114.44）、7 日 `HH:mm` 營業時間（允許跨午夜）、最多 8 張圖片
- 公開頁面只會讀取 `isActive == true` 的酒吧；下架等同 soft delete，不會遺失資料

## 開發階段

| 階段 | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 專案架構、型別、工具函數、主題 | ✅ 完成 |
| Phase 1 | Firebase 設定、規則、登入／註冊、AuthProvider | ✅ 完成 |
| Phase 2 | Admin 酒吧 CRUD（圖片以貼網址方式加入） | ✅ 完成（Storage 上傳待 Blaze） |
| Phase 3 | 列表、搜尋、篩選、地圖、詳情頁 | 🚧 列表／篩選／詳情已完成；地圖模式、距離排序待辦 |
| Phase 4 | Like / Dislike 投票（transaction） | ⏳ |
| Phase 5 | 感想 + 相片牆 + 評分聚合 | ⏳ |
| Phase 6 | 收藏、個人頁、貼文動態 | ⏳ |
| Phase 7 | Admin 審核、統計 Dashboard | ⏳ |
| Phase 8 | i18n、舉報、活動、PWA、WhatsApp 分享 | ⏳ |
| Phase 9 | Vercel 部署、GitHub 推送 | ⏳ |

---

## GitHub 與帳戶（Phase 0 已完成推送）

本專案刻意使用**獨立的 GitHub 帳戶**，與其他專案完全分開：

| 項目 | 值 |
|---|---|
| 遠端 repo | <https://github.com/kyrickcc-611/cigar-whisky-hk>（private） |
| 推送帳戶 | `kyrickcc-611`（GitHub CLI 活躍帳戶） |
| commit 身份 | repo-local：`kyrickcc-611 <354919355+kyrickcc-611@users.noreply.github.com>` |
| 預設分支 | `main`（已追蹤 `origin/main`） |

### 多 GitHub 帳戶共存（重要）

本機同時登入了兩個帳戶：`kyrickcc-611`（本專案）與 `DonKHK`（其他專案）。

| 目的 | 命令 |
|---|---|
| 睇有邊幾個帳戶、邊個活躍 | `gh auth status` |
| 切換活躍帳戶 | `gh auth switch --user kyrickcc-611` |
| 重新設定 git 憑證助手 | `gh auth setup-git` |
| 查看當前 commit 身份 | `git config --local --get user.email` |

- **commit 身份是 repo-local**（存在 `.git/config`），不會影響其他專案的全域 `DonKHK` 設定。
- Windows 憑證管理員原本存有 `git:https://github.com` → `DonKHK` 的記錄，已刪除；現在憑證由
  `gh auth git-credential` 按**活躍帳戶**提供。
- 若日後 push 突然變成推到錯誤帳戶：先 `gh auth switch --user <正確帳戶>`，
  再用 `gh auth status` 確認該帳戶顯示 `Active account: true`。

### 在新機器上重建（參考）

```bash
git clone https://github.com/kyrickcc-611/cigar-whisky-hk.git
cd cigar-whisky-hk
npm install
git config user.name "kyrickcc-611"
git config user.email "354919355+kyrickcc-611@users.noreply.github.com"
```

### 日常提交

```bash
git add -A
git commit -m "feat(bars): 完成酒吧列表與搜尋篩選"
git push
```

> ⚠️ 提交前務必確認 `.env.local` **沒有**被加入。
> `.gitignore` 已排除 `.env`、`.env*.local`、`.firebase/`、`*-debug.log`、
> `*serviceAccount*.json`、`*-firebase-adminsdk-*.json`。
> 如不小心推送了 service account 金鑰，請即到 Google Cloud Console **刪除該金鑰**（撤銷 API key 並不足夠）。

---

## 部署到 Vercel

1. 到 <https://vercel.com/new> → **Import Git Repository** → 選 `cigar-whisky-hk`
2. Framework Preset 會自動偵測為 **Next.js**，Build Command / Output 保持預設
3. **Environment Variables** 逐項加入（Production + Preview 都要）：
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `NEXT_PUBLIC_ENABLE_GOOGLE_LOGIN`（設 `true` 才顯示 Google 登入按鈕）
4. **Deploy**
5. 部署完成後，回到 Firebase Console：
   - **Authentication → Settings → Authorized domains** 加入 `xxx.vercel.app`（及自訂網域）
   - Google Cloud API key 的 HTTP referrer 加入 `https://xxx.vercel.app/*`

---

## 注意事項與已知限制

### 1. OneDrive 與 `node_modules`

本專案位於 OneDrive 同步資料夾內。`node_modules` 有數萬個檔案，會拖慢 OneDrive 同步，偶爾造成檔案鎖定（`EBUSY` / `EPERM`）。

建議做法（任選其一）：

- 在 OneDrive 設定中對專案資料夾選擇「永遠保留在此裝置」並排除 `node_modules`
- 或把整個專案移到非同步資料夾（例如 `C:\dev\cigar-whisky-hk`）再開發

### 2. Node.js 版本

Next.js 14.2 官方支援 Node 18.17+ / 20 / 22。本機為 Node 24，Phase 0 建置已通過；若日後升級 Next 15 或遇到奇怪錯誤，建議改用 Node 20 LTS。

### 3. Firestore 地區

`asia-east2 (Hong Kong)` 一旦建立**不可更改**，重建資料庫需重新開始。

### 4. Firestore 查詢限制

- 不支援「按計算出的距離」排序 → 距離在前端以 Haversine 計算並排序
- 複合條件（例如 `isActive + district + type + orderBy`）需要複合索引，Firestore 錯誤訊息會提供一鍵建立連結
- 一次 `getDocs` 最多取得符合條件的全部文件（本專案上限設 500），超過再做分頁

### 5. 費用（MVP 階段基本免費）

| 服務 | 免費額度（Spark） |
|---|---|
| Authentication | 電郵／密碼登入不限數量 |
| Firestore | 每日 50,000 次讀取、20,000 次寫入、20,000 次刪除、1 GiB 儲存 |
| Storage | ⚠️ 需要 Blaze 方案才能啟用；本專案暫未使用（圖片以網址儲存） |
| Google Maps | 每月 $200 美元等值免費額度（需綁信用卡） |

超過 Spark 額度需升級 Blaze（按用量計費）。

### 6. 安全

- `firestore.rules` / `storage.rules` 未部署前，資料庫是「正式模式」＝全部禁止讀寫，網站會顯示空白／錯誤，屬正常現象
- 切勿把 service account JSON 或任何私鑰放入 `NEXT_PUBLIC_*` 變數
- 圖片以網址形式輸入，前端只接受 `http` / `https`；`storage.rules` 已預備 5 MB、jpeg / png / webp 限制，待 Blaze 升級後部署

---

## 授權

私人專案（private），未授權不得轉載。



