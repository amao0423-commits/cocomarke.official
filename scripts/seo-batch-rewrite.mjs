/**
 * SEO Batch Rewrite v3 — full-pipeline rewrite for all microCMS blog articles
 *
 * Per-article process:
 *  1. Fetch HTML from public URL
 *  2. Strip previously added SEO wrappers
 *  3. Extract original H2/H3 headings
 *  4. Rewrite title (structural or AI)
 *  5. Generate 2 article-specific SVG infographics, upload to microCMS
 *  6. Inject images into body at ~1/3 and ~2/3 H2 section boundaries
 *  7. Inject tip/warning blocks at relevant H2 sections (max 1 each)
 *  8. Inject CTAs
 *  9. Wrap: definition → わかること → 目次 → body → FAQ
 * 10. PATCH microCMS
 *
 * Run single article: node seo-batch-rewrite.mjs --only=<article-id>
 */

import Anthropic from '@anthropic-ai/sdk';

const MICROCMS_API_KEY  = process.env.MICROCMS_API_KEY  ?? 'qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5';
const MICROCMS_DOMAIN   = process.env.MICROCMS_SERVICE_DOMAIN ?? 'cocomarke';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? '';
const PEXELS_API_KEY    = process.env.PEXELS_API_KEY    ?? 'NmEpHgSEbtq6tK5wEd3OziJm101VLGpyeYqV5ZMxhIrMtScj9WNjcN5Z';

const SITE_BASE = 'https://www.cocomarke.com';
const DELAY_MS  = 4000;

const CTA1 = `<blockquote><p>COCOマーケでは無料相談を実施中です。お気軽にご連絡ください。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a></p></blockquote>`;
const CTA2 = `<blockquote><p>サービス資料を無料でダウンロードいただけます。</p><p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p></blockquote>`;
const CTA3 = `<blockquote><p>COCOマーケでは無料相談を実施中です。専任マネージャーが最適なプランをご提案します。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a></p><p>　／　</p><p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p></blockquote>`;

const anthropic = ANTHROPIC_API_KEY ? new Anthropic({ apiKey: ANTHROPIC_API_KEY }) : null;

// ─── Utilities ────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));
const stripHtml = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
const fixPostLinks = html => html.replace(/href="(https?:\/\/www\.cocomarke\.com)?\/post\//g, 'href="/blog/');

// ─── Strip previously added SEO elements ─────────────────────────────────────

function stripAddedElements(html) {
  let r = html;
  // Remove images/figures we previously inserted
  r = r.replace(/<figure[^>]*>[\s\S]*?(?:pexels-photo|svg-\w+|infographic|図解)[\s\S]*?<\/figure>/gi, '');
  r = r.replace(/<img[^>]*(?:pexels-photo|svg-\w+|infographic)[^>]*\/?>/gi, '');
  r = r.replace(/<h2[^>]*>\s*この記事でわかること\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*目次\s*<\/h2>[\s\S]*?(?=<h2|$)/gi, '');
  r = r.replace(/<h2[^>]*>\s*よくある質問（FAQ）\s*<\/h2>[\s\S]*/gi, '');
  r = r.replace(/<blockquote>[\s\S]*?(?:cocomarke\.com\/contact|cocomake-guide\.com)[\s\S]*?<\/blockquote>/gi, '');
  r = r.replace(/<p>[^<]*とは、[^<]*のことです[^<]*<\/p>/g, '');
  r = r.replace(/<h2[^>]*>\s*<br\s*\/?>\s*<\/h2>/gi, '');
  // Remove tip/warning blockquotes (v3 format: <strong>💡 or ⚠️ as first child)
  r = r.replace(/<blockquote>\s*<p>\s*<strong>(?:💡|⚠️)[^<]*<\/strong>[^<]*<\/p>[\s\S]{0,600}?<\/blockquote>/gi, '');
  return r.replace(/\n{3,}/g, '\n\n').trim();
}

// ─── Extract headings ─────────────────────────────────────────────────────────

const SKIP_H2 = /^(目次|この記事でわかること|よくある質問|FAQ|まとめ|おわりに|おすすめ記事|露出なら|COCOマーケ)/;

function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map(m => stripHtml(m[1]).replace(/^\d+\.\s*/, '').trim())
    .filter(t => t.length > 3 && !SKIP_H2.test(t));
}

function extractH3s(html) {
  return [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>/g)]
    .map(m => stripHtml(m[1]).replace(/^[①-⑩]\s*/, '').trim())
    .filter(t => t.length > 3);
}

// ─── Title helpers ────────────────────────────────────────────────────────────

function improveTitle(title) {
  const len = [...title].length;
  if (len >= 50) return title;
  if (/インスタ|Instagram/.test(title)) return `${title}｜2025年最新版・完全解説`;
  if (/マーケティング|SNS/.test(title)) return `${title}｜2025年最新・実践ガイド`;
  return `${title}｜2025年最新完全ガイド`;
}

function makeTopic(title) {
  const t = title;
  if (/アルゴリズム/.test(t)) return 'Instagramがコンテンツを評価・表示する仕組みや順位付けのルール';
  if (/リール|Reels/.test(t)) return 'Instagram上で最大90秒の縦型動画を投稿・閲覧できるショート動画機能';
  if (/ストーリー/.test(t)) return '24時間で自動的に消えるInstagramの短期間コンテンツ共有機能';
  if (/ハッシュタグ/.test(t)) return '「#」記号を付けた検索可能なキーワードタグ';
  if (/インサイト/.test(t)) return 'Instagramのプロアカウントで閲覧できる投稿・アカウントの統計データ';
  if (/広告|ads|PPC/.test(t)) return 'ターゲット層に向けて有料で配信できる宣伝・プロモーション手法';
  if (/DM|メッセージ/.test(t)) return 'Instagramユーザー間でやり取りできるダイレクトメッセージ機能';
  if (/フォロワー/.test(t)) return 'あなたのアカウントをフォローし投稿を受け取るユーザー';
  if (/SEO|検索/.test(t)) return 'Instagramの検索結果や発見タブに投稿を上位表示させる最適化施策';
  if (/運用代行/.test(t)) return 'SNS・Instagramアカウントの投稿・分析・改善を外部の専門会社に委託するサービス';
  if (/分析|ツール/.test(t)) return 'SNSアカウントのパフォーマンスを数値で把握・改善するための計測・解析手法';
  if (/集客|マーケティング/.test(t)) return '商品・サービスの認知拡大と顧客獲得を目的としたSNS活用戦略';
  return 'Instagramやソーシャルメディアを活用して成果を出す手法';
}

function makeDefinition(title) {
  const base = title.replace(/【[^】]*】/g,'').replace(/｜.*$/,'').replace(/[！？!?]/g,'').replace(/\d{4}年.*版/,'').replace(/完全ガイド|徹底解説|完全解説|徹底比較|完全攻略/,'').trim();
  return `<p>${base}とは、${makeTopic(title)}のことです。本記事では${base}の基本から実践的な活用法まで詳しく解説します。</p>`;
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
      new RegExp(`(<h2[^>]*>)\\s*(?:\\d+\\.\\s*)?${escaped}\\s*</h2>`),
      `$1<a id="h-s${i+1}"></a>${h}</h2>`
    );
  });
  return result;
}

function generateFaq(title, h2s, h3s) {
  const base = title.replace(/【[^】]*】/g,'').replace(/｜.*$/,'').trim().slice(0,20);
  const pairs = [
    {
      q: `${base}は初心者でも始められますか？`,
      a: `はい、始めることができます。${base}は基本設定から始めて少しずつ実践することが重要です。本記事で紹介した手順を参考に、まずは小さなステップから取り組んでください。COCOマーケでも無料相談を受け付けており、初心者の方を丁寧にサポートしています。`,
    },
    {
      q: `${base}で成果が出るまでどのくらいかかりますか？`,
      a: `アカウントの現状や施策の質によって異なりますが、一般的には1〜3ヶ月で効果が現れ始めます。継続的な投稿と分析・改善のサイクルを回すことで、3〜6ヶ月以内に明確な成果が見えてくることが多いです。`,
    },
  ];

  const all = [...h2s, ...h3s].filter(h => h.length > 4);
  for (const h of all) {
    if (pairs.length >= 8) break;
    const q = headingToQ(h);
    if (q) pairs.push({ q, a: `${h}については、本記事本文で詳しく解説しています。要点は「具体的な目標設定」「データをもとにした継続改善」「ユーザー目線のコンテンツ作り」の3点です。詳細は上記セクションをご参照ください。専門的なサポートが必要な場合は、COCOマーケの無料相談もご活用ください。` });
  }

  if (pairs.length < 6) {
    pairs.push({ q: `${base}でよくある失敗パターンと対策を教えてください。`, a: `よくある失敗として、①継続性のなさ（不定期投稿）②ターゲット設定の曖昧さ③データ分析をしない運用の3つが挙げられます。週次の投稿カレンダー作成・ターゲットペルソナの明確化・インサイトの定期チェックが効果的です。` });
    pairs.push({ q: `${base}はどのように外注・代行を活用すればいいですか？`, a: `外注を検討する場合は、自社のゴール（フォロワー増加・集客・ブランディング）を明確にしたうえで、強みを持つ会社を選ぶことが重要です。COCOマーケでは業種・規模に合わせたプランをご提案しています。まずは無料相談をご利用ください。` });
  }

  const items = pairs.slice(0, 6).map((p, i) => `<h3>Q${i+1}. ${p.q}</h3>\n<p>${p.a}</p>`).join('\n\n');
  return `<h2 id="h-faq">よくある質問（FAQ）</h2>\n${items}`;
}

function headingToQ(h) {
  if (/とは/.test(h)) return `${h.replace(/とは.*/, '')}とは何ですか？`;
  if (/方法|やり方|手順/.test(h)) return `${h}はどのように行えばいいですか？`;
  if (/ポイント|コツ|秘訣/.test(h)) return `${h}で押さえるべき重要なポイントは何ですか？`;
  if (/メリット|デメリット|注意/.test(h)) return `${h}について詳しく教えてください。`;
  if (/料金|費用|コスト/.test(h)) return `${h}はどのくらいかかりますか？`;
  if (/選び方|比較/.test(h)) return `${h}はどのように進めればいいですか？`;
  return null;
}

// ─── Tip / Warning blocks ─────────────────────────────────────────────────────

function makeTipBlock(topic) {
  return `<blockquote><p><strong>💡 ポイント</strong></p><p>「${topic}」を活用する際は、まず基本的な設定を確認してから実践することが大切です。小さなアクションを積み重ね、定期的に効果を振り返りながら改善を続けていきましょう。</p></blockquote>`;
}

function makeWarningBlock(topic) {
  return `<blockquote><p><strong>⚠️ 注意</strong></p><p>「${topic}」に対応する際は、Instagramの利用規約の範囲内で行動することが重要です。問題が解決しない場合は、公式ヘルプセンターへの問い合わせをご検討ください。</p></blockquote>`;
}

/**
 * Insert a tip block and/or warning block into article body.
 * - warning: after first </p> following an H2 that matches danger keywords
 * - tip: after first </p> following an H2 that matches positive keywords
 * Max 1 warning + 1 tip total per article.
 */
function injectTipWarning(html, h2s) {
  let result = html;
  let warningDone = false, tipDone = false;

  for (let i = 0; i < h2s.length; i++) {
    const h = h2s[i];
    const isWarning = !warningDone && /トラブル|注意|禁止|リスク|問題|デメリット|失敗|NG/.test(h);
    const isTip    = !tipDone    && i > 0 && /活用|ポイント|コツ|メリット|おすすめ|基本|方法|上手に/.test(h);

    if (!isWarning && !isTip) continue;

    // Find the H2 in HTML by anchor id (set by makeH2IdsInBody)
    const anchorTag = `id="h-s${i + 1}"`;
    let h2pos = result.indexOf(anchorTag);
    if (h2pos < 0) {
      // Fallback: match by text
      const escaped = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = result.match(new RegExp(`<h2[^>]*>(?:<a[^>]*>)?${escaped}`));
      if (m) h2pos = result.indexOf(m[0]);
    }
    if (h2pos < 0) continue;

    // Find first </p> after this H2
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

// ─── Content assembly ─────────────────────────────────────────────────────────

function injectCTAs(html) {
  const segs = html.split(/(?=<h2)/i);
  const n = segs.length;
  const p1 = Math.floor(n / 3);
  const p2 = Math.floor(n * 2 / 3);
  const out = [];
  let c1 = false, c2 = false;
  segs.forEach((s, i) => {
    out.push(s);
    if (i >= p1 && !c1) { out.push(CTA1); c1 = true; }
    else if (i >= p2 && !c2) { out.push(CTA2); c2 = true; }
  });
  return out.join('') + '\n' + CTA3;
}

/**
 * Inject image figure tags into original body HTML at ~1/3 and ~2/3 H2 positions.
 * Uses Shopify-style natural figure presentation.
 */
function injectImagesIntoBody(html, imgTag1, imgTag2) {
  const positions = [...html.matchAll(/<h2/gi)].map(m => m.index);
  if (positions.length === 0) {
    const paras = html.split(/<\/p>/i);
    const n = paras.length;
    const i1 = Math.floor(n / 3);
    const i2 = Math.floor(n * 2 / 3);
    return paras.map((p, i) => {
      let out = p + (i < paras.length - 1 ? '</p>' : '');
      if (i === i1) out += '\n' + imgTag1 + '\n';
      if (i === i2) out += '\n' + imgTag2 + '\n';
      return out;
    }).join('');
  }

  const startIdx = positions.length > 2 ? 1 : 0;
  const range = positions.length - startIdx;
  const insertIdx1 = startIdx + Math.max(1, Math.floor(range / 3));
  const insertIdx2 = startIdx + Math.max(insertIdx1 - startIdx + 1, Math.floor(range * 2 / 3));

  const pos1 = positions[Math.min(insertIdx1, positions.length - 1)];
  const pos2 = positions[Math.min(insertIdx2, positions.length - 1)];

  if (pos1 === pos2) {
    return html.slice(0, pos1) + imgTag1 + '\n' + imgTag2 + '\n' + html.slice(pos1);
  }
  return html.slice(0, pos1) + imgTag1 + '\n' + html.slice(pos1, pos2) + imgTag2 + '\n' + html.slice(pos2);
}

// ─── Pexels photo fetch & upload ─────────────────────────────────────────────

/**
 * Map article title to 2 distinct Pexels search queries.
 * q1 = used for image at ~1/3 of article, q2 = image at ~2/3.
 */
function makePexelsQueries(title, h2s) {
  const t = title;
  if (/PPC|ペイパークリック|リスティング/.test(t))
    return { q1: 'pay per click digital advertising laptop', q2: 'online marketing analytics dashboard' };
  if (/リール|Reels/.test(t))
    return { q1: 'smartphone video content creator', q2: 'social media video production studio' };
  if (/ストーリー|Story/.test(t))
    return { q1: 'instagram stories smartphone creative', q2: 'social media content lifestyle' };
  if (/ハッシュタグ/.test(t))
    return { q1: 'social media hashtag trending phone', q2: 'instagram content strategy laptop' };
  if (/アルゴリズム/.test(t))
    return { q1: 'social media algorithm data technology', q2: 'digital marketing analytics computer' };
  if (/広告|ads/.test(t))
    return { q1: 'digital advertising marketing office', q2: 'business campaign results success' };
  if (/分析|ツール|インサイト/.test(t))
    return { q1: 'data analytics business dashboard', q2: 'marketing metrics chart laptop' };
  if (/フォロワー/.test(t))
    return { q1: 'instagram followers growth engagement', q2: 'social media community building' };
  if (/DM|メッセージ/.test(t))
    return { q1: 'smartphone messaging chat digital', q2: 'business communication mobile app' };
  if (/運用代行/.test(t))
    return { q1: 'social media management team office', q2: 'digital marketing agency strategy' };
  if (/集客|マーケティング/.test(t))
    return { q1: 'digital marketing strategy business', q2: 'social media growth success office' };
  if (/SEO|検索/.test(t))
    return { q1: 'search engine optimization laptop', q2: 'content marketing strategy business' };
  // default instagram marketing
  return { q1: 'instagram marketing smartphone business', q2: 'social media content creator lifestyle' };
}

async function fetchPexelsPhoto(query, page = 1) {
  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );
  if (!res.ok) throw new Error(`Pexels API ${res.status}`);
  const data = await res.json();
  if (!data.photos?.length) throw new Error(`Pexels no results: "${query}"`);
  return data.photos[0];
}

async function downloadAndUploadPhoto(photo, filenameBase) {
  const imgUrl = photo.src.large2x ?? photo.src.large;
  const ext = (imgUrl.split('?')[0].split('.').pop() || 'jpg').toLowerCase();
  const filename = `pexels-photo-${photo.id}-${filenameBase}.${ext}`;

  const imgRes = await fetch(imgUrl);
  if (!imgRes.ok) throw new Error(`Pexels download ${imgRes.status}`);
  const buffer = await imgRes.arrayBuffer();

  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType }), filename);

  const uploadRes = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms-management.io/api/v1/media`,
    { method: 'POST', headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY }, body: formData }
  );
  if (!uploadRes.ok) throw new Error(`Upload ${uploadRes.status}: ${await uploadRes.text()}`);
  const data = await uploadRes.json();
  return { url: data.url, alt: photo.alt || photo.photographer, credit: photo.photographer };
}

// ─── microCMS PATCH ───────────────────────────────────────────────────────────

async function patchArticle(contentId, title, content) {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${contentId}`,
    {
      method: 'PATCH',
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    }
  );
  return { ok: res.ok, status: res.status, text: await res.text() };
}

// ─── Fetch from public URL ────────────────────────────────────────────────────

async function fetchArticleHTML(id) {
  const res = await fetch(`${SITE_BASE}/blog/${id}/`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COCOBot/3.0)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

function extractCMSBody(html) {
  const start = html.indexOf('<div class="cms-body">');
  if (start < 0) return '';
  const section = html.slice(start);
  const endIdx = section.indexOf('<aside');
  return endIdx > 0 ? section.slice(0, endIdx) : section.slice(0, 60000);
}

// ─── Fetch all articles ───────────────────────────────────────────────────────

async function fetchAllArticles() {
  const res = await fetch(
    `https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs?limit=100&fields=id,title&orders=-publishedAt`,
    { headers: { 'X-MICROCMS-API-KEY': MICROCMS_API_KEY } }
  );
  const data = await res.json();
  return data.contents ?? [];
}

// ─── AI rewrite (optional) ───────────────────────────────────────────────────

async function aiRewrite(article, rawText, h2s) {
  const prompt = `日本語SEOライターとして、以下の記事をリライトしてください。
元記事タイトル: ${article.title}
元記事本文（先頭6000文字）: ${rawText.slice(0,6000)}
条件: タイトル50〜60文字・/post/*→/blog/*に置換・H2/H3構成を論理整理・最低3000文字
出力: JSON {"title":"...","content":"HTML本文のみ（定義文・わかること・FAQ・CTA含めない）"}`;

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });
  const match = msg.content[0].text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI parse failed');
  return JSON.parse(match[0]);
}

// ─── Process single article ───────────────────────────────────────────────────

async function processArticle(article) {
  const { id, title } = article;
  process.stdout.write(`  取得...`);

  const pageHtml = await fetchArticleHTML(id);
  const rawCmsBody = extractCMSBody(pageHtml);
  const cleanedBody = stripAddedElements(rawCmsBody);
  const h2s = extractH2s(cleanedBody);
  const h3s = extractH3s(cleanedBody);

  process.stdout.write(` OK (H2×${h2s.length})\n`);

  let newTitle = improveTitle(title);
  let contentBody = fixPostLinks(cleanedBody);

  if (anthropic) {
    process.stdout.write(`  AI リライト...`);
    try {
      const ai = await aiRewrite(article, stripHtml(cleanedBody), h2s);
      newTitle = ai.title;
      contentBody = fixPostLinks(ai.content);
      process.stdout.write(` OK\n`);
    } catch (e) {
      process.stdout.write(` fallback (${e.message.slice(0,40)})\n`);
    }
  }

  // Fetch 2 Pexels photos with different keyword queries
  process.stdout.write(`  Pexels写真取得・アップロード...`);
  const { q1, q2 } = makePexelsQueries(newTitle, h2s);
  const shortId = id.slice(0, 12);

  let photo1 = null, photo2 = null;
  try { photo1 = await downloadAndUploadPhoto(await fetchPexelsPhoto(q1), `${shortId}-1`); } catch(e) { process.stdout.write(`[P1失敗:${e.message.slice(0,30)}]`); }
  await sleep(600);
  // Use page=2 for second query to avoid the same top result if queries are similar
  try { photo2 = await downloadAndUploadPhoto(await fetchPexelsPhoto(q2, 1), `${shortId}-2`); } catch(e) { process.stdout.write(`[P2失敗:${e.message.slice(0,30)}]`); }
  process.stdout.write(` OK\n`);

  // Shopify-style figure tags (margin/shadow handled by CSS in [id].astro)
  const imgTag1 = photo1
    ? `<figure style="text-align:center;"><img src="${photo1.url}" alt="${photo1.alt}" loading="lazy"><figcaption>Photo by ${photo1.credit} / Pexels</figcaption></figure>`
    : '';
  const imgTag2 = photo2
    ? `<figure style="text-align:center;"><img src="${photo2.url}" alt="${photo2.alt}" loading="lazy"><figcaption>Photo by ${photo2.credit} / Pexels</figcaption></figure>`
    : '';

  // Inject images at ~1/3 and ~2/3 of original body sections
  const bodyWithImages = injectImagesIntoBody(contentBody, imgTag1, imgTag2);

  // Add anchor IDs to H2s for TOC links
  const bodyWithIds = makeH2IdsInBody(bodyWithImages, h2s);

  // Inject tip/warning blocks (max 1 each, at relevant H2 sections)
  const bodyWithBlocks = injectTipWarning(bodyWithIds, h2s);

  // Inject CTAs
  const bodyWithCtas = injectCTAs(bodyWithBlocks);

  // Assemble final content
  const definition = makeDefinition(newTitle);
  const wakaruBox  = makeWakaruBox(h2s.length ? h2s : ['記事の内容をご確認ください']);
  const toc        = makeToc(h2s.length ? h2s : []);
  const faq        = generateFaq(newTitle, h2s, h3s);

  const finalContent = [definition, wakaruBox, toc, bodyWithCtas, faq].join('\n\n');

  process.stdout.write(`  microCMS PATCH...`);
  const result = await patchArticle(id, newTitle, finalContent);
  process.stdout.write(` ${result.ok ? '✅' : '❌'} (${result.status})\n`);

  return { id, patchOk: result.ok, img1: photo1?.url, img2: photo2?.url };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const onlyId = process.argv.find(a => a.startsWith('--only='))?.slice(7);

  console.log('═'.repeat(64));
  console.log('SEO Batch Rewrite v3  |  COCOマーケ blogs');
  console.log(`Mode: ${anthropic ? 'AI rewrite (Claude Haiku)' : 'Structural rewrite'}`);
  console.log('Images: Pexels写真2枚（キーワード別）');
  console.log('Blocks: tip/warning 最大各1箇所 | Shopify-style figure');
  if (onlyId) console.log(`Target: ${onlyId} のみ`);
  console.log('═'.repeat(64));

  const all = await fetchAllArticles();
  const targets = onlyId ? all.filter(a => a.id === onlyId) : all;
  console.log(`\n対象記事: ${targets.length}件（全${all.length}件中）\n`);

  if (targets.length === 0) {
    console.error(`記事が見つかりません: ${onlyId}`);
    process.exit(1);
  }

  let success = 0, fail = 0;
  const failed = [];

  for (let i = 0; i < targets.length; i++) {
    const article = targets[i];
    console.log(`[${i+1}/${targets.length}] ${article.id}`);
    try {
      const r = await processArticle(article);
      if (r.patchOk) success++; else { fail++; failed.push(article.id); }
    } catch (e) {
      console.error(`  ❌ ${e.message}`);
      fail++;
      failed.push(article.id);
    }
    if (i < targets.length - 1) { process.stdout.write(`  次まで待機...\n`); await sleep(DELAY_MS); }
  }

  console.log('\n' + '═'.repeat(64));
  console.log(`完了: 成功 ${success}件 / 失敗 ${fail}件 / 合計 ${targets.length}件`);
  if (failed.length) console.log('失敗記事:', failed.join(', '));
  console.log('═'.repeat(64));
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
