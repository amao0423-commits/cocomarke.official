/**
 * fix-toc-h3.mjs <slug...> [--apply] [--no-faq]
 *
 * 記事の目次を本文のH2＋H3から入れ子で作り直す。
 * - H2を第1階層、その配下のH3を第2階層に入れる
 * - 目次の文言を本文の見出しと完全一致させる（リライトで見出しが変わったズレを解消）
 * - リンク先は実在する見出しidに繋ぎ直す
 * - 「目次」「この記事でわかること」自体は含めない
 * - --no-faq: 「Q1.」のようなFAQ形式のH3を目次から除く
 *
 * 既定はドライラン。--apply を付けたときだけ microCMS に反映する。
 */
const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const NO_FAQ = args.includes('--no-faq');
const slugs = args.filter((a) => !a.startsWith('--'));

if (!slugs.length) {
  console.error('usage: node scripts/fix-toc-h3.mjs <slug...> [--apply] [--no-faq]');
  process.exit(1);
}

const EXCLUDE = ['この記事でわかること', '目次'];
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const isFaqQ = (t) => /^Q\s*\d*\s*[.．、:：]?/.test(t);

function build(html) {
  // 目次＝アンカーを含む最初のリスト
  let toc = null;
  for (const m of html.matchAll(/<(ol|ul)>[\s\S]*?<\/\1>/g)) {
    if (m[0].includes('href="#')) { toc = m; break; }
  }
  // リンクが1つも無い目次（項目が太字テキストだけ等）もあるため、
  // 「目次」見出しの直後のリストも候補として拾う
  if (!toc) {
    const h = html.match(/<h2[^>]*>[^<]{0,10}目次[^<]{0,10}<\/h2>/);
    if (h) {
      const m = html.slice(h.index + h[0].length).match(/^\s*<(ol|ul)>[\s\S]*?<\/\1>/);
      if (m) { toc = m; toc.index = h.index + h[0].length + m.index; }
    }
  }
  if (!toc) return { err: '目次リストが見つかりません' };

  // 目次より後ろの見出しだけを対象にする（目次自身の中身を拾わないため）
  const after = html.slice(toc.index + toc[0].length);
  const heads = [...after.matchAll(/<(h[23]) id="([^"]+)">([\s\S]*?)<\/\1>/g)]
    .map((m) => ({ lv: m[1], id: m[2], t: text(m[3]) }))
    .filter((h) => !EXCLUDE.includes(h.t));
  if (!heads.length) return { err: '見出しが見つかりません' };

  const li = (h) => `<li><a href="#${h.id}" target="_self">${h.t}</a>`;
  const out = [];
  let sub = [];
  const flush = () => {
    if (!out.length) return;
    out[out.length - 1] += (sub.length ? `<ul>${sub.join('')}</ul>` : '') + '</li>';
    sub = [];
  };
  let h2n = 0, h3n = 0, skipped = 0;
  for (const h of heads) {
    if (h.lv === 'h2') { flush(); out.push(li(h)); h2n++; }
    else {
      if (NO_FAQ && isFaqQ(h.t)) { skipped++; continue; }
      if (!out.length) continue;              // H2より前のH3は入れ子にできないので除外
      sub.push(li(h) + '</li>'); h3n++;
    }
  }
  flush();

  const next = html.slice(0, toc.index) + `<ol>${out.join('')}</ol>` + html.slice(toc.index + toc[0].length);
  return { html: next, h2n, h3n, skipped };
}

for (const slug of slugs) {
  const res = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}?fields=id,title,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!res.ok) { console.error(`${slug}: fetch ${res.status}`); continue; }
  const a = await res.json();
  const before = a.content ?? '';
  const r = build(before);

  console.log(`■ ${a.title.slice(0, 46)}`);
  console.log(`   ${slug}`);
  if (r.err) { console.log(`   ${r.err}\n`); continue; }

  const broken = [...new Set([...r.html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]))]
    .filter((x) => !r.html.includes(`id="${x}"`));
  console.log(`   目次: H2 ${r.h2n}項目 / H3 ${r.h3n}項目${r.skipped ? `（FAQ形式 ${r.skipped}件を除外）` : ''}`);
  console.log(`   リンク切れ: ${broken.length ? broken.join(', ') : 'なし'}`);
  console.log(`   文字数: ${before.length} → ${r.html.length}`);

  if (!APPLY) { console.log('   （ドライラン）\n'); continue; }
  if (broken.length) { console.error('   リンク切れが出るため中止\n'); continue; }

  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${slug}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: r.html }),
  });
  console.log(`   PATCH ${p.status} ${p.ok ? '✅ 反映' : '❌ ' + (await p.text()).slice(0, 120)}\n`);
}
