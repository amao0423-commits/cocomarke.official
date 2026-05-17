/**
 * Weekly article auto-generation script
 * - Researches trending Instagram topics from reference sources
 * - Generates 8000-char Japanese article with Claude
 * - Inserts mid-article image from Pexels
 * - Uploads to microCMS, sends email notification
 *
 * Required env vars:
 *   ANTHROPIC_API_KEY
 *   MICROCMS_SERVICE_DOMAIN   (e.g. "cocomarke")
 *   MICROCMS_WRITE_API_KEY    (API key with write permission)
 *   PEXELS_API_KEY
 *   SMTP_PASS
 */

import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MICROCMS_SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'cocomarke';
const MICROCMS_WRITE_API_KEY = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const SMTP_PASS = process.env.SMTP_PASS;

const CATEGORIES = ['検索対策', 'SNS戦略', '運用の基本', '活用事例', '最新情報', '集客'];

const REFERENCE_SOURCES = [
  'https://about.instagram.com/blog',
  'https://about.fb.com/news/category/technologies/instagram/',
  'https://www.socialmediatoday.com/topic/instagram/',
  'https://creators.instagram.com/',
];

// ---------- helpers ----------

async function fetchPageText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COCOBot/1.0)' },
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    // strip HTML tags, collapse whitespace, take first 3000 chars
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000);
  } catch {
    return '';
  }
}

async function fetchPexelsImage(query) {
  if (!PEXELS_API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const photo = data.photos?.[0];
    if (!photo) return null;
    return {
      url: photo.src.large2x || photo.src.large,
      alt: photo.alt || query,
      credit: `Photo by ${photo.photographer} on Pexels`,
    };
  } catch {
    return null;
  }
}

function generateSlug(titleEn) {
  return titleEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function buildArticleHtml(sections, midImage) {
  // sections: [{h2, h3s: [{heading, paragraphs}]}]
  // Insert image after 2nd H2 section
  const parts = [];
  sections.forEach((sec, si) => {
    parts.push(`<h2>${sec.h2}</h2>`);
    sec.h3s.forEach((sub, hi) => {
      parts.push(`<h3>${sub.heading}</h3>`);
      sub.paragraphs.forEach(p => parts.push(`<p>${p}</p>`));
    });
    if (si === 1 && midImage) {
      parts.push(
        `<figure style="margin:2em 0;text-align:center;">` +
        `<img src="${midImage.url}" alt="${midImage.alt}" style="max-width:100%;border-radius:8px;">` +
        `<figcaption style="font-size:13px;color:#888;margin-top:8px;">${midImage.credit}</figcaption>` +
        `</figure>`
      );
    }
  });
  return parts.join('\n');
}

// ---------- main ----------

async function main() {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required');
  if (!MICROCMS_WRITE_API_KEY) throw new Error('MICROCMS_WRITE_API_KEY or MICROCMS_API_KEY is required');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const today = new Date().toISOString().slice(0, 10);

  // 1. Fetch reference source snippets
  console.log('Fetching reference sources...');
  const sourceTexts = await Promise.all(REFERENCE_SOURCES.map(fetchPageText));
  const combinedSources = REFERENCE_SOURCES
    .map((url, i) => `[${url}]\n${sourceTexts[i]}`)
    .join('\n\n---\n\n')
    .slice(0, 8000);

  // 2. Determine topic + generate article with Claude
  console.log('Generating article with Claude...');
  const planResponse = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `以下は${today}現在のInstagram関連の最新情報ソースです。\n\n${combinedSources}\n\n` +
        `これらを参考に、日本のInstagram運用担当者・マーケターが検索しそうな**今週最も旬なキーワード1つ**を選び、` +
        `以下のJSON形式のみで回答してください（説明不要）:\n` +
        `{"keyword":"キーワード","titleJa":"日本語記事タイトル（40字以内）","titleEn":"english-slug-words","category":"${CATEGORIES.join('|')}の中から最適な1つ","imageQuery":"pexels検索用英語キーワード2-3語"}`
    }],
  });

  let plan;
  try {
    const raw = planResponse.content[0].text.trim();
    plan = JSON.parse(raw.match(/\{[\s\S]+\}/)?.[0] ?? raw);
  } catch {
    throw new Error(`Failed to parse plan JSON: ${planResponse.content[0].text}`);
  }
  console.log('Topic plan:', plan);

  const slug = generateSlug(plan.titleEn || plan.keyword);

  // 3. Fetch mid-article image
  const midImage = await fetchPexelsImage(plan.imageQuery || plan.keyword);
  console.log('Image:', midImage?.url ?? 'none');

  // 4. Generate full article
  const articleResponse = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8000,
    messages: [{
      role: 'user',
      content: `テーマ: 「${plan.titleJa}」\nキーワード: ${plan.keyword}\n対象読者: 日本のInstagram運用担当者・中小企業マーケター\n\n` +
        `以下の要件で**日本語**の記事本文をHTML形式で生成してください:\n` +
        `- 合計文字数: 8000文字以上\n` +
        `- 構成: 導入(300字) → 目次 → H2見出し5〜7個、各H2にH3を2〜3個 → まとめ\n` +
        `- 目次はH2見出しのアンカーリンク付きの箇条書き（<ul>タグ使用）\n` +
        `- H2にはInstagramの最新情報や具体的な数値を含める\n` +
        `- 各段落は読みやすい150〜250字程度\n` +
        `- 末尾にCTAとして「COCOマーケのInstagram運用代行についてはこちらをご覧ください → <a href="/contact/">お問い合わせ</a>」を追加\n` +
        `- <title>や<head>タグは不要、<h2>〜<p>等の本文HTMLのみ出力\n` +
        `- SEOに最適化されたキーワードを自然に含める\n` +
        `参考情報（最新トレンド）:\n${combinedSources.slice(0, 2000)}`
    }],
  });

  const bodyHtml = articleResponse.content[0].text;
  console.log(`Generated article: ${bodyHtml.length} chars`);

  // Insert mid-image after 2nd </h2> closing tag
  let finalBody = bodyHtml;
  if (midImage) {
    const h2Closes = [...finalBody.matchAll(/<\/h2>/gi)];
    if (h2Closes.length >= 2) {
      const insertAt = h2Closes[1].index + h2Closes[1][0].length;
      const imgHtml =
        `\n<figure style="margin:2em 0;text-align:center;">` +
        `<img src="${midImage.url}" alt="${midImage.alt}" style="max-width:100%;border-radius:8px;" loading="lazy">` +
        `<figcaption style="font-size:13px;color:#888;margin-top:8px;">${midImage.credit}</figcaption>` +
        `</figure>\n`;
      finalBody = finalBody.slice(0, insertAt) + imgHtml + finalBody.slice(insertAt);
    }
  }

  // 5. Upload to microCMS
  const articleUrl = `https://${MICROCMS_SERVICE_DOMAIN}.microcms.io/api/v1/blogs`;
  const eyecatch = midImage ? { url: midImage.url } : undefined;

  const payload = {
    title: plan.titleJa,
    content: finalBody,
    category: plan.category,
    day: today,
    ...(eyecatch ? { eyecatch } : {}),
  };

  console.log('Uploading to microCMS...');
  const createRes = await fetch(articleUrl, {
    method: 'POST',
    headers: {
      'X-MICROCMS-API-KEY': MICROCMS_WRITE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    throw new Error(`microCMS create failed: ${createRes.status} ${err}`);
  }

  const created = await createRes.json();
  const contentId = created.id ?? slug;
  const publicUrl = `https://www.cocomarke.com/blog/${contentId}/`;

  console.log(`Article published: ${publicUrl}`);

  // 6. Send email notification
  if (SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: 'mail1028.onamae.ne.jp',
      port: 465,
      secure: true,
      auth: { user: 'info@cocomarke.com', pass: SMTP_PASS },
    });

    await transporter.sendMail({
      from: '"COCOマーケ Bot" <info@cocomarke.com>',
      to: 'info@cocomarke.com',
      subject: `【自動投稿】${plan.titleJa}`,
      text: [
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
    console.log('Notification email sent.');
  }

  console.log('Done!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
