/**
 * apply-image-alt.mjs [--apply]
 *
 * alt が空の <img> に代替テキストを設定する。
 * 入力は scratchpad/alt/ に用意した inventory.json（対象画像の一覧）と
 * alts.txt（`番号|altテキスト` の行）。
 *
 * 置換は「その記事の、そのsrcを持つ、altが空のimgタグ」だけを対象にする。
 * 同じ記事に同じ画像が複数回出る場合も、空のものだけが対象になる。
 *
 * 既定はドライラン。--apply を付けたときだけ microCMS を更新する。
 */
import { readFileSync } from 'node:fs';

const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const APPLY = process.argv.includes('--apply');
const DIR = '/private/tmp/claude-501/-Users-andoaoi-out-2/f79cb711-d3cf-4987-a1eb-10243da3fbe3/scratchpad/alt';

const items = JSON.parse(readFileSync(`${DIR}/inventory.json`, 'utf8'));
const alts = new Map();
for (const line of readFileSync(`${DIR}/alts.txt`, 'utf8').split('\n')) {
  const i = line.indexOf('|');
  if (i > 0) alts.set(Number(line.slice(0, i).trim()), line.slice(i + 1).trim());
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// 記事ごとにまとめる
const bySlug = new Map();
items.forEach((it, idx) => {
  const alt = alts.get(idx + 1);
  if (!alt) return;
  if (!bySlug.has(it.slug)) bySlug.set(it.slug, []);
  bySlug.get(it.slug).push({ src: it.src, alt });
});

let totalImg = 0, totalArt = 0, failed = 0;
for (const [slug, list] of bySlug) {
  const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}?fields=id,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); failed++; continue; }
  let content = (await res.json()).content ?? '';
  let n = 0;

  for (const { src, alt } of list) {
    // 同じ src で alt が空の img タグを1つだけ置き換える
    const re = new RegExp(
      `<img\\b(?=[^>]*\\bsrc="${src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}")([^>]*?)\\balt=""([^>]*)>`);
    const m = content.match(re);
    if (!m) continue;
    content = content.replace(re, `<img${m[1]}alt="${esc(alt)}"${m[2]}>`);
    n++;
  }

  const left = (content.match(/<img\b[^>]*\balt=""[^>]*>/g) || []).length;
  console.log(`■ ${slug}: ${n}枚に設定${left ? ` / alt空が${left}枚残存` : ''}`);
  totalImg += n; totalArt++;

  if (!APPLY || !n) continue;
  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!p.ok) { console.error(`   ❌ ${p.status} ${(await p.text()).slice(0, 100)}`); failed++; }
}

console.log(`\n${APPLY ? '設定完了' : 'ドライラン'}: ${totalArt}記事 / ${totalImg}枚${failed ? ` / 失敗 ${failed}` : ''}`);
if (!APPLY) console.log('反映するには --apply');
