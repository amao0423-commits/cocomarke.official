/**
 * seo-rewrite-thin.mjs — 6000字未満の記事だけAIリライト（6000字以上に）
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/seo-rewrite-thin.mjs
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/seo-rewrite-thin.mjs --only=<id>
 *   node scripts/seo-rewrite-thin.mjs --check   # 文字数確認のみ（PATCH なし）
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_KEY    = 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const MICROCMS_DOMAIN = 'cocomarke';
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY ?? '';
const PEXELS_KEY      = 'NmEpHgSEbtq6tK5wEd3OziJm101VLGpyeYqV5ZMxhIrMtScj9WNjcN5Z';
const DELAY_MS        = 8000;
const MIN_CHARS       = 6000;

const SKIP_IDS = new Set([
  'ppc-advertising-beginners-success-guide',
  'insta-influencer-marketing-guide',
  'instagram-mention-how-to',
]);

const CTA_MID = `<blockquote><p><strong>Instagram運用についてのご相談はこちら</strong></p><p>COCOマーケでは、アカウント設計から運用代行まで無料でご相談いただけます。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_END = `<blockquote><p><strong>Instagramアカウントの運用でお困りですか？</strong></p><p>COCOマーケでは無料相談を実施中です。専任マネージャーが最適なプランをご提案します。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;

const anthropic = ANTHROPIC_KEY ? new Anthropic({ apiKey: ANTHROPIC_KEY }) : null;

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const countChars = html => html.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
const stripHtml = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const fixPostLinks = html => html.replace(/href="(https?:\/\/www\.cocomarke\.com)?\/post\//g, 'href="/blog/');

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

// ─── Strip existing SEO wrappers (keep body) ──────────────────────────────────

function stripWrappers(html) {
  let r = html;
  r = r.replace(/<h2[^>]*>\s*この記事でわかること\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*目次\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*よくある質問[（(]?FAQ[）)]?\s*<\/h2>[\s\S]*?(?=<h2[^>]*>\s*(?:まとめ|合わせて読みたい)|$)/gi, '');
  r = r.replace(/<blockquote>[\s\S]*?(?:cocomarke\.com\/contact|cocomake-guide\.com)[\s\S]*?<\/blockquote>/gi, '');
  r = r.replace(/<figure[^>]*>[\s\S]*?pexels[\s\S]*?<\/figure>/gi, '');
  r = r.replace(/<p><br><\/p>/g, '').replace(/<p> <\/p>/g, '');
  return r.trim();
}

// ─── SEO wrappers ─────────────────────────────────────────────────────────────

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
  const all = [...h2s, ...h3s].filter(h => h.length > 4);
  for (const h of all) {
    if (pairs.length >= 5) break;
    if (/とは/.test(h))
      pairs.push({ q: `${h.replace(/とは.*/, '')}とは何ですか？`, a: `${h.replace(/とは.*/, '')}とは、${stripHtml(title)}に関連する重要な概念です。本記事の該当セクションで基本から実践まで詳しく解説しています。` });
    else if (/方法|やり方|手順|コツ|ポイント/.test(h))
      pairs.push({ q: `${h}を実践するコツはありますか？`, a: `${h}では、①目標の明確化②継続的な実施③データによる改善の3ステップが重要です。詳細は本記事の該当セクションをご確認ください。` });
    else if (/メリット|デメリット|注意|リスク/.test(h))
      pairs.push({ q: `${h}で特に注意すべきポイントは？`, a: `最も重要なのはInstagramの利用規約を守り、ユーザーにとって価値のあるコンテンツを継続的に発信することです。` });
  }
  if (pairs.length < 3) {
    pairs.push({ q: `${base}は初心者でも効果が出せますか？`, a: `はい、基本設定と継続運用を心がければ初心者でも十分な効果が得られます。COCOマーケのInstagram運用代行も初心者・中小企業を多数サポートしてきました。` });
    pairs.push({ q: `効果が出るまでどのくらいかかりますか？`, a: `アカウント状況や施策の質によりますが、継続運用で1〜3ヶ月で効果が見え始め、3〜6ヶ月で明確な成果が現れることが多いです。週次でインサイトを確認しながら改善を繰り返すことが大切です。` });
    pairs.push({ q: `運用に不安があります。どうすればいいですか？`, a: `COCOマーケでは、Instagramアカウントの設計・運用改善に関する無料相談を実施しています。現状の課題をヒアリングして最適な改善策をご提案します。` });
  }
  const items = pairs.slice(0, 5).map((p, i) => `<h3>Q${i+1}. ${p.q}</h3>\n<p>${p.a}</p>`).join('\n\n');
  return `<h2 id="h-faq">よくある質問（FAQ）</h2>\n${items}`;
}

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
  if (/プロフィール/.test(title)) return { q1: 'instagram profile smartphone lifestyle', q2: 'social media personal branding' };
  if (/保存|ダウンロード/.test(title)) return { q1: 'smartphone saving photos download', q2: 'mobile app storage digital content' };
  if (/コラボ|共同/.test(title)) return { q1: 'collaboration business partnership team', q2: 'social media collab content creators' };
  if (/アカウント|凍結|停止/.test(title)) return { q1: 'instagram account smartphone security', q2: 'social media account management phone' };
  return { q1: 'instagram marketing smartphone business', q2: 'social media content creator lifestyle' };
}

async function fetchPexels(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const d = await r.json();
  if (!d.photos?.length) throw new Error(`No results: "${query}"`);
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
元記事本文（先頭6000文字）:
${rawText.slice(0, 6000)}

## 出力要件
- 文字数: HTMLタグを除いた日本語テキストで**6,000字以上**（できれば6,500〜7,500字が理想）
- H2: 5〜7個（絵文字なし）
- H3: 各H2に2〜3個（絵文字なし）
- 各H2冒頭: 100〜150字で要点を先出し（逆ピラミッド構造）
- /post/* URLは /blog/* に置換

## 冒頭固定構造（必須）
最初のH2の前に以下の順序で書くこと:
1. **結論先出し**（1〜2文）: キーワードへの直接回答
2. **定義文**（1文）: 「〇〇とは、～のことです」形式
3. **対象読者**（1文）: 「この記事は、～な方に向けてまとめています」形式
※「この記事でわかること」「目次」「CTA」はスクリプトが自動追加するため含めない

## COCOマーケのサービス範囲（必須遵守）
COCOマーケが提供するのは「Instagramアカウントの設計・運用支援」のみ。
以下はCOCOマーケでは**提供していない**ため、提供を示唆する表現は絶対に使わないこと：
- インフルエンサーマーケティング・インフルエンサー起用（紹介記事はOK）
- PPC・Google広告・Yahoo!広告・Facebook広告・LINE広告の運用代行
- LP（ランディングページ）制作・Web制作
- SEOコンサルティング

## 被リンク獲得・引用されやすい記事設計
SEO上位だけでなく、他社メディア・法人ブログ・note・比較記事・生成AIの回答から引用・参照されやすい構成を意識すること。

- 冒頭に**定義文**を置く（例：「〇〇とは、△△のことです」）
- 記事中に**短く引用しやすい結論文**を1〜2文で入れる
- 以下から1つ以上を記事に含める:
  - 比較表（他サイトが参照したくなる整理）
  - よくある失敗の体系化
  - 業界・業種別の傾向分析
  - 数値・指標の定義と目安値
  - Before/Afterで変化を示す
  - チェックリスト
  - 用語の違いの明文化
- タイトルに「2026年版」「保存版」「比較」「業種別」等を活用し、内容価値が一目でわかるようにする

## FAQ セクション（必須・まとめの直前に配置）
「合わせて読みたい記事」セクションの後・まとめの前に以下の形式で必ず含めること:

<h2 id="h-faq">よくある質問（FAQ）</h2>
<h3>Q1. [記事テーマに特有の具体的な質問（検索クエリに近い言い回し）]</h3>
<p>[結論を1文で先に。補足説明を続ける。「本記事で解説しています」で終わらせない]</p>
...5〜6問

- 汎用テンプレート禁止（抽象的な回答NG）
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
- 不自然に整いすぎた教科書調を避ける

## ビジュアル要素（本文内に必ず含めること）
- 💡 blockquote（ヒント・メリット系）: 1〜2個
  <blockquote><p><strong>💡 ポイント</strong></p><p>説明文（具体的に）</p></blockquote>
- ⚠️ blockquote（注意・リスク系）: 1個
  <blockquote><p><strong>⚠️ 注意</strong></p><p>説明文（具体的に）</p></blockquote>
- テーブルがある場合: ヘッダー行・列は<th>のみ使用（<p>タグはセル内に入れない）
- リスト: <ul>はCSSで▶自動表示 → 絵文字重複禁止。<ol>は数字自動 → ①②重複禁止

## 内部リンク（文脈に合った3記事以上を自然にリンク）
- /blog/instagram-collab-post-guide-2025（コラボ機能）
- /blog/instagram-like-limit-account-suspension（アクション制限・凍結）
- /blog/instagram-algorithm-latest-complete-guide（アルゴリズム）
- /blog/insta-influencer-marketing-guide（インフルエンサーマーケティング）
- /blog/instagram-follower-methods（フォロワー増加）
- /blog/instagram-reels-tips-to-go-viral-2025（リール）
- /blog/instagram-hashtag-5-limit-2025（ハッシュタグ）
- /blog/instagram-insights-guide-2025（インサイト分析）
- /blog/instagram-profile-strategy-2025（プロフィール）
- /blog/instagram-story-strategy-2025（ストーリー）
- /blog/ppc-advertising-beginners-success-guide（PPC広告入門）

## 禁止事項
- H2・H3への絵文字追加
- <pre><code>ブロックの使用（blockquote/tableに置き換える）
- <p><br></p>の空行
- divタグのstyle属性
- 汎用テンプレート文「〇〇とは、〇〇を活用して成果を出す手法のことです」
- 事実不明な数値・事例の捏造（数値がない場合は「定性的傾向」として明記すること）

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

  // Try delimiter format first (===END=== optional in case of truncation)
  const titleMatch = text.match(/===TITLE===\s*([\s\S]*?)\s*===CONTENT===/);
  const contentMatch = text.match(/===CONTENT===\s*([\s\S]*?)(?:\s*===END===|$)/);
  if (titleMatch && contentMatch) {
    return {
      title: titleMatch[1].trim(),
      content: contentMatch[1].trim(),
    };
  }

  // Fallback: try JSON parse
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
  } catch {}

  throw new Error(`AI parse failed. stop_reason=${msg.stop_reason} len=${text.length}`);
}

// ─── microCMS ─────────────────────────────────────────────────────────────────

async function fetchAllArticles() {
  const r = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs?limit=100&fields=id,title,content&orders=-publishedAt`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY } }
  );
  if (!r.ok) throw new Error(`fetchAll ${r.status}`);
  return (await r.json()).contents ?? [];
}

async function patchContent(id, content) {
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  return r;
}

// ─── Process single article ───────────────────────────────────────────────────

async function processArticle(article, checkOnly) {
  const { id, title, content: rawContent } = article;
  const currentChars = countChars(rawContent ?? '');

  if (checkOnly) {
    console.log(`  現在: ${currentChars}字 ${currentChars < MIN_CHARS ? '⚠️ 対象' : '✅ OK'}`);
    return { id, chars: currentChars, skipped: true };
  }

  // 1. AI rewrite
  process.stdout.write(`  AI リライト (Sonnet)...`);
  const cleanedBody = stripWrappers(rawContent ?? '');
  let newTitle = title;
  let contentBody = fixPostLinks(cleanedBody);

  try {
    const ai = await aiRewrite({ id, title }, stripHtml(cleanedBody));
    newTitle = ai.title || title;
    contentBody = fixPostLinks(ai.content ?? '');
    const c = countChars(contentBody);
    process.stdout.write(` OK (${c}字)\n`);
  } catch (e) {
    process.stdout.write(` ❌ ${e.message.slice(0, 60)}\n`);
    throw e;
  }

  // 2. Pexels
  process.stdout.write(`  Pexels...`);
  const { q1, q2 } = makePexelsQueries(newTitle);
  const shortId = id.slice(0, 10);
  let photo1 = null, photo2 = null;
  try { photo1 = await uploadPhoto(await fetchPexels(q1), `${shortId}-1`); } catch { process.stdout.write(`[P1失敗]`); }
  await sleep(500);
  try { photo2 = await uploadPhoto(await fetchPexels(q2, 2), `${shortId}-2`); } catch { process.stdout.write(`[P2失敗]`); }
  process.stdout.write(` OK\n`);

  const imgTag1 = photo1 ? `<figure><img src="${photo1.url}" alt="${photo1.alt}" loading="lazy"><figcaption>Photo by ${photo1.credit} / Pexels</figcaption></figure>` : '';
  const imgTag2 = photo2 ? `<figure><img src="${photo2.url}" alt="${photo2.alt}" loading="lazy"><figcaption>Photo by ${photo2.credit} / Pexels</figcaption></figure>` : '';

  // 3. Inject images (between H2s)
  const newH2s = extractH2s(contentBody);
  const newH3s = extractH3s(contentBody);
  let body = contentBody;
  const h2positions = [...body.matchAll(/<h2/gi)].map(m => m.index);
  if (h2positions.length >= 3 && imgTag1) {
    const p1 = h2positions[Math.floor(h2positions.length / 3)];
    body = body.slice(0, p1) + imgTag1 + '\n' + body.slice(p1);
    const h2positions2 = [...body.matchAll(/<h2/gi)].map(m => m.index);
    const p2 = h2positions2[Math.floor(h2positions2.length * 2 / 3)];
    if (imgTag2 && p2 !== p1) body = body.slice(0, p2) + imgTag2 + '\n' + body.slice(p2);
  } else if (imgTag1) {
    body = imgTag1 + '\n' + body + (imgTag2 ? '\n' + imgTag2 : '');
  }

  // 4. H2 IDs + CTAs
  const bodyWithIds = makeH2IdsInBody(body, newH2s);
  const bodyWithCtas = injectCTAs(bodyWithIds);

  // 5. わかること + 目次 + body + FAQ（AI生成済みなら追加しない）
  const effectiveH2s = newH2s.length ? newH2s : extractH2s(rawContent ?? '');
  const wakaruBox = effectiveH2s.length >= 2 ? makeWakaruBox(effectiveH2s) : '';
  const toc       = effectiveH2s.length >= 2 ? makeToc(effectiveH2s) : '';
  const hasAiFaq = /よくある質問|h-faq/i.test(bodyWithCtas);
  const faq = hasAiFaq ? '' : generateFaq(newTitle, effectiveH2s, newH3s);
  const finalContent = [wakaruBox, toc, bodyWithCtas, faq].filter(Boolean).join('\n\n');

  // 6. PATCH
  process.stdout.write(`  microCMS PATCH...`);
  const res = await patchContent(id, finalContent);
  const finalChars = countChars(finalContent);
  process.stdout.write(` ${res.ok ? '✅' : '❌'} (${res.status}) | ${finalChars}字\n`);
  if (!res.ok) console.error('  Error:', await res.text());

  return { id, ok: res.ok, chars: finalChars };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const onlyIds  = process.argv.filter(a => a.startsWith('--only=')).map(a => a.slice(7));
  const onlyId   = onlyIds[0]; // kept for compat
  const checkOnly = process.argv.includes('--check');

  console.log('═'.repeat(64));
  console.log('SEO Rewrite Thin  |  COCOマーケ blogs');
  console.log(`対象: ${MIN_CHARS}字未満の記事のみ`);
  if (checkOnly) {
    console.log('モード: 文字数チェックのみ（PATCH なし）');
  } else if (anthropic) {
    console.log('AI: Claude Sonnet（6,000字以上目標）');
  } else {
    console.error('❌ ANTHROPIC_API_KEY が設定されていません。');
    console.error('   ANTHROPIC_API_KEY=sk-ant-... node scripts/seo-rewrite-thin.mjs');
    process.exit(1);
  }
  console.log('═'.repeat(64));

  // Fetch all articles with content
  process.stdout.write('\n全記事取得中...');
  const all = await fetchAllArticles();
  process.stdout.write(` ${all.length}件\n`);

  // Filter: skip done, optionally filter by --only, filter by char count
  let pending = all.filter(a => !SKIP_IDS.has(a.id));
  if (onlyIds.length > 0) {
    const idSet = new Set(onlyIds);
    pending = pending.filter(a => idSet.has(a.id));
  } else {
    pending = pending.filter(a => countChars(a.content ?? '') < MIN_CHARS);
  }

  console.log(`\n対象: ${pending.length}件（${MIN_CHARS}字未満）`);
  if (pending.length === 0) {
    console.log('対象記事なし。完了。');
    return;
  }

  // Print list
  console.log('\n' + '─'.repeat(64));
  pending.forEach((a, i) => {
    const chars = countChars(a.content ?? '');
    console.log(`  ${i+1}. [${chars}字] ${a.id}`);
  });
  console.log('─'.repeat(64) + '\n');

  if (checkOnly) {
    console.log('（--check モード: PATCHは行いません）');
    return;
  }

  let success = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < pending.length; i++) {
    const article = pending[i];
    console.log(`[${i+1}/${pending.length}] ${article.id}`);
    console.log(`  タイトル: ${article.title.slice(0, 50)}`);
    console.log(`  現在: ${countChars(article.content ?? '')}字`);
    try {
      const r = await processArticle(article, false);
      if (r.ok) success++; else { fail++; failed.push(article.id); }
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
      fail++;
      failed.push(article.id);
    }
    if (i < pending.length - 1) {
      process.stdout.write(`  次まで ${DELAY_MS/1000}秒待機...\n\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log('\n' + '═'.repeat(64));
  console.log(`完了: 成功 ${success}件 / 失敗 ${fail}件 / 合計 ${pending.length}件`);
  if (failed.length) console.log('失敗記事:', failed.join(', '));
  console.log('═'.repeat(64));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
