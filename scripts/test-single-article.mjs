/**
 * Test script: Process single article with SVG improvements
 * Article: how-to-check-instagram-dm-without-marking-as-read
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_API_KEY  = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN   = 'cocomarke';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const ARTICLE_ID = 'how-to-check-instagram-dm-without-marking-as-read';

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// ─── Helper functions (copy from main script) ────────────────────────────────

const stripHtml = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => stripHtml(m[1]).replace(/^\d+\.\s*/, '').trim())
    .filter(t => t.length > 3);
}

function shortenLabel(text) {
  if (text.length <= 12) return text;
  if (/とは[？?]?$/.test(text)) return text.replace(/とは[？?]?$/, '') + '…';
  if (/方法/.test(text)) return text.replace(/方法/, 'ほう') + '…';
  if (/確認/.test(text)) return text.replace(/確認/, '確認') + '…';
  if (/選び方/.test(text)) return text.replace(/選び方/, '選択') + '…';
  return text.slice(0, 12) + '…';
}

const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#3B82F6'];

// ─── SVG generation with improved text handling ──────────────────────────────

function svgChecklist(titleText, pts, header) {
  const rows = pts.slice(0, 4).map((p, i) => {
    const y = 100 + i * 70;
    const shortLabel = shortenLabel(p);
    return `<rect x="25" y="${y}" width="750" height="55" rx="8" fill="white" stroke="${COLORS[i]}" stroke-width="2"/>
  <rect x="25" y="${y}" width="62" height="55" rx="8" fill="${COLORS[i]}"/>
  <text x="56" y="${y+34}" font-family="sans-serif" font-size="20" fill="white" text-anchor="middle">✓</text>
  <text x="105" y="${y+31}" font-family="sans-serif" font-size="12" fill="#1F2937">${shortLabel}</text>`;
  });
  return svg800x450(header, '#22C55E', rows.join('\n'), pts);
}

function svg800x450(header, headerColor, body, pts) {
  // Split header into 2 lines (max 20 chars per line, total 38 max)
  const line1 = header.slice(0, 20);
  const line2 = header.length > 20 ? header.slice(20, 38) + (header.length > 38 ? '…' : '') : '';

  const headerSVG = line2 
    ? `<text x="400" y="28" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="17" font-weight="bold" fill="white" text-anchor="middle">${line1}</text>
  <text x="400" y="50" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="17" font-weight="bold" fill="white" text-anchor="middle">${line2}</text>`
    : `<text x="400" y="43" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="19" font-weight="bold" fill="white" text-anchor="middle">${line1}</text>`;

  const headerHeight = line2 ? 75 : 68;
  const svgHeight = 450 + (line2 ? 25 : 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${svgHeight}" viewBox="0 0 800 ${svgHeight}">
  <rect width="800" height="${svgHeight}" fill="#f8faff"/>
  <rect width="800" height="${headerHeight}" fill="${headerColor}"/>
  ${headerSVG}
  ${body}
  <text x="400" y="${svgHeight - 14}" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">© COCOマーケ｜Instagramマーケティング支援</text>
</svg>`;
}

// ─── microCMS functions ──────────────────────────────────────────────────────

async function fetchArticle(articleId) {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${articleId}`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function uploadSVG(svgContent, filename) {
  const formData = new FormData();
  formData.append('file', new Blob([Buffer.from(svgContent, 'utf8')], { type: 'image/svg+xml' }), filename);
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms-management.io/api/v1/media`,
    { method: 'POST', headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY }, body: formData }
  );
  if (!res.ok) throw new Error(`SVG upload ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.url;
}

async function patchArticle(contentId, title, content) {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${contentId}`,
    {
      method: 'PATCH',
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    }
  );
  return { ok: res.ok, status: res.status, text: await res.text() };
}

// ─── Main test ────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━ テスト処理開始 ━━━\n');
  console.log(`記事ID: ${ARTICLE_ID}\n`);

  // 1. Fetch article
  console.log('✓ 記事取得中...');
  const article = await fetchArticle(ARTICLE_ID);
  console.log(`  タイトル: ${article.title}`);
  console.log(`  コンテンツサイズ: ${article.content.length} bytes\n`);

  // 2. Extract headings
  const h2s = extractH2s(article.content);
  console.log('✓ 見出し抽出:');
  h2s.forEach((h, i) => console.log(`  ${i+1}. ${h}`));
  console.log();

  // 3. Generate SVGs
  console.log('✓ SVG生成中...');
  const half = Math.ceil(h2s.length / 2);
  const pts1 = h2s.slice(0, half);
  const pts2 = h2s.slice(half);

  const header1 = `${article.title.slice(0, 20)}｜前半`;
  const header2 = `${article.title.slice(0, 20)}｜後半`;

  const svg1 = svgChecklist(article.title, pts1, header1);
  const svg2 = svgChecklist(article.title, pts2, header2);

  console.log(`  SVG1 サイズ: ${svg1.length} bytes`);
  console.log(`  SVG2 サイズ: ${svg2.length} bytes\n`);

  // 4. Upload SVGs
  console.log('✓ SVGアップロード中...');
  const filename1 = `svg-${ARTICLE_ID.slice(0, 28)}-1-improved.svg`;
  const filename2 = `svg-${ARTICLE_ID.slice(0, 28)}-2-improved.svg`;

  let url1 = null, url2 = null;
  try {
    url1 = await uploadSVG(svg1, filename1);
    console.log(`  ✓ SVG1: ${url1}`);
  } catch (e) {
    console.error(`  ✗ SVG1 失敗: ${e.message}`);
  }

  try {
    url2 = await uploadSVG(svg2, filename2);
    console.log(`  ✓ SVG2: ${url2}`);
  } catch (e) {
    console.error(`  ✗ SVG2 失敗: ${e.message}`);
  }

  console.log('\n✓ 完了\n');
  console.log('━━━ 結果 ━━━');
  console.log(`記事タイトル: ${article.title}`);
  console.log(`SVG1 URL: ${url1 || 'Failed'}`);
  console.log(`SVG2 URL: ${url2 || 'Failed'}`);
  console.log('\n※ 注意: 実際にmicroCMS上の記事を更新していません');
  console.log('   URLが正常に返却されたら、本処理で記事を更新します');
}

main().catch(e => {
  console.error('✗ エラー:', e.message);
  process.exit(1);
});
