#!/usr/bin/env node
// ガイドラインテンプレ section: pre/code → styled blockquotes/tables
// + 中段CTA → 🌙 dark card

const KEY    = 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const DOMAIN = 'cocomarke';
const ID     = 'insta-influencer-marketing-guide';

async function run() {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}?fields=content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  let { content } = await r.json();

  // ── 1. 中段CTA → 🌙 ダークカード ────────────────────────────────────
  // 「COCOマーケでは無料相談を実施中です。専任マネージャーが...」 の blockquote を置換
  content = content.replace(
    /<blockquote><p>COCOマーケでは無料相談を実施中です。専任マネージャーが最適なプランをご提案します。<\/p>[\s\S]*?<\/blockquote>/,
    '<blockquote>' +
      '<p><strong>🌙</strong></p>' +
      '<p><small>Instagram運用でお困りですか？</small></p>' +
      '<p><strong>COCOマーケでは無料相談を実施中です</strong></p>' +
      '<p>' +
        '<a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>' +
        '　　' +
        '<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a>' +
      '</p>' +
    '</blockquote>'
  );

  // ── 2. 広告表記 h5 + pre/code → 💡 blockquote ────────────────────────
  content = content.replace(
    /<h5[^>]*>■ 広告表記について<\/h5>[\s\S]*?<\/code><\/pre>/,
    '<blockquote>' +
      '<p><strong>💡 広告表記について（必須）</strong></p>' +
      '<p>本案件は広告に該当するため、投稿内に必ず以下を記載してください。</p>' +
      '<ul>' +
        '<li><span style="color:#005bea"><strong>#PR</strong></span> または <span style="color:#005bea"><strong>#広告</strong></span> を投稿内に明記</li>' +
        '<li>記載位置は投稿文の<strong>冒頭または目立つ位置</strong>（文末への小さな記載はNG）</li>' +
        '<li>ストーリーズ投稿の場合も同様に明示してください</li>' +
      '</ul>' +
    '</blockquote>'
  );

  // ── 3. 表現ルール h5 + pre/code → 🚫 blockquote ──────────────────────
  content = content.replace(
    /<h5[^>]*>■ 表現ルール<\/h5>[\s\S]*?<\/code><\/pre>/,
    '<blockquote>' +
      '<p><strong>🚫 NG表現（禁止）</strong></p>' +
      '<ul>' +
        '<li><span style="color:#dc2626"><strong>効果を断定する表現</strong></span>　例：「絶対に痩せる」「必ず効果が出る」</li>' +
        '<li><span style="color:#dc2626"><strong>医療的・治療的な表現</strong></span>　例：「治る」「改善する」</li>' +
        '<li><span style="color:#dc2626"><strong>誇張表現</strong></span>　例：「最強」「No.1（根拠なし）」「たった3日で変わる」</li>' +
      '</ul>' +
    '</blockquote>'
  );

  // ── 4. 投稿内容の方向性 h5 + pre/code → 💡 blockquote + ステップ表 ──
  content = content.replace(
    /<h5[^>]*>■ 投稿内容の方向性<\/h5>[\s\S]*?<\/code><\/pre>/,
    '<blockquote>' +
      '<p><strong>💡 投稿内容の方向性（推奨）</strong></p>' +
      '<ul>' +
        '<li>実際の使用シーンを自然に含める</li>' +
        '<li>日常に溶け込んだ親しみやすい紹介</li>' +
        '<li>フォロワーが真似しやすい構成を意識する</li>' +
      '</ul>' +
    '</blockquote>' +
    '<table><tbody>' +
      '<tr><th>① 導入</th><th>② 使用シーン</th><th>③ 感想</th><th>④ まとめ</th></tr>' +
      '<tr><td>悩み・きっかけ</td><td>実際の使い方</td><td>体験ベースの感想</td><td>締め・行動喚起</td></tr>' +
    '</tbody></table>'
  );

  // ── 5. ブランドトーン h5 + pre/code → table ───────────────────────────
  content = content.replace(
    /<h5[^>]*>■ ブランドトーン<\/h5>[\s\S]*?<\/code><\/pre>/,
    '<table><tbody>' +
      '<tr><th colspan="2">🎨 ブランドトーン</th></tr>' +
      '<tr><td><strong>推奨</strong></td><td>上品・落ち着いた・信頼感のある表現</td></tr>' +
      '<tr><td><strong>絵文字</strong></td><td>過度な使用は控えてください</td></tr>' +
      '<tr><td><strong>NG</strong></td><td><span style="color:#dc2626">過度にカジュアル・攻撃的・誇張的な表現</span></td></tr>' +
    '</tbody></table>'
  );

  // ── 6. ② 投稿前提出ルール (h5×4 + pre/code×4) → 1つの table ─────────
  content = content.replace(
    /(<h4[^>]*>② 投稿前提出ルール<\/h4>)<p>投稿前に必ず以下のフローを実施してください。<\/p>[\s\S]*?<\/code><\/pre>\n?(<h5[^>]*>③)/,
    '$1' +
    '<p>投稿前に必ず以下のフローを実施してください。</p>' +
    '<table><tbody>' +
      '<tr><th>項目</th><th>内容</th></tr>' +
      '<tr><td><strong>提出期限</strong></td><td>投稿予定日の<span style="color:#005bea"><strong>3営業日前</strong></span>までに提出</td></tr>' +
      '<tr><td><strong>提出内容</strong></td><td>投稿テキスト（キャプション）／画像または動画データ／ハッシュタグ案</td></tr>' +
      '<tr><td><strong>修正対応</strong></td><td>修正依頼があった場合は必ず対応し、修正後は再提出をお願いします</td></tr>' +
      '<tr><td><strong>投稿可否</strong></td><td><span style="color:#005bea"><strong>最終承認後のみ</strong></span>投稿可能（承認前の投稿は不可）</td></tr>' +
    '</tbody></table>' +
    '$2'
  );

  // ── 7. ③ NG事項 h5 + pre/code → 🚫 blockquote ───────────────────────
  content = content.replace(
    /<h5[^>]*>③ NG事項<\/h5>[\s\S]*?<\/code><\/pre>/,
    '<blockquote>' +
      '<p><strong>🚫 ③ NG事項（禁止事項）</strong></p>' +
      '<ul>' +
        '<li>他社・競合商品の比較や批判</li>' +
        '<li>誤解を招くビフォーアフター表現</li>' +
        '<li>不適切な言動（差別・暴力・誹謗中傷）</li>' +
        '<li>公序良俗に反する内容</li>' +
      '</ul>' +
    '</blockquote>'
  );

  // ── 8. ④ 法規制 h4 + pre/code → ⚠️ blockquote ───────────────────────
  content = content.replace(
    /(<h4[^>]*>④ 法規制に関する注意<\/h4>)\n?<pre><code>[\s\S]*?<\/code><\/pre>/,
    '$1' +
    '<blockquote>' +
      '<p><strong>⚠️ 法規制の遵守は企業側の責任です</strong></p>' +
      '<ul>' +
        '<li><strong>薬機法</strong>（美容・健康系商材）— 効果効能の断定表現は厳禁</li>' +
        '<li><strong>景品表示法</strong>（誇大広告）— 「No.1」「最安」は根拠が必要</li>' +
        '<li><strong>ステルスマーケティング規制</strong> — <span style="color:#005bea"><strong>#PRまたは#広告</strong></span>の明示が法律上必須</li>' +
      '</ul>' +
      '<p>※違反した場合、投稿修正または削除を依頼する場合があります。</p>' +
    '</blockquote>'
  );

  // ── 9. ⑤ 投稿後の対応 h4 + pre/code → 💡 blockquote ─────────────────
  content = content.replace(
    /(<h4[^>]*>⑤ 投稿後の対応<\/h4>)\n?<pre><code>[\s\S]*?<\/code><\/pre>/,
    '$1' +
    '<blockquote>' +
      '<p><strong>💡 投稿後のルール</strong></p>' +
      '<ul>' +
        '<li>投稿後の大幅な修正は原則不可</li>' +
        '<li>コメント欄での質問には可能な範囲でご対応ください</li>' +
        '<li>炎上・トラブルが発生した場合は<strong>速やかにご連絡ください</strong></li>' +
      '</ul>' +
    '</blockquote>'
  );

  // ── 変更確認 ──────────────────────────────────────────────────────────
  const checks = [
    ['🌙 ダークCTA',           content.includes('🌙')],
    ['💡 広告表記blockquote',  content.includes('広告表記について（必須）')],
    ['🚫 NG表現blockquote',    content.includes('🚫 NG表現（禁止）')],
    ['💡 投稿方向性blockquote',content.includes('投稿内容の方向性（推奨）')],
    ['ステップ table',          content.includes('① 導入</th>')],
    ['🎨 ブランドトーン table', content.includes('🎨 ブランドトーン')],
    ['② 提出ルール table',     content.includes('3営業日前')],
    ['🚫 NG事項blockquote',    content.includes('🚫 ③ NG事項')],
    ['⚠️ 法規制blockquote',   content.includes('法規制の遵守は企業側の責任')],
    ['💡 投稿後blockquote',    content.includes('投稿後のルール')],
    ['pre/code残存確認',        !content.includes('<pre><code>')],
  ];
  checks.forEach(([label, ok]) => console.log((ok ? '✅' : '❌') + ' ' + label));

  const textLen = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`文字数: ${textLen}字`);

  console.log('\nmicroCMS PATCH中...');
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
}

run().catch(e => { console.error(e); process.exit(1); });
