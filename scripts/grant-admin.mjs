#!/usr/bin/env node
/**
 * 將現有用戶設為 superadmin，或收回權限。
 *
 * 用法：
 *   node scripts/grant-admin.mjs your@email.com            設為 superadmin
 *   node scripts/grant-admin.mjs your@email.com --revoke   降回普通用戶
 *   node scripts/grant-admin.mjs --uid=<uid>               直接指定 UID
 *
 * 原理：
 * Security Rules 禁止任何人（包括自己）把 role 改成 superadmin，
 * 因此本腳本改用 Firebase CLI 的登入憑證換取「專案 owner」access token，
 * 以 REST API 直接寫入 users/{uid}.role —— owner 身份會繞過 Security Rules。
 * 好處：不需要下載 service account 私鑰，維持「零伺服器密鑰」架構。
 *
 * 前置條件：
 *   1. 已安裝 Firebase CLI 並執行過 `firebase login`
 *   2. 目標用戶已在網站註冊並登入過一次（users/{uid} 文件才會存在）
 */
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

/**
 * Firebase CLI 的公開 OAuth client（見 firebase-tools 原始碼 apiv2）。
 * 它只代表「Firebase CLI 這個應用程式」，不是本專案的密鑰。
 */
const FIREBASE_CLI_CLIENT_ID =
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FIREBASE_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

const CONFIG_PATH = join(homedir(), '.config', 'configstore', 'firebase-tools.json');

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function readJson(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`讀取${label}失敗：${filePath}\n  ${error.message}`);
  }
}

function readProjectId() {
  const fromFlag = process.argv.find((arg) => arg.startsWith('--project='));
  if (fromFlag) return fromFlag.split('=')[1];

  try {
    const env = readFileSync('.env.local', 'utf8');
    const match = env.match(/^NEXT_PUBLIC_FIREBASE_PROJECT_ID=(.+)$/m);
    if (match?.[1]?.trim()) return match[1].trim();
  } catch {
    // 忽略：下面會提示改用 --project=
  }

  fail('找不到 NEXT_PUBLIC_FIREBASE_PROJECT_ID（請在專案根目錄執行，或加 --project=your-project-id）');
}

function documentsUrl(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function getOwnerAccessToken() {
  const config = readJson(CONFIG_PATH, 'Firebase CLI 登入憑證');
  const refreshToken = config?.tokens?.refresh_token;
  if (!refreshToken) {
    fail('找不到 Firebase CLI refresh token，請先執行 `firebase login`。');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: FIREBASE_CLI_CLIENT_ID,
      client_secret: FIREBASE_CLI_CLIENT_SECRET,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload.access_token) {
    fail(
      `換取 access token 失敗（${payload.error ?? response.status}）。\n` +
        '  請重新執行 `firebase login`，或改為在 Firebase Console 手動把 users/{uid} 的 role 設為 superadmin。',
    );
  }
  return payload.access_token;
}

async function findUserDocByEmail(email, token, projectId) {
  const response = await fetch(`${documentsUrl(projectId)}:runQuery`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: 'users' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'email' },
            op: 'EQUAL',
            value: { stringValue: email },
          },
        },
        limit: 1,
      },
    }),
  });

  const rows = await response.json();
  if (!response.ok) {
    fail(`查詢用戶失敗：${JSON.stringify(rows)}`);
  }
  const document = Array.isArray(rows) ? rows.find((row) => row.document)?.document : undefined;
  return document ?? null;
}

async function setUserRole(uid, role, token, projectId) {
  const response = await fetch(
    `${documentsUrl(projectId)}/users/${uid}?updateMask.fieldPaths=role`,
    {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { role: { stringValue: role } } }),
    },
  );

  if (!response.ok) {
    fail(`更新 role 失敗：${await response.text()}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const revoke = args.includes('--revoke');
  const uidFlag = args.find((arg) => arg.startsWith('--uid='));
  const email = args.find((arg) => !arg.startsWith('--'))?.trim().toLowerCase();
  const uid = uidFlag ? uidFlag.split('=')[1] : null;

  if (!email && !uid) {
    console.log(
      [
        '',
        '用法：',
        '  node scripts/grant-admin.mjs your@email.com',
        '  node scripts/grant-admin.mjs your@email.com --revoke',
        '  node scripts/grant-admin.mjs --uid=<uid>',
        '  node scripts/grant-admin.mjs your@email.com --project=your-project-id',
        '',
      ].join('\n'),
    );
    process.exit(0);
  }

  const projectId = readProjectId();
  const token = await getOwnerAccessToken();
  const nextRole = revoke ? 'user' : 'superadmin';

  let targetUid = uid;

  if (!targetUid) {
    const document = await findUserDocByEmail(email, token, projectId);
    if (!document) {
      fail(
        `找不到 email 為 ${email} 的用戶文件。\n` +
          '  請先到網站註冊並登入一次（登入後才會自動建立 users/{uid}），然後再執行此腳本。',
      );
    }
    targetUid = document.name.split('/').pop();
    const currentRole = document.fields?.role?.stringValue ?? '(未設定)';
    console.log(`✔ 找到用戶 ${email}（uid: ${targetUid}，目前 role: ${currentRole}）`);
  }

  await setUserRole(targetUid, nextRole, token, projectId);

  console.log(`✔ 已將 users/${targetUid}.role 設為 ${nextRole}（project: ${projectId}）`);
  console.log(
    nextRole === 'superadmin'
      ? '  用戶重新整理頁面（或重新登入）後，選單就會出現「管理後台」，可前往 /admin 管理酒吧。'
      : '  該用戶的後台權限已收回。',
  );
}

main().catch((error) => fail(error?.message ?? String(error)));
