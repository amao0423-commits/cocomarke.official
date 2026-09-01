/**
 * migrate-updated-date.mjs [--apply] [--only-clean]
 *
 * microCMS が自動更新する updatedAt の値を、CMSの「更新日」(updatedDate) へ写す。
 * 表示は updatedDate だけを見るようにしたので、これで日付が以後動かなくなる。
 *
 *  --only-clean : 直近の一括作業（2026-08-26以降）で updatedAt が動いた記事を除外し、
 *                 値が信用できる記事だけを移行する。
 *
 * すでに updatedDate が入っている記事はスキップする（上書きしない）。
 * 既定はドライラン。--apply を付けたときだけ更新する。
 */
const KEY = process.env.MICROCMS_API_KEY || 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const ONLY_CLEAN = args.includes('--only-clean');

// この日以降の updatedAt は、目次修正などの一括作業で動いた可能性がある
const DIRTY_FROM = '2026-08-26';

const jstDate = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10);

const arts = [];
for (let off = 0; ; off += 100) {
  const r = await fetch(
    `https://cocomarke.microcms.io/api/v1/blogs?limit=100&offset=${off}&fields=id,title,day,updatedAt,updatedDate`,
    { headers: { 'X-MICROCMS-API-KEY': KEY } });
  const { contents, totalCount } = await r.json();
  arts.push(...contents);
  if (arts.length >= totalCount || !contents.length) break;
}

let done = 0, skipped = 0, dirty = 0;
for (const a of arts) {
  if (a.updatedDate) { skipped++; continue; }
  const isDirty = jstDate(a.updatedAt) >= DIRTY_FROM;
  if (isDirty) {
    dirty++;
    if (ONLY_CLEAN) continue;
  }
  // 表示はJST基準。JSTの日付の0時を、そのままの日付として保存する
  const d = jstDate(a.updatedAt);
  const value = `${d}T00:00:00+09:00`;

  if (!APPLY) { done++; continue; }
  const p = await fetch(`https://cocomarke.microcms.io/api/v1/blogs/${a.id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ updatedDate: value }),
  });
  if (p.ok) done++;
  else console.error(`  ❌ ${a.id}: ${p.status} ${(await p.text()).slice(0, 90)}`);
}

console.log(`対象 ${arts.length}記事`);
console.log(`  ${APPLY ? '設定した' : '設定する'}記事      : ${done}件`);
console.log(`  すでに設定済み     : ${skipped}件`);
console.log(`  一括作業で動いた記事: ${dirty}件${ONLY_CLEAN ? '（今回は除外）' : '（現在値をそのまま移行）'}`);
if (!APPLY) console.log('\n（ドライラン。反映するには --apply）');
