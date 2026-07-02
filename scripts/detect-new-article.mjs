/**
 * detect-new-article.mjs
 * 毎朝実行し、「直近に公開された新着ブログ記事」を検出して Slack に通知する。
 * 通知を見た担当者が Claude Code に「<slug> をリライトして」と指示 → フル品質でリライト＋反映する運用。
 *   - リライト自体はこのスクリプトでは行わない（検出＋通知のみ）
 * Env: MICROCMS_API_KEY（必須）, SLACK_WEBHOOK_URL（任意・未設定なら標準出力のみ）
 */
const KEY = process.env.MICROCMS_API_KEY;
const SLACK = process.env.SLACK_WEBHOOK_URL;
const DOMAIN = 'cocomarke';
// 実行時刻から見て「これ以内に公開された記事＝本日の新着」とみなす分（朝9時投稿・9:30頃実行＋GHA遅延を吸収）
const WINDOW_MIN = 180;

async function main() {
  if (!KEY) { console.error('MICROCMS_API_KEY not set'); process.exit(1); }

  const res = await fetch(
    `https://${DOMAIN}.microcms.io/api/v1/blogs?limit=1&orders=-publishedAt&fields=id,title,publishedAt`,
    { headers: { 'X-MICROCMS-API-KEY': KEY } }
  );
  if (!res.ok) { console.error('microCMS fetch failed:', res.status); process.exit(1); }
  const j = await res.json();
  const a = j.contents?.[0];
  if (!a) { console.log('記事なし'); return; }

  const ageMin = (Date.now() - new Date(a.publishedAt).getTime()) / 60000;
  console.log(`最新記事: ${a.id} / publishedAt=${a.publishedAt} / 経過=${ageMin.toFixed(0)}分`);

  if (ageMin > WINDOW_MIN) {
    console.log(`本日の新着なし（${WINDOW_MIN}分以内の公開が見つからないためスキップ）`);
    return;
  }

  const url = `https://www.cocomarke.com/blog/${a.id}/`;
  const text = [
    '📝 *新着ブログ記事を検出しました（本日分）*',
    `*タイトル*：${a.title}`,
    `*スラッグ*：\`${a.id}\``,
    `*URL*：${url}`,
    '',
    '▶ リライトするには Claude Code で次のように指示してください：',
    `『\`${a.id}\` を前回と同じ流儀でリライトして』`,
    '（目次再構成／競合・UGCリンク削除＋独自文化／一次情報インライン化／内部リンク追加を自動適用し、そのまま反映します）',
  ].join('\n');

  if (SLACK) {
    const r = await fetch(SLACK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    console.log('Slack通知:', r.status, r.ok ? '✅' : '❌');
  } else {
    console.log('--- SLACK_WEBHOOK_URL 未設定のため通知内容を出力 ---');
    console.log(text);
  }
}

main().catch((e) => { console.error('Fatal:', e); process.exit(1); });
