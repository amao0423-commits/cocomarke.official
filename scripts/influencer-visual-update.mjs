#!/usr/bin/env node
/**
 * インフルエンサー記事 ビジュアル改善 + Pexels画像置換
 * - SVG画像 → Pexels写真2枚
 * - H2見出しに絵文字追加
 * - 💡/⚠️ 強調ブロック追加
 * - 標準フロー絵文字化
 * - 不要な空行（<p><br></p>）削除
 */

const KEY    = process.env.MICROCMS_API_KEY    ?? 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const DOMAIN = process.env.MICROCMS_DOMAIN     ?? 'cocomarke';
const PEXELS = process.env.PEXELS_API_KEY      ?? 'NmEpHgSEbtq6tK5wEd3OziJm101VLGpyeYqV5ZMxhIrMtScj9WNjcN5Z';
const ID     = 'insta-influencer-marketing-guide';

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchPexelsPhoto(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS } }
  );
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const d = await r.json();
  if (!d.photos?.length) throw new Error(`No results: ${query}`);
  return d.photos[0];
}

async function uploadPhoto(photo, suffix) {
  const imgUrl  = photo.src.large2x ?? photo.src.large;
  const ext     = (imgUrl.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const fname   = `pexels-photo-${photo.id}-influencer-${suffix}.${ext}`;
  const mime    = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const buf     = await (await fetch(imgUrl)).arrayBuffer();
  const fd      = new FormData();
  fd.append('file', new Blob([buf], { type: mime }), fname);
  const r = await fetch(`https://${DOMAIN}.microcms-management.io/api/v1/media`, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': KEY },
    body: fd,
  });
  if (!r.ok) throw new Error(`Upload failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { url: data.url, credit: photo.photographer };
}

function applyVisualUpdates(html, photo1, photo2) {
  let h = html;

  // ── 1. 不要な空行を削除 ────────────────────────────────────────
  h = h.replace(/<p><br><\/p>/g, '');
  // 空の <br> standalone も除去
  h = h.replace(/<p> <\/p>/g, '');

  // ── 2. SVG画像を Pexels 写真に置換 ────────────────────────────
  h = h.replace(
    /<figure><img src="[^"]*svg-insta-influencer-marketing-g-1\.svg"[^>]*><\/figure>/,
    `<figure style="text-align:center;"><img src="${photo1.url}" alt="Instagramインフルエンサーマーケティングのイメージ" loading="lazy"><figcaption>Photo by ${photo1.credit} / Pexels</figcaption></figure>`
  );
  h = h.replace(
    /<figure><img src="[^"]*svg-insta-influencer-marketing-g-2\.svg"[^>]*><\/figure>/,
    `<figure style="text-align:center;"><img src="${photo2.url}" alt="インフルエンサーとブランドのコラボレーション" loading="lazy"><figcaption>Photo by ${photo2.credit} / Pexels</figcaption></figure>`
  );

  // ── 3. H2見出しに絵文字を追加 ──────────────────────────────────
  const h2emojis = [
    ['Instagramインフルエンサーマーケティングとは</h2>', '📱 Instagramインフルエンサーマーケティングとは</h2>'],
    ['成功事例から学ぶインフルエンサーマーケティング施策</h2>', '🏆 成功事例から学ぶインフルエンサーマーケティング施策</h2>'],
    ['インフルエンサー施策の費用相場</h2>', '💰 インフルエンサー施策の費用相場</h2>'],
    ['インフルエンサーマーケティングで費用対効果を最大化する戦略</h2>', '🚀 インフルエンサーマーケティングで費用対効果を最大化する戦略</h2>'],
    ['インフルエンサーマーケティングのリスク管理と対策</h2>', '⚡ インフルエンサーマーケティングのリスク管理と対策</h2>'],
    ['インフルエンサーマーケティングの炎上対策</h2>', '🔥 インフルエンサーマーケティングの炎上対策</h2>'],
    ['インフルエンサーマーケティングのガイドライン設計</h2>', '📋 インフルエンサーマーケティングのガイドライン設計</h2>'],
    ['よくある質問（FAQ）</h2>', '❓ よくある質問（FAQ）</h2>'],
  ];
  h2emojis.forEach(([from, to]) => { h = h.replace(from, to); });

  // ── 4. H3見出しに絵文字を追加 ──────────────────────────────────
  const h3emojis = [
    ['インタラクティブ事例</h3>', '✨ インタラクティブ事例</h3>'],
    ['フォーマットハック事例</h3>', '🎯 フォーマットハック事例</h3>'],
    ['UGC・マイクロインフルエンサー事例</h3>', '📣 UGC・マイクロインフルエンサー事例</h3>'],
    ['費用計算方法</h3>', '🧮 費用計算方法</h3>'],
    ['フォロワー規模別の相場</h3>', '📊 フォロワー規模別の相場</h3>'],
    ['ステルスマーケティング対策</h3>', '⚠️ ステルスマーケティング対策</h3>'],
    ['ターゲット不一致リスク</h3>', '🎯 ターゲット不一致リスク</h3>'],
    ['必須ガイドライン項目</h3>', '✅ 必須ガイドライン項目</h3>'],
  ];
  h3emojis.forEach(([from, to]) => { h = h.replace(from, to); });

  // ── 5. 💡 ポイントブロックを追加（intro テーブル後） ────────────
  // 比較テーブルの直後（"2026年は特に..."段落の前）に挿入
  h = h.replace(
    '<p>2026年は特に、「信頼ベースの購買」が加速しているため、インフルエンサー施策の重要性はさらに高まっています。',
    '<blockquote><p><strong>💡 インフルエンサーマーケティングが選ばれる理由</strong></p><p>消費者調査では「知人・インフルエンサーの口コミ」が購買決定に影響する割合が、企業広告の<strong>約2倍</strong>とされています。特にInstagramはビジュアルで商品の魅力を伝えやすく、「発見→共感→購買」の流れを自然に設計できるプラットフォームです。</p></blockquote><p>2026年は特に、「信頼ベースの購買」が加速しているため、インフルエンサー施策の重要性はさらに高まっています。'
  );

  // ── 6. 💡 ポイントブロックを追加（費用対効果セクション末尾） ─────
  h = h.replace(
    '<h2 id="hdb9bfaa780">⚡ インフルエンサーマーケティングのリスク管理と対策</h2>',
    '<blockquote><p><strong>💡 費用対効果を最大化する黄金法則</strong></p><ul><li><strong>メガ1人よりマイクロ10人：</strong>リーチは分散するが信頼度・エンゲージメントが高く、費用対効果が安定する</li><li><strong>単発より3ヶ月以上の継続契約：</strong>「何度も見る＝信頼できる」という認知が積み上がる</li><li><strong>投稿素材を二次利用：</strong>Meta広告に転用するとCVRが通常広告の1.2〜2倍になる事例も</li></ul></blockquote><h2 id="hdb9bfaa780">⚡ インフルエンサーマーケティングのリスク管理と対策</h2>'
  );

  // ── 7. ⚠️ 警告ブロックをステルスマーケティング後に追加 ────────
  h = h.replace(
    'そのため、「広告であることを明確に表示する」ことが必須です。',
    'そのため、「広告であることを明確に表示する」ことが必須です。<blockquote><p><strong>⚠️ 違反リスクに注意</strong></p><p>ステルスマーケティング規制に違反した場合、企業・インフルエンサー双方に措置命令が下される可能性があります。2023年10月の規制施行後、すでに複数の企業が行政指導を受けています。<strong>#PRまたは#広告の明示は投稿冒頭・目立つ位置に必ず記載</strong>してください。</p></blockquote>'
  );

  // ── 8. 標準フロー を絵文字リストに改善 ─────────────────────────
  h = h.replace(
    '<p>標準フロー</p>\n<ol><li>インフルエンサーが投稿案作成</li><li>企業へ事前提出（テキスト・動画）</li><li>マーケ＋法務がチェック</li><li>修正指示</li><li>最終承認</li><li>投稿</li></ol>',
    '<p><strong>📋 標準承認フロー</strong></p><ol><li>📝 インフルエンサーが投稿案を作成</li><li>📤 企業へ事前提出（テキスト・画像・動画）</li><li>✅ マーケ担当＋法務がチェック</li><li>🔧 修正指示（必要に応じて）</li><li>✔️ 最終承認</li><li>📣 投稿公開</li></ol>'
  );
  // \n バリアントにも対応（改行有無の違い）
  h = h.replace(
    '<p>標準フロー</p><ol><li>インフルエンサーが投稿案作成</li><li>企業へ事前提出（テキスト・動画）</li><li>マーケ＋法務がチェック</li><li>修正指示</li><li>最終承認</li><li>投稿</li></ol>',
    '<p><strong>📋 標準承認フロー</strong></p><ol><li>📝 インフルエンサーが投稿案を作成</li><li>📤 企業へ事前提出（テキスト・画像・動画）</li><li>✅ マーケ担当＋法務がチェック</li><li>🔧 修正指示（必要に応じて）</li><li>✔️ 最終承認</li><li>📣 投稿公開</li></ol>'
  );

  // ── 9. NG→OK表をよりわかりやすくする（✅/❌ アイコン追加） ────
  // 禁止表現テーブルのヘッダーに絵文字追加
  h = h.replace(
    '<p><strong>NG表現</strong></p></td><td colspan="1" rowspan="1"><p><strong>OK表現</strong></p>',
    '<p><strong>❌ NG表現</strong></p></td><td colspan="1" rowspan="1"><p><strong>✅ OK表現</strong></p>'
  );

  // ── 10. まとめ前に 💡 活用ポイントまとめブロックを追加 ──────────
  // FAQの前にある「SNSマーケティング完全ガイド」リンクの後に挿入
  h = h.replace(
    '<h2 id="h4b68d6d3c5">❓ よくある質問（FAQ）</h2>',
    '<blockquote><p><strong>💡 インフルエンサーマーケティング 実践チェックリスト</strong></p><ul><li>✅ インフルエンサーのフォロワー属性（年齢・性別・地域）を確認した</li><li>✅ エンゲージメント率3%以上を目安に選定した</li><li>✅ ステルスマーケティング対策（#PR明示）をガイドラインに明記した</li><li>✅ 単発ではなく3ヶ月以上の継続契約を設計した</li><li>✅ 投稿素材のMeta広告二次利用について契約で確認した</li><li>✅ 投稿前のチェック・承認フローを整備した</li></ul></blockquote><h2 id="h4b68d6d3c5">❓ よくある質問（FAQ）</h2>'
  );

  return h;
}

async function main() {
  console.log('=== Pexels画像を取得・アップロード中...');
  const rawPhoto1 = await fetchPexelsPhoto('instagram influencer content creator social media lifestyle');
  await sleep(600);
  const rawPhoto2 = await fetchPexelsPhoto('marketing strategy business collaboration team');

  const photo1 = await uploadPhoto(rawPhoto1, '1');
  await sleep(600);
  const photo2 = await uploadPhoto(rawPhoto2, '2');
  console.log('✅ 画像アップロード完了');
  console.log('  img1:', photo1.url);
  console.log('  img2:', photo2.url);

  console.log('\n=== 記事HTML取得中...');
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}?fields=content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  const { content } = await r.json();

  console.log('=== ビジュアル改善適用中...');
  const updated = applyVisualUpdates(content, photo1, photo2);

  // 変更確認
  const removedBr   = (content.match(/<p><br><\/p>/g) || []).length;
  const svgsReplaced = (updated.match(/svg-insta-influencer/g) || []).length === 0;
  const h2emoji     = updated.includes('📱 Instagram');
  const tipBlock    = updated.includes('💡 インフルエンサーマーケティングが選ばれる理由');
  const warnBlock   = updated.includes('⚠️ 違反リスクに注意');
  const flowEmoji   = updated.includes('📝 インフルエンサーが投稿案を作成');
  const checklist   = updated.includes('✅ インフルエンサーのフォロワー属性');
  console.log(`  空行削除: ${removedBr}件`);
  console.log(`  SVG→Pexels: ${svgsReplaced ? '✅' : '❌'}`);
  console.log(`  H2絵文字: ${h2emoji ? '✅' : '❌'}`);
  console.log(`  💡ポイントブロック: ${tipBlock ? '✅' : '❌'}`);
  console.log(`  ⚠️警告ブロック: ${warnBlock ? '✅' : '❌'}`);
  console.log(`  フロー絵文字化: ${flowEmoji ? '✅' : '❌'}`);
  console.log(`  実践チェックリスト: ${checklist ? '✅' : '❌'}`);

  const textLen = updated.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`  文字数: ${textLen}字`);

  console.log('\n=== microCMS PATCH中...');
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: updated }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
}

main().catch(e => { console.error(e); process.exit(1); });
