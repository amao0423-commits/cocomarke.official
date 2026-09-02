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

// 入れ子のリストを含む目次を正しく切り出す。
// /<(ol|ul)>[\s\S]*?<\/\1>/ だと内側の </ul> で止まり、途中までしか
// 置換できずに末尾の項目が古いまま残ってしまう。開閉を数えて末尾を求める。
function findList(html, from = 0) {
  const open = /<(ol|ul)\b[^>]*>/g;
  open.lastIndex = from;
  const m = open.exec(html);
  if (!m) return null;
  const tag = m[1];
  const re = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'g');
  re.lastIndex = m.index;
  let depth = 0, t;
  while ((t = re.exec(html)) !== null) {
    depth += t[0][1] === '/' ? -1 : 1;
    if (depth === 0) {
      return { index: m.index, length: t.index + t[0].length - m.index,
               html: html.slice(m.index, t.index + t[0].length), tag };
    }
  }
  return null;
}
const text = (s) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// FAQ見出しの判定。「Q.」で始まらない質問もあるため、
// 直近のH2がFAQ系かどうかでも判断する（そちらのほうが取りこぼしが少ない）。
const isFaqQ = (t) => /^Q\s*\d*\s*[.．、:：]?/.test(t);
const isFaqH2 = (t) => /よくある質問|FAQ|Q\s*&\s*A|Q＆A/i.test(t);

function build(html) {
  // 目次＝アンカーを含む最初のリスト（入れ子を含めて丸ごと取る）
  let toc = null;
  for (let pos = 0; ; ) {
    const l = findList(html, pos);
    if (!l) break;
    if (l.html.includes('href="#')) { toc = { index: l.index, 0: l.html }; break; }
    pos = l.index + l.length;
  }
  // リンクが1つも無い目次（項目が太字テキストだけ等）もあるため、
  // 「目次」見出しの直後のリストも候補として拾う
  if (!toc) {
    // 「目　次」のように全角スペースが入る表記もあるため間の空白を許容する
    const h = html.match(/<h2[^>]*>[^<]{0,10}目\s*次[^<]{0,10}<\/h2>/);
    if (h) {
      const after = h.index + h[0].length;
      const l = findList(html, after);
      // 目次見出しの直後にリストがある場合のみ採用（離れていたら別物）
      if (l && html.slice(after, l.index).trim() === '') {
        toc = { index: l.index, 0: l.html };
      } else {
        // 目次見出しはあるがリストが無い場合は、その位置に新しく作る
        toc = { index: after, 0: '' };
      }
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
  let h2n = 0, h3n = 0, skipped = 0, inFaq = false;
  for (const h of heads) {
    if (h.lv === 'h2') { flush(); out.push(li(h)); h2n++; inFaq = isFaqH2(h.t); }
    else {
      if (NO_FAQ && (inFaq || isFaqQ(h.t))) { skipped++; continue; }
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
