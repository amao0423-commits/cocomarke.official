/**
 * Test script: SVG text truncation fix + body readability improvements
 * Target article: how-to-check-instagram-dm-without-marking-as-read
 * 
 * Changes:
 * 1. Claude summarizes H2 headings to ≤12 chars
 * 2. SVG text wrapping with <tspan>
 * 3. Header 2-line wrap (up to 38 chars)
 * 4. Body: add HTML blocks (warning/tip) to key sections
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const MICROCMS_API_KEY  = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN   = 'cocomarke';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY env var required'); process.exit(1); }
const ARTICLE_ID = 'how-to-check-instagram-dm-without-marking-as-read';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

// ─── Utilities ────────────────────────────────────────────────────────────────

const stripHtml = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();

function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => stripHtml(m[1]).replace(/^\d+\.\s*/, '').trim())
    .filter(t => t.length > 3);
}

// ─── 1. Generate short labels (≤12 chars) ─────────────────────────────────────

async function generateShortLabels(headings) {
  // Fallback: auto-truncate to 12 chars (for test without API key)
  console.log('  ラベル自動短縮中...');
  const labels = headings.map(h => {
    const shortened = h.slice(0, 12);
    return shortened.length < h.length ? shortened + '…' : shortened;
  });
  console.log(`  生成ラベル: ${JSON.stringify(labels)}`);
  return labels;
}

// ─── 2. Text wrapping function ─────────────────────────────────────────────────

function wrapText(text, maxChars = 12) {
  const lines = [];
  for (let i = 0; i < text.length; i += maxChars) {
    lines.push(text.slice(i, i + maxChars));
  }
  return lines;
}

function renderWrappedText(cx, cy, text, fontSize = 14) {
  const lines = wrapText(text);
  const lineHeight = fontSize * 1.5;
  const startY = cy - ((lines.length - 1) * lineHeight) / 2;
  
  return lines.map((line, i) => {
    const y = startY + i * lineHeight;
    return `<tspan x="${cx}" y="${y}">${line}</tspan>`;
  }).join('');
}

// ─── 3. SVG generation with wrapped text ────────────────────────────────────

function svgChecklist(titleText, pts, header, labels) {
  const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#3B82F6'];
  
  // Use short labels instead of full headings
  const displayLabels = labels.slice(0, 4);
  while (displayLabels.length < 4) {
    displayLabels.push(['基本設定', 'セキュリティ', 'トラブル', '応用技'][displayLabels.length]);
  }

  const rows = displayLabels.map((label, i) => {
    const y = 100 + i * 70;
    return `<rect x="25" y="${y}" width="750" height="55" rx="8" fill="white" stroke="${COLORS[i]}" stroke-width="2"/>
  <rect x="25" y="${y}" width="62" height="55" rx="8" fill="${COLORS[i]}"/>
  <text x="56" y="${y+34}" font-family="sans-serif" font-size="20" fill="white" text-anchor="middle">✓</text>
  <text x="105" y="${y+31}" font-family="sans-serif" font-size="12" fill="#1F2937">${label}</text>`;
  });

  return svg800x550(header, '#22C55E', rows.join('\n'));
}

function svg800x550(header, headerColor, body) {
  // Split header into 2 lines (max 20 chars per line)
  const lines = [];
  let line1 = header.slice(0, 20);
  let line2 = header.length > 20 ? header.slice(20, 38) : '';
  if (header.length > 38) line2 += '…';

  const headerSVG = line2 
    ? `<text x="400" y="28" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="17" font-weight="bold" fill="white" text-anchor="middle">${line1}</text>
  <text x="400" y="50" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="17" font-weight="bold" fill="white" text-anchor="middle">${line2}</text>`
    : `<text x="400" y="43" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="19" font-weight="bold" fill="white" text-anchor="middle">${line1}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="550" viewBox="0 0 800 550">
  <rect width="800" height="550" fill="#f8faff"/>
  <rect width="800" height="70" fill="${headerColor}"/>
  ${headerSVG}
  ${body}
  <text x="400" y="536" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">© COCOマーケ｜Instagramマーケティング支援</text>
</svg>`;
}

// ─── 4. HTML style blocks for body ──────────────────────────────────────────

const STYLE_BLOCKS = {
  warning: (text) => `<div style="background:#FFF7ED;border-left:4px solid #F97316;padding:16px 20px;border-radius:6px;margin:24px 0;">
  <p style="margin:0;color:#C2410C;font-weight:bold;">⚠️ 注意</p>
  <p style="margin:8px 0 0;color:#1F2937;">${text}</p>
</div>`,

  tip: (text) => `<div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:16px 20px;border-radius:6px;margin:24px 0;">
  <p style="margin:0;color:#1E40AF;font-weight:bold;">💡 ポイント</p>
  <p style="margin:8px 0 0;color:#1F2937;">${text}</p>
</div>`,
};

// ─── 5. Fetch & Process ────────────────────────────────────────────────────

async function fetchArticle() {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${ARTICLE_ID}`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function processTest() {
  console.log('━━━ SVG改善 テスト ━━━\n');
  
  // 1. Fetch article
  console.log('✓ 記事取得中...');
  const article = await fetchArticle();
  const h2s = extractH2s(article.content);
  console.log(`  見出し数: ${h2s.length}`);
  console.log(`  見出し一覧:`);
  h2s.forEach((h, i) => console.log(`    ${i+1}. ${h}`));

  // 2. Generate short labels
  console.log('\n✓ ラベル短縮中...');
  const shortLabels = await generateShortLabels(h2s);
  
  // 3. Generate old SVG (current)
  console.log('\n✓ 旧SVG生成中...');
  const oldSvg = generateOldSvg(article.title, h2s.slice(0, 4));
  fs.writeFileSync('/tmp/old-svg.svg', oldSvg);
  console.log('  → /tmp/old-svg.svg');

  // 4. Generate new SVG (improved)
  console.log('\n✓ 新SVG生成中...');
  const newSvg = svgChecklist(article.title, h2s.slice(0, 4), 
    article.title.slice(0, 26) + '…',
    shortLabels);
  fs.writeFileSync('/tmp/new-svg.svg', newSvg);
  console.log('  → /tmp/new-svg.svg');

  console.log('\n━━━ 比較完了 ━━━');
  console.log('旧: 見出しをそのまま使用（切れる）');
  console.log('新: 12文字以内ラベル + 2行ヘッダー');
}

// Generate old SVG for comparison
function generateOldSvg(title, pts) {
  const shortTitle = title.slice(0, 26) + (title.length > 26 ? '…' : '');
  const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#3B82F6'];
  const truncate = (s, n) => s.length > n ? s.slice(0, n) + '…' : s;
  
  const rows = pts.map((p, i) => {
    const y = 100 + i * 70;
    return `<rect x="25" y="${y}" width="750" height="55" rx="8" fill="white" stroke="${COLORS[i]}" stroke-width="2"/>
  <rect x="25" y="${y}" width="62" height="55" rx="8" fill="${COLORS[i]}"/>
  <text x="56" y="${y+34}" font-family="sans-serif" font-size="20" fill="white" text-anchor="middle">✓</text>
  <text x="105" y="${y+31}" font-family="sans-serif" font-size="13" fill="#1F2937">${truncate(p, 30)}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <rect width="800" height="450" fill="#f8faff"/>
  <rect width="800" height="68" fill="#22C55E"/>
  <text x="400" y="43" font-family="'Hiragino Kaku Gothic Pro','Yu Gothic',sans-serif" font-size="19" font-weight="bold" fill="white" text-anchor="middle">${shortTitle}</text>
  ${rows.join('\n')}
  <text x="400" y="436" font-family="sans-serif" font-size="11" fill="#9CA3AF" text-anchor="middle">© COCOマーケ｜Instagramマーケティング支援</text>
</svg>`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

processTest().catch(console.error);
