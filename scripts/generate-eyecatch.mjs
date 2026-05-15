/**
 * アイキャッチ画像 自動生成 & microCMS アップロードスクリプト
 * 使い方: node scripts/generate-eyecatch.mjs <MANAGEMENT_API_KEY>
 *
 * Management APIキーの取得:
 *   cocomarke.microcms.io → サービス設定 → APIキー → 管理用APIキーを追加
 */

import { chromium } from 'playwright';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const MGMT_KEY    = process.argv[2];
const CONTENT_KEY = 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const SERVICE     = 'cocomarke';
const BLOGS_API   = `https://${SERVICE}.microcms.io/api/v1/blogs`;
const MEDIA_API   = `https://${SERVICE}.microcms-management.io/api/v1/media`;

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR    = path.join(__dirname, '../.eyecatch-tmp');
const LOGO_PATH  = path.join(__dirname, '../old/images/fotter-logo.png');
const LOGO_B64   = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`;

if (!MGMT_KEY) {
  console.error('使い方: node scripts/generate-eyecatch.mjs <MANAGEMENT_API_KEY>');
  console.error('\n Management APIキー取得先:');
  console.error('  cocomarke.microcms.io → サービス設定 → APIキー → 管理用APIキーを追加');
  process.exit(1);
}

// カテゴリー別カラー
const CATEGORY_COLORS = {
  '検索対策': { bg: '#1a3a6b', accent: '#4a9eff', badge: '#2d5fa0' },
  'SNS戦略':  { bg: '#1b2d5e', accent: '#6c63ff', badge: '#3d3494' },
  '運用の基本': { bg: '#0d4a6b', accent: '#00c9ff', badge: '#0a6690' },
  '活用事例': { bg: '#0f4c3a', accent: '#00e5a0', badge: '#187050' },
  '最新情報': { bg: '#4a1a6b', accent: '#c06fff', badge: '#6b2d9a' },
  '集客':     { bg: '#6b1a2d', accent: '#ff6b9d', badge: '#9a2d50' },
};
const DEFAULT_COLORS = { bg: '#0e2a5c', accent: '#005bea', badge: '#1a4a9a' };

// タイトルを2行に自然分割する
// 優先: ｜ → ！ → ？ → 、 → 中間分割
function splitTitle(raw) {
  const title = raw.replace(/【[^】]*】/g, '').trim() || raw;
  if (title.length <= 20) return [title];

  // 区切り文字で分割（｜ ！ ？ ： を優先）
  const separators = ['｜', '！', '？', '：', '|'];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx > 8 && idx < title.length - 4) {
      // ｜ は区切り文字自体を削除、他は末尾に残す
      if (sep === '｜' || sep === '|') {
        return [title.slice(0, idx).trimEnd(), title.slice(idx + 1).trimStart()];
      }
      return [title.slice(0, idx + 1), title.slice(idx + 1).trimStart()];
    }
  }

  // 自然な区切りがなければ20〜24文字付近で分割
  const mid = Math.round(title.length / 2);
  const split = Math.max(16, Math.min(mid, 24));
  return [title.slice(0, split), title.slice(split)];
}

// アイキャッチHTML生成（2行タイトル・フォント自動縮小）
function buildHtml(title, category, logoDataUri) {
  const c     = CATEGORY_COLORS[category] ?? DEFAULT_COLORS;
  const lines = splitTitle(title);
  const linesHtml = lines.map(l => `<div class="line" id="l${lines.indexOf(l)}">${l}</div>`).join('');

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: linear-gradient(135deg, ${c.bg} 0%, #0a1628 60%, #040d1a 100%);
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif;
    position: relative;
  }
  .circle1 {
    position: absolute; border-radius: 50%;
    width: 480px; height: 480px;
    background: radial-gradient(circle, ${c.accent}22 0%, transparent 70%);
    top: -120px; right: -80px;
  }
  .circle2 {
    position: absolute; border-radius: 50%;
    width: 300px; height: 300px;
    background: radial-gradient(circle, ${c.accent}15 0%, transparent 70%);
    bottom: -80px; left: 80px;
  }
  .grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(${c.accent}08 1px, transparent 1px),
      linear-gradient(90deg, ${c.accent}08 1px, transparent 1px);
    background-size: 60px 60px;
  }
  .content {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    justify-content: center;
    padding: 60px 80px 110px;
  }
  .badge {
    display: inline-block;
    background: ${c.badge};
    color: #fff;
    font-size: 22px; font-weight: 700;
    letter-spacing: 0.08em;
    padding: 6px 22px;
    border-radius: 6px;
    margin-bottom: 24px;
    border: 1px solid ${c.accent}55;
    width: fit-content;
  }
  .title {
    margin-bottom: 32px;
  }
  .title .line {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 1040px;
    font-size: 48px; font-weight: 900;
    line-height: 1.45;
    color: #ffffff;
    text-shadow: 0 2px 20px rgba(0,0,0,0.6);
    letter-spacing: 0.02em;
  }
  .accent-line {
    width: 60px; height: 4px;
    background: linear-gradient(90deg, ${c.accent}, transparent);
    border-radius: 2px;
  }
  .brand {
    position: absolute;
    bottom: 36px; right: 72px;
  }
  .brand img {
    height: 38px; width: auto;
    opacity: 0.85;
  }
  .side-line {
    position: absolute; right: 56px; top: 60px; bottom: 110px;
    width: 3px;
    background: linear-gradient(to bottom, ${c.accent}88, transparent);
    border-radius: 2px;
  }
</style>
</head>
<body>
  <div class="grid"></div>
  <div class="circle1"></div>
  <div class="circle2"></div>
  <div class="side-line"></div>
  <div class="content">
    <div class="badge">${category || 'お役立ち情報'}</div>
    <div class="title">${linesHtml}</div>
    <div class="accent-line"></div>
  </div>
  <div class="brand">
    <img src="${logoDataUri}" alt="COCOマーケ">
  </div>
  <script>
    (function() {
      var lines = document.querySelectorAll('.title .line');
      lines.forEach(function(el) {
        var size = 48;
        while (el.scrollWidth > 1040 && size > 30) {
          size -= 1;
          el.style.fontSize = size + 'px';
        }
      });
    })();
  </script>
</body>
</html>`;
}

// Playwright でスクリーンショット
async function generateImage(browser, title, category, outputPath) {
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(buildHtml(title, category, LOGO_B64), { waitUntil: 'load' });
  await page.screenshot({ path: outputPath, type: 'png' });
  await page.close();
}

// メディアをアップロードしてURLを取得
async function uploadMedia(imagePath, filename) {
  const imageData = readFileSync(imagePath);
  const blob = new Blob([imageData], { type: 'image/png' });
  const form = new FormData();
  form.append('file', blob, filename);

  // まずコンテンツAPIキーで試み、次に管理キーで試みる
  for (const [headerName, keyValue] of [
    ['X-MICROCMS-API-KEY', CONTENT_KEY],
    ['X-MICROCMS-MANAGEMENT-API-KEY', MGMT_KEY],
  ]) {
    const res = await fetch(MEDIA_API, {
      method: 'POST',
      headers: { [headerName]: keyValue },
      body: form,
    });
    if (res.ok) {
      const json = await res.json();
      return json.url ?? json.data?.url ?? null;
    }
    const errText = await res.text();
    if (res.status !== 401 && res.status !== 403) {
      throw new Error(`Upload ${res.status}: ${errText.slice(0, 150)}`);
    }
  }
  throw new Error('メディアアップロード権限がありません。Management APIキーが必要です。');
}

// eyecatch URLをJSON PATCHで設定
async function patchEyecatchUrl(contentId, imageUrl) {
  const res = await fetch(`${BLOGS_API}/${contentId}`, {
    method: 'PATCH',
    headers: {
      'X-MICROCMS-API-KEY': CONTENT_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ eyecatch: imageUrl }),
  });
  return { ok: res.ok, status: res.status, text: await res.text() };
}

// メイン
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // 全記事取得
  const res = await fetch(`${BLOGS_API}?limit=100&fields=id,title,category,eyecatch`, {
    headers: { 'X-MICROCMS-API-KEY': CONTENT_KEY },
  });
  const { contents } = await res.json();
  console.log(`\n🖼  対象記事: ${contents.length} 件\n`);

  const browser = await chromium.launch({ headless: true });

  const results = { ok: [], failed: [] };

  for (let i = 0; i < contents.length; i++) {
    const { id, title, category } = contents[i];
    const cat = typeof category === 'string' ? category : category?.name ?? '';
    const filename = `${id}.png`;
    const outPath  = path.join(OUT_DIR, filename);

    console.log(`[${String(i + 1).padStart(2)}/${contents.length}] ${id.slice(0, 48)}`);

    try {
      // 1. 画像生成
      await generateImage(browser, title, cat, outPath);
      console.log(`         📐 生成OK`);

      // 2. メディアアップロード → URL取得
      const imageUrl = await uploadMedia(outPath, filename);
      if (!imageUrl) throw new Error('URLが取得できませんでした');
      console.log(`         ☁️  アップロードOK`);

      // 3. eyecatch URLをPATCH
      const patch = await patchEyecatchUrl(id, imageUrl);
      if (patch.ok) {
        console.log(`         ✅ 更新OK`);
        results.ok.push(id);
      } else {
        throw new Error(`PATCH ${patch.status}: ${patch.text.slice(0, 120)}`);
      }
    } catch (e) {
      console.log(`         ❌ ${e.message}`);
      results.failed.push({ id, reason: e.message });
    }

    await new Promise(r => setTimeout(r, 800));
  }

  await browser.close();

  console.log('\n── 完了 ──');
  console.log(`成功: ${results.ok.length} 件`);
  console.log(`失敗: ${results.failed.length} 件`);
  if (results.failed.length) {
    results.failed.forEach(f => console.log(`  ${f.id}: ${f.reason}`));
  }
}

main().catch(console.error);
