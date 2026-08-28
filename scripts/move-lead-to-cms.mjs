/**
 * move-lead-to-cms.mjs [--apply]
 *
 * blogSeoOverrides.ts の lead（記事冒頭の青いリード枠）を microCMS の本文へ移す。
 * lead はコード側にあるため編集のたびにデプロイが必要だった。本文の先頭に
 * blockquote として入れることで、microCMSの管理画面から編集できるようにする。
 *
 * 表示位置は変わらない（従来 lead は cms-body の直前に描画され、
 * 本文先頭の blockquote も同じ位置に来る）。
 *
 * 既定はドライラン。--apply を付けたときだけ microCMS を更新する。
 * ※ 反映後、blogSeoOverrides.ts 側の lead を空にする必要がある（二重表示を防ぐため）。
 */
import { readFileSync } from 'node:fs';

const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const APPLY = process.argv.includes('--apply');

const src = readFileSync('src/lib/blogSeoOverrides.ts', 'utf8');

// slug ごとのブロックを切り出して lead を取り出す
const entries = [];
const re = /^ {2}'([a-z0-9-]+)':\s*\{/gm;
const heads = [...src.matchAll(re)];
for (let i = 0; i < heads.length; i++) {
  const start = heads[i].index;
  const end = i + 1 < heads.length ? heads[i + 1].index : src.length;
  const block = src.slice(start, end);
  const m = block.match(/\n\s*lead:\s*'((?:[^'\\]|\\.)*)'/);
  const lead = m ? m[1].replace(/\\'/g, "'") : '';
  if (lead.trim()) entries.push({ slug: heads[i][1], lead: lead.trim() });
}

console.log(`lead を持つ記事: ${entries.length}件\n`);

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const { slug, lead } of entries) {
  const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}?fields=id,title,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); continue; }
  const a = await res.json();
  const before = a.content ?? '';

  const plain = lead.replace(/\s+/g, '');
  if (before.replace(/<[^>]+>/g, '').replace(/\s+/g, '').includes(plain)) {
    console.log(`■ ${slug}\n   すでに本文に含まれています（スキップ）\n`);
    continue;
  }

  const after = `<blockquote><p>${esc(lead)}</p></blockquote>` + before;

  console.log(`■ ${slug}`);
  console.log(`   ${a.title.slice(0, 44)}`);
  console.log(`   リード: ${lead.slice(0, 60)}…`);
  console.log(`   文字数: ${before.length} → ${after.length}`);

  if (!APPLY) { console.log('   （ドライラン）\n'); continue; }

  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: after }),
  });
  console.log(`   PATCH ${p.status} ${p.ok ? '✅ 反映' : '❌ ' + (await p.text()).slice(0, 120)}\n`);
}
