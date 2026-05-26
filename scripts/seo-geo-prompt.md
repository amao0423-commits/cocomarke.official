# COCOマーケ ブログ記事 SEO/GEO 作成・リライト プロンプトテンプレート

このドキュメントはCOCOマーケブログ（Astro + microCMS）の記事を作成・リライトする際の標準プロンプトです。

---

## 基本プロンプト（コピー＆ペースト用）

```
以下の条件でInstagram・SNSマーケティングに関するブログ記事を[作成/リライト]してください。

## 対象記事
- 記事ID: [microCMS の記事 ID]
- URL: https://www.cocomarke.com/blog/[slug]/
- テーマ: [記事のテーマ]

## 文字数・構成
- 本文テキスト（HTMLタグ除く）: 8,000字以上
- H2セクション: 6〜8個
- 各H2配下にH3を2〜4個
- まとめセクションを必ず末尾に含める

## 冒頭固定テンプレート（必須構造）
記事本文の最初のH2の**前**に以下の順序で書くこと:

1. **結論先出し**（1〜2文）: キーワードへの直接回答を最初に出す
   例：「Instagramのフォロワーを増やすには、投稿の一貫性とエンゲージメント率の改善が最も効果的です。」

2. **定義文**（1文）: 「〇〇とは、～です」形式で用語を明確にする
   例：「Instagramショッピングとは、Instagram上で商品を見つけてECサイトの購入導線につなげる販売手法です。」

3. **対象読者**（1文）: 「この記事は、～な方に向けてまとめています」形式
   例：「この記事は、Instagramを活用して集客・認知拡大を狙うビジネスアカウントの運用担当者向けです。」

※「この記事でわかること」と「目次」はスクリプトが自動追加するため、本文には含めない。

## 関連記事リンクブロック（必須）
まとめセクション（`<h2>まとめ</h2>`）の**直前**に以下の形式で挿入すること:

```html
<h2>合わせて読みたい記事</h2>
<ul>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
</ul>
```

- 記事テーマに最も関連する3記事を選ぶ（下記の内部リンクリストから選択）
- 本文中に既にリンクしている記事を再掲してもよい（ナビゲーション目的のため）

## SEO/GEO 要件
- タイトル・H2・H3 に主要キーワードを自然に含める
- GEO（生成エンジン最適化）を意識し、AI検索への回答性を高める
  → 「〇〇とは？」「なぜ〇〇か？」「〇〇の手順は？」などの問いに直接答える構成
- 各H2の冒頭は100〜150字で該当セクションの要点を先出し（逆ピラミッド構造）

## FAQ セクション（必須・AI生成）
まとめセクションの直前（「合わせて読みたい記事」の後）に以下の形式で必ず含めること:

```html
<h2 id="h-faq">よくある質問（FAQ）</h2>
<h3>Q1. [記事テーマに特有の具体的な質問]</h3>
<p>[結論を1文で先に書く。補足説明を続ける]</p>
<h3>Q2. ...</h3>
...
```

- Q&A は5〜6問（記事テーマに特有の質問のみ。汎用テンプレ禁止）
- 「本記事の該当セクションで解説しています」で終わらせない
- 回答は「結論→補足」の順（生成AIが引用しやすい形式）
- Q の中に「ですか？」「できますか？」「必要ですか？」など検索クエリに近い自然な言い回しを使う

## 被リンク獲得・引用されやすい記事設計
SEO上位だけでなく、他社メディア・法人ブログ・note・比較記事・生成AIの回答から引用・参照されやすい構成を優先する。

### 記事タイプの主目的を明確にする
- 検索獲得型: キーワード検索流入を主目的。検索意図への回答精度を最優先
- 引用獲得型: 他サイトや生成AIに引用されることを主目的。独自性・整理・定義を優先
- CV獲得型: 問い合わせ・相談・資料DLを主目的。導線と信頼構築を優先

### 引用されやすい要素（1記事1個以上必ず入れる）
- 独自調査・独自集計
- 業界別データまとめ・地域別分析
- 比較表（他社が参照理由を持てる整理）
- チェックリスト・よくある失敗の体系化
- 数値変化のBefore/After・成功事例
- 最新トレンド整理・アルゴリズム変化の解説
- 定義・用語の違いの明文化（短く引用しやすい結論文を入れる）

### 引用されやすい書き方
- 冒頭に定義文を置く
- 記事中に「短く引用しやすい結論文」を1〜2文で入れる
- タイトルだけで内容価値が伝わるようにする（「2026年版」「地域別」「業種別」「比較」「調査」「保存版」等を活用）
- 生成AIが回答で引用しやすい定義・FAQ・比較を入れる
- 独自の切り口を見出しで明示する

### 地域×業種記事を作る場合
単なるローカルSEO記事にせず、以下を含めて引用価値を高める：
地域特性・業種特性・競合傾向・ハッシュタグ傾向・投稿時間傾向・リール活用傾向・来店導線の特徴・成功/失敗パターン

### 成功事例を入れる場合
- 実施前の課題・実施内容・変化した数値・改善理由・再現性ポイントの順で書く
- 事実不明な数値は捏造しない。数値がない場合は「定性的事例」と明記する

## サービス範囲（必須確認）
COCOマーケが提供するのは以下のInstagramアカウント運用支援のみ：
- Instagramアカウントの設計・最適化
- 発見・おすすめ機能への露出強化
- アカウント運用代行（投稿・エンゲージメント・分析・改善）

以下のサービスはCOCOマーケでは提供していないため、記事内で提供を示唆する表現を使わないこと：
- インフルエンサーマーケティング（紹介する記事を書くことはOKだが、COCOマーケが提供するかのような表現はNG）
- PPC広告・リスティング広告・Google広告・Yahoo!広告の運用代行
- Facebook広告・LINE広告などSNS以外の有料広告運用
- LP（ランディングページ）制作・Web制作
- SEOコンサルティング（外部提供サービスとして）

## 画像
- Pexels API で商用利用可能な写真を2枚使用
- 同じ写真を複数記事で使い回さない
- <figure><img ...><figcaption>説明（Photo by 撮影者名 / Pexels）</figcaption></figure> 形式
- microCMS Management API でアップロードしてからURLを埋め込む

## バックリンク要件
### 内部リンク（最低3記事）
関連するCOCOマーケブログ記事を文脈に合わせて自然にリンク。
主な関連記事（必要に応じて選択）：
- /blog/insta-influencer-marketing-guide（インフルエンサーマーケティング）
- /blog/instagram-collab-post-guide-2025（コラボ機能）
- /blog/instagram-like-limit-account-suspension（アクション制限）
- /blog/ppc-advertising-beginners-success-guide（PPC広告入門）
- その他: /blog/ 配下の関連記事を検索して追加

### 外部リンク
- 公式ソース（Instagram Help Center、Meta Business、Google公式など）
- 統計・調査データの出典元
- SNSマーケティング情報サイト（Buffer Resources: https://buffer.com/resources/）
- リンク形式: target="_blank" rel="noopener noreferrer"

### 情報収集・参考サイト一覧
記事作成時の一次情報・トレンド把握・文章スタイルの参考として活用する。

**Instagramアカウント（公式）**
- Adam Mosseri（Instagram CEO）: https://www.instagram.com/mosseri/
- Instagram for Creators: https://www.instagram.com/creators/
- Instagram Creators Hub: https://creators.instagram.com/

**Meta / Instagram 公式ブログ**
- Instagram 公式ブログ: https://about.instagram.com/blog
- Meta Newsroom（Instagram カテゴリ）: https://about.fb.com/news/category/technologies/instagram/

**海外メディア・コミュニティ**
- Social Media Today: https://www.socialmediatoday.com/
- Social Media Today（Instagram トピック）: https://www.socialmediatoday.com/topic/instagram/
- Reddit r/InstagramMarketing: https://www.reddit.com/r/InstagramMarketing/
- Reddit r/Instagram: https://www.reddit.com/r/Instagram/
- Buffer Resources: https://buffer.com/resources/

**SNSアカウント（業界識者）**
- @alex193a（X）: https://x.com/alex193a

## ビジュアル要素（microCMS HTML）
microCMSはdivタグのstyle属性を削除するため、以下の要素を使うこと：

### blockquote（絵文字プレフィックスでスタイルが変わる）
- 💡 → 青パステル背景（ヒント・ポイント・メリット）
- ⚠️ → 黄パステル背景（注意・リスク・落とし穴）
- 🚫 → 赤パステル背景（禁止事項・NG表現）
- ダークCTA → コンタクトリンク付きblockquote（文中1〜2回、🌙使用禁止）

### ダークCTA blockquote の書き方
**注意**: 🌙絵文字は使用禁止。`<small>`タグはmicroCMSに削除される。
ダークCTAの検出はJSが `a[href*="cocomarke.com/contact"]` の有無で判定する。

<blockquote>
  <p><strong>[見出しテキスト（例：Instagram運用についてのご相談はこちら）]</strong></p>
  <p>COCOマーケでは無料相談を実施中です</p>
  <p>
    <a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>
    　　
    <a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a>
  </p>
</blockquote>

### テーブル
- <th> 要素のみ背景色（パステルブルー）が付く（CSSで自動適用）
- インラインstyleは使わない（グローバルCSSが適用される）
- th/td の中に <p> タグを入れない（テキスト直書き）

### リスト
- <ul> は CSS で ▶ ブレットが自動表示（✅などの絵文字を重複させない）
- <ol> は数字が自動表示（①②③などの丸数字を重複させない）

## 禁止事項
- H2 への絵文字使用（H2は絵文字なし）
- H3 への絵文字使用（H3はボーダーデザインのみ）
- <pre><code> ブロックの使用（blockquote/tableに置き換える）
- <p><br></p> の空行（全削除）
- divタグへのstyle属性（microCMSに削除される）
- 汎用テンプレート文「〇〇とは、〇〇を活用して成果を出す手法のことです」の使用

## microCMS PATCH の注意
- PATCH body に含めるのは { content } のみ（description など他フィールドは含めない）
- エンドポイント: https://cocomarke.microcms.io/api/v1/blogs/{id}
- Management API（画像アップロード）: https://cocomarke.microcms-management.io/api/v1/media
```

---

## バッチリライト実行方法

### 構造修正モード（APIキー不要）
```bash
node scripts/seo-batch-rewrite-v4.mjs
# または特定記事のみ
node scripts/seo-batch-rewrite-v4.mjs --only=<記事ID>
```
→ 空行削除・CTA更新・Pexels写真・わかること/目次/FAQ自動生成を全記事に適用

### AIリライトモード（8000字以上・高品質）
```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/seo-batch-rewrite-v4.mjs
```
→ Claude Sonnet で全文リライト（8000字目標、💡⚠️blockquote、内部リンク付き）

### スキップ対象（既にリライト完了）
- `ppc-advertising-beginners-success-guide`
- `insta-influencer-marketing-guide`
- `instagram-mention-how-to`

---

## スクリプト構成テンプレート（Node.js .mjs）

```javascript
#!/usr/bin/env node
const KEY        = 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const DOMAIN     = 'cocomarke';
const ID         = '[記事ID]';
const PEXELS_KEY = 'NmEpHgSEbtq6tK5wEd3OziJm101VLGpyeYqV5ZMxhIrMtScj9WNjcN5Z';

async function searchPexels(query) {
  const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`, {
    headers: { Authorization: PEXELS_KEY },
  });
  return (await r.json()).photos[0];
}

async function uploadToCMS(photo, fname) {
  const buf = await (await fetch(photo.src.large)).arrayBuffer();
  const fd  = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/jpeg' }), fname);
  const r = await fetch(`https://${DOMAIN}.microcms-management.io/api/v1/media`, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': KEY },
    body: fd,
  });
  if (!r.ok) throw new Error(`Upload failed ${r.status}: ${await r.text()}`);
  return (await r.json()).url;
}

async function run() {
  // 1. コンテンツ取得
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}?fields=content`, {
    headers: { 'X-MICROCMS-API-KEY': KEY },
  });
  let { content } = await r.json();

  // 2. Pexels画像アップロード
  const [photo1, photo2] = await Promise.all([
    searchPexels('[検索ワード1]'),
    searchPexels('[検索ワード2]'),
  ]);
  const [img1, img2] = await Promise.all([
    uploadToCMS(photo1, '[ファイル名1].jpg'),
    uploadToCMS(photo2, '[ファイル名2].jpg'),
  ]);

  // 3. コンテンツ変換（リライトの場合は replace、新規作成は直接HTMLを構築）
  content = content.replace(/<p><br><\/p>/g, '');
  // ... 各置換処理 ...

  // 4. 文字数確認
  const textLen = content.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`文字数: ${textLen}字`); // 8000字以上を確認

  // 5. PATCH
  const res = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
}

run().catch(e => { console.error(e); process.exit(1); });
```

---

## HTML構造チェックリスト

記事作成・リライト後に確認する項目：

| 項目 | 確認内容 |
|------|---------|
| 文字数 | 8,000字以上（`content.replace(/<[^>]+>/g,'').replace(/\s+/g,'').length`） |
| 導入文 | テンプレート文ではなくテーマに合った固有のリード文 |
| 内部リンク | 最低3記事に自然なリンク |
| 外部リンク | 公式ソースへのリンクあり |
| Pexels画像 | 2枚、microCMSにアップロード済み、figcaptionあり |
| 🌙 CTA | 文中1〜2箇所 |
| 💡/⚠️/🚫 | 適切な箇所にblockquoteあり |
| <pre><code> | 使用なし（全てblockquote/tableに置換済み） |
| <p><br></p> | 使用なし（全削除済み） |
| H2絵文字 | なし |
| ul li ▶重複 | ✅などの絵文字と▶の重複なし |
| ol ①②重複 | 丸数字と自動番号の重複なし |
| サービス範囲 | PPC/広告代行/LP制作などの誤記なし |

---

## よくあるエラーと対処法

| エラー | 原因 | 対処法 |
|--------|------|--------|
| 404 Not Found | エンドポイントのtypo（`blog`→`blogs`） | URL確認: `/api/v1/blogs/{id}` |
| 400 `'description' is unexpected key` | PATCHボディに不要フィールドを含めた | `body: JSON.stringify({ content })` のみ |
| FormData import error | `import { FormData } from 'node:buffer'` | Node.js 18+では不要、import削除 |
| div style が消える | microCMSがdivのstyle属性を削除する仕様 | blockquote + 絵文字プレフィックスで代替 |
| 文字数が届かない | 空行削除後に減る場合がある | 各セクションに💡/⚠️blockquote追加で補完 |
