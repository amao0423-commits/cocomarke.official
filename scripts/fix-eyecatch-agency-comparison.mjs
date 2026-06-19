import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const CONTENT_KEY = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const SERVICE     = 'cocomarke';
const ARTICLE_ID  = 'instagram-management-agency-comparison';
const TITLE       = 'Instagram運用代行のおすすめ｜10社を徹底比較';
const CATEGORY    = 'SNS戦略';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGO_PATH = path.join(__dirname, '../old/images/fotter-logo.png');
const LOGO_B64  = `data:image/png;base64,${readFileSync(LOGO_PATH).toString('base64')}`;

const CATEGORY_COLORS = {
  '検索対策':  { bg: '#1a3a6b', accent: '#4a9eff', badge: '#2d5fa0' },
  'SNS戦略':   { bg: '#1b2d5e', accent: '#6c63ff', badge: '#3d3494' },
  '運用の基本': { bg: '#0d4a6b', accent: '#00c9ff', badge: '#0a6690' },
  '活用事例':  { bg: '#0f4c3a', accent: '#00e5a0', badge: '#187050' },
  '最新情報':  { bg: '#4a1a6b', accent: '#c06fff', badge: '#6b2d9a' },
  '集客':      { bg: '#6b1a2d', accent: '#ff6b9d', badge: '#9a2d50' },
};
const DEFAULT_COLORS = { bg: '#0e2a5c', accent: '#005bea', badge: '#1a4a9a' };

function splitTitle(raw) {
  const title = raw.replace(/【[^】]*】/g, '').trim() || raw;
  if (title.length <= 20) return [title];
  const separators = ['｜', '！', '？', '：', '|'];
  for (const sep of separators) {
    const idx = title.indexOf(sep);
    if (idx > 8 && idx < title.length - 4) {
      if (sep === '｜' || sep === '|') {
        return [title.slice(0, idx).trimEnd(), title.slice(idx + 1).trimStart()];
      }
      return [title.slice(0, idx + 1), title.slice(idx + 1).trimStart()];
    }
  }
  const mid = Math.round(title.length / 2);
  const split = Math.max(16, Math.min(mid, 24));
  return [title.slice(0, split), title.slice(split)];
}

function buildHtml(title, category, logoDataUri) {
  const c = CATEGORY_COLORS[category] ?? DEFAULT_COLORS;
  const lines = splitTitle(title);
  const linesHtml = lines.map((l, i) => `<div class="line" id="l${i}">${l}</div>`).join('');
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
  .circle1 { position: absolute; border-radius: 50%; width: 480px; height: 480px;
    background: radial-gradient(circle, ${c.accent}22 0%, transparent 70%);
    top: -120px; right: -80px; }
  .circle2 { position: absolute; border-radius: 50%; width: 300px; height: 300px;
    background: radial-gradient(circle, ${c.accent}15 0%, transparent 70%);
    bottom: -80px; left: 80px; }
  .grid { position: absolute; inset: 0;
    background-image: linear-gradient(${c.accent}08 1px, transparent 1px),
      linear-gradient(90deg, ${c.accent}08 1px, transparent 1px);
    background-size: 60px 60px; }
  .content { position: absolute; inset: 0; display: flex; flex-direction: column;
    justify-content: center; padding: 60px 80px 110px; }
  .badge { display: inline-block; background: ${c.badge}; color: #fff;
    font-size: 22px; font-weight: 700; letter-spacing: 0.08em;
    padding: 6px 22px; border-radius: 6px; margin-bottom: 24px;
    border: 1px solid ${c.accent}55; width: fit-content; }
  .title { margin-bottom: 32px; }
  .title .line { display: block; white-space: nowrap; overflow: hidden;
    text-overflow: ellipsis; max-width: 1040px;
    font-size: 48px; font-weight: 900; line-height: 1.45;
    color: #ffffff; text-shadow: 0 2px 20px rgba(0,0,0,0.6); letter-spacing: 0.02em; }
  .accent-line { width: 60px; height: 4px;
    background: linear-gradient(90deg, ${c.accent}, transparent); border-radius: 2px; }
  .brand { position: absolute; bottom: 36px; right: 72px; }
  .brand img { height: 38px; width: auto; opacity: 0.85; }
  .side-line { position: absolute; right: 56px; top: 60px; bottom: 110px; width: 3px;
    background: linear-gradient(to bottom, ${c.accent}88, transparent); border-radius: 2px; }
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
  <div class="brand"><img src="${logoDataUri}" alt="COCOマーケ"></div>
  <script>
    (function() {
      document.querySelectorAll('.title .line').forEach(function(el) {
        var size = 48;
        while (el.scrollWidth > 1040 && size > 28) { size -= 1; el.style.fontSize = size + 'px'; }
      });
    })();
  </script>
</body>
</html>`;
}

async function main() {
  if (!CONTENT_KEY) throw new Error('MICROCMS_API_KEY が未設定です');

  console.log('Playwrightでアイキャッチ生成中...');
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(buildHtml(TITLE, CATEGORY, LOGO_B64), { waitUntil: 'load' });
  await page.waitForTimeout(300);

  const imgBuf = await page.screenshot({ type: 'png' });
  await browser.close();
  console.log(`  画像生成OK (${imgBuf.length} bytes)`);

  console.log('microCMSにアップロード中...');
  const fd = new FormData();
  fd.append('file', new Blob([imgBuf], { type: 'image/png' }), `${ARTICLE_ID}.png`);
  const uploadRes = await fetch(`https://${SERVICE}.microcms-management.io/api/v1/media`, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': CONTENT_KEY },
    body: fd,
  });
  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  const { url } = await uploadRes.json();
  console.log(`  アップロードOK: ${url}`);

  console.log('microCMS eyecatch PATCHing...');
  const patchRes = await fetch(`https://${SERVICE}.microcms.io/api/v1/blogs/${ARTICLE_ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': CONTENT_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ eyecatch: { url, width: 1200, height: 630 } }),
  });
  if (!patchRes.ok) {
    const txt = await patchRes.text();
    if (txt.includes('unexpected')) {
      const p2 = await fetch(`https://${SERVICE}.microcms.io/api/v1/blogs/${ARTICLE_ID}`, {
        method: 'PATCH',
        headers: { 'X-MICROCMS-API-KEY': CONTENT_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ eyecatch: url }),
      });
      if (!p2.ok) throw new Error(`PATCH failed: ${p2.status} ${await p2.text()}`);
    } else {
      throw new Error(`PATCH failed: ${patchRes.status} ${txt}`);
    }
  }
  console.log('✅ アイキャッチ更新完了！');
  console.log(`   https://www.cocomarke.com/blog/${ARTICLE_ID}/`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
