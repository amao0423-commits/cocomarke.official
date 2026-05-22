#!/usr/bin/env node
// Patch PPC and Influencer articles:
//  1. Remove COCOマーケ-offers-PPC language from PPC article
//  2. Add external backlinks (Google Ads, Yahoo! Ads, skillshop)
//  3. Add ≥3 internal backlinks per article
//  4. Fix copy-paste FAQ answers in influencer article

const KEY    = process.env.MICROCMS_API_KEY ?? 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const DOMAIN = 'cocomarke';

async function get(id) {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${id}?fields=title,content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  if (!r.ok) throw new Error(`GET ${id}: ${r.status}`);
  return r.json();
}

async function patch(id, content) {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PATCH ${id}: ${r.status} ${t}`);
  }
  return r.status;
}

// ── PPC article ────────────────────────────────────────────────────────────────
function updatePpc(html) {
  let h = html;

  // 1. External link: Google広告 (first occurrence in body)
  h = h.replace(
    'Googleが提供する「Google広告」で、日本国内の検索エンジンシェアの約75%',
    'Googleが提供する「<a href="https://ads.google.com/intl/ja_jp/home/" target="_blank" rel="noopener noreferrer">Google広告</a>」で、日本国内の検索エンジンシェアの約75%'
  );

  // 2. External link: Yahoo!広告
  h = h.replace(
    'Yahoo!広告も国内では多くのユーザーにリーチできるため',
    '<a href="https://marketing.yahoo.co.jp/" target="_blank" rel="noopener noreferrer">Yahoo!広告</a>も国内では多くのユーザーにリーチできるため'
  );

  // 3. External link: Google Skillshop
  h = h.replace(
    'Google公式の「Google広告認定資格（スキルショップ）」の学習も有効です。',
    '<a href="https://skillshop.withgoogle.com/" target="_blank" rel="noopener noreferrer">Google公式の「Google広告認定資格（スキルショップ）」</a>の学習も有効です。'
  );

  // 4. Internal link: after listing/display ad table – mention SNS ads articles
  h = h.replace(
    '購買意欲の高いユーザーに直接アプローチできるリスティング広告は、初心者が最初に取り組む広告手法として最適です。「今すぐ相談・購入したい」ユーザーが能動的に検索しているタイミングに広告を表示できるため、成果につながりやすい傾向があります。</p>',
    '購買意欲の高いユーザーに直接アプローチできるリスティング広告は、初心者が最初に取り組む広告手法として最適です。「今すぐ相談・購入したい」ユーザーが能動的に検索しているタイミングに広告を表示できるため、成果につながりやすい傾向があります。SNS広告も組み合わせて活用したい場合は、<a href="https://www.cocomarke.com/blog/instagram-ads-guide-cost-how-to-run-beginners/">インスタ広告の出し方完全ガイド</a>や<a href="https://www.cocomarke.com/blog/facebook-ads-guide-how-to-start/">Facebook広告とは？始める前に知っておきたい全てのことを解説</a>もあわせてご覧ください。</p>'
  );

  // 5. Internal link: Q4 (PPC vs SEO) – add SEO article reference
  h = h.replace(
    '短期的な集客にはPPC広告、長期的なブランド構築・集客基盤にはSEOを組み合わせて活用するのが効果的です。</p>',
    '短期的な集客にはPPC広告、長期的なブランド構築・集客基盤にはSEOを組み合わせて活用するのが効果的です。SEO対策については<a href="https://www.cocomarke.com/blog/what-is-seo-search-engine-optimization/">SEO対策とは？初心者にもわかりやすく意味・やり方・おすすめツールまで解説</a>で詳しく解説しています。</p>'
  );

  // 6. Internal link: add SNS marketing guide in まとめ
  h = h.replace(
    'PPC広告は少額から始められ即効性のあるデジタル広告手法ですが、成果を出すためには正しい準備と継続的な改善が欠かせません。本記事の要点を整理します。</p>',
    'PPC広告は少額から始められ即効性のあるデジタル広告手法ですが、成果を出すためには正しい準備と継続的な改善が欠かせません。PPC広告と並行してSNSマーケティングを強化したい場合は<a href="https://www.cocomarke.com/blog/how-to-use-sns-for-business-success/">SNSマーケティング完全ガイド｜企業成功事例と戦略</a>もご参考ください。本記事の要点を整理します。</p>'
  );

  // 7. Fix 💡 blockquote – remove "COCOマーケでは広告設計からLP改善まで一括でサポート" (PPC service claim)
  h = h.replace(
    '<blockquote><p><strong>💡 ポイント</strong></p><p>PPC広告で成果を出すには、広告だけでなくLP（ランディングページ）の改善がセットで必要です。COCOマーケでは広告設計からLP改善まで一括でサポートしています。まずはお気軽にご相談ください。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a></p></blockquote>',
    '<blockquote><p><strong>💡 ポイント</strong></p><p>PPC広告で成果を出すには、広告だけでなくLP（ランディングページ）の改善がセットで必要です。「クリック率を上げる広告文の改善」と「コンバージョン率を高めるLP改善」をセットで進めることで、費用対効果が大きく向上します。</p></blockquote>'
  );

  // 8. Fix 自社運用vs代理店 – remove "COCOマーケでは、PPC広告を含むデジタルマーケティングの運用支援" claim
  h = h.replace(
    'COCOマーケでは、PPC広告を含むデジタルマーケティングの運用支援・コンサルティングを行っています。初回相談は無料ですので、まずはお気軽にご相談ください。',
    'PPC広告と並行してInstagram・SNSでのオーガニック集客も強化したい場合は、Instagram専門の運用支援を行うCOCOマーケへご相談ください。初回相談は無料です。'
  );

  // 9. Fix まとめ CTA – remove PPC service implication
  h = h.replace(
    'PPC広告の運用を本格的に検討されている方、「自社での運用が難しい」と感じている方は、ぜひCOCOマーケへご相談ください。初回相談は無料です。',
    'PPC広告に加えてInstagram・SNSでの集客基盤も構築したい方は、ぜひCOCOマーケへご相談ください。Instagram専門の運用支援・コンサルティングを提供しています。初回相談は無料です。'
  );

  // 10. Fix CTA blockquote about "資料" that implies PPC service
  h = h.replace(
    '<blockquote><p>サービス資料を無料でダウンロードいただけます。PPC広告を含むデジタル広告運用の概要をまとめています。</p><p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p></blockquote>',
    '<blockquote><p>COCOマーケのサービス資料を無料でダウンロードいただけます。InstagramをはじめとしたSNS運用支援の概要をまとめています。</p><p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p></blockquote>'
  );

  return h;
}

// ── Influencer article ─────────────────────────────────────────────────────────
function updateInfluencer(html) {
  let h = html;

  // 1. External link: Meta for Business after the intro comparison table
  h = h.replace(
    '2026年は特に、「信頼ベースの購買」が加速しているため、インフルエンサー施策の重要性はさらに高まっています。</p>',
    '2026年は特に、「信頼ベースの購買」が加速しているため、インフルエンサー施策の重要性はさらに高まっています。<a href="https://business.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram Business（Meta公式）</a>でもインフルエンサーとのブランドコンテンツ連携機能が強化されており、企業側の活用ハードルが下がっています。</p>'
  );

  // 2. Internal link 1: after 資生堂 case in UGC section, add Reels article
  h = h.replace(
    'ユーザーにとって「よく見る＝信頼できる」という状態を作っています。</p>',
    'ユーザーにとって「よく見る＝信頼できる」という状態を作っています。インフルエンサー投稿をリール形式で展開するとさらに拡散効果が高まります。リールの具体的な活用法は<a href="https://www.cocomarke.com/blog/instagram-reels-tips-to-go-viral-2025/">インスタリールがバズる方法7選｜初心者でもできるテク公開</a>でご確認ください。</p>'
  );

  // 3. Internal link 2: after cost table, add agency article
  h = h.replace(
    'この構造により、認知 → 信頼 → 購買の流れを自然に作ることができます。</p>',
    'この構造により、認知 → 信頼 → 購買の流れを自然に作ることができます。インフルエンサー施策と合わせてInstagram運用代行も検討されている場合は<a href="https://www.cocomarke.com/blog/instagram-management-agency-comparison/">Instagram運用代行おすすめ9社を徹底比較【料金・実績・得意領域を完全ガイド】</a>もご参考ください。</p>'
  );

  // 4. Internal link 3: in ROI section after existing pros-cons link, add marketing strategy article
  h = h.replace(
    '関連記事：<a href="/blog/instagram-pros-cons-marketing-managers" target="_blank" rel="noopener noreferrer"><span style="color: #0062e0"><u>【完全解説】インスタ運用のメリット・デメリット10選｜企業がやるべき理由と注意点</u></span></a></p>',
    '関連記事：<a href="https://www.cocomarke.com/blog/instagram-pros-cons-marketing-managers/">【完全解説】インスタ運用のメリット・デメリット10選｜企業がやるべき理由と注意点</a>　／　<a href="https://www.cocomarke.com/blog/instagram-marketing-strategies-pros-cons/">インスタマーケティングの基本とは？具体的な活用手法やメリット・デメリットを紹介</a></p>'
  );

  // 5. Fix FAQ Q3 – generic answer → proper answer
  h = h.replace(
    '<h3 id="h949ea6590c">Q3. Instagramインフルエンサーマーケティングとは何ですか？</h3><p>Instagramインフルエンサーマーケティングとはについては、本記事本文で詳しく解説しています。要点は「具体的な目標設定」「データをもとにした継続改善」「ユーザー目線のコンテンツ作り」の3点です。詳細は上記セクションをご参照ください。専門的なサポートが必要な場合は、COCOマーケの無料相談もご活用ください。</p>',
    '<h3 id="h949ea6590c">Q3. Instagramインフルエンサーマーケティングとは何ですか？</h3><p>フォロワーを持つ影響力のある個人（インフルエンサー）を活用して、商品・サービスの認知拡大や購買促進を図るマーケティング手法です。Instagram上では企業広告よりも「信頼ある第三者の口コミ」として受け取られるため、エンゲージメント率が高くなりやすい特徴があります。ナノ〜メガの規模に応じてさまざまなインフルエンサーが存在し、目的とKPIに合わせて選定・起用します。</p>'
  );

  // 6. Fix FAQ Q4 – generic answer → proper answer
  h = h.replace(
    '<h3 id="ha0e274411f">Q4. インフルエンサー施策の費用相場はどのくらいかかりますか？</h3><p>インフルエンサー施策の費用相場については、本記事本文で詳しく解説しています。要点は「具体的な目標設定」「データをもとにした継続改善」「ユーザー目線のコンテンツ作り」の3点です。詳細は上記セクションをご参照ください。専門的なサポートが必要な場合は、COCOマーケの無料相談もご活用ください。</p>',
    '<h3 id="ha0e274411f">Q4. インフルエンサー施策の費用相場はどのくらいかかりますか？</h3><p>「フォロワー数×2〜3円」が目安の計算式です。ナノインフルエンサー（〜5,000人）は5,000〜20,000円、マイクロ（1万〜5万人）は30,000〜150,000円、ミドル（5万〜10万人）は100,000〜400,000円が相場です。費用対効果が最も高いのはマイクロ層の複数起用で、単発よりも3ヶ月以上の継続契約の方がROIが安定する傾向があります。</p>'
  );

  // 7. Fix FAQ Q5 – question wording is wrong ("どのくらいかかりますか") + generic answer
  h = h.replace(
    '<h3 id="he6801b302a">Q5. インフルエンサーマーケティングで費用対効果を最大化する戦略はどのくらいかかりますか？</h3><p>インフルエンサーマーケティングで費用対効果を最大化する戦略については、本記事本文で詳しく解説しています。要点は「具体的な目標設定」「データをもとにした継続改善」「ユーザー目線のコンテンツ作り」の3点です。詳細は上記セクションをご参照ください。専門的なサポートが必要な場合は、COCOマーケの無料相談もご活用ください。</p>',
    '<h3 id="he6801b302a">Q5. インフルエンサーマーケティングで費用対効果を最大化するには？</h3><p>「マイクロインフルエンサーの複数起用×長期（3〜6ヶ月）契約×UGC設計」の組み合わせが最も効果的とされています。また、インフルエンサー投稿をMeta広告（Instagram/Facebook）の素材として二次利用することで、CVRが通常広告の1.2〜2倍になる事例も多く見られます。ギフティングを活用してコストを下げながらUGCを量産する設計も有効です。</p>'
  );

  // 8. Fix FAQ Q6 – generic answer → proper answer
  h = h.replace(
    '<h3 id="h4740f1cf33">Q6. 費用計算方法はどのように行えばいいですか？</h3><p>費用計算方法については、本記事本文で詳しく解説しています。要点は「具体的な目標設定」「データをもとにした継続改善」「ユーザー目線のコンテンツ作り」の3点です。詳細は上記セクションをご参照ください。専門的なサポートが必要な場合は、COCOマーケの無料相談もご活用ください。</p>',
    '<h3 id="h4740f1cf33">Q6. インフルエンサー施策の費用はどう計算すればいいですか？</h3><p>基本の計算式は「フォロワー数×2〜3円＝1投稿あたりの目安報酬」です。例えばマイクロインフルエンサー（フォロワー3万人）であれば60,000〜90,000円程度が相場です。ただし、エンゲージメント率が高い人材や動画（リール）コンテンツは単価が割高になる場合があります。正確な見積もりはインフルエンサーのメディアキットや直接交渉で確認するのが確実です。</p>'
  );

  // 9. Internal link 4: add SNSマーケティング guide near conclusion
  h = h.replace(
    '<h2 id="h4b68d6d3c5">よくある質問（FAQ）</h2>',
    '<p>SNSマーケティング全体の戦略設計については<a href="https://www.cocomarke.com/blog/how-to-use-sns-for-business-success/">SNSマーケティング完全ガイド｜企業成功事例と戦略</a>もあわせてご覧ください。</p><h2 id="h4b68d6d3c5">よくある質問（FAQ）</h2>'
  );

  return h;
}

async function run() {
  // ── PPC ──
  console.log('=== PPC記事を更新中...');
  const ppcData = await get('ppc-advertising-beginners-success-guide');
  const ppcNew  = updatePpc(ppcData.content);
  if (ppcNew === ppcData.content) {
    console.warn('⚠️  PPC: 変更なし（置換ターゲットが見つからない可能性あり）');
  } else {
    const status = await patch('ppc-advertising-beginners-success-guide', ppcNew);
    console.log(`✅ PPC PATCH: ${status}`);
  }

  // ── Influencer ──
  console.log('=== インフルエンサー記事を更新中...');
  const inflData = await get('insta-influencer-marketing-guide');
  const inflNew  = updateInfluencer(inflData.content);
  if (inflNew === inflData.content) {
    console.warn('⚠️  Influencer: 変更なし（置換ターゲットが見つからない可能性あり）');
  } else {
    const status = await patch('insta-influencer-marketing-guide', inflNew);
    console.log(`✅ Influencer PATCH: ${status}`);
  }
}

run().catch(e => { console.error(e); process.exit(1); });
