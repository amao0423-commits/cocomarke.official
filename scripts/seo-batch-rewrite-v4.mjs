/**
 * SEO Batch Rewrite v4 — COCOマーケ blog full pipeline
 *
 * Changes from v3:
 *  - No 🌙 emoji (dark CTA detected by contact link)
 *  - COCOマーケ service scope: Instagram account mgmt only
 *  - 8000+ char target (was 3000)
 *  - Claude Sonnet for better quality
 *  - Table: <th> for header rows/cols, no <p> inside cells
 *  - H2/H3: no emojis
 *  - Skip already-rewritten articles
 *
 * Usage:
 *   node seo-batch-rewrite-v4.mjs                  # all pending articles
 *   node seo-batch-rewrite-v4.mjs --only=<id>      # single article
 *   ANTHROPIC_API_KEY=sk-... node seo-batch-rewrite-v4.mjs
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_KEY    = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN = 'cocomarke';
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY ?? '';
const PEXELS_KEY      = process.env.PEXELS_API_KEY;
const DELAY_MS        = 5000;

// ─── Already rewritten — skip ─────────────────────────────────────────────────
const SKIP_IDS = new Set([
  'ppc-advertising-beginners-success-guide',
  'insta-influencer-marketing-guide',
  'instagram-mention-how-to',
]);

// ─── New dark CTA (no 🌙, detected by contact link in JS) ────────────────────
const CTA_MID = `<blockquote><p><strong>Instagram運用についてのご相談はこちら</strong></p><p>COCOマーケでは、アカウント設計から運用代行まで無料でご相談いただけます。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_END = `<blockquote><p><strong>Instagramアカウントの運用でお困りですか？</strong></p><p>COCOマーケでは無料相談を実施中です。専任マネージャーが最適なプランをご提案します。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const stripHtml = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const fixPostLinks = html => html.replace(/href="(https?:\/\/www\.cocomarke\.com)?\/post\//g, 'href="/blog/');

// ─── Strip previously added SEO elements ─────────────────────────────────────

function stripOldElements(html) {
  let r = html;
  r = r.replace(/<figure[^>]*>[\s\S]*?(?:pexels-photo|svg-\w+|infographic|図解|mention-guide)[\s\S]*?<\/figure>/gi, '');
  r = r.replace(/<img[^>]*(?:pexels-photo|svg-\w+|infographic)[^>]*\/?>/gi, '');
  r = r.replace(/<h2[^>]*>\s*この記事でわかること\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*目次\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*よくある質問[（(]?FAQ[）)]?\s*<\/h2>[\s\S]*?(?=<h2[^>]*>\s*(?:まとめ|合わせて読みたい)|$)/gi, '');
  r = r.replace(/<blockquote>[\s\S]*?(?:cocomarke\.com\/contact|cocomake-guide\.com)[\s\S]*?<\/blockquote>/gi, '');
  r = r.replace(/<p>[^<]*とは、[^<]*のことです[^<]*<\/p>/g, '');
  r = r.replace(/<h2[^>]*>\s*<br\s*\/?>\s*<\/h2>/gi, '');
  r = r.replace(/<blockquote>\s*<p>\s*<strong>(?:💡|⚠️|🚫)[^<]*<\/strong>[^<]*<\/p>[\s\S]{0,800}?<\/blockquote>/gi, '');
  r = r.replace(/<p><br><\/p>/g, '');
  r = r.replace(/<p> <\/p>/g, '');
  return r.replace(/\n{3,}/g, '\n\n').trim();
}

function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0);
}

function extractH3s(html) {
  return [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0);
}

// ─── SEO content builders ─────────────────────────────────────────────────────

function makeWakaruBox(h2s) {
  const items = h2s.slice(0, 6).map(h => `<li>${h}</li>`).join('\n');
  return `<h2 id="h-wakaru">この記事でわかること</h2>\n<ul>\n${items}\n</ul>`;
}

function makeToc(h2s) {
  const items = h2s.map((h, i) => `<li><a href="#h-s${i+1}" target="_self">${h}</a></li>`).join('\n');
  return `<h2 id="h-toc">目次</h2>\n<ol>\n${items}\n</ol>`;
}

function makeH2IdsInBody(html, h2s) {
  let result = html;
  h2s.forEach((h, i) => {
    const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`(<h2[^>]*>)\\s*(?:<a[^>]*>)?${escaped}(?:</a>)?\\s*</h2>`),
      `$1<a id="h-s${i+1}"></a>${h}</h2>`
    );
  });
  return result;
}

function generateFaq(title, h2s, h3s) {
  const base = title.replace(/【[^】]*】/g,'').replace(/｜.*$/,'').trim().slice(0,20);
  const pairs = [];

  // Generate Q&A from H2/H3 headings
  const all = [...h2s, ...h3s].filter(h => h.length > 4);
  for (const h of all) {
    if (pairs.length >= 5) break;
    if (/とは/.test(h)) pairs.push({ q: `${h.replace(/とは.*/, '')}とは何ですか？`, a: `${h.replace(/とは.*/, '')}とは、${stripHtml(title)}に関連する重要な概念です。本記事の該当セクションで基本から実践まで詳しく解説しています。` });
    else if (/方法|やり方|手順|コツ|ポイント/.test(h)) pairs.push({ q: `${h}を実践するためのコツはありますか？`, a: `${h}の実践では、①目標の明確化②継続的な実施③データによる改善の3ステップが重要です。詳細は本記事の該当セクションをご確認ください。` });
    else if (/メリット|デメリット|注意|リスク/.test(h)) pairs.push({ q: `${h}について、特に注意すべきポイントはありますか？`, a: `本記事で詳しく解説していますが、最も重要なのはInstagramの利用規約を守り、ユーザーにとって価値のあるコンテンツを継続的に発信することです。` });
    else if (/料金|費用|コスト/.test(h)) pairs.push({ q: `${h}はどのくらいかかりますか？`, a: `費用は目的や規模によって大きく異なります。本記事の費用セクションで相場を詳しく解説していますので、ご参照ください。` });
  }

  // Generic fallbacks
  if (pairs.length < 3) {
    pairs.push({ q: `${base}は初心者でも効果を出せますか？`, a: `はい、基本的な設定と継続的な運用を心がけることで、初心者でも十分な効果を出せます。まずは本記事の手順を参考に小さなステップから始めてみましょう。COCOマーケのInstagram運用代行も、初心者・中小企業の方を多数サポートしてきた実績があります。` });
    pairs.push({ q: `効果が出るまでどのくらいの期間が必要ですか？`, a: `アカウントの現状や施策の質により異なりますが、継続的な運用で1〜3ヶ月で効果が見え始め、3〜6ヶ月で明確な成果が現れることが多いです。週次でインサイトを確認しながら改善を繰り返すことが大切です。` });
    pairs.push({ q: `自社アカウントの運用で不安な点があります。どうすればいいですか？`, a: `COCOマーケでは、Instagramアカウントの設計・運用改善に関する無料相談を実施しています。現状の課題をヒアリングしたうえで、最適な改善策をご提案します。お気軽にご相談ください。` });
  }

  const items = pairs.slice(0, 6).map((p, i) => `<h3>Q${i+1}. ${p.q}</h3>\n<p>${p.a}</p>`).join('\n\n');
  return `<h2 id="h-faq">よくある質問（FAQ）</h2>\n${items}`;
}

// ─── Tip / Warning blockquotes ────────────────────────────────────────────────

function makeTipBlock(topic) {
  return `<blockquote><p><strong>💡 ポイント</strong></p><p>「${topic}」を実践する際は、まず基本設定を整えてから小さなアクションを積み重ねることが大切です。定期的にインサイトで数値を確認し、改善を繰り返すことで成果が出やすくなります。</p></blockquote>`;
}

function makeWarningBlock(topic) {
  return `<blockquote><p><strong>⚠️ 注意</strong></p><p>「${topic}」に対応する際は、Instagramのコミュニティガイドラインや利用規約の範囲内で行動することが重要です。違反するとアカウントの機能制限や凍結につながる可能性があります。</p></blockquote>`;
}

function injectTipWarning(html, h2s) {
  let result = html;
  let warningDone = false, tipDone = false;

  for (let i = 0; i < h2s.length; i++) {
    const h = h2s[i];
    const isWarning = !warningDone && /トラブル|注意|禁止|リスク|問題|デメリット|失敗|NG|凍結|停止/.test(h);
    const isTip     = !tipDone    && i > 0 && /活用|ポイント|コツ|メリット|おすすめ|基本|方法|上手に|攻略|戦略/.test(h);

    if (!isWarning && !isTip) continue;

    const anchorTag = `id="h-s${i + 1}"`;
    let h2pos = result.indexOf(anchorTag);
    if (h2pos < 0) {
      const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = result.match(new RegExp(`<h2[^>]*>(?:<a[^>]*>)?${escaped}`));
      if (m) h2pos = result.indexOf(m[0]);
    }
    if (h2pos < 0) continue;

    const pEnd = result.indexOf('</p>', h2pos);
    if (pEnd < 0) continue;

    const insertAt = pEnd + 4;
    if (isWarning) {
      result = result.slice(0, insertAt) + '\n' + makeWarningBlock(h) + '\n' + result.slice(insertAt);
      warningDone = true;
    } else if (isTip) {
      result = result.slice(0, insertAt) + '\n' + makeTipBlock(h) + '\n' + result.slice(insertAt);
      tipDone = true;
    }
    if (warningDone && tipDone) break;
  }
  return result;
}

// ─── CTA injection ────────────────────────────────────────────────────────────

function injectCTAs(html) {
  const segs = html.split(/(?=<h2)/i);
  const n = segs.length;
  const p1 = Math.floor(n / 3);
  const p2 = Math.floor(n * 2 / 3);
  const out = [];
  let c1 = false, c2 = false;
  segs.forEach((s, i) => {
    out.push(s);
    if (i >= p1 && !c1) { out.push(CTA_MID); c1 = true; }
    else if (i >= p2 && !c2) { out.push(CTA_END); c2 = true; }
  });
  if (!c2) out.push(CTA_END);
  return out.join('');
}

// ─── Image injection ──────────────────────────────────────────────────────────

function injectImages(html, imgTag1, imgTag2) {
  const positions = [...html.matchAll(/<h2/gi)].map(m => m.index);
  if (positions.length === 0) {
    const paras = html.split(/<\/p>/i);
    const n = paras.length;
    return paras.map((p, i) => {
      let out = p + (i < paras.length - 1 ? '</p>' : '');
      if (i === Math.floor(n / 3)) out += '\n' + imgTag1 + '\n';
      if (i === Math.floor(n * 2 / 3)) out += '\n' + imgTag2 + '\n';
      return out;
    }).join('');
  }
  const start = positions.length > 2 ? 1 : 0;
  const range = positions.length - start;
  const i1 = start + Math.max(1, Math.floor(range / 3));
  const i2 = start + Math.max(i1 - start + 1, Math.floor(range * 2 / 3));
  const pos1 = positions[Math.min(i1, positions.length - 1)];
  const pos2 = positions[Math.min(i2, positions.length - 1)];
  if (pos1 === pos2) return html.slice(0, pos1) + imgTag1 + '\n' + imgTag2 + '\n' + html.slice(pos1);
  return html.slice(0, pos1) + imgTag1 + '\n' + html.slice(pos1, pos2) + imgTag2 + '\n' + html.slice(pos2);
}

// ─── Pexels ──────────────────────────────────────────────────────────────────

function makePexelsQueries(title) {
  if (/リール|Reels/.test(title)) return { q1: 'smartphone video content creator filming', q2: 'social media video production creator' };
  if (/ストーリー|Stories/.test(title)) return { q1: 'instagram stories smartphone creative lifestyle', q2: 'social media story content mobile' };
  if (/ハッシュタグ/.test(title)) return { q1: 'social media hashtag phone trending', q2: 'instagram content strategy planning' };
  if (/アルゴリズム/.test(title)) return { q1: 'social media algorithm data analytics', q2: 'digital marketing strategy laptop' };
  if (/広告|ads/.test(title)) return { q1: 'digital advertising marketing office', q2: 'business campaign success results' };
  if (/分析|インサイト|ツール/.test(title)) return { q1: 'data analytics dashboard business', q2: 'marketing metrics charts laptop' };
  if (/フォロワー/.test(title)) return { q1: 'instagram followers growth engagement phone', q2: 'social media community building online' };
  if (/DM|メッセージ/.test(title)) return { q1: 'smartphone messaging chat communication', q2: 'business mobile app message' };
  if (/運用代行/.test(title)) return { q1: 'social media management team office', q2: 'digital marketing agency strategy meeting' };
  if (/集客|飲食|店/.test(title)) return { q1: 'restaurant cafe instagram marketing', q2: 'local business social media promotion' };
  if (/SEO|検索/.test(title)) return { q1: 'search engine optimization laptop business', q2: 'content marketing strategy office' };
  if (/プロフィール/.test(title)) return { q1: 'instagram profile smartphone lifestyle', q2: 'social media personal branding' };
  if (/保存|ダウンロード/.test(title)) return { q1: 'smartphone saving photos download', q2: 'mobile app storage digital content' };
  if (/ライブ|配信/.test(title)) return { q1: 'live streaming smartphone broadcast', q2: 'social media live video creator' };
  if (/コラボ|共同/.test(title)) return { q1: 'collaboration business partnership team', q2: 'social media collab content creators' };
  if (/アカウント|凍結|停止/.test(title)) return { q1: 'instagram account smartphone security', q2: 'social media account management phone' };
  if (/マーケティング|SNS/.test(title)) return { q1: 'social media marketing strategy business', q2: 'digital marketing team office success' };
  return { q1: 'instagram marketing smartphone business', q2: 'social media content creator lifestyle' };
}

async function fetchPexels(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const d = await r.json();
  if (!d.photos?.length) throw new Error(`No Pexels results: "${query}"`);
  return d.photos[0];
}

async function uploadPhoto(photo, filenameBase) {
  const url = photo.src.large2x ?? photo.src.large;
  const ext = (url.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const filename = `pexels-${photo.id}-${filenameBase}.${ext}`;
  const buf = await (await fetch(url)).arrayBuffer();
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/jpeg' }), filename);
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms-management.io/api/v1/media`, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY },
    body: fd,
  });
  if (!r.ok) throw new Error(`Upload ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { url: data.url, alt: photo.alt || photo.photographer, credit: photo.photographer };
}

// ─── AI rewrite ───────────────────────────────────────────────────────────────

async function aiRewrite(article, rawText) {
  const prompt = `あなたは日本語SEO・Instagramマーケティング専門ライターです。以下の記事をリライトしてください。

## 記事情報
タイトル: ${article.title}
元記事本文（先頭8000文字）:
${rawText.slice(0, 8000)}

## 出力要件
- 文字数: HTMLタグを除いた日本語テキストで8,000字以上
- タイトル: 50〜60文字（2026年を含む場合は「2026年」に統一）
- H2: 6〜8個（絵文字なし）
- H3: 各H2に2〜4個（絵文字なし）
- /post/* のURLは /blog/* に置換

## 冒頭固定構造（必須）
最初のH2の前に以下の順序で書くこと:
1. **結論先出し**（1〜2文）: キーワードへの直接回答
2. **定義文**（1文）: 「〇〇とは、～のことです」形式
3. **対象読者**（1文）: 「この記事は、～な方に向けてまとめています」形式
※「この記事でわかること」「目次」「CTA」はスクリプトが自動追加するため含めない

## COCOマーケのサービス範囲（必須遵守）
COCOマーケが提供するのは「Instagramアカウントの設計・運用支援」のみ。
以下はCOCOマーケでは提供していないため、提供を示唆する表現は使わないこと：
- インフルエンサーマーケティング・インフルエンサー起用（紹介記事はOK）
- PPC・Google広告・Yahoo!広告・Facebook広告・LINE広告の運用代行
- LP（ランディングページ）制作・Web制作
- SEOコンサルティング

## 被リンク獲得・引用されやすい記事設計
SEO上位だけでなく、他社メディア・法人ブログ・note・比較記事・生成AIの回答から引用・参照されやすい構成を意識すること。

- 記事中に**短く引用しやすい結論文**を1〜2文で入れる
- 以下から1つ以上を記事に含める:
  - 比較表（他サイトが参照したくなる整理）
  - よくある失敗の体系化
  - 数値・指標の定義と目安値（例：「視聴完了率70%以上が目安」）
  - Before/Afterで変化を示す
  - 業界・業種別の傾向分析
  - チェックリスト
  - 用語の違いの明文化
- タイトルに「保存版」「比較」「業種別」「調査」等を活用し内容価値を明示する

## FAQ セクション（必須・まとめの直前に配置）
「合わせて読みたい記事」セクションの後・まとめの前に以下の形式で必ず含めること:

<h2 id="h-faq">よくある質問（FAQ）</h2>
<h3>Q1. [記事テーマに特有の具体的な質問（検索クエリに近い言い回し）]</h3>
<p>[結論を1文で先に。補足説明を続ける。「本記事で解説しています」で終わらせない]</p>
...5〜6問

- 汎用テンプレート禁止（「基本設定を整えてから始めましょう」等の抽象回答NG）
- 回答は「結論→補足」の順（生成AIが引用しやすい形式）

## 関連記事リンクブロック（必須・まとめの直前）
FAQセクションの後・まとめの前に挿入:

<h2>合わせて読みたい記事</h2>
<ul>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
  <li><a href="/blog/[slug]/" target="_blank">[記事タイトル]</a></li>
</ul>

※下記内部リンクリストから記事テーマに最も近い3記事を選ぶ

## AI臭を消すルール
- 同じ文型を連続させない
- 「まず」「次に」「最後に」を多用しない
- 「重要です」だけで終わらせず、何がどう重要かを書く
- 抽象論だけで段落を埋めない（判断基準・例・失敗例・注意点を入れる）
- 一般論の焼き直しではなく、他サイトが参照理由を持てる情報を入れる
- 事実不明な数値・事例は捏造しない（数値がない場合は「定性的傾向」として明記する）

## ビジュアル要素（本文内に含めること）
- 💡 blockquote（ヒント・メリット系）: 1〜2個
  例: <blockquote><p><strong>💡 ポイント</strong></p><p>説明文</p></blockquote>
- ⚠️ blockquote（注意・リスク系）: 1個
  例: <blockquote><p><strong>⚠️ 注意</strong></p><p>説明文</p></blockquote>
- テーブルがある場合: 見出し行・列は<th>、セル内に<p>タグは使わない

## 内部リンク（文脈に合わせて3記事以上自然にリンク）
- /blog/instagram-collab-post-guide-2025（コラボ機能）
- /blog/instagram-like-limit-account-suspension（アクション制限）
- /blog/instagram-algorithm-latest-complete-guide（アルゴリズム）
- /blog/instagram-follower-methods（フォロワー増加）
- /blog/instagram-reels-tips-to-go-viral-2025（リール）
- /blog/instagram-hashtag-5-limit-2025（ハッシュタグ）
- /blog/instagram-insights-guide-2025（インサイト分析）
- /blog/instagram-profile-strategy-2025（プロフィール）
- /blog/instagram-story-strategy-2025（ストーリー）
- /blog/instagram-ads-cost-strategy-2025-trends-success（Instagram広告）
（記事テーマに最も関連する3記事以上を選んでリンク。既に記事内にリンクがある場合は保持）

## 出力形式
以下のデリミタ形式で出力すること（JSONは使わない）:

===TITLE===
新タイトル（50〜60文字）
===CONTENT===
HTML本文（わかること・目次・CTAは含めない。冒頭固定構造→本文→合わせて読みたい記事→FAQ→まとめ の順で書く）
===END===`;

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{ role: 'user', content: prompt }],
  });
  const text = msg.content[0].text;

  const titleMatch = text.match(/===TITLE===\s*([\s\S]*?)\s*===CONTENT===/);
  const contentMatch = text.match(/===CONTENT===\s*([\s\S]*?)(?:\s*===END===|$)/);
  if (titleMatch && contentMatch) {
    return { title: titleMatch[1].trim(), content: contentMatch[1].trim() };
  }
  // Fallback: JSON parse
  try {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
  } catch {}
  throw new Error(`AI parse failed. stop_reason=${msg.stop_reason}`);
}

// ─── microCMS ─────────────────────────────────────────────────────────────────

async function fetchContent(id) {
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${id}?fields=id,title,content`, {
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY },
  });
  if (!r.ok) throw new Error(`Fetch ${r.status}`);
  return r.json();
}

async function patchContent(id, content) {
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return r;
}

async function fetchAllArticles() {
  const r = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs?limit=100&fields=id,title&orders=-publishedAt`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY } }
  );
  return (await r.json()).contents ?? [];
}

// ─── Process single article ───────────────────────────────────────────────────

async function processArticle(article) {
  const { id, title } = article;

  // 1. Fetch current content
  process.stdout.write(`  取得...`);
  const data = await fetchContent(id);
  const rawCmsBody = data.content ?? '';
  const cleanedBody = stripOldElements(rawCmsBody);
  const h2s = extractH2s(cleanedBody);
  const h3s = extractH3s(cleanedBody);
  process.stdout.write(` OK (H2×${h2s.length})\n`);

  let newTitle = title;
  let contentBody = fixPostLinks(cleanedBody);

  // 2. AI rewrite
  if (anthropic) {
    process.stdout.write(`  AI リライト (Sonnet)...`);
    try {
      const ai = await aiRewrite({ id, title }, stripHtml(cleanedBody));
      newTitle = ai.title || title;
      contentBody = fixPostLinks(ai.content);
      const charCount = contentBody.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
      process.stdout.write(` OK (${charCount}字)\n`);
    } catch (e) {
      process.stdout.write(` fallback: ${e.message.slice(0, 50)}\n`);
    }
  } else {
    process.stdout.write(`  (Anthropic APIキー未設定 — 構造修正のみ)\n`);
  }

  // 3. Pexels photos
  process.stdout.write(`  Pexels取得・アップロード...`);
  const { q1, q2 } = makePexelsQueries(newTitle);
  const shortId = id.slice(0, 10);
  let photo1 = null, photo2 = null;
  try { photo1 = await uploadPhoto(await fetchPexels(q1), `${shortId}-1`); } catch(e) { process.stdout.write(`[P1失敗]`); }
  await sleep(500);
  try { photo2 = await uploadPhoto(await fetchPexels(q2, 2), `${shortId}-2`); } catch(e) { process.stdout.write(`[P2失敗]`); }
  process.stdout.write(` OK\n`);

  const imgTag1 = photo1
    ? `<figure><img src="${photo1.url}" alt="${photo1.alt}" loading="lazy"><figcaption>Photo by ${photo1.credit} / Pexels</figcaption></figure>`
    : '';
  const imgTag2 = photo2
    ? `<figure><img src="${photo2.url}" alt="${photo2.alt}" loading="lazy"><figcaption>Photo by ${photo2.credit} / Pexels</figcaption></figure>`
    : '';

  // 4. Assemble: images → H2 IDs → tip/warning → CTAs
  const bodyWithImages = injectImages(contentBody, imgTag1, imgTag2);
  const newH2s = extractH2s(bodyWithImages);
  const bodyWithIds  = makeH2IdsInBody(bodyWithImages, newH2s);
  const bodyWithBlocks = injectTipWarning(bodyWithIds, newH2s);
  const bodyWithCtas = injectCTAs(bodyWithBlocks);

  // 5. Wrap with わかること + 目次 + body + FAQ（AI生成済みなら追加しない）
  const effectiveH2s = newH2s.length ? newH2s : h2s;
  const wakaruBox = effectiveH2s.length >= 2 ? makeWakaruBox(effectiveH2s) : '';
  const toc       = effectiveH2s.length >= 2 ? makeToc(effectiveH2s) : '';
  const hasAiFaq = /よくある質問|h-faq/i.test(bodyWithCtas);
  const faq = hasAiFaq ? '' : generateFaq(newTitle, effectiveH2s, h3s);

  const parts = [wakaruBox, toc, bodyWithCtas, faq].filter(Boolean);
  const finalContent = parts.join('\n\n');

  // 6. PATCH
  process.stdout.write(`  microCMS PATCH...`);
  const res = await patchContent(id, finalContent);
  const charCount = finalContent.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  process.stdout.write(` ${res.ok ? '✅' : '❌'} (${res.status}) | ${charCount}字\n`);
  if (!res.ok) console.error('  PATCH error:', await res.text());

  return { id, ok: res.ok, chars: charCount };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const onlyId = process.argv.find(a => a.startsWith('--only='))?.slice(7);
  const dryRun = process.argv.includes('--dry-run');

  console.log('═'.repeat(64));
  console.log('SEO Batch Rewrite v4  |  COCOマーケ blogs');
  console.log(`AI: ${anthropic ? 'Claude Sonnet (8000字目標)' : '❌ 未設定 — ANTHROPIC_API_KEY が必要'}`);
  console.log('CTA: ダークカード（🌙なし・cocomarke.com/contactリンクで検出）');
  console.log('Image: Pexels 2枚/記事');
  if (onlyId) console.log(`Target: ${onlyId} のみ`);
  if (dryRun) console.log('DRY RUN: PATCHしません');
  console.log('═'.repeat(64));

  const all = await fetchAllArticles();
  const pending = onlyId
    ? all.filter(a => a.id === onlyId)
    : all.filter(a => !SKIP_IDS.has(a.id));

  console.log(`\n対象: ${pending.length}件（スキップ: ${SKIP_IDS.size}件 / 全${all.length}件）\n`);

  let success = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < pending.length; i++) {
    const article = pending[i];
    console.log(`[${i+1}/${pending.length}] ${article.id}`);
    console.log(`  タイトル: ${article.title.slice(0, 50)}`);
    try {
      if (!dryRun) {
        const r = await processArticle(article);
        if (r.ok) success++; else { fail++; failed.push(article.id); }
      } else {
        console.log('  [DRY RUN skip]');
      }
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
      fail++;
      failed.push(article.id);
    }
    if (i < pending.length - 1) {
      process.stdout.write(`  次まで ${DELAY_MS/1000}秒待機...\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '═'.repeat(64));
  console.log(`完了: 成功 ${success}件 / 失敗 ${fail}件 / 合計 ${pending.length}件`);
  if (failed.length) console.log('失敗記事:', failed.join(', '));
  console.log('═'.repeat(64));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
