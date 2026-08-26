/**
 * audit-toc.mjs — 全記事の目次を一括チェック（読み取り専用）
 *
 * 重要: サイトは描画時に tocJs（blog/[id].astro）で目次リンクを
 * 「完全一致 → 前方一致 → 位置」の順に実在の見出しへ繋ぎ直している。
 * そのためCMS本文のhrefが #h-sN のままでも実害が無いことが多い。
 * このスクリプトは同じ解決ロジックを再現し、"読者から見た" 不具合だけを報告する。
 *
 * 検出:
 *   prose    … 目次の文言が見出しと違う（文章型の目次。要は目次として読めない）
 *   broken   … tocJsで解決しても飛び先が無いままの項目
 *   nolink   … 目次の項目にリンクが無い
 *   notoc    … H2が3つ以上あるのに目次が無い
 *
 * 使い方: node scripts/audit-toc.mjs [--json] [--slug <slug>]
 */
const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const argv = process.argv.slice(2);
const AS_JSON = argv.includes('--json');
const ONLY = argv.includes('--slug') ? argv[argv.indexOf('--slug') + 1] : null;

const EXCLUDE = ['この記事でわかること', '目次'];
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
const norm = (s) => strip(s).replace(/\s+/g, '').trim();

async function fetchAll() {
  const out = [];
  for (let offset = 0; ; offset += 100) {
    const url = `https://cocomarke.microcms.io/api/v1/blogs?limit=100&offset=${offset}&fields=id,title,content`;
    const res = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY } });
    if (!res.ok) throw new Error(`fetch ${res.status}: ${await res.text()}`);
    const { contents, totalCount } = await res.json();
    out.push(...contents);
    if (out.length >= totalCount || !contents.length) return out;
  }
}

function audit(article) {
  const c = article.content ?? '';
  const issues = [];

  // 目次＝アンカーを含む最初の ol/ul
  let toc = null, tocStart = -1;
  for (const m of c.matchAll(/<(ol|ul)>[\s\S]*?<\/\1>/g)) {
    if (m[0].includes('href="#')) { toc = m[0]; tocStart = m.index; break; }
  }

  // 見出し候補（tocJsと同じ: h2/h3/h4、目次内は除く、わかること/目次は除外）
  const cands = [...c.matchAll(/<(h[234]) id="([^"]+)">([\s\S]*?)<\/\1>/g)]
    .filter((m) => !(tocStart >= 0 && m.index > tocStart && m.index < tocStart + toc.length))
    .map((m) => ({ tag: m[1], id: m[2], text: norm(m[3]), used: false }))
    .filter((h) => !EXCLUDE.includes(h.text));

  const h2count = cands.filter((h) => h.tag === 'h2').length;

  if (!toc) {
    if (h2count >= 3) issues.push({ type: 'notoc', detail: `H2が${h2count}個あるが目次なし` });
    return { ...article, issues };
  }

  const lis = [...toc.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => m[1]);
  const nolink = lis.filter((li) => !li.includes('href="#')).length;
  if (nolink) issues.push({ type: 'nolink', detail: `${nolink}項目がリンクなし` });

  // tocJs の解決ロジックを再現
  const links = [...toc.matchAll(/<a href="#([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)]
    .map((m) => ({ href: m[1], text: norm(m[2]) }));
  let ptr = 0;
  const broken = [], prose = [];
  for (const link of links) {
    let target = null, ti = -1;
    for (let k = 0; k < cands.length; k++) {
      if (!cands[k].used && cands[k].text === link.text) { target = cands[k]; ti = k; break; }
    }
    if (!target && link.text.length >= 6) {
      for (let k = 0; k < cands.length; k++) {
        const ct = cands[k].text;
        if (!cands[k].used && (ct.startsWith(link.text) || link.text.startsWith(ct))) {
          target = cands[k]; ti = k; break;
        }
      }
    }
    if (!target) {
      for (let k = ptr; k < cands.length; k++) {
        if (!cands[k].used && cands[k].tag === 'h2') { target = cands[k]; ti = k; break; }
      }
    }
    if (!target) { broken.push(link.text.slice(0, 24) || link.href); continue; }
    target.used = true;
    ptr = ti + 1;
    // 見出しと文言が違う＝目次として読めない（文章型）
    if (target.text !== link.text) prose.push({ toc: link.text, h2: target.text });
  }

  if (broken.length) issues.push({ type: 'broken', detail: broken.join(' / ') });
  if (prose.length) {
    issues.push({
      type: 'prose',
      detail: `${prose.length}項目`,
      samples: prose.slice(0, 3).map((p) => `「${p.toc.slice(0, 34)}…」→ 本来「${p.h2}」`),
    });
  }
  return { ...article, issues };
}

let articles = await fetchAll();
if (ONLY) articles = articles.filter((a) => a.id === ONLY);
const bad = articles.map(audit).filter((r) => r.issues.length);

if (AS_JSON) {
  console.log(JSON.stringify(bad.map(({ id, title, issues }) => ({ id, title, issues })), null, 2));
} else {
  console.log(`対象 ${articles.length}記事 / 要修正 ${bad.length}記事\n`);
  const byType = {};
  for (const r of bad) for (const i of r.issues) (byType[i.type] ??= []).push(r.id);
  console.log('種類別（重複あり）:');
  for (const [t, ids] of Object.entries(byType)) console.log(`  ${t.padEnd(7)} ${String(ids.length).padStart(3)}記事`);
  console.log();
  for (const r of bad) {
    console.log(`■ ${r.id}`);
    console.log(`  ${r.title.slice(0, 60)}`);
    for (const i of r.issues) {
      console.log(`  [${i.type}] ${i.detail}`);
      for (const s of i.samples ?? []) console.log(`      ${s}`);
    }
    console.log();
  }
}
