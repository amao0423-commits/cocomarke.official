/**
 * scripts/create-articles-may2026.mjs
 * 2026年5月の3記事を作成・更新するワンタイムスクリプト
 *
 * May 1  (eig3q8sh1o) : PATCH — タイトル変更・内容刷新
 * May 8  (5sx39tiziu5p): DELETE → PUT sns-news-roundup-2026-may
 * May 15 (ag-y7epef372): DELETE → PUT sns-image-size-guide-2026
 */

import Anthropic from '@anthropic-ai/sdk';
import { uploadEyecatch } from './eyecatch.mjs';

const ANTHROPIC_API_KEY   = process.env.ANTHROPIC_API_KEY;
const SVC                 = process.env.MICROCMS_SERVICE_DOMAIN ?? 'cocomarke';
const API_KEY             = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const PEXELS_API_KEY      = process.env.PEXELS_API_KEY; // 中間画像用（オプション）
const SLACK_WEBHOOK_URL   = process.env.SLACK_WEBHOOK_URL;

const BASE_URL  = `https://${SVC}.microcms.io/api/v1/blogs`;
const MEDIA_URL = `https://${SVC}.microcms-management.io/api/v1/media`;

// ─── 既存記事（関連記事リンク用） ─────────────────────────────────────────
const EXISTING_ARTICLES = [
  { id: 'instagram-feed-size-1080x1440-update',            title: 'Instagramのフィードサイズが1080×1440に変わった！影響と対応策',             category: '運用の基本' },
  { id: 'instagram-2025-strategy-new-features-algorithm',  title: '【2026年最新】Instagram大型アップデート完全解説｜アルゴリズム・運用はどう変わった？', category: '最新情報' },
  { id: 'instagram-highlight-update-2025-marketing-strategy', title: '【2025年11月最新】インスタハイライトが「丸」に回帰？',              category: '最新情報' },
  { id: 'instagram-story-strategy-2025',                   title: '【2025年版】インスタストーリー完全攻略｜ファン化・集客・販売を実現する戦略運用法', category: 'SNS戦略' },
  { id: 'instagram-hashtag-5-limit-2025',                  title: 'インスタグラムハッシュタグが5個制限に？新ルールへの対策とインスタSEOを徹底解説', category: '検索対策' },
  { id: 'instagram-reels-views-not-increasing-7-reasons',  title: 'インスタリールの再生回数が伸びない7つの理由と改善策',                  category: 'SNS戦略' },
  { id: 'instagram-algorithm-latest-complete-guide',       title: 'インスタアルゴリズム最新完全攻略｜リーチとフォロワーを増やす運用法',     category: 'SNS戦略' },
  { id: 'instagram-broadcast-channel-how-to-guide',        title: 'インスタグラムの一斉配信チャンネルとは？作り方・活用法・集客戦略まで完全解説', category: 'SNS戦略' },
  { id: 'why-instagram-image-quality-drops-and-how-to-fix',title: 'インスタ投稿画質が落ちる原因と対策方法を徹底解説!',                    category: '運用の基本' },
  { id: 'instagram-seo-marketing',                         title: 'Instagramの投稿が上位に表示される仕組みとは？',                       category: '検索対策' },
  { id: 'what-is-seo-search-engine-optimization',          title: 'SEO対策とは？初心者にもわかりやすく意味・やり方・おすすめツールまで解説', category: '検索対策' },
  { id: 'instagram-outsourcing-success',                   title: '【2026年最新版】Instagram運用代行とは？費用相場・成功事例・選び方まで徹底解説', category: '集客' },
  { id: 'chatgpt-instagram-caption-tips-prompts',          title: 'ChatGPTでインスタ投稿文を時短＆量産！使い方・プロンプト例を徹底解説',   category: '運用の基本' },
  { id: 'edits-how-to-2025-instagram-reels-save-post',     title: '【2025年最新版】Editsの使い方を徹底解説！',                          category: '運用の基本' },
];

// ─── 3記事の定義 ─────────────────────────────────────────────────────────
const ARTICLES = [
  {
    date:       '2026-05-01',
    action:     'patch',
    existingId: 'eig3q8sh1o',
    titleJa:    'Instagram「Instants」完全ガイド！瞬間共有機能の特徴・使い方と運用活用術【2026年最新】',
    category:   '最新情報',
    imageQuery: 'instagram smartphone camera social',
    relatedIds: ['instagram-2025-strategy-new-features-algorithm', 'instagram-highlight-update-2025-marketing-strategy', 'instagram-story-strategy-2025', 'instagram-broadcast-channel-how-to-guide'],
    topicDetails: `
Instagram の新機能「Instants」（インスタンツ）について、日本のInstagram運用担当者・マーケター向けに詳しく解説。

カバーすべき内容：
- Instantsとは何か（Meta公式発表の引用、機能の概要）
- 通常フィード投稿・ストーリーズ・リールとの違いと使い分け
- アルゴリズムへの影響（Instants投稿のリーチ・エンゲージメント傾向）
- ビジネスアカウントで活用できるシーン（新商品告知、日常発信、舞台裏公開など）
- 企業・ブランドの活用事例（具体的なシナリオを3〜4例）
- Instantsを使う際の注意点・ベストプラクティス
- COCOマーケとしての見解・推奨運用方針

公式情報・信頼できる参照先（リンクを本文中に挿入すること）：
- Meta公式: https://about.instagram.com/
- Instagramクリエイター向け: https://creators.instagram.com/
- Meta for Business: https://www.facebook.com/business/help/instagram
`,
  },
  {
    date:       '2026-05-08',
    action:     'create',
    deleteId:   '5sx39tiziu5p',
    slug:       'sns-news-roundup-2026-may',
    titleJa:    '【2026年5月版】最新機能などSNSニュースまとめ｜Instagram、X、LINE、TikTok、YouTube、Threads、note、BeReal',
    category:   '最新情報',
    imageQuery: 'social media apps news smartphone',
    relatedIds: ['instagram-2025-strategy-new-features-algorithm', 'instagram-algorithm-latest-complete-guide', 'what-is-seo-search-engine-optimization', 'instagram-hashtag-5-limit-2025'],
    topicDetails: `
2026年5月時点での主要SNSプラットフォームの最新ニュース・機能アップデートをまとめた記事。
日本のマーケター・企業担当者が実務で活かせる情報にフォーカスする。

各プラットフォームごとにH2見出しを立て、最新情報を2〜3項目以上解説：

■ Instagram
- 2026年春の主要アップデート（Instants、アルゴリズム変更、新クリエイターツールなど）
- フィード・リール・ストーリーズの仕様変更
- 公式リンク：https://about.instagram.com/blog , https://creators.instagram.com/

■ X（旧Twitter）
- 2026年のX Premium機能追加・UI変更
- ポストのインプレッション表示変化
- 企業アカウントへの影響
- 公式リンク：https://blog.x.com/

■ LINE
- LINE公式アカウントの新機能・料金改定
- VOOM（旧タイムライン）の動向
- リッチメニュー・メッセージ配信の変更点
- 公式リンク：https://www.linebiz.com/jp/

■ TikTok
- 2026年の新クリエイター向け機能
- TikTok Shopの日本展開状況
- ビジネスアカウント向けアップデート
- 公式リンク：https://newsroom.tiktok.com/ja-jp

■ YouTube
- YouTubeショート最新動向
- チャンネル収益化の変更
- YouTube Premiumと広告の変化
- 公式リンク：https://blog.youtube/

■ Threads（Meta製SNS）
- Threadsの月間アクティブユーザー数・成長状況
- 新機能追加（検索強化・アルゴリズムなど）
- 企業アカウントでの活用ポイント
- 公式リンク：https://about.fb.com/news/

■ note
- noteのビジネス活用・プロフェッショナル向け機能
- クリエイターエコノミーとしての最新動向
- 公式リンク：https://note.com/info/

■ BeReal
- 若年層ユーザー動向
- ビジネス活用の可能性と限界
- 公式リンク：https://bere.al/

記事末尾に「2026年5月のSNSトレンドまとめ」として、マーケターへの提言を追加。
`,
  },
  {
    date:       '2026-05-15',
    action:     'create',
    deleteId:   'ag-y7epef372',
    slug:       'sns-image-size-guide-2026',
    titleJa:    '【2026年5月最新】SNS投稿に最適な画像サイズ一覧！Instagram・X（Twitter）・TikTok・LINEなど',
    category:   '運用の基本',
    imageQuery: 'social media design mockup phone',
    relatedIds: ['instagram-feed-size-1080x1440-update', 'why-instagram-image-quality-drops-and-how-to-fix', 'instagram-post-ideas-2025', 'chatgpt-instagram-caption-tips-prompts'],
    topicDetails: `
主要SNSプラットフォームの推奨画像・動画サイズを2026年5月時点の最新情報でまとめた保存版記事。
HTMLテーブル（<table>タグ）を使って一覧表形式で見やすく整理すること。

■ Instagram
・フィード投稿サイズ
  - 正方形: 1080×1080px（アスペクト比1:1）
  - 縦長(ポートレート): 1080×1350px（アスペクト比4:5）※最もリーチが取れるサイズ
  - 横長(ランドスケープ): 1080×566px（アスペクト比1.91:1）
・ストーリーズ: 1080×1920px（アスペクト比9:16）
・リール: 1080×1920px（アスペクト比9:16）
・プロフィール画像: 320×320px（表示は110×110px）
・カルーセル投稿: 各スライド1080×1080px推奨
・公式リンク：https://about.instagram.com/

■ X（旧Twitter）
・ツイート画像: 1200×675px（アスペクト比16:9）推奨
・プロフィール画像: 400×400px（丸型表示）
・ヘッダー画像: 1500×500px
・カード画像: 800×418px
・公式リンク：https://help.twitter.com/ja/

■ TikTok
・動画: 1080×1920px（アスペクト比9:16）必須
・カバー画像: 1080×1920px
・プロフィール画像: 200×200px（丸型）
・公式リンク：https://newsroom.tiktok.com/

■ LINE
・LINE公式アカウント リッチメニュー: 2500×1686px
・LINE VOOM投稿: 1080×1080px推奨
・プロフィール画像: 640×640px以上
・LINE広告バナー: 1200×628px
・公式リンク：https://www.linebiz.com/jp/

■ YouTube
・サムネイル: 1280×720px（最小640×360px、16:9必須）
・チャンネルアート/バナー: 2560×1440px（表示は2048×1152px内）
・プロフィール画像: 800×800px（丸型表示）
・ショートサムネイル: 1080×1920px
・公式リンク：https://support.google.com/youtube/

■ Threads（Meta製SNS）
・投稿画像: 1080×1350px（縦長推奨）または1080×1080px
・プロフィール画像: 320×320px
・公式リンク：https://www.threads.net/

■ note
・記事見出し画像: 1280×670px推奨（アスペクト比16:8.3）
・プロフィール画像: 400×400px以上
・公式リンク：https://note.com/info/

■ BeReal
・正方形フォーマット（インカメ+アウトカメ合成）
・編集不可の独自フォーマット

■ ファイル形式・容量の目安
- 静止画: JPEG（高品質圧縮）またはPNG（透過必要時）
- 動画: MP4（H.264エンコード）
- ファイルサイズ: Instagram最大8MB（動画4GB）、X最大5MB（動画512MB）等プラットフォームごとの制限
- WebP形式の対応状況も解説

※ 2026年5月時点の情報。各プラットフォームの仕様変更の可能性あり。
`,
  },
];

// ─── ヘルパー関数 ──────────────────────────────────────────────────────────

async function fetchMidImage(query) {
  if (PEXELS_API_KEY) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY }, signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();
      const photo = data.photos?.[0];
      if (photo) return { url: photo.src.large2x || photo.src.large, alt: photo.alt || query };
    } catch {}
  }
  const seed = [...query].reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
  return { url: `https://picsum.photos/seed/${seed}/1200/630`, alt: query };
}

async function notifySlack(article, contentId) {
  if (!SLACK_WEBHOOK_URL) return;
  const publicUrl = `https://www.cocomarke.com/blog/${contentId}/`;
  const payload = {
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: '📝 COCOマーケ 記事が投稿されました', emoji: true },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*タイトル*\n${article.titleJa}` },
          { type: 'mrkdwn', text: `*カテゴリ*\n${article.category}` },
          { type: 'mrkdwn', text: `*投稿日*\n${article.date}` },
        ],
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `*URL*\n<${publicUrl}|${publicUrl}>` },
      },
    ],
  };
  await fetch(SLACK_WEBHOOK_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  }).catch(err => console.warn('  Slack通知失敗:', err.message));
  console.log('  Slack通知送信');
}

async function generateHTML(client, article) {
  const relatedLinks = article.relatedIds
    .map(id => {
      const a = EXISTING_ARTICLES.find(e => e.id === id);
      return a ? `<li>関連記事：<a href="/blog/${a.id}/">${a.title}</a></li>` : null;
    })
    .filter(Boolean)
    .join('\n');

  const prompt = `
記事タイトル: 「${article.titleJa}」
カテゴリ: ${article.category}
対象読者: 日本のInstagram運用担当者・中小企業マーケター・SNS担当者
投稿日: ${article.date}

テーマ詳細:
${article.topicDetails}

━━━ 記事作成要件 ━━━

【文字数・形式】
- 合計8000文字以上（多ければ多いほど良い）
- <title><head>タグは不要。<h2>〜<p>等の本文HTMLのみ出力

【構成（必ず以下の順序で）】
1. 導入文（300〜400字）
   - 読者の課題・悩みへの共感で始める
   - 「この記事でわかること」を箇条書きで示す
   - 読む価値を明確に伝える

2. 目次
   <h2 id="toc">目次</h2>
   <ul>
     <li><a href="#section-01">H2タイトル1</a></li>
     <li><a href="#section-02">H2タイトル2</a></li>
     ...（全H2を列挙）
   </ul>

3. 本文
   - H2見出し: 5〜8個、各H2に id="section-01" から連番IDを付与
   - 各H2の下にH3を2〜3個
   - 各H3の下に段落（<p>タグ）を2〜3個、1段落150〜250字程度
   - 具体的な数値・事例・手順を含める

4. まとめ（<h2 id="section-summary">まとめ</h2>）
   200〜300字で記事全体を締める

5. 関連記事（まとめの直後）
   <h2 id="section-related">関連記事</h2>
   <ul>
${relatedLinks}
   </ul>

6. CTA（最後の1行）
   <p>COCOマーケのInstagram運用代行についてはこちらをご覧ください → <a href="/contact/">お問い合わせ</a></p>

【公式リンクの挿入（重要）】
- 公式発表・統計・数値には必ずインラインでリンクを挿入
- 例: <a href="https://about.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram公式</a>
- 各H2セクションに最低1つは公式・信頼できるソースのリンクを含める

【文体・SEO】
- 敬体（です・ます調）で統一
- キーワードを自然に含める
- 読者が実際に行動できる具体的な情報を提供
- 箇条書き（<ul><li>）を適度に活用して読みやすくする
`;

  const res = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 14000,
    messages:   [{ role: 'user', content: prompt }],
  });

  return res.content[0].text;
}

// ─── メイン処理 ────────────────────────────────────────────────────────────

async function main() {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required');
  if (!API_KEY)           throw new Error('MICROCMS_WRITE_API_KEY is required');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  for (const article of ARTICLES) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`記事: ${article.titleJa}`);
    console.log(`日付: ${article.date} / アクション: ${article.action}`);
    console.log('='.repeat(60));

    // 1. 古い記事を削除
    if (article.action === 'create' && article.deleteId) {
      console.log(`古い記事を削除: ${article.deleteId}`);
      const delRes = await fetch(`${BASE_URL}/${article.deleteId}`, {
        method:  'DELETE',
        headers: { 'X-MICROCMS-API-KEY': API_KEY },
      });
      console.log(`  DELETE ${article.deleteId}: ${delRes.status}`);
    }

    // 2. ブランドアイキャッチ生成・アップロード
    console.log('アイキャッチを生成中...');
    const eyecatchUrl = await uploadEyecatch({
      title:         article.titleJa,
      category:      article.category,
      serviceDomain: SVC,
      apiKey:        API_KEY,
    }).catch(e => { console.warn('  eyecatch失敗:', e.message); return null; });

    // 中間画像（記事本文に挿入）
    console.log('中間画像を取得中...');
    const rawImage = await fetchMidImage(article.imageQuery).catch(() => null);

    // 3. 記事HTML生成
    console.log('Claude で記事を生成中...');
    const bodyHtml = await generateHTML(client, article);
    console.log(`  生成文字数: ${bodyHtml.length}`);

    // 4. 中間画像の挿入（3番目のH2閉じタグの後）
    let finalBody = bodyHtml;
    if (rawImage) {
      const h2Closes = [...finalBody.matchAll(/<\/h2>/gi)];
      const insertIdx = h2Closes.length >= 3 ? 2 : h2Closes.length >= 2 ? 1 : -1;
      if (insertIdx >= 0) {
        const pos = h2Closes[insertIdx].index + h2Closes[insertIdx][0].length;
        const imgHtml =
          `\n<figure style="margin:2em 0;text-align:center;">` +
          `<img src="${rawImage.url}" alt="${article.titleJa}" style="max-width:100%;border-radius:8px;" loading="lazy">` +
          `<figcaption style="font-size:13px;color:#888;margin-top:8px;">Photo: Unsplash</figcaption>` +
          `</figure>\n`;
        finalBody = finalBody.slice(0, pos) + imgHtml + finalBody.slice(pos);
      }
    }

    // 5. microCMS へアップロード
    // eyecatch はまず { url, width, height } 形式で試し、ダメなら URL 文字列で試す
    const buildPayload = (ecValue) => ({
      title:    article.titleJa,
      content:  finalBody,
      category: article.category,
      day:      article.date,
      ...(ecValue !== undefined ? { eyecatch: ecValue } : {}),
    });

    async function tryUpload(method, url, ecValue) {
      const res = await fetch(url, {
        method,
        headers: { 'X-MICROCMS-API-KEY': API_KEY, 'Content-Type': 'application/json' },
        body:    JSON.stringify(buildPayload(ecValue)),
      });
      if (!res.ok) {
        const err = await res.text();
        return { ok: false, status: res.status, err };
      }
      return { ok: true, data: await res.json() };
    }

    const method   = article.action === 'patch' ? 'PATCH' : 'PUT';
    const endpoint = article.action === 'patch'
      ? `${BASE_URL}/${article.existingId}`
      : `${BASE_URL}/${article.slug}`;

    console.log(`${method} → ${endpoint}`);

    // eyecatch フォーマットを順番に試す（URLが返ったならそのまま文字列で）
    const eyecatchCandidates = eyecatchUrl
      ? [eyecatchUrl, undefined]
      : [undefined];

    let result;
    for (const ecValue of eyecatchCandidates) {
      const attempt = await tryUpload(method, endpoint, ecValue);
      if (attempt.ok) {
        result = attempt.data;
        break;
      }
      if (ecValue === undefined) {
        throw new Error(`microCMS ${method} failed: ${attempt.status} ${attempt.err}`);
      }
      console.warn(`  eyecatch format failed (${JSON.stringify(ecValue).slice(0, 60)}...), trying next...`);
    }

    const resultId = result.id ?? article.slug ?? article.existingId;
    const doneUrl = `https://www.cocomarke.com/blog/${resultId}/`;
    console.log(`完了: ${doneUrl}`);
    await notifySlack(article, resultId);
  }

  console.log('\n✅ 全記事の作成・更新が完了しました');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
