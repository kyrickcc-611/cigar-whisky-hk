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
| 檔案 | Firebase Storage |
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
   - **電子郵件/密碼**（Email/Password）：必須
   - **Google**：可選（選一個支援電郵即可）
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

### 5. 部署 Security Rules（Phase 1 完成後）

`firestore.rules` 與 `storage.rules` 會在 Phase 1 建立。部署方式二選一：

**方法 A：Firebase CLI（建議）**

```bash
npx firebase-tools login
npx firebase-tools use --add          # 選擇你的專案，別名例如 default
npx firebase-tools deploy --only firestore:rules,storage:rules,firestore:indexes
```

**方法 B：Console 手動貼上**

- Firestore Database → **規則** → 貼上 `firestore.rules` 內容 → 發佈
- Storage → **規則** → 貼上 `storage.rules` 內容 → 發佈

### 6. 建立 Super Admin（Phase 1 完成後）

1. 先在網站註冊一個帳號並完成電郵驗證
2. 到 Firebase Console → **Firestore → users → 你的 uid**
3. 把 `role` 欄位由 `user` 改成 `superadmin`
4. 重新登入（或稍等 token 更新），即可進入 `/admin`

> 亦可用 `scripts/grant-admin.mjs`（需要 service account），適合正式環境。詳見 Phase 1 說明。

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
   │  ├─ bars/                 # 列表（Phase 3）
   │  ├─ login/ register/      # 認證（Phase 1）
   │  └─ account/ admin/       # 個人頁（Phase 6）／後台（Phase 2、7）
   ├─ components/
   │  ├─ layout/               # SiteHeader、SiteFooter、UserMenu
   │  ├─ ui/                   # 通用元件（ComingSoon…）
   │  ├─ bars/                 # BarCard、BarFilters、BarMap…（Phase 3）
   │  ├─ reviews/              # 感想與相片上傳（Phase 5）
   │  └─ admin/                # 後台表單、統計卡（Phase 2、7）
   ├─ lib/
   │  ├─ firebase/client.ts    # Firebase 初始化（lazy、單例、env 檢查）
   │  ├─ repositories/         # （Phase 1+）所有 Firestore 讀寫集中在這裡
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

## 開發階段

| 階段 | 內容 | 狀態 |
|---|---|---|
| Phase 0 | 專案架構、型別、工具函數、主題 | ✅ 完成 |
| Phase 1 | Firebase 設定、規則、登入／註冊、AuthProvider | ⏳ |
| Phase 2 | Admin 酒吧 CRUD + 相片上傳 | ⏳ |
| Phase 3 | 列表、搜尋、篩選、地圖、詳情頁 | ⏳ |
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
| Storage | 5 GB 儲存、每日 1 GB 下載 |
| Google Maps | 每月 $200 美元等值免費額度（需綁信用卡） |

超過 Spark 額度需升級 Blaze（按用量計費）。

### 6. 安全

- `firestore.rules` / `storage.rules` 未部署前，資料庫是「正式模式」＝全部禁止讀寫，網站會顯示空白／錯誤，屬正常現象
- 切勿把 service account JSON 或任何私鑰放入 `NEXT_PUBLIC_*` 變數
- 圖片上傳限制 5 MB、只接受 jpeg / png / webp（在 Storage Rules 強制執行）

---

## 授權

私人專案（private），未授權不得轉載。



