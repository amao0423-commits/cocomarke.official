/**
 * check-post-links.mjs — 記事本文内の /post/ リンク残存チェック
 *
 * Usage:
 *   node scripts/check-post-links.mjs           # チェックのみ
 *   node scripts/check-post-links.mjs --fix     # 自動修正して PATCH
 */

const MICROCMS_KEY    = 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const MICROCMS_DOMAIN = 'cocomarke';

const fixMode = process.argv.includes('--fix');

async function fetchAll() {
  const r = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs?limit=100&fields=id,title,content&orders=-publishedAt`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY } }
  );
  if (!r.ok) throw new Error(`fetchAll ${r.status}`);
  return (await r.json()).contents ?? [];
}

async function patchContent(id, content) {
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return r;
}

const POST_LINK_RE = /href="(?:https?:\/\/www\.cocomarke\.com)?\/post\//g;

async function main() {
  console.log('═'.repeat(60));
  console.log('/post/ リンク残存チェック  |  COCOマーケ blogs');
  console.log(fixMode ? 'モード: 自動修正 + PATCH' : 'モード: チェックのみ（--fix で修正）');
  console.log('═'.repeat(60));

  process.stdout.write('\n全記事取得中...');
  const all = await fetchAll();
  process.stdout.write(` ${all.length}件\n\n`);

  const found = [];
  for (const article of all) {
    const content = article.content ?? '';
    const matches = content.match(POST_LINK_RE);
    if (matches) {
      found.push({ id: article.id, title: article.title, count: matches.length, content });
    }
  }

  if (found.length === 0) {
    console.log('✅ /post/ リンクは全記事で検出されませんでした。');
    return;
  }

  console.log(`⚠️  /post/ リンクが残存している記事: ${found.length}件\n`);
  for (const a of found) {
    console.log(`  [${a.count}箇所] ${a.id}`);
    console.log(`         ${a.title.slice(0, 60)}`);
  }

  if (!fixMode) {
    console.log('\n--fix フラグを付けて実行すると自動修正します:');
    console.log('  node scripts/check-post-links.mjs --fix');
    return;
  }

  console.log('\n修正中...');
  let success = 0, fail = 0;
  for (const a of found) {
    const fixed = a.content.replace(
      /href="(https?:\/\/www\.cocomarke\.com)?\/post\//g,
      'href="/blog/'
    );
    process.stdout.write(`  ${a.id} ... `);
    const res = await patchContent(a.id, fixed);
    if (res.ok) {
      process.stdout.write('✅\n');
      success++;
    } else {
      process.stdout.write(`❌ (${res.status})\n`);
      fail++;
    }
  }

  console.log(`\n完了: 修正 ${success}件 / 失敗 ${fail}件`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
