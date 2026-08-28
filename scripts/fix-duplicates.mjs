/**
 * fix-duplicates.mjs <slug...> [--apply]
 *
 * 記事内の重複を解消する。
 *  1. 「この記事でわかること」ブロック（見出し＋直後のリスト）を削除する。
 *     目次と内容が重なるうえ、見出しと同文のためSEO上も価値が薄い。
 *  2. 同一の段落・リスト項目が2回以上出る場合、2つ目以降を削除する（最初は残す）。
 *
 * 目次（アンカーを含むリスト）は対象外。見出しと同文になるのは仕様のため。
 * 既定はドライラン。--apply を付けたときだけ microCMS に反映する。
 */
const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const slugs = args.filter((a) => !a.startsWith('--'));

if (!slugs.length) {
  console.error('usage: node scripts/fix-duplicates.mjs <slug...> [--apply]');
  process.exit(1);
}

const norm = (s) =>
  s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, '').trim();

function stripWakaru(html) {
  // 「この記事でわかること」の見出しから次のH2の直前までを削除
  const re = /<h2[^>]*>[^<]{0,40}この記事でわかること[^<]{0,10}<\/h2>[\s\S]*?(?=<h2|$)/;
  const m = html.match(re);
  return m ? { html: html.replace(re, ''), removed: norm(m[0]).slice(0, 70) } : { html, removed: null };
}

function dedupe(html) {
  // 目次の範囲は除外対象として記録しておく
  let tocStart = -1, tocEnd = -1;
  for (const m of html.matchAll(/<(ol|ul)>[\s\S]*?<\/\1>/g)) {
    if (m[0].includes('href="#')) { tocStart = m.index; tocEnd = m.index + m[0].length; break; }
  }
  const seen = new Set();
  const removals = [];
  for (const m of html.matchAll(/<(p|li)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (tocStart >= 0 && m.index >= tocStart && m.index < tocEnd) continue;
    const t = norm(m[2]);
    if (t.length < 30) continue;
    if (seen.has(t)) removals.push({ start: m.index, end: m.index + m[0].length, text: t });
    else seen.add(t);
  }
  // 後ろから削除して位置ずれを防ぐ
  let out = html;
  for (const r of [...removals].reverse()) out = out.slice(0, r.start) + out.slice(r.end);
  // 中身が空になったリストを掃除
  out = out.replace(/<(ol|ul)>\s*<\/\1>/g, '');
  return { html: out, removals };
}

function rebuildToc(html) {
  // 目次＝アンカーを含む最初のリスト
  let toc = null;
  for (const m of html.matchAll(/<(ol|ul)>[\s\S]*?<\/\1>/g)) {
    if (m[0].includes('href="#')) { toc = m; break; }
  }
  if (!toc) return { html, rebuilt: false };
  const rest = html.slice(toc.index + toc[0].length);
  const heads = [...rest.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)]
    .map((m) => ({ id: m[1], text: m[2].replace(/<[^>]+>/g, '').trim() }))
    .filter((h) => !['目次', 'この記事でわかること'].includes(h.text));
  if (!heads.length) return { html, rebuilt: false };
  const items = heads.map((h) => `<li><a href="#${h.id}" target="_self">${h.text}</a></li>`).join('');
  return {
    html: html.slice(0, toc.index) + `<ol>${items}</ol>` + html.slice(toc.index + toc[0].length),
    rebuilt: true,
    count: heads.length,
  };
}

for (const slug of slugs) {
  const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}?fields=id,title,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); continue; }
  const a = await res.json();
  const before = a.content ?? '';

  const s1 = stripWakaru(before);
  const s2 = dedupe(s1.html);
  // 「この記事でわかること」を消すと見出し構成が変わるため、目次も本文のH2から作り直す。
  // 併せて #h-sN のような実在しないアンカーも解消される。
  const s3 = rebuildToc(s2.html);
  const after = s3.html;

  console.log(`■ ${a.title.slice(0, 48)}`);
  console.log(`   ${slug}`);
  console.log(`   この記事でわかること: ${s1.removed ? '削除 → ' + s1.removed + '…' : 'なし'}`);
  console.log(`   重複削除: ${s2.removals.length}箇所`);
  for (const r of s2.removals) console.log(`     - ${r.text.slice(0, 66)}…`);
  console.log(`   目次: ${s3.rebuilt ? s3.count + '項目で再構築' : '見つからず（変更なし）'}`);

  const broken = [...new Set([...after.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))]
    .filter((x) => !after.includes(`id="${x}"`));
  console.log(`   リンク切れ: ${broken.length ? broken.join(', ') : 'なし'}`);
  console.log(`   文字数: ${before.length} → ${after.length}`);

  if (!APPLY) { console.log('   （ドライラン）\n'); continue; }
  if (before === after) { console.log('   変更なし\n'); continue; }
  if (broken.length) { console.error('   リンク切れが出るため中止\n'); continue; }

  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: after }),
  });
  console.log(`   PATCH ${p.status} ${p.ok ? '✅ 反映' : '❌ ' + (await p.text()).slice(0, 120)}\n`);
}
