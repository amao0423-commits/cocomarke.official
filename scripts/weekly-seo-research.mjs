/**
 * weekly-seo-research.mjs
 *
 * 毎週火曜 09:00 JST に実行。
 * GSC クエリデータ + 日本語トレンドソースを組み合わせてキーワード候補をスコアリングし、
 * 「新規記事 or リライト」の判断つきで Slack に通知する。
 * 記事の生成・公開は行わない（人間確認後に weekly-article.mjs を手動実行）。
 *
 * 必要な環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_JSON, GSC_SITE_URL
 *   ANTHROPIC_API_KEY
 *   MICROCMS_API_KEY
 *   SLACK_WEBHOOK_URL
 */

import { writeFileSync } from 'fs';
import Anthropic from '@anthropic-ai/sdk';

const SITE         = 'https://www.cocomarke.com';
const REPORT_DAYS  = 28;
const MIN_IMP      = 20;
const POS_MIN      = 3.5;   // この順位より上は改善余地が小さい
const POS_MAX      = 25;    // この順位より下は現実的でない
const TOP_N        = 12;    // スコアリング後に上位N件を Claude に渡す

// ── 日本語トレンドソース ──────────────────────────────────────────────────
const JP_SOURCES = [
  { url: 'https://ferret-plus.com/',          label: 'ferret' },
  { url: 'https://markezine.jp/article/',      label: 'MarkeZine' },
  { url: 'https://webtan.impress.co.jp/',      label: 'Web担当者Forum' },
  { url: 'https://blog.socialdog.jp/',         label: 'SocialDog Blog' },
  { url: 'https://note.com/search?q=instagram+%E9%81%8B%E7%94%A8&context=note&mode=search', label: 'note' },
  { url: 'https://www.socialmediatoday.com/topic/instagram/', label: 'SocialMediaToday' },
];

// ── ユーティリティ ────────────────────────────────────────────────────────

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

async function fetchText(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COCOBot/1.0)' },
      signal: AbortSignal.timeout(10_000),
    });
    const text = await res.text();
    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 2500);
  } catch {
    return '';
  }
}

// ── Google OAuth2 認証（リフレッシュトークン方式） ──────────────────────

async function getGoogleToken(clientId, clientSecret, refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`Google auth failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

// ── GSC: クエリ次元でデータ取得 ───────────────────────────────────────────

async function fetchGscQueries(token, siteUrl) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: isoDate(REPORT_DAYS),
        endDate:   isoDate(2),
        dimensions: ['query'],
        rowLimit: 1000,
        dataState: 'final',
      }),
    }
  );
  if (!res.ok) throw new Error(`GSC queries ${res.status}: ${await res.text()}`);
  const data = await res.json();

  return (data.rows ?? [])
    .map(r => ({
      query:       r.keys[0],
      impressions: r.impressions,
      clicks:      r.clicks,
      ctr:         r.ctr,
      position:    r.position,
    }))
    .filter(r =>
      r.impressions >= MIN_IMP &&
      r.position >= POS_MIN &&
      r.position <= POS_MAX
    );
}

// ── microCMS: 記事一覧取得 ────────────────────────────────────────────────

async function fetchArticles(apiKey) {
  const res = await fetch(
    'https://cocomarke.microcms.io/api/v1/blogs?limit=100&fields=id,title,category,publishedAt,updatedAt',
    { headers: { 'X-MICROCMS-API-KEY': apiKey } }
  );
  const data = await res.json();
  return data.contents ?? [];
}

// ── クエリと既存記事のマッチング ──────────────────────────────────────────

function matchToArticle(query, articles) {
  const words = query.replace(/[^\p{L}\p{N}\s]/gu, ' ').toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (!words.length) return null;

  let best = null;
  let bestScore = 0;
  for (const a of articles) {
    const haystack = (a.title + ' ' + a.id).toLowerCase();
    const hits = words.filter(w => haystack.includes(w)).length;
    const score = hits / words.length;
    if (score >= 0.45 && score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

// ── スコアリング ──────────────────────────────────────────────────────────
//
// 優先度 = 上位化ポテンシャル × 表示ボリューム × CTR改善余地 × 既存資産ボーナス
//
// - 順位 4〜10 が最高値（トップ3まで最短）
// - 順位 11〜20 は中間（2ページ目だがリーチ可能）
// - CTR が平均より低い → タイトル修正だけで大きく改善できる可能性
// - 既存記事があるとリライトの方が新規より工数が低い

function scoreQuery(q, existingArticle) {
  // 上位化ポテンシャル
  const posPotential =
    q.position >= 4 && q.position <= 7   ? 5 :
    q.position >= 8 && q.position <= 12  ? 4 :
    q.position >= 13 && q.position <= 20 ? 3 :
    2;

  // 表示ボリューム（対数スケール、最大5）
  const impVol = Math.min(5, Math.log10(Math.max(q.impressions, 10)));

  // CTR 改善余地（目標3%との差）
  const ctrGap = Math.max(0, 0.03 - q.ctr) / 0.03;  // 0〜1

  // 既存記事ボーナス（リライトは新規より速い）
  const existBonus = existingArticle ? 1.3 : 1;

  return parseFloat((posPotential * impVol * (1 + ctrGap) * existBonus).toFixed(2));
}

// ── Claude によるバッチ分析 ───────────────────────────────────────────────

async function analyzeWithClaude(client, candidates, jpTrends) {
  const candidateLines = candidates.map((c, i) =>
    `${i + 1}. "${c.query}" | 順位${c.position.toFixed(1)} | 表示${c.impressions} | CTR${(c.ctr * 100).toFixed(1)}% | 既存記事:${c.existingArticle ? `「${c.existingArticle.title}」` : 'なし'}`
  ).join('\n');

  const trendsText = jpTrends.map(t => `[${t.label}] ${t.text.slice(0, 400)}`).join('\n\n');

  const prompt = `あなたはInstagramマーケティング支援会社「COCOマーケ」のSEOコンテンツストラテジストです。

以下のGSCキーワード候補を評価してください。

【候補リスト（GSCデータ）】
${candidateLines}

【今週の日本語トレンド補正情報】
${trendsText}

各候補について以下を評価し、JSONのみで回答してください（前後の説明不要）：
- intent: 検索意図（informational/transactional/navigational/commercial）
- businessValue: 事業価値 0-3（3=COCOマーケのサービスに直接関連、2=間接的、1=弱い、0=無関係）
- action: 推奨アクション（"rewrite"=既存記事リライト / "new_article"=新規記事 / "skip"=対応不要）
- reason: 推奨理由（1文、30字以内）
- suggestions: 具体的施策 2〜3点（rewriteは改善点、new_articleは記事構成H2案）
- urgency: 鮮度・緊急度（"high"=今週対応 / "medium"=今月内 / "low"=いつでも）

JSON形式：
[{"query":"...","intent":"...","businessValue":0-3,"action":"rewrite|new_article|skip","reason":"...","suggestions":["...","..."],"urgency":"high|medium|low"}]`;

  const res = await client.messages.create({
    model:      'claude-opus-4-7',
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = res.content[0].text.trim();
  try {
    return JSON.parse(raw.match(/\[[\s\S]+\]/)?.[0] ?? raw);
  } catch {
    console.warn('[Claude] JSON parse failed, returning empty array');
    return [];
  }
}

// ── Slack 通知 ────────────────────────────────────────────────────────────

function actionBadge(action, urgency) {
  if (action === 'rewrite')      return urgency === 'high' ? '🔴 リライト優先' : '🟠 リライト';
  if (action === 'new_article')  return urgency === 'high' ? '🟡 新規記事優先' : '🟢 新規記事';
  return '⬜ スキップ';
}

async function sendSlackReport(webhookUrl, scored, analyzed, jpTrends, dataAvail) {
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const availLabel = [
    dataAvail.gsc      ? '✅ GSC'        : '⬜ GSC（未設定）',
    dataAvail.microcms ? '✅ microCMS'   : '⬜ microCMS',
    dataAvail.claude   ? '✅ Claude分析' : '⬜ Claude',
  ].join('  ');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `🔍 Weekly SEO Research — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `過去${REPORT_DAYS}日間 ｜ キーワード候補 TOP${Math.min(scored.length, TOP_N)}\n${availLabel}`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*📋 優先キーワード候補（GSCベース）*\n対応後は `node scripts/weekly-article.mjs` を `KEYWORD_OVERRIDE=<keyword>` 付きで手動実行してください。',
      },
    },
  ];

  // 各候補をブロックで追加（最大8件）
  const displayItems = scored.slice(0, 8);
  for (let i = 0; i < displayItems.length; i++) {
    const c = displayItems[i];
    const analysis = analyzed.find(a => a.query === c.query);

    const metricLine = [
      `順位 *${c.position.toFixed(1)}*`,
      `表示 *${c.impressions.toLocaleString()}*`,
      `CTR *${(c.ctr * 100).toFixed(1)}%*`,
      `スコア *${c.score}pts*`,
    ].join('  ');

    const actionLine = analysis
      ? `${actionBadge(analysis.action, analysis.urgency)}  _(${analysis.reason})_`
      : '（分析データなし）';

    const suggestionsLine = analysis?.suggestions?.length
      ? analysis.suggestions.slice(0, 3).map((s, j) => `>${j + 1}. ${s}`).join('\n')
      : '';

    const existingLine = c.existingArticle
      ? `既存記事: <${SITE}/blog/${c.existingArticle.id}/|${c.existingArticle.title}>`
      : '既存記事: なし（新規作成）';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${i + 1}. "${c.query}"*`,
          metricLine,
          existingLine,
          actionLine,
          suggestionsLine,
        ].filter(Boolean).join('\n'),
      },
    });

    if (i < displayItems.length - 1) blocks.push({ type: 'divider' });
  }

  // 日本語トレンドサマリー
  if (jpTrends.some(t => t.text)) {
    const trendText = jpTrends
      .filter(t => t.text)
      .map(t => `• [${t.label}] ${t.text.slice(0, 80).replace(/\s+/g, ' ')}...`)
      .join('\n');

    blocks.push(
      { type: 'divider' },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*🗞 今週の日本語トレンド補正*\n${trendText}`,
        },
      }
    );
  }

  // フッター
  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: [
          '記事を作成するには: `KEYWORD_OVERRIDE="キーワード" node scripts/weekly-article.mjs`',
          'またはGitHub Actions → Weekly Article → Run workflow → keyword欄に入力',
        ].join('  ｜  '),
      }],
    }
  );

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });
  if (!res.ok) throw new Error(`Slack ${res.status}: ${await res.text()}`);
}

// ── メイン ────────────────────────────────────────────────────────────────

async function main() {
  const {
    GOOGLE_OAUTH_CLIENT_ID,
    GOOGLE_OAUTH_CLIENT_SECRET,
    GOOGLE_OAUTH_REFRESH_TOKEN,
    GSC_SITE_URL,
    ANTHROPIC_API_KEY,
    MICROCMS_API_KEY,
    SLACK_WEBHOOK_URL,
  } = process.env;

  if (!SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL is required');

  const dataAvail = { gsc: false, microcms: false, claude: false };

  // ── GSC クエリデータ取得 ──
  let gscQueries = [];
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN && GSC_SITE_URL) {
    try {
      console.log('[Google] トークン取得中...');
      const token = await getGoogleToken(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN);
      console.log('[GSC] クエリデータ取得中...');
      gscQueries = await fetchGscQueries(token, GSC_SITE_URL);
      dataAvail.gsc = true;
      console.log(`  → ${gscQueries.length} クエリ（順位${POS_MIN}〜${POS_MAX}、表示${MIN_IMP}+）`);
    } catch (e) {
      console.warn(`[GSC] スキップ: ${e.message}`);
    }
  } else {
    console.warn('[GSC] 認証情報未設定 → スキップ');
  }

  // ── 既存記事取得 ──
  let articles = [];
  if (MICROCMS_API_KEY) {
    try {
      console.log('[microCMS] 記事リスト取得中...');
      articles = await fetchArticles(MICROCMS_API_KEY);
      dataAvail.microcms = true;
      console.log(`  → ${articles.length} 記事`);
    } catch (e) {
      console.warn(`[microCMS] スキップ: ${e.message}`);
    }
  }

  // ── 日本語トレンド取得 ──
  console.log('[JP Trends] 日本語ソーススクレイプ中...');
  const jpTrends = await Promise.all(
    JP_SOURCES.map(async s => ({ ...s, text: await fetchText(s.url) }))
  );
  console.log(`  → ${jpTrends.filter(t => t.text).length} ソース取得`);

  // ── クエリと既存記事のマッチング ──
  const matched = gscQueries.map(q => ({
    ...q,
    existingArticle: matchToArticle(q.query, articles),
    score: scoreQuery(q, matchToArticle(q.query, articles)),
  }));

  // ── スコア降順でソート・上位N件に絞る ──
  const scored = matched
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_N);

  console.log(`[Score] TOP${scored.length}:`);
  scored.forEach((c, i) =>
    console.log(`  ${i + 1}. [${c.score}pts] "${c.query}" (順位${c.position.toFixed(1)}, 表示${c.impressions})`)
  );

  // ── Claude 分析 ──
  let analyzed = [];
  if (ANTHROPIC_API_KEY && scored.length > 0) {
    try {
      console.log('[Claude] キーワード候補を分析中...');
      const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
      analyzed = await analyzeWithClaude(client, scored, jpTrends);
      dataAvail.claude = true;
      console.log(`  → ${analyzed.length} 件分析完了`);
    } catch (e) {
      console.warn(`[Claude] スキップ: ${e.message}`);
    }
  }

  // ── JSON レポート保存 ──
  const report = {
    generatedAt:    new Date().toISOString(),
    period:         { days: REPORT_DAYS, from: isoDate(REPORT_DAYS), to: isoDate(2) },
    dataAvailability: dataAvail,
    scored,
    analyzed,
    jpTrends: jpTrends.map(t => ({ label: t.label, excerpt: t.text.slice(0, 200) })),
  };
  writeFileSync('seo-research-report.json', JSON.stringify(report, null, 2));
  console.log('[Report] seo-research-report.json 保存完了');

  // ── Slack 送信 ──
  if (scored.length === 0) {
    console.log('[Slack] 候補なし → スキップ');
    return;
  }
  console.log('[Slack] レポート送信中...');
  await sendSlackReport(SLACK_WEBHOOK_URL, scored, analyzed, jpTrends, dataAvail);
  console.log('[Slack] 送信完了');
  console.log('\n✅ 完了。Slackで候補を確認し、KEYWORD_OVERRIDE を指定して weekly-article.mjs を手動実行してください。');
}

main().catch(e => { console.error('[Fatal]', e); process.exit(1); });
