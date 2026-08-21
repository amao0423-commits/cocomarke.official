/**
 * fetch-articles.mjs — microCMS のブログ記事をローカルに取得する。
 * 出力: data/articles/<slug>.md（frontmatter + 本文HTML）
 *
 * ブログ運用フローの起点。Claude Code が記事本文を直接分析できる状態を作る。
 * ※ここでは「取得」のみ。既存記事の上書き・公開は行わない（設計方針）。
 *
 * 使い方: node scripts/fetch-articles.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const BASE = 'https://cocomarke.microcms.io/api/v1/blogs';
const OUT_DIR = 'data/articles';
const SITE = 'https://www.cocomarke.com';

const catName = (c) => (c && typeof c === 'object' ? c.name ?? '' : c ?? '');

/** microCMS の全記事を取得（ページング） */
async function fetchAll() {
  const all = [];
  const limit = 100;
  for (let offset = 0; ; offset += limit) {
    const url = `${BASE}?limit=${limit}&offset=${offset}&fields=id,title,description,content,publishedAt,revisedAt,updatedAt,day,category`;
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY } });
    if (!res.ok) throw new Error(`fetch failed ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const json = await res.json();
    all.push(...json.contents);
    if (offset + limit >= json.totalCount) break;
  }
  return all;
}

/** frontmatter の値を安全にエスケープ（YAML: ダブルクオート囲み） */
const y = (v) => `"${String(v ?? '').replace(/"/g, '\\"')}"`;

function toMarkdown(a) {
  const slug = a.id;
  const fm = [
    '---',
    `id: ${y(a.id)}`,
    `slug: ${y(slug)}`,
    `title: ${y(a.title)}`,
    `description: ${y(a.description ?? '')}`,
    // サイト側の表示ロジック（[id].astro: blog.day ?? blog.publishedAt）と一致させる。
    // microCMSの内部publishedAtは移行時の一括登録日になっており、実際の投稿日はdayフィールド。
    `publishedAt: ${y(a.day ?? a.publishedAt ?? '')}`,
    `updatedAt: ${y(a.revisedAt ?? a.updatedAt ?? '')}`,
    `category: ${y(catName(a.category))}`,
    `url: ${y(`${SITE}/blog/${slug}/`)}`,
    '---',
    '',
  ].join('\n');
  return fm + (a.content ?? '') + '\n';
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const articles = await fetchAll();
  let n = 0;
  for (const a of articles) {
    const path = `${OUT_DIR}/${a.id}.md`;
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, toMarkdown(a), 'utf8');
    n++;
  }
  console.log(`✅ ${n} 記事を ${OUT_DIR}/ に保存しました（microCMS totalCount と一致）`);
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
