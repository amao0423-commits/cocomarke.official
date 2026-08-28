/**
 * remove-lead-blockquote.mjs <slug...> [--apply]
 *
 * move-lead-to-cms.mjs で本文の先頭に差し込んだリード用 blockquote を取り除く。
 * 誤削除を防ぐため、次の両方を満たすときだけ削除する。
 *   1. 本文の「先頭」の要素が blockquote であること
 *   2. その中身が、旧 blogSeoOverrides.ts の lead と一致すること
 *
 * 既定はドライラン。--apply を付けたときだけ microCMS を更新する。
 */
import { readFileSync } from 'node:fs';

const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const slugs = args.filter((a) => !a.startsWith('--'));

const LEADS = JSON.parse(readFileSync('/tmp/leads.json', 'utf8'));
const norm = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>').replace(/\s+/g, '').trim();

if (!slugs.length) { console.error('usage: node scripts/remove-lead-blockquote.mjs <slug...> [--apply]'); process.exit(1); }

for (const slug of slugs) {
  const lead = LEADS[slug];
  if (!lead) { console.log(`■ ${slug}\n   旧leadが見つかりません（スキップ）\n`); continue; }

  const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}?fields=id,title,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); continue; }
  const a = await res.json();
  const before = a.content ?? '';

  const m = before.match(/^\s*<blockquote>[\s\S]*?<\/blockquote>/);
  console.log(`■ ${slug}`);
  if (!m) { console.log('   先頭にblockquoteがありません（スキップ）\n'); continue; }
  if (norm(m[0]) !== norm(lead)) {
    console.log('   先頭blockquoteの中身が旧leadと一致しません（安全のためスキップ）');
    console.log(`     本文: ${norm(m[0]).slice(0, 50)}…`);
    console.log(`     旧lead: ${norm(lead).slice(0, 50)}…\n`);
    continue;
  }

  const after = before.slice(m[0].length);
  console.log(`   削除: ${norm(m[0]).slice(0, 56)}…`);
  console.log(`   文字数: ${before.length} → ${after.length}`);
  if (!APPLY) { console.log('   （ドライラン）\n'); continue; }

  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: after }),
  });
  console.log(`   PATCH ${p.status} ${p.ok ? '✅ 削除' : '❌ ' + (await p.text()).slice(0, 120)}\n`);
}
