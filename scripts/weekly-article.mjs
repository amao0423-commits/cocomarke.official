/**
 * Weekly article auto-generation script
 * - Researches trending Instagram topics from reference sources + web search
 * - Avoids recently published topics (fetches recent articles first)
 * - Generates 8000+ char Japanese article with Claude (TOC, anchor links, citations)
 * - Inserts mid-article image
 * - Uploads to microCMS with English slug as content ID
 * - Sends email + Slack notification
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   MICROCMS_SERVICE_DOMAIN   (e.g. "cocomarke")
 *   MICROCMS_WRITE_API_KEY    (write permission required)
 *   PEXELS_API_KEY            (optional — falls back to Unsplash/picsum)
 *   SMTP_PASS                 (optional — email notification)
 *   ARTICLE_DATE              (optional — override date, YYYY-MM-DD)
 */

import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';

const ANTHROPIC_API_KEY      = process.env.ANTHROPIC_API_KEY;
const MICROCMS_SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'cocomarke';
const MICROCMS_WRITE_API_KEY  = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const PEXELS_API_KEY          = process.env.PEXELS_API_KEY;
const SMTP_PASS               = process.env.SMTP_PASS;
const MEDIA_URL               = `https://${MICROCMS_SERVICE_DOMAIN}.microcms-management.io/api/v1/media`;

const CATEGORIES = ['検索対策', 'SNS戦略', '運用の基本', '活用事例', '最新情報', '集客'];

const REFERENCE_SOURCES = [
  'https://about.instagram.com/blog',
  'https://creators.instagram.com/',
  'https://www.socialmediatoday.com/topic/instagram/',
  'https://about.fb.com/news/',
  'https://blog.hootsuite.com/instagram-statistics/',
  'https://later.com/blog/instagram/',
];

// ─── helpers ────────────────────────────────────────────────────────────────

async function fetchPageText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COCOBot/1.0)' },
      signal:  AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);
  } catch {
    return '';
  }
}

async function fetchImage(query) {
  // 1. Pexels（APIキーがある場合）
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

  // 2. Unsplash Source（リダイレクト追跡）
  try {
    const q = query.split(' ').slice(0, 3).map(w => encodeURIComponent(w)).join(',');
    const res = await fetch(
      `https://source.unsplash.com/featured/1200x630/?${q}`,
      { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10000) }
    );
    if (res.ok && res.url && !res.url.includes('source.unsplash.com')) {
      return { url: res.url, alt: query };
    }
  } catch {}

  // 3. picsum（フォールバック）
  const seed = [...query].reduce((a, c) => a + c.charCodeAt(0), 0) % 1000;
  return { url: `https://picsum.photos/seed/${seed}/1200/630`, alt: query };
}

async function uploadEyecatch(imageInfo) {
  if (!imageInfo) return null;
  try {
    const imgRes = await fetch(imageInfo.url, { signal: AbortSignal.timeout(15000) });
    if (!imgRes.ok) throw new Error('fetch failed');
    const buf = await imgRes.arrayBuffer();
    const ct  = imgRes.headers.get('content-type') ?? 'image/jpeg';
    const ext = ct.includes('png') ? 'png' : 'jpg';
    const form = new FormData();
    form.append('file', new Blob([buf], { type: ct }), `eyecatch.${ext}`);
    const upRes = await fetch(MEDIA_URL, {
      method:  'POST',
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_WRITE_API_KEY },
      body:    form,
    });
    if (upRes.ok) {
      const data = await upRes.json();
      if (data.url) { console.log('  eyecatch uploaded:', data.url); return data.url; }
    }
  } catch (e) {
    console.warn('  eyecatch upload failed:', e.message);
  }
  return imageInfo.url; // フォールバック: 外部 URL
}

async function fetchRecentArticles() {
  try {
    const res = await fetch(
      `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/blogs?limit=30&fields=id,title,category&orders=-day`,
      { headers: { 'X-MICROCMS-API-KEY': MICROCMS_WRITE_API_KEY } }
    );
    const data = await res.json();
    return data.contents ?? [];
  } catch {
    return [];
  }
}

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
    .replace(/-+$/, '');
}

// ─── main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!ANTHROPIC_API_KEY)     throw new Error('ANTHROPIC_API_KEY is required');
  if (!MICROCMS_WRITE_API_KEY) throw new Error('MICROCMS_WRITE_API_KEY is required');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const today  = process.env.ARTICLE_DATE ?? new Date().toISOString().slice(0, 10);

  // 1. 既存記事を取得（重複防止 + 関連記事リンク用）
  console.log('既存記事を取得中...');
  const recentArticles = await fetchRecentArticles();
  const recentTitles   = recentArticles.slice(0, 10).map(a => a.title).join('\n- ');
  console.log(`  ${recentArticles.length}件取得`);

  // 2. 参照ソースを取得
  console.log('参照ソースを取得中...');
  const sourceTexts = await Promise.all(REFERENCE_SOURCES.map(fetchPageText));
  const combinedSources = REFERENCE_SOURCES
    .map((url, i) => `[${url}]\n${sourceTexts[i]}`)
    .join('\n\n---\n\n')
    .slice(0, 8000);

  // 3. トピック決定（Claude）
  console.log('トピックを決定中...');
  const planRes = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 600,
    messages: [{
      role:    'user',
      content: `以下は${today}現在のInstagram関連の最新情報ソースです。\n\n${combinedSources}\n\n` +
        `【最近すでに取り上げた記事（同じテーマは避けること）】\n- ${recentTitles}\n\n` +
        `これらを参考に、日本のInstagram運用担当者・マーケターが検索しそうな**今週最も旬なキーワード1つ**を選んでください。` +
        `上記の既存記事と異なるテーマを必ず選ぶこと。\n` +
        `以下のJSON形式のみで回答してください（説明不要）:\n` +
        `{"keyword":"キーワード","titleJa":"日本語記事タイトル（40字以内）","titleEn":"english-slug-words","category":"${CATEGORIES.join('|')}","imageQuery":"pexels検索用英語キーワード2-3語"}`,
    }],
  });

  let plan;
  try {
    const raw = planRes.content[0].text.trim();
    plan = JSON.parse(raw.match(/\{[\s\S]+\}/)?.[0] ?? raw);
  } catch {
    throw new Error(`plan JSON parse failed: ${planRes.content[0].text}`);
  }
  console.log('トピック:', plan);

  const slug = generateSlug(plan.titleEn || plan.keyword);

  // 4. 画像取得・アップロード
  console.log('画像を取得中...');
  const rawImage = await fetchImage(plan.imageQuery || plan.keyword);
  console.log('  URL:', rawImage?.url);
  const eyecatchUrl = await uploadEyecatch(rawImage);

  // 5. 関連記事リンク（Claude に選ばせる）
  const relatedCandidates = recentArticles.slice(0, 20);
  const relatedHtml = relatedCandidates.length > 0
    ? `既存記事から関連性の高いものを2〜3件選んで以下の形式で含めてください:\n` +
      relatedCandidates.map(a => `<li>関連記事：<a href="/blog/${a.id}/">${a.title}</a></li>`).join('\n')
    : '';

  // 6. 記事HTML生成
  console.log('記事を生成中...');
  const articleRes = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 14000,
    messages: [{
      role:    'user',
      content: `記事タイトル: 「${plan.titleJa}」
キーワード: ${plan.keyword}
カテゴリ: ${plan.category}
対象読者: 日本のInstagram運用担当者・中小企業マーケター
投稿日: ${today}

━━━ 記事作成要件 ━━━

【文字数・形式】
- 合計8000文字以上（多ければ多いほど良い）
- <title><head>タグは不要。<h2>〜<p>等の本文HTMLのみ出力

【構成（必ず以下の順序で）】
1. 導入文（300〜400字）
   - 読者の課題・悩みへの共感で始める
   - 「この記事でわかること」を箇条書きで示す

2. 目次
   <h2 id="toc">目次</h2>
   <ul>
     <li><a href="#section-01">H2タイトル1</a></li>
     <li><a href="#section-02">H2タイトル2</a></li>
     ...（全H2を列挙）
   </ul>

3. 本文
   - H2見出し5〜8個（各H2に id="section-01" 〜 連番IDを付与）
   - 各H2にH3を2〜3個
   - 各H3に段落<p>を2〜3個（1段落150〜250字）
   - 具体的な数値・事例・手順を含める

4. まとめ（<h2 id="section-summary">まとめ</h2>、200〜300字）

5. 関連記事
   <h2 id="section-related">関連記事</h2>
   <ul>
${relatedHtml}
   </ul>

6. CTA（最後の1行）
   <p>COCOマーケのInstagram運用代行についてはこちらをご覧ください → <a href="/contact/">お問い合わせ</a></p>

【公式リンク（重要）】
- 公式発表・統計・数値には必ずインラインでリンクを挿入
- 例: <a href="https://about.instagram.com/" target="_blank" rel="noopener noreferrer">Instagram公式</a>
- 各H2に最低1つは公式・信頼できるソースのリンクを含める

参考情報（最新トレンド）:\n${combinedSources.slice(0, 2000)}`,
    }],
  });

  const bodyHtml = articleRes.content[0].text;
  console.log(`  生成文字数: ${bodyHtml.length}`);

  // 7. 中間画像の挿入
  let finalBody = bodyHtml;
  if (rawImage) {
    const h2Closes = [...finalBody.matchAll(/<\/h2>/gi)];
    const insertIdx = h2Closes.length >= 3 ? 2 : h2Closes.length >= 2 ? 1 : -1;
    if (insertIdx >= 0) {
      const pos = h2Closes[insertIdx].index + h2Closes[insertIdx][0].length;
      const imgHtml =
        `\n<figure style="margin:2em 0;text-align:center;">` +
        `<img src="${rawImage.url}" alt="${plan.titleJa}" style="max-width:100%;border-radius:8px;" loading="lazy">` +
        `<figcaption style="font-size:13px;color:#888;margin-top:8px;">出典: Unsplash</figcaption>` +
        `</figure>\n`;
      finalBody = finalBody.slice(0, pos) + imgHtml + finalBody.slice(pos);
    }
  }

  // 8. microCMS へアップロード（PUT でスラッグを ID に）
  const payload = {
    title:    plan.titleJa,
    content:  finalBody,
    category: plan.category,
    day:      today,
  };

  // eyecatch フォーマットを順番に試す
  const eyecatchCandidates = eyecatchUrl
    ? [{ url: eyecatchUrl, width: 1200, height: 630 }, eyecatchUrl, null]
    : [null];

  const articleUrl = `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/blogs/${slug}`;
  let contentId = slug;

  for (const ecValue of eyecatchCandidates) {
    const body = ecValue !== null
      ? { ...payload, eyecatch: ecValue }
      : payload;
    const res = await fetch(articleUrl, {
      method:  'PUT',
      headers: { 'X-MICROCMS-API-KEY': MICROCMS_WRITE_API_KEY, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    if (res.ok) {
      const created = await res.json();
      contentId = created.id ?? slug;
      break;
    }
    if (ecValue === null) {
      const err = await res.text();
      throw new Error(`microCMS PUT failed: ${res.status} ${err}`);
    }
    console.warn('  eyecatch format retry...');
  }

  const publicUrl = `https://www.cocomarke.com/blog/${contentId}/`;
  console.log(`公開: ${publicUrl}`);

  // 9. メール通知
  if (SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host:   'mail1028.onamae.ne.jp',
      port:   465,
      secure: true,
      auth:   { user: 'info@cocomarke.com', pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from:    '"COCOマーケ Bot" <info@cocomarke.com>',
      to:      'info@cocomarke.com',
      subject: `【自動投稿】${plan.titleJa}`,
      text:    [
        '週次自動記事が投稿されました。',
        '',
        `■ タイトル  : ${plan.titleJa}`,
        `■ カテゴリー: ${plan.category}`,
        `■ キーワード: ${plan.keyword}`,
        `■ スラッグ  : ${contentId}`,
        `■ URL       : ${publicUrl}`,
        `■ 投稿日    : ${today}`,
        '',
        '記事の内容を確認・編集するには microCMS 管理画面をご確認ください。',
      ].join('\n'),
    });
    console.log('メール送信完了');
  }

  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
