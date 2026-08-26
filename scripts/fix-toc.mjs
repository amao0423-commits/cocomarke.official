/**
 * fix-toc.mjs <slug> [--apply]
 *
 * 記事の目次を本文のH2から作り直す。
 * - 目次のリンク先を実在する見出しidに繋ぎ直す（#h-sN 等のプレースホルダを解消）
 * - 目次の文言を本文のH2と完全一致させる
 * - 「この記事でわかること」「目次」自体は目次に含めない
 *
 * 既定はドライラン。--apply を付けたときだけ microCMS に反映する。
 */
const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const [slug, ...flags] = process.argv.slice(2);
const APPLY = flags.includes('--apply');

if (!slug) {
  console.error('usage: node scripts/fix-toc.mjs <slug> [--apply]');
  process.exit(1);
}

const EXCLUDE = ['この記事でわかること', '目次'];
const strip = (s) => s.replace(/<[^>]+>/g, '').trim();

const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
  headers: { 'X-MICROCMS-API-KEY': KEY },
});
if (!res.ok) {
  console.error('fetch failed:', res.status, await res.text());
  process.exit(1);
}
const content = (await res.json()).content ?? '';

// 本文の全H2（目次に載せる対象のみ）
const heads = [...content.matchAll(/<h2 id="([^"]+)">(.*?)<\/h2>/gs)]
  .map((m) => ({ id: m[1], text: strip(m[2]) }))
  .filter((h) => !EXCLUDE.includes(h.text));

if (!heads.length) {
  console.error('H2が見つかりません');
  process.exit(1);
}

// 既存の目次（アンカーを含む最初の ol/ul）を差し替える
const listRe = /<(ol|ul)>[\s\S]*?<\/\1>/g;
let target = null;
for (const m of content.matchAll(listRe)) {
  if (m[0].includes('href="#')) { target = m; break; }
}
if (!target) {
  console.error('目次リストが見つかりません');
  process.exit(1);
}

const before = [...target[0].matchAll(/<li>(.*?)<\/li>/gs)].map((m) => strip(m[1]));
const items = heads
  .map((h) => `<li><a href="#${h.id}" target="_self">${h.text}</a></li>`)
  .join('');
const next = content.slice(0, target.index) + `<ol>${items}</ol>` +
  content.slice(target.index + target[0].length);

console.log(`=== ${slug} ===`);
console.log(`\n変更前（${before.length}項目）`);
before.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
console.log(`\n変更後（${heads.length}項目）`);
heads.forEach((h, i) => console.log(`  ${i + 1}. ${h.text}  -> #${h.id}`));

const broken = [...next.matchAll(/href="#([^"]+)"/g)]
  .map((m) => m[1])
  .filter((a) => !next.includes(`id="${a}"`));
console.log(`\nリンク切れ: ${broken.length ? broken.join(', ') : 'なし'}`);
console.log(`文字数: ${content.length} -> ${next.length}`);

if (!APPLY) {
  console.log('\n（ドライラン。反映するには --apply）');
  process.exit(0);
}
if (broken.length) {
  console.error('\nリンク切れが残るため中止しました');
  process.exit(1);
}

const patch = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
  method: 'PATCH',
  headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: next }),
});
console.log(`\nPATCH ${patch.status} ${patch.ok ? '✅ 反映しました' : '❌ ' + (await patch.text()).slice(0, 200)}`);
