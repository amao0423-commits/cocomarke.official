/**
 * Update single article with improved SVGs
 * Article: how-to-check-instagram-dm-without-marking-as-read
 */

const MICROCMS_API_KEY  = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN   = 'cocomarke';
const ARTICLE_ID = 'how-to-check-instagram-dm-without-marking-as-read';

// Old SVG URLs (existing in article)
const OLD_SVG_URL1 = 'https://images.microcms-assets.io/assets/bfc6bd7eb1b047c99582466ac1152f03/11c617a09c9e4f2eb2c5ae0aecc0616a/svg-how-to-check-instagram-dm-wi-1.svg';
const OLD_SVG_URL2 = 'https://images.microcms-assets.io/assets/bfc6bd7eb1b047c99582466ac1152f03/1fbcd1dcf3c942e9a65a73163c9e5094/svg-how-to-check-instagram-dm-wi-2.svg';

// New SVG URLs (from improved generation)
const NEW_SVG_URL1 = 'https://images.microcms-assets.io/assets/bfc6bd7eb1b047c99582466ac1152f03/e61b26f84cd74657a35e61c93a2ab547/svg-how-to-check-instagram-dm-wi-1-improved.svg';
const NEW_SVG_URL2 = 'https://images.microcms-assets.io/assets/bfc6bd7eb1b047c99582466ac1152f03/6f2d8452e7784d31a01276e2a3b3d81e/svg-how-to-check-instagram-dm-wi-2-improved.svg';

// ─── Fetch article ────────────────────────────────────────────────────────────

async function fetchArticle(articleId) {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${articleId}`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY } }
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Replace SVG images in content ────────────────────────────────────────────

function replaceSVGUrls(content) {
  let updated = content;
  
  // Replace specific old SVG URLs with new ones
  updated = updated.replace(OLD_SVG_URL1, NEW_SVG_URL1);
  updated = updated.replace(OLD_SVG_URL2, NEW_SVG_URL2);
  
  // Also update width and height to match new SVG dimensions
  // Old: width="800" height="450"
  // New: width="800" height="475" (for 2-line header)
  // Match img tags for SVG files and update dimensions
  updated = updated.replace(
    /(<img[^>]*src=".*?improved\.svg"[^>]*)width="800"\s+height="450"/g,
    '$1width="800" height="475"'
  );

  return updated;
}

// ─── Patch article ────────────────────────────────────────────────────────────

async function patchArticle(contentId, content) {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${contentId}`,
    {
      method: 'PATCH',
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    }
  );
  return { ok: res.ok, status: res.status };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('━━━ 記事更新開始 ━━━\n');

  try {
    // 1. Fetch current article
    console.log('✓ 記事取得中...');
    const article = await fetchArticle(ARTICLE_ID);
    console.log(`  タイトル: ${article.title.slice(0, 50)}...`);
    console.log(`  コンテンツサイズ: ${article.content.length} bytes\n`);

    // 2. Replace SVG URLs
    console.log('✓ SVG URL置換中...');
    const updatedContent = replaceSVGUrls(article.content);
    console.log(`  置換後サイズ: ${updatedContent.length} bytes\n`);

    // 3. Patch article
    console.log('✓ microCMS更新中...');
    const result = await patchArticle(ARTICLE_ID, updatedContent);
    console.log(`  ステータス: ${result.status}`);
    console.log(`  結果: ${result.ok ? '✅ 成功' : '❌ 失敗'}\n`);

    if (result.ok) {
      console.log('━━━ 更新完了 ━━━\n');
      console.log('改善内容:');
      console.log('  1. SVGテキスト短縮（12文字以内）');
      console.log('  2. SVGヘッダー2行化（38文字まで）');
      console.log('  3. SVG高さ拡張（450px → 475px）');
      console.log(`\n記事を確認: https://www.cocomarke.com/blog/${ARTICLE_ID}/`);
    } else {
      console.error('❌ 更新に失敗しました');
      process.exit(1);
    }

  } catch (e) {
    console.error('✗ エラー:', e.message);
    process.exit(1);
  }
}

main();
