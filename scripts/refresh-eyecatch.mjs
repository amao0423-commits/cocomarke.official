/**
 * refresh-eyecatch.mjs <slug...> [--apply]
 *
 * 記事の現在のタイトル・カテゴリでアイキャッチを作り直して差し替える。
 * リライトでタイトルを変えたのにサムネイルが旧タイトルのまま、という状態を解消する用途。
 *
 * 既定はドライラン（生成だけしてローカルに保存し、差し替えはしない）。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { generateEyecatchBuffer, uploadEyecatch, patchEyecatch } from './eyecatch.mjs';

const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const DOMAIN = 'cocomarke';
const OUT = process.env.EYECATCH_OUT || '/tmp/eyecatch-preview';

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const slugs = args.filter((a) => !a.startsWith('--'));

if (!slugs.length) {
  console.error('usage: node scripts/refresh-eyecatch.mjs <slug...> [--apply]');
  process.exit(1);
}
mkdirSync(OUT, { recursive: true });

for (const slug of slugs) {
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${slug}?fields=id,title,category`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); continue; }
  const a = await res.json();
  const cat = a.category && (a.category.name || a.category);

  console.log(`■ ${slug}`);
  console.log(`   タイトル: ${a.title}`);
  console.log(`   カテゴリ: ${cat ?? '（なし）'}`);

  if (!APPLY) {
    const buf = await generateEyecatchBuffer(a.title, cat);
    const p = `${OUT}/${slug}.png`;
    writeFileSync(p, buf);
    console.log(`   プレビュー生成: ${p}\n`);
    continue;
  }

  const url = await uploadEyecatch({ title: a.title, category: cat, serviceDomain: DOMAIN, apiKey: KEY });
  const ok = await patchEyecatch({ contentId: slug, eyecatchUrl: url, serviceDomain: DOMAIN, apiKey: KEY });
  console.log(`   ${ok ? '✅ 差し替え完了' : '❌ 差し替え失敗'}: ${url}\n`);
}
