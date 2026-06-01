/**
 * scripts/eyecatch.mjs
 * COCOマーケ ブランドアイキャッチ画像生成・アップロード
 * デザイン: 既存記事と統一（左揃えタイトル・カテゴリカラーグラデーション・右縦ライン・ロゴ右下）
 */

// sharp(librsvg) は GitHub Actions(Ubuntu) で日本語フォントが見つからず文字化けするため
// Playwright(Chromium 内蔵フォント) でスクリーンショットを撮る方式に変更
import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dir    = dirname(fileURLToPath(import.meta.url));
const LOGO_B64 = `data:image/png;base64,${readFileSync(join(__dir, '../old/images/fotter-logo.png')).toString('base64')}`;

// ─── カテゴリ別カラー定義 ──────────────────────────────────────────────────
// gradFrom: 背景グラデーション（左上）/ accent: バッジ・ライン色
const CAT_COLORS = {
  '検索対策':   { gradFrom: '#0A2E1A', accent: '#22A662' },
  'SNS戦略':    { gradFrom: '#1A0A38', accent: '#9333EA' },
  '運用の基本': { gradFrom: '#0B1E42', accent: '#2563EB' },
  '活用事例':   { gradFrom: '#0A2830', accent: '#0891B2' },
  '最新情報':   { gradFrom: '#2D1400', accent: '#EA580C' },
  '集客':       { gradFrom: '#2E0A18', accent: '#E11D6A' },
};
const DEFAULT_COLORS = { gradFrom: '#0B1E42', accent: '#2563EB' };

// ─── XMLエスケープ ─────────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── 日本語テキスト折り返し ───────────────────────────────────────────────
function wrapTitle(title, maxCharsPerLine) {
  const lines = [];

  // 「｜」区切りを優先
  const parts = title.split('｜');
  if (parts.length >= 2 && parts[0].length <= maxCharsPerLine) {
    lines.push(parts[0]);
    const rest = parts.slice(1).join('｜');
    if (rest.length <= maxCharsPerLine) {
      lines.push(rest);
    } else {
      for (let i = 0; i < rest.length; i += maxCharsPerLine) {
        lines.push(rest.slice(i, i + maxCharsPerLine));
      }
    }
    return lines.slice(0, 3);
  }

  // 通常折り返し（句読点・括弧で区切る）
  let rem = title;
  while (rem.length > 0) {
    if (rem.length <= maxCharsPerLine) { lines.push(rem); break; }
    let cut = maxCharsPerLine;
    for (let i = maxCharsPerLine; i > maxCharsPerLine - 6 && i > 0; i--) {
      if ('。、！？】』）」…'.includes(rem[i])) { cut = i + 1; break; }
    }
    lines.push(rem.slice(0, cut));
    rem = rem.slice(cut);
  }
  return lines.slice(0, 3);
}

// ─── SVG 生成 ─────────────────────────────────────────────────────────────
function buildSvg(title, category) {
  const W = 1200, H = 630;
  const { gradFrom, accent } = CAT_COLORS[category] ?? DEFAULT_COLORS;

  // タイトル長に応じてフォントサイズと折り返し幅を決定
  const len = title.length;
  const { fs, maxC } =
    len <= 20 ? { fs: 72, maxC: 18 } :
    len <= 30 ? { fs: 62, maxC: 20 } :
    len <= 40 ? { fs: 54, maxC: 22 } :
    len <= 55 ? { fs: 46, maxC: 24 } :
               { fs: 40, maxC: 26 };

  const lines  = wrapTitle(title, maxC);
  const lh     = fs * 1.45;
  const blockH = lines.length * lh;

  // テキストブロックを縦方向に中央より少し上に配置
  const titleStartY = (H - blockH) / 2 + 40;

  // バッジの位置（タイトルの上）
  const badgeY  = titleStartY - 90;
  const badgeFontSize = 18;
  const badgePadX = 22;
  const badgeH  = badgeFontSize + 20;
  const badgeW  = category.length * badgeFontSize * 0.95 + badgePadX * 2;

  // テキスト要素
  const fontFamily = "'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Noto Sans CJK JP', 'Yu Gothic UI', sans-serif";
  const textEls = lines.map((line, i) =>
    `<text x="72" y="${titleStartY + i * lh + fs}"
      font-family="${fontFamily}"
      font-size="${fs}" font-weight="900"
      fill="#FFFFFF" dominant-baseline="auto">${esc(line)}</text>`
  ).join('\n  ');

  // fotter-logo.png は 304×80 → 高さ48pxに縮小すると幅182px
  const LOGO_H = 48;
  const LOGO_W = Math.round(LOGO_H * 304 / 80); // 182px

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}">
  <defs>
    <!-- カテゴリカラーグラデーション背景 -->
    <radialGradient id="bg" cx="18%" cy="30%" r="70%" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="${gradFrom}" stop-opacity="1"/>
      <stop offset="100%" stop-color="#04040C"     stop-opacity="1"/>
    </radialGradient>
  </defs>

  <!-- 背景 -->
  <rect width="${W}" height="${H}" fill="#04040C"/>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- 右縦アクセントライン -->
  <rect x="${W - 5}" y="0" width="5" height="${H}" fill="${accent}" opacity="0.75"/>

  <!-- カテゴリバッジ -->
  <rect x="72" y="${badgeY}" width="${badgeW}" height="${badgeH}" rx="${badgeH / 2}"
    fill="rgba(0,0,0,0.55)" stroke="${accent}" stroke-width="1.5"/>
  <text x="${72 + badgePadX}" y="${badgeY + badgeFontSize + 7}"
    font-family="${fontFamily}"
    font-size="${badgeFontSize}" font-weight="700" fill="#FFFFFF">${esc(category)}</text>

  <!-- バッジ下アクセントライン -->
  <rect x="72" y="${badgeY + badgeH + 12}" width="52" height="4" rx="2" fill="${accent}"/>

  <!-- タイトル -->
  ${textEls}

  <!-- ロゴ（右下）: fotter-logo.png（白・透明背景）-->
  <image x="${W - 5 - 20 - LOGO_W}" y="${H - 20 - LOGO_H}"
    width="${LOGO_W}" height="${LOGO_H}"
    href="${LOGO_B64}"/>

</svg>`;
}

// ─── Playwright 用 HTML テンプレート ──────────────────────────────────────
// sharp(librsvg) は日本語フォント未対応の環境で文字化けするため HTML+Playwright を使用

const PLAYWRIGHT_COLORS = {
  '検索対策': { bg: '#1a3a6b', accent: '#4a9eff', badge: '#2d5fa0' },
  'SNS戦略':  { bg: '#1b2d5e', accent: '#6c63ff', badge: '#3d3494' },
  '運用の基本': { bg: '#0d4a6b', accent: '#00c9ff', badge: '#0a6690' },
  '活用事例': { bg: '#0f4c3a', accent: '#00e5a0', badge: '#187050' },
  '最新情報': { bg: '#4a1a6b', accent: '#c06fff', badge: '#6b2d9a' },
  '集客':     { bg: '#6b1a2d', accent: '#ff6b9d', badge: '#9a2d50' },
};
const PW_DEFAULT = { bg: '#0e2a5c', accent: '#005bea', badge: '#1a4a9a' };

function splitTitleHtml(raw) {
  const title = raw.replace(/【[^】]*】/g, '').trim() || raw;
  if (title.length <= 20) return [title];
  const separators = ['｜', '！', '？', '：', '|'];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx > 8 && idx < title.length - 4) {
      return sep === '｜' || sep === '|'
        ? [title.slice(0, idx).trimEnd(), title.slice(idx + 1).trimStart()]
        : [title.slice(0, idx + 1), title.slice(idx + 1).trimStart()];
    }
  }
  const mid = Math.round(title.length / 2);
  return [title.slice(0, Math.max(16, Math.min(mid, 24))), title.slice(Math.max(16, Math.min(mid, 24)))];
}

function buildHtml(title, category) {
  const c = PLAYWRIGHT_COLORS[category] ?? PW_DEFAULT;
  const lines = splitTitleHtml(title);
  const linesHtml = lines.map((l, i) => `<div class="line" id="l${i}">${l}</div>`).join('');
  return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { width:1200px; height:630px; overflow:hidden;
  background:linear-gradient(135deg,${c.bg} 0%,#0a1628 60%,#040d1a 100%);
  font-family:"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Noto Sans CJK JP","Yu Gothic",sans-serif;
  position:relative; }
.circle1 { position:absolute; border-radius:50%; width:480px; height:480px;
  background:radial-gradient(circle,${c.accent}22 0%,transparent 70%);
  top:-120px; right:-80px; }
.circle2 { position:absolute; border-radius:50%; width:300px; height:300px;
  background:radial-gradient(circle,${c.accent}15 0%,transparent 70%);
  bottom:-80px; left:80px; }
.grid { position:absolute; inset:0;
  background-image:linear-gradient(${c.accent}08 1px,transparent 1px),
    linear-gradient(90deg,${c.accent}08 1px,transparent 1px);
  background-size:60px 60px; }
.content { position:absolute; inset:0; display:flex; flex-direction:column;
  justify-content:center; padding:60px 80px 110px; }
.badge { display:inline-block; background:${c.badge}; color:#fff;
  font-size:22px; font-weight:700; letter-spacing:0.08em;
  padding:6px 22px; border-radius:6px; margin-bottom:24px;
  border:1px solid ${c.accent}55; width:fit-content; }
.title { margin-bottom:32px; }
.title .line { display:block; white-space:nowrap; overflow:hidden;
  text-overflow:ellipsis; max-width:1040px;
  font-size:48px; font-weight:900; line-height:1.45; color:#fff;
  text-shadow:0 2px 20px rgba(0,0,0,.6); letter-spacing:0.02em; }
.accent-line { width:60px; height:4px;
  background:linear-gradient(90deg,${c.accent},transparent); border-radius:2px; }
.brand { position:absolute; bottom:36px; right:72px; }
.brand img { height:38px; width:auto; opacity:0.85; }
.side-line { position:absolute; right:56px; top:60px; bottom:110px; width:3px;
  background:linear-gradient(to bottom,${c.accent}88,transparent); border-radius:2px; }
</style></head>
<body>
  <div class="grid"></div><div class="circle1"></div><div class="circle2"></div>
  <div class="side-line"></div>
  <div class="content">
    <div class="badge">${category || 'お役立ち情報'}</div>
    <div class="title">${linesHtml}</div>
    <div class="accent-line"></div>
  </div>
  <div class="brand"><img src="${LOGO_B64}" alt="COCOマーケ"></div>
  <script>
    document.querySelectorAll('.title .line').forEach(function(el){
      var s=48; while(el.scrollWidth>1040&&s>28){s--;el.style.fontSize=s+'px';}
    });
  </script>
</body></html>`;
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Playwright で HTML をスクリーンショット → PNG バッファを生成 */
export async function generateEyecatchBuffer(title, category) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.setContent(buildHtml(title, category), { waitUntil: 'load' });
    await page.waitForTimeout(300);
    return await page.screenshot({ type: 'png' });
  } finally {
    await browser.close();
  }
}

/** microCMS Management API にアイキャッチをアップロードして URL を返す */
export async function uploadEyecatch({ title, category, serviceDomain, apiKey }) {
  const MEDIA_URL = `https://${serviceDomain}.microcms-management.io/api/v1/media`;
  const pngBuf = await generateEyecatchBuffer(title, category);
  const form   = new FormData();
  form.append('file', new Blob([pngBuf], { type: 'image/png' }), 'eyecatch.png');

  const res = await fetch(MEDIA_URL, {
    method:  'POST',
    headers: { 'X-MICROCMS-API-KEY': apiKey },
    body:    form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`eyecatch upload failed: ${res.status} ${err}`);
  }
  const data = await res.json();
  if (!data.url) throw new Error('eyecatch upload: no url in response');
  console.log('  eyecatch uploaded:', data.url);
  return data.url;
}

/** microCMS Content API で eyecatch フィールドを更新（フォーマット自動選択） */
export async function patchEyecatch({ contentId, eyecatchUrl, serviceDomain, apiKey }) {
  const endpoint = `https://${serviceDomain}.microcms.io/api/v1/blogs/${contentId}`;
  // { url } 形式 → 失敗なら URL 文字列で再試行
  for (const eyecatch of [{ url: eyecatchUrl, width: 1200, height: 630 }, eyecatchUrl]) {
    const res = await fetch(endpoint, {
      method:  'PATCH',
      headers: { 'X-MICROCMS-API-KEY': apiKey, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ eyecatch }),
    });
    if (res.ok) return true;
    const err = await res.text();
    console.warn(`  eyecatch PATCH attempt failed: ${res.status} ${err.slice(0, 80)}`);
  }
  return false;
}
