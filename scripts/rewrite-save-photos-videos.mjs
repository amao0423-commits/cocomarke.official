/**
 * rewrite-save-photos-videos.mjs
 * "インスタ画像・動画 スマホ保存" SEOリライト
 * 実行: ANTHROPIC_API_KEY=sk-ant-... node scripts/rewrite-save-photos-videos.mjs
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_KEY = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const DOMAIN       = 'cocomarke';
const ARTICLE_ID   = 'how-to-save-instagram-photos-videos';

async function fetchArticle() {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ARTICLE_ID}?fields=title,content`, {
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY },
  });
  return r.json();
}

async function patchArticle(title, content) {
  const r = await fetch(`https://${DOMAIN}.microcms.io/api/v1/blogs/${ARTICLE_ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content }),
  });
  if (!r.ok) throw new Error(`PATCH failed ${r.status}: ${await r.text()}`);
  return r.json();
}

const PROMPT = (title, content) => `
あなたは日本語SEOとInstagram運用に強い編集者です。
以下の既存記事をリライトしてください。新規記事は作成せず、既存記事を更新します。

【現在のタイトル】
${title}

【現在のHTML本文】
${content}

【主キーワード】
インスタ 画像 動画 保存 スマホ／インスタ ダウンロード スマホ

【補助キーワード】
インスタ 高画質 保存 / インスタ 動画 保存 スマホ / インスタ 画像 保存 iPhone /
インスタ 保存 Android / インスタ リール 保存 / インスタ ストーリー 保存 /
インスタ 保存 バレる / インスタ 保存 違法 / インスタ 保存 アプリなし

【GSC状況】
インプレ756・CTR1.7%・順位9.4位。表示はあるが、クリック率が低い。CTR3%以上が目標。

【必須タイトル】
【2026年最新】インスタ画像・動画をスマホに高画質保存する方法7選

【必須meta description（HTML内に<meta name="description">として追加）】
インスタの画像・動画をスマホに高画質保存したい人向けに、iPhone/Android別の保存方法を解説。アプリなしの手順、リール・ストーリー保存、バレる可能性や注意点も紹介します。

【必須冒頭文（記事の最初に追加）】
インスタの画像・動画保存とは、Instagram上に投稿された写真・動画・リールなどを、スマホ内で後から見返せるように保存することです。
ただし、保存方法によっては画質が落ちたり、著作権や利用規約上の注意が必要になったりする場合があります。本記事では、iPhone・Androidでインスタ画像や動画を高画質に保存する方法と、安全に使うための注意点をわかりやすく解説します。

【必須構成（この順で再構成してください）】
## インスタの画像・動画保存とは？
### 保存できる主なコンテンツ
### 保存前に知っておきたい注意点

## インスタ画像・動画をスマホに保存する方法7選
### 1. Instagram公式の保存機能を使う
### 2. スマホのスクリーンショット・画面録画を使う
### 3. ブラウザ版Instagramから保存する
### 4. 外部保存ツールを使う
### 5. 保存アプリを使う
### 6. リール動画を保存する
### 7. ストーリーを保存する

## iPhoneでインスタ画像・動画を保存する手順
### 画像を保存する方法
### 動画を保存する方法
### 画面録画を使う場合の注意点

## Androidでインスタ画像・動画を保存する手順
### 画像を保存する方法
### 動画を保存する方法
### 保存できないときの確認ポイント

## インスタ画像・動画を高画質で保存するコツ
### 画質が落ちる主な原因
### 高画質保存しやすい方法
### 保存後に画質を確認するポイント

## インスタ保存はバレる？違法？安全性の注意点
### 保存しても相手に通知される？
### 著作権・利用規約で注意すべきこと
### 保存した画像・動画を再投稿するときの注意点

## インスタ画像・動画を保存できない原因と対処法
### 投稿が非公開になっている
### ストーリーの公開期限が切れている
### アプリやブラウザに不具合がある
### 保存ツールが対象投稿に対応していない

## よくある質問（FAQ）
## まとめ

【必須FAQ（8問、回答は「結論→補足」形式）】
Q1. インスタの画像や動画はスマホに保存できますか？
A. はい、保存方法を選べばスマホに保存できます。ただし、Instagram公式機能では端末内に直接保存できないケースもあるため、スクリーンショット、画面録画、外部ツール、保存アプリなどを目的に応じて使い分ける必要があります。

Q2. インスタの画像や動画を保存すると相手にバレますか？
A. 通常の投稿画像や動画を保存しても、相手に通知されることは基本的にありません。ただし、機能や仕様は変更される可能性があるため、最新のInstagram公式仕様も確認してください。

Q3. インスタの動画を高画質で保存するにはどうすればいいですか？
A. 高画質で保存したい場合は、元投稿の画質を保ちやすい保存方法を選ぶことが重要です。画面録画やスクリーンショットでは画質が落ちることがあるため、動画の解像度に対応した保存ツールやブラウザ保存の可否を確認しましょう。

Q4. インスタの保存は違法ですか？
A. 個人で見返す目的の保存は問題になりにくい一方、無断転載や商用利用はトラブルになる可能性があります。他人の投稿を再投稿・加工・販売・広告利用する場合は、投稿者の許可を取ることが大切です。

Q5. アプリなしでインスタの画像や動画を保存できますか？
A. はい、アプリなしでも保存できる場合があります。スクリーンショット、画面録画、ブラウザ版Instagram、Web上の保存ツールなどを使えば、アプリを追加せずに保存できるケースがあります。

Q6. インスタのリール動画はスマホに保存できますか？
A. リール動画も保存できる場合があります。ただし、投稿者の設定や使用する保存方法によっては保存できないことがあります。高画質で残したい場合は、対応している保存方法を選びましょう。

Q7. インスタのストーリーは保存できますか？
A. 公開中のストーリーであれば、画面録画などで保存できる場合があります。ただし、24時間で消える仕様のため、公開期限が切れたストーリーは保存できません。

Q8. インスタの画像や動画を保存できない原因は何ですか？
A. 非公開アカウント、投稿削除、通信環境、アプリ不具合、保存ツールの非対応などが主な原因です。まずは投稿が見られる状態か、通信環境が安定しているか、アプリやブラウザが最新かを確認してください。

【内部リンク（自然な箇所に追加）】
- リール保存の詳細 → <a href="/blog/edits-how-to-2025-instagram-reels-save-post">Editsアプリでのリール保存・投稿方法</a>
- 画質低下の対策 → <a href="/blog/why-instagram-image-quality-drops-and-how-to-fix">インスタ投稿で画質が落ちる原因と対策</a>
- ストーリー活用 → <a href="/blog/instagram-story-strategy-2025">インスタストーリーの戦略的運用法</a>

【末尾CTA（まとめの後に追加）】
インスタの運用を効率化したい方や、集客・フォロワー増加でお悩みの方は、COCOマーケの無料相談をご活用ください。
<a href="https://www.cocomarke.com/">Instagram運用のプロに無料で相談する →</a>

【禁止事項】
- 「必ず復元できる」など事実未確認の断定表現をしない
- キーワードを不自然に詰め込まない
- <div style=""> を使わない（microCMS仕様）
- URLスラッグを変更しない

【出力形式】
以下のJSON形式のみで返してください（コードブロック・説明文不要）：
{"title":"新タイトル","content":"HTML全文"}
`;

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required');

  const client = new Anthropic({ apiKey });

  console.log('[1/3] 記事取得中...');
  const { title, content } = await fetchArticle();
  console.log('  タイトル:', title);
  console.log('  文字数:', content.length);

  console.log('[2/3] Claude でリライト中（2〜3分かかります）...');
  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 16000,
    messages: [{ role: 'user', content: PROMPT(title, content) }],
  });

  const text = msg.content[0].text.trim();
  let rewritten;
  try {
    rewritten = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) rewritten = JSON.parse(match[0]);
    else throw new Error('Claudeの応答がJSONではありません:\n' + text.slice(0, 300));
  }

  console.log('  新タイトル:', rewritten.title);
  console.log('  新文字数:', rewritten.content.length);

  console.log('[3/3] microCMS に保存中...');
  await patchArticle(rewritten.title, rewritten.content);
  console.log('✅ 完了: https://www.cocomarke.com/blog/' + ARTICLE_ID);
}

main().catch(e => { console.error('[Fatal]', e.message); process.exit(1); });
