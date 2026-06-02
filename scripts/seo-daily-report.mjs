/**
 * seo-daily-report.mjs
 *
 * 毎日 00:00 JST に GitHub Actions から実行。
 * GSC・GA4 のデータを取得し、記事・固定ページ・技術SEO の3セクションで Slack 通知する。
 *
 * 必要な環境変数:
 *   GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN
 *   GSC_SITE_URL, GA4_PROPERTY_ID
 *   SLACK_WEBHOOK_URL, MICROCMS_API_KEY
 */

import { writeFileSync } from 'fs';

const SITE        = 'https://www.cocomarke.com';
const REPORT_DAYS = 28;
const TOP_N       = 5;

// 固定ページ定義
const FIXED_PAGES = [
  {
    path: '/',
    name: 'トップページ',
    url:  `${SITE}/`,
    actionsHighBounce: [
      'ファーストビューCTAの文言を「Instagramを伸ばしたい方はこちら」に変更',
      '実績・導入事例を目立つ位置に追加してスクロールを促す',
      '信頼要素（媒体掲載・クライアント数）をヒーロー直下に追加',
    ],
    actionsDefault: [
      'お問い合わせへの動線を増やす（CTAボタン追加）',
      'ファーストビューのコピーを見直す',
    ],
  },
  {
    path: '/contact',
    name: 'お問い合わせ',
    url:  `${SITE}/contact/`,
    actionsHighBounce: [
      '入力項目を名前・メール・相談内容の3項目に絞る',
      'フォーム上部に「無料相談できます」などの安心文言を追加',
      'LINE での問い合わせ導線を追加する',
    ],
    actionsDefault: [
      'フォームの入力項目を見直す',
      'LINE 問い合わせ導線を追加する',
    ],
  },
];

// ── 日付ユーティリティ ─────────────────────────────────────────────────────

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ── Google OAuth2 認証 ────────────────────────────────────────────────────

async function getGoogleToken(clientId, clientSecret, refreshToken) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });
  const body = await res.json();
  if (!body.access_token) throw new Error(`Google auth failed: ${JSON.stringify(body)}`);
  return body.access_token;
}

// ── GSC: 全ページの検索パフォーマンス取得 ────────────────────────────────
// key: フルURL (https://www.cocomarke.com/blog/slug/)

async function fetchGsc(token, siteUrl) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate:  isoDate(REPORT_DAYS),
        endDate:    isoDate(2),
        dimensions: ['page'],
        rowLimit:   500,
        dataState:  'final',
      }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const result = {};
  for (const row of data.rows ?? []) {
    const url  = row.keys[0];
    const path = url.replace(SITE, '').replace(/\/$/, '') || '/';
    result[path] = {
      url,
      impressions: row.impressions,
      clicks:      row.clicks,
      ctr:         row.ctr,
      position:    row.position,
    };
  }
  return result;
}

// ── GA4: 全ページのセッション・エンゲージメント取得 ─────────────────────
// key: pagePath (/blog/slug, /, /contact 等)

async function fetchGa4(token, propertyId) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions:  [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        dateRanges: [{ startDate: `${REPORT_DAYS}daysAgo`, endDate: '2daysAgo' }],
        limit: 500,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    }
  );
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const dimIdx = Object.fromEntries((data.dimensionHeaders ?? []).map((h, i) => [h.name, i]));
  const metIdx = Object.fromEntries((data.metricHeaders ?? []).map((h, i) => [h.name, i]));

  const result = {};
  for (const row of data.rows ?? []) {
    const path = (row.dimensionValues[dimIdx['pagePath']]?.value ?? '').replace(/\/$/, '') || '/';
    result[path] = {
      sessions:    parseInt(row.metricValues[metIdx['sessions']]?.value ?? '0'),
      avgDuration: parseFloat(row.metricValues[metIdx['averageSessionDuration']]?.value ?? '0'),
      bounceRate:  parseFloat(row.metricValues[metIdx['bounceRate']]?.value ?? '0'),
    };
  }
  return result;
}

// ── 技術SEO チェック ──────────────────────────────────────────────────────

async function checkTechnicalSeo() {
  const checks = [];
  try {
    const res  = await fetch(`${SITE}/`, {
      headers: { 'User-Agent': 'COCOMarkeSEOBot/1.0' },
      signal:  AbortSignal.timeout(10_000),
    });
    const html = await res.text();

    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    checks.push({ name: 'title タグ', ok: !!titleMatch, detail: titleMatch?.[1]?.slice(0, 40) });

    const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    checks.push({ name: 'meta description', ok: !!descMatch, detail: descMatch?.[1]?.slice(0, 40) });

    const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
    checks.push({ name: 'canonical タグ', ok: hasCanonical });

    const inlineCount = (html.match(/style="/g) ?? []).length;
    checks.push({ name: 'インラインスタイル', ok: inlineCount < 30, detail: `${inlineCount} 件` });
  } catch (e) {
    checks.push({ name: 'HTML取得', ok: false, detail: e.message.slice(0, 50) });
  }

  try {
    const res = await fetch(`${SITE}/sitemap.xml`, { signal: AbortSignal.timeout(5_000) });
    checks.push({ name: 'sitemap.xml', ok: res.ok && res.status === 200 });
  } catch {
    checks.push({ name: 'sitemap.xml', ok: false });
  }

  return checks;
}

// ── microCMS: 全記事リスト取得 ────────────────────────────────────────────

async function fetchArticles(apiKey) {
  const res  = await fetch(
    'https://cocomarke.microcms.io/api/v1/blogs?limit=100&fields=id,title,publishedAt,updatedAt',
    { headers: { 'X-MICROCMS-API-KEY': apiKey } }
  );
  const data = await res.json();
  const map  = {};
  for (const c of data.contents ?? []) {
    map[c.id] = { id: c.id, title: c.title, publishedAt: c.publishedAt, updatedAt: c.updatedAt };
  }
  return map;
}

// ── 記事スコアリング ──────────────────────────────────────────────────────

function scoreArticle(gsc, ga4) {
  let pts = 0;
  const reasons  = [];
  const actions  = [];

  if (gsc) {
    const { impressions, ctr, position } = gsc;
    const ctrPct = (ctr * 100).toFixed(1);

    if (impressions >= 500 && ctr < 0.02) {
      pts += 50;
      reasons.push(`インプレ ${impressions.toLocaleString()} / CTR ${ctrPct}%（目標3%+）`);
      actions.push('タイトルに数字・ベネフィット・年を追加してCTRを改善');
      actions.push('metaDescriptionの冒頭1文で「誰に・何がわかるか」を明記');
    } else if (impressions >= 200 && ctr < 0.03) {
      pts += 25;
      reasons.push(`インプレ ${impressions.toLocaleString()} / CTR ${ctrPct}%（改善余地）`);
      actions.push('タイトルの検索意図との一致度を再確認する');
    }

    if (position >= 4 && position <= 10 && impressions >= 100) {
      pts += 45;
      reasons.push(`順位 ${position.toFixed(1)}（トップ3まであと少し・最優先帯）`);
      actions.push('FAQを5問以上追加してSGE・ゼロクリック対策を強化');
      actions.push('H2/H3 見出しにロングテールキーワードを組み込む');
      actions.push('更新日・著者情報を明示してE-E-A-T を強化');
    } else if (position >= 11 && position <= 20 && impressions >= 50) {
      pts += 20;
      reasons.push(`順位 ${position.toFixed(1)}（2ページ目）`);
      actions.push('競合上位記事と比べて不足している情報・見出しを追加');
      actions.push('内部リンクを2件以上追加して権威性を補強');
    }

    if (impressions >= 300 && position > 20) {
      pts += 15;
      reasons.push(`インプレ ${impressions.toLocaleString()} / 順位 ${position.toFixed(1)}（圏外）`);
      actions.push('検索意図を再分析し、導入・構成・見出しを全面見直し');
    }
  }

  if (ga4) {
    const { sessions, avgDuration, bounceRate } = ga4;
    if (avgDuration < 30 && bounceRate > 0.75 && sessions >= 30) {
      pts += 30;
      reasons.push(`滞在 ${avgDuration.toFixed(0)}秒 / 直帰率 ${(bounceRate * 100).toFixed(0)}%`);
      actions.push('導入文を改善（最初の2文で記事の価値を明確に）');
      actions.push('ファーストビューにTOCを設置してスキャナビリティを上げる');
    } else if (bounceRate > 0.68 && sessions >= 50) {
      pts += 15;
      reasons.push(`直帰率 ${(bounceRate * 100).toFixed(0)}%`);
      actions.push('関連記事への内部リンクを増やして回遊を促す');
    }
  }

  return { pts, reasons, actions };
}

// ── 固定ページ評価 ────────────────────────────────────────────────────────

function scoreFixedPage(pageDef, ga4) {
  const issues  = [];
  const actions = [];

  if (ga4) {
    const { sessions, avgDuration, bounceRate } = ga4;
    if (bounceRate > 0.7) {
      issues.push(`直帰率 ${(bounceRate * 100).toFixed(0)}%（高い）`);
      actions.push(...pageDef.actionsHighBounce);
    }
    if (avgDuration < 30) issues.push(`滞在時間 ${avgDuration.toFixed(0)}秒（短い）`);
    if (issues.length === 0) issues.push('問題なし');
    if (actions.length === 0) actions.push(...pageDef.actionsDefault);
  } else {
    issues.push('GA4データなし');
    actions.push(...pageDef.actionsDefault);
  }

  return { issues, actions };
}

// ── Slack 通知 ────────────────────────────────────────────────────────────

function priorityBadge(pts) {
  if (pts >= 70) return '🔴 緊急';
  if (pts >= 45) return '🟠 高';
  if (pts >= 20) return '🟡 中';
  return '🟢 低';
}

async function sendSlack(webhookUrl, { ranked, fixedPages, techSeo, dataAvail, today }) {
  const availLabels = [
    dataAvail.gsc ? '✅ GSC' : '⬜ GSC',
    dataAvail.ga4 ? '✅ GA4' : '⬜ GA4',
  ].join('  ');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 SEO改善レポート — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `過去${REPORT_DAYS}日間  ${availLabels}` },
    },
    { type: 'divider' },
    // ── 記事ページ ──
    { type: 'section', text: { type: 'mrkdwn', text: `*📝 記事ページ TOP${ranked.length}*` } },
  ];

  for (let i = 0; i < ranked.length; i++) {
    const { slug, title, score, gsc, ga4 } = ranked[i];
    const url     = `${SITE}/blog/${slug}/`;
    const metrics = [];
    if (gsc) metrics.push(`CTR *${(gsc.ctr * 100).toFixed(1)}%*  順位 *${gsc.position.toFixed(1)}*  インプレ *${gsc.impressions.toLocaleString()}*`);
    if (ga4) metrics.push(`滞在 *${ga4.avgDuration.toFixed(0)}s*  直帰 *${(ga4.bounceRate * 100).toFixed(0)}%*`);
    const actionLines = score.actions.slice(0, 3).map((a, j) => `>${j + 1}. ${a}`).join('\n');
    const shortTitle  = title.length > 36 ? title.slice(0, 36) + '…' : title;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${i + 1}. ${priorityBadge(score.pts)}*  <${url}|${shortTitle}>`,
          metrics.join('  '),
          `_課題: ${score.reasons.join(' / ')}_`,
          actionLines,
        ].filter(Boolean).join('\n'),
      },
    });

    if (i < ranked.length - 1) blocks.push({ type: 'divider' });
  }

  // ── 固定ページ ──
  blocks.push(
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: '*🏠 固定ページ*' } },
  );

  for (const fp of fixedPages) {
    const actionLines = fp.score.actions.slice(0, 3).map((a, j) => `>${j + 1}. ${a}`).join('\n');
    const metricsLine = fp.ga4
      ? `滞在 *${fp.ga4.avgDuration.toFixed(0)}s*  直帰 *${(fp.ga4.bounceRate * 100).toFixed(0)}%*  セッション *${fp.ga4.sessions}*`
      : '_GA4データなし_';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*<${fp.url}|${fp.name}>*`,
          metricsLine,
          `_課題: ${fp.score.issues.join(' / ')}_`,
          actionLines,
        ].join('\n'),
      },
    });
  }

  // ── 技術SEO ──
  blocks.push(
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: '*🔧 技術SEO*' } },
  );

  const techLines = techSeo
    .map(c => `${c.ok ? '✅' : '❌'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`)
    .join('\n');

  blocks.push(
    { type: 'section', text: { type: 'mrkdwn', text: techLines || '_チェックなし_' } },
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: '`node scripts/rewrite-*.mjs` でリライト実行  ｜  microCMS への自動反映は行いません',
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
    GA4_PROPERTY_ID,
    SLACK_WEBHOOK_URL,
    MICROCMS_API_KEY,
  } = process.env;

  if (!SLACK_WEBHOOK_URL) throw new Error('SLACK_WEBHOOK_URL is required');
  if (!MICROCMS_API_KEY)  throw new Error('MICROCMS_API_KEY is required');

  // ── microCMS 記事一覧 ──
  console.log('[microCMS] 記事リスト取得中...');
  const articles = await fetchArticles(MICROCMS_API_KEY);
  console.log(`  → ${Object.keys(articles).length} 記事`);

  // ── Google APIs ──
  let gscAll = {};
  let ga4All = {};

  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN && GSC_SITE_URL) {
    try {
      console.log('[Google] アクセストークン取得中...');
      const token = await getGoogleToken(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN);

      console.log('[GSC] データ取得中...');
      gscAll = await fetchGsc(token, GSC_SITE_URL);
      console.log(`  → ${Object.keys(gscAll).length} URL`);

      if (GA4_PROPERTY_ID) {
        console.log('[GA4] データ取得中...');
        ga4All = await fetchGa4(token, GA4_PROPERTY_ID);
        console.log(`  → ${Object.keys(ga4All).length} ページ`);
      }
    } catch (err) {
      console.warn(`[Google] スキップ: ${err.message}`);
    }
  }

  // ── 技術SEO チェック ──
  console.log('[技術SEO] チェック中...');
  const techSeo = await checkTechnicalSeo();

  // ── 記事ページ スコアリング ──
  console.log('[Score] 記事スコアリング中...');
  const scored = Object.entries(articles).map(([slug, article]) => {
    const gscPath = `/blog/${slug}`;
    const gsc     = gscAll[gscPath] ?? gscAll[gscPath + '/'] ?? null;
    const ga4     = ga4All[`/blog/${slug}`] ?? ga4All[`/blog/${slug}/`] ?? null;
    return {
      slug,
      title:     article.title,
      updatedAt: article.updatedAt,
      score:     scoreArticle(gsc, ga4),
      gsc,
      ga4,
    };
  });

  const ranked = scored
    .filter(a => a.score.pts > 0 && a.score.reasons.length > 0)
    .sort((a, b) => b.score.pts - a.score.pts)
    .slice(0, TOP_N);

  ranked.forEach((a, i) =>
    console.log(`  ${i + 1}. [${a.score.pts}pts] ${a.title.slice(0, 60)}`)
  );

  // ── 固定ページ評価 ──
  const fixedPages = FIXED_PAGES.map(def => {
    const ga4 = ga4All[def.path] ?? ga4All[def.path + '/'] ?? null;
    return { ...def, ga4, score: scoreFixedPage(def, ga4) };
  });

  // ── JSON レポート保存 ──
  const report = {
    generatedAt:      new Date().toISOString(),
    period:           { days: REPORT_DAYS, from: isoDate(REPORT_DAYS), to: isoDate(2) },
    dataAvailability: { gsc: Object.keys(gscAll).length > 0, ga4: Object.keys(ga4All).length > 0 },
    ranked,
    fixedPages,
    techSeo,
  };
  writeFileSync('seo-report.json', JSON.stringify(report, null, 2));
  console.log('[Report] seo-report.json 保存完了');

  // ── Slack 通知 ──
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  console.log('[Slack] 通知送信中...');
  await sendSlack(SLACK_WEBHOOK_URL, {
    ranked,
    fixedPages,
    techSeo,
    dataAvail: report.dataAvailability,
    today,
  });
  console.log('[Slack] 送信完了');
}

main().catch(err => { console.error('[Fatal]', err); process.exit(1); });
