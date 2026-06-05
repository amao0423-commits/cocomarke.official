#!/usr/bin/env node
// メンション記事リライト: 導入文修正 + Pexels画像 + 💡⚠️🌙blockquote + バックリンク強化

const KEY           = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const DOMAIN        = 'cocomarke';
const ID            = 'instagram-mention-how-to';
const PEXELS_KEY    = process.env.PEXELS_API_KEY;

async function searchPexels(query) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
    headers: { Authorization: PEXELS_KEY },
  });
  const d = await r.json();
  return d.photos[0];
}

async function uploadToCMS(photo, fname) {
  const buf  = await (await fetch(photo.src.large)).arrayBuffer();
  const fd   = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/jpeg' }), fname);
  const r = await fetch(`https://${DOMAIN}.microcms-management.io/api/v1/media`, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': KEY },
    body: fd,
  });
  if (!r.ok) throw new Error(`Upload failed ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { url: data.url, credit: photo.photographer };
}

async function run() {
  // ── コンテンツ取得 ──────────────────────────────────────────────────────
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}?fields=content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  let { content } = await r.json();

  // ── Pexels 画像アップロード ────────────────────────────────────────────
  console.log('Pexels 検索中...');
  const [photo1, photo2] = await Promise.all([
    searchPexels('instagram smartphone social media app'),
    searchPexels('influencer content creator phone social'),
  ]);
  console.log(`Photo1: ${photo1.src.large} / ${photo1.photographer}`);
  console.log(`Photo2: ${photo2.src.large} / ${photo2.photographer}`);

  console.log('microCMS にアップロード中...');
  const [img1, img2] = await Promise.all([
    uploadToCMS(photo1, 'mention-guide-instagram-1.jpg'),
    uploadToCMS(photo2, 'mention-guide-instagram-2.jpg'),
  ]);
  console.log('Upload完了:', img1.url, img2.url);

  // ── 1. 空行削除 ────────────────────────────────────────────────────────
  content = content.replace(/<p><br><\/p>/g, '');
  content = content.replace(/<p> <\/p>/g, '');
  content = content.replace(/<p> <\/p>/g, '');

  // ── 2. 導入文修正（テンプレートゴミ → 正しいリード文） ────────────────────
  content = content.replace(
    '<p>インスタのメンションとはやり方・できない原因・通知の仕組みまで解説とは、Instagramやソーシャルメディアを活用して成果を出す手法のことです。本記事ではインスタのメンションとはやり方・できない原因・通知の仕組みまで解説の基本から実践的な活用法まで詳しく解説します。</p>',
    '<p>Instagramの「メンション」は、@（アットマーク）を使って特定のアカウントに言及し、そのユーザーに通知を届ける機能です。友人の紹介やビジネスでのコラボレーション、UGCの収集まで活用の幅は広く、Instagram運用の基本スキルといえます。本記事では、メンションの基本的な仕組みから具体的なやり方・できない原因・ビジネス活用法・注意すべきマナーまで、2026年最新情報を網羅的に解説します。</p>'
  );

  // ── 3. 💡 メンション機能のポイント blockquote（タグ付けの違いH3の前に挿入） ──
  content = content.replace(
    '<h3 id="h56eff8e3ab">インスタのメンションとタグ付けの違い</h3>',
    '<blockquote>' +
      '<p><strong>💡 メンション機能を活用するとできること</strong></p>' +
      '<ul>' +
        '<li>相手に確実に通知が届くため「見てほしい投稿」を直接伝えられる</li>' +
        '<li>ストーリーズでメンションされた投稿をリポストすることで口コミの連鎖が生まれる</li>' +
        '<li>企業アカウントへのUGCを把握・活用するための入口として機能する</li>' +
        '<li>インフルエンサー施策やコラボ企画で関係者への告知が一度に完了する</li>' +
      '</ul>' +
    '</blockquote>' +
    '<h3 id="h56eff8e3ab">インスタのメンションとタグ付けの違い</h3>'
  );

  // ── 4. 中段CTA → 🌙 ダークカード ────────────────────────────────────────
  content = content.replace(
    '<blockquote><p>COCOマーケでは無料相談を実施中です。お気軽にご連絡ください。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a></p></blockquote>',
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

  // ── 5. 下段CTA → 🌙 ダークカード ────────────────────────────────────────
  content = content.replace(
    '<blockquote><p>サービス資料を無料でダウンロードいただけます。</p><p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p></blockquote>',
    '<blockquote>' +
      '<p><strong>🌙</strong></p>' +
      '<p><small>インフルエンサーマーケティングに興味がありますか？</small></p>' +
      '<p><strong>COCOマーケでは無料相談を実施中です</strong></p>' +
      '<p>' +
        '<a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>' +
        '　　' +
        '<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a>' +
      '</p>' +
    '</blockquote>'
  );

  // ── 6. ⚠️ マナー注意事項 blockquote（Instagram公式引用の前に挿入） ──────────
  content = content.replace(
    '<blockquote><p>ポジティブ、包括的、かつ安全な環境を構築すること。',
    '<blockquote>' +
      '<p><strong>⚠️ 絶対にやってはいけないメンションの使い方</strong></p>' +
      '<ul>' +
        '<li>注目を集める目的だけで無関係な投稿に有名人・人気アカウントを大量メンション（スパム扱いされアカウント凍結のリスクあり）</li>' +
        '<li>批判・晒しを目的としたネガティブなメンション（コミュニティガイドライン違反・報告対象）</li>' +
        '<li>事前確認なしでプライベートな写真・個人情報をメンションで拡散する行為</li>' +
      '</ul>' +
    '</blockquote>' +
    '<blockquote><p>ポジティブ、包括的、かつ安全な環境を構築すること。'
  );

  // ── 7. インフルエンサー施策セクションに内部リンクを追加 ──────────────────
  content = content.replace(
    '単純なメンションは「紹介」、コラボ機能は「共同制作」と位置づけ、施策の目的に応じて使い分けることが成功の鍵です。</p>',
    '単純なメンションは「紹介」、コラボ機能は「共同制作」と位置づけ、施策の目的に応じて使い分けることが成功の鍵です。</p>' +
    '<p>関連記事：<a href="/blog/insta-influencer-marketing-guide" target="_blank" rel="noopener noreferrer">インフルエンサーマーケティングの完全ガイド｜施策の流れ・費用相場・選び方を解説</a></p>'
  );

  // ── 8. SVG → Pexels 写真に差し替え ──────────────────────────────────────
  content = content.replace(
    /<figure><img src="[^"]*svg-instagram-mention-how-to-1\.svg"[^>]*><\/figure>/,
    `<figure><img src="${img1.url}" alt="Instagramのメンション機能の使い方ガイド" width="800" height="534"><figcaption>Instagramメンション機能：基本から活用まで（Photo by ${img1.credit} / Pexels）</figcaption></figure>`
  );
  content = content.replace(
    /<figure><img src="[^"]*svg-instagram-mention-how-to-2\.svg"[^>]*><\/figure>/,
    `<figure><img src="${img2.url}" alt="Instagramビジネス活用・メンション戦略" width="800" height="534"><figcaption>メンション戦略でビジネスを加速する（Photo by ${img2.credit} / Pexels）</figcaption></figure>`
  );

  // ── チェック ──────────────────────────────────────────────────────────
  const checks = [
    ['導入文修正',              content.includes('@（アットマーク）を使って特定のアカウントに言及')],
    ['💡 メンションポイント',   content.includes('💡 メンション機能を活用するとできること')],
    ['⚠️ マナーblockquote',    content.includes('⚠️ 絶対にやってはいけない')],
    ['🌙 中段CTA',             content.includes('Instagram運用でお困りですか')],
    ['🌙 下段CTA',             content.includes('インフルエンサーマーケティングに興味')],
    ['Pexels画像1',            content.includes('mention-guide-instagram-1.jpg')],
    ['Pexels画像2',            content.includes('mention-guide-instagram-2.jpg')],
    ['インフルエンサー内部リンク', content.includes('insta-influencer-marketing-guide')],
    ['コラボ内部リンク',        content.includes('instagram-collab-post-guide-2025')],
    ['いいね制限内部リンク',    content.includes('instagram-like-limit-account-suspension')],
    ['SVG残存なし',             !content.includes('svg-instagram-mention-how-to')],
    ['空行なし',                !content.includes('<p><br></p>')],
  ];
  checks.forEach(([label, ok]) => console.log((ok ? '✅' : '❌') + ' ' + label));

  const textLen = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`\n文字数: ${textLen}字`);

  console.log('\nmicroCMS PATCH 中...');
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
}

run().catch(e => { console.error(e); process.exit(1); });
