/**
 * rewrite-dm-delete.mjs
 * "インスタ dm 削除 / インスタ メッセージ 削除" SEOリライト
 * 実行: ANTHROPIC_API_KEY=sk-ant-... node scripts/rewrite-dm-delete.mjs
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_KEY = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const DOMAIN       = 'cocomarke';
const ARTICLE_ID   = 'instagram-dm-troubleshooting-guide';

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

【主対象キーワード】
- インスタ dm 削除
- インスタ メッセージ 削除

【副対象キーワード】
- インスタ dm 送信取り消し
- インスタ 送信取り消し
- インスタ メッセージ 消えた
- インスタ dm 削除 相手
- インスタ dm 削除 復元

【改善目的】
GSCで順位6〜9位台・CTR0.1%前後。タイトル・冒頭・見出し・FAQを改善してCTRと滞在満足度を上げる。

【必須実施事項】
1. タイトル前半に「インスタDM削除」「メッセージ削除」を自然に含める
2. 冒頭300字以内で結論を先に書く（削除と送信取り消しは別機能である旨）
3. 記事上部（冒頭直後）に以下の比較表を<table>で追加する：
   | 操作 | 自分の画面 | 相手の画面 | 通知 | 復元 |
   - DMスレッド削除
   - 個別メッセージ送信取り消し
   - メッセージ削除（自分のみ）
4. 「相手に残るか？」「通知されるか？」「復元できるか？」をFAQで明確に答える
5. 以下のH2を含める（既存H2を置き換えてよい）：
   - インスタDMを削除する方法（iPhone・Android対応）
   - 送信取り消しとの違い・使い分け
   - メッセージが突然消えた原因と確認ポイント
6. iPhone・Androidどちらでも使える手順として説明する
7. Instagram公式ヘルプへの外部リンクを適切箇所に入れる：
   https://help.instagram.com/
8. 以下の既存記事への内部リンクを2〜3件自然に追加する：
   - 既読なしDM確認: /blog/how-to-check-instagram-dm-without-marking-as-read
   - アカウント削除: /blog/instagram-account-deletion-2026
   - アカウント凍結: /blog/instagram-account-freeze
9. 末尾にCOCOマーケへの相談CTAを自然に入れる（Instagram運用代行・無料相談）
   リンク先: https://www.cocomarke.com/
10. URLスラッグは変更しない（${ARTICLE_ID}のまま）

【禁止事項】
- 事実未確認の仕様を断定しない（「必ず復元できる」等）
- キーワードを不自然に詰め込まない
- 既存テーマから外れた一般的なInstagram運用論で水増ししない
- <div style=""> を使わない（microCMS仕様）

【記事構成（この順序で）】
1. 導入文（300字以内・結論ファースト）
2. 早見表（削除/取り消し/消えた の違い比較表）
3. H2: インスタDMを削除する方法（iPhone・Android手順）
4. H2: 送信取り消しとの違い・使い分け
5. H2: メッセージが突然消えた原因と確認ポイント
6. FAQ（よくある質問：相手に残る？通知は？復元は？）
7. まとめ・CTA

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

  console.log('[2/3] Claude でリライト中（1〜2分かかります）...');
  const msg = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 12000,
    messages: [{ role: 'user', content: PROMPT(title, content) }],
  });

  const text = msg.content[0].text.trim();
  let rewritten;
  try {
    rewritten = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) rewritten = JSON.parse(match[0]);
    else throw new Error('Claudeの応答がJSONではありません:\n' + text.slice(0, 500));
  }

  console.log('  新タイトル:', rewritten.title);
  console.log('  新文字数:', rewritten.content.length);

  console.log('[3/3] microCMS に保存中...');
  await patchArticle(rewritten.title, rewritten.content);
  console.log('✅ 完了: https://www.cocomarke.com/blog/' + ARTICLE_ID);
}

main().catch(e => { console.error('[Fatal]', e.message); process.exit(1); });
