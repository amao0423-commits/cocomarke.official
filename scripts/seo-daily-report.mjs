/**
 * seo-daily-report.mjs
 *
 * 毎日 00:00 JST に GitHub Actions から実行。
 * GSC・GA4・Mixpanel のデータを取得してスコアリングし、
 * 改善優先度の高い記事トップ5 を Slack に通知する。
 * microCMS への書き込みは行わない（公開は人間確認）。
 *
 * 必要な環境変数:
 *   GOOGLE_SERVICE_ACCOUNT_JSON, GSC_SITE_URL, GA4_PROPERTY_ID
 *   MIXPANEL_PROJECT_ID, MIXPANEL_API_SECRET
 *   SLACK_WEBHOOK_URL, MICROCMS_API_KEY
 */

import { writeFileSync } from 'fs';

const SITE = 'https://www.cocomarke.com';
const REPORT_DAYS = 28;
const TOP_N = 5;

// ── 日付ユーティリティ ─────────────────────────────────────────────────────

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

// ── Google OAuth2 認証（リフレッシュトークン方式） ──────────────────────

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

// ── GSC: 検索パフォーマンス取得 ───────────────────────────────────────────

async function fetchGsc(token, siteUrl) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: isoDate(REPORT_DAYS),
        endDate:   isoDate(2),          // 直近2日はデータが不安定なため除外
        dimensions: ['page'],
        rowLimit: 500,
        dataState: 'final',
      }),
    }
  );
  if (!res.ok) throw new Error(`GSC ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const result = {};
  for (const row of data.rows ?? []) {
    const url = row.keys[0];
    if (!url.includes('/blog/')) continue;
    const slug = url.replace(`${SITE}/blog/`, '').replace(/\/$/, '');
    if (!slug) continue;
    result[slug] = {
      url,
      impressions: row.impressions,
      clicks:      row.clicks,
      ctr:         row.ctr,
      position:    row.position,
    };
  }
  return result;
}

// ── GA4: セッション・エンゲージメント取得 ────────────────────────────────

async function fetchGa4(token, propertyId) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dimensions: [{ name: 'pagePath' }],
        metrics: [
          { name: 'sessions' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
        ],
        dateRanges: [{ startDate: `${REPORT_DAYS}daysAgo`, endDate: '2daysAgo' }],
        dimensionFilter: {
          filter: {
            fieldName: 'pagePath',
            stringFilter: { matchType: 'BEGINS_WITH', value: '/blog/' },
          },
        },
        limit: 500,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
    }
  );
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  const data = await res.json();

  const dimIdx = Object.fromEntries(
    (data.dimensionHeaders ?? []).map((h, i) => [h.name, i])
  );
  const metIdx = Object.fromEntries(
    (data.metricHeaders ?? []).map((h, i) => [h.name, i])
  );

  const result = {};
  for (const row of data.rows ?? []) {
    const path = row.dimensionValues[dimIdx['pagePath']]?.value ?? '';
    const slug = path.replace('/blog/', '').replace(/\/$/, '');
    if (!slug) continue;
    result[slug] = {
      sessions:    parseInt(row.metricValues[metIdx['sessions']]?.value ?? '0'),
      avgDuration: parseFloat(row.metricValues[metIdx['averageSessionDuration']]?.value ?? '0'),
      bounceRate:  parseFloat(row.metricValues[metIdx['bounceRate']]?.value ?? '0'),
    };
  }
  return result;
}

// ── Mixpanel: CVイベント取得（JQL） ──────────────────────────────────────

async function fetchMixpanel(projectId, apiSecret) {
  // GA4トラッキングコードに合わせて contact_click / article_cta_click を集計
  const script = `
function main() {
  return Events({
    from_date: '${isoDate(REPORT_DAYS)}',
    to_date:   '${isoDate(2)}',
    event_selectors: [
      { event: 'contact_click' },
      { event: 'article_cta_click' },
      { event: 'document_click' }
    ]
  })
  .groupBy(
    ['properties.page_slug', 'name'],
    mixpanel.reducer.count()
  )
  .map(function(r) {
    return { slug: r.key[0] || '', event: r.key[1], count: r.value };
  });
}`;

  const auth = Buffer.from(`${apiSecret}:`).toString('base64');
  const res = await fetch('https://data.mixpanel.com/api/2.0/jql', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ script }),
  });
  if (!res.ok) throw new Error(`Mixpanel ${res.status}: ${await res.text()}`);
  const rows = await res.json();

  const result = {};
  for (const item of Array.isArray(rows) ? rows : []) {
    // page_slug は "/blog/article-id/" 形式
    const slug = String(item.slug ?? '').replace('/blog/', '').replace(/\/$/, '');
    if (!slug) continue;
    if (!result[slug]) result[slug] = { contactClicks: 0, ctaClicks: 0, docClicks: 0 };
    if (item.event === 'contact_click')     result[slug].contactClicks += item.count;
    if (item.event === 'article_cta_click') result[slug].ctaClicks    += item.count;
    if (item.event === 'document_click')    result[slug].docClicks     += item.count;
  }
  return result;
}

// ── microCMS: 全記事リスト取得 ────────────────────────────────────────────

async function fetchArticles(apiKey) {
  const res = await fetch(
    'https://cocomarke.microcms.io/api/v1/blogs?limit=100&fields=id,title,publishedAt,updatedAt',
    { headers: { 'X-MICROCMS-API-KEY': apiKey } }
  );
  const data = await res.json();
  const map = {};
  for (const c of data.contents ?? []) {
    map[c.id] = { id: c.id, title: c.title, publishedAt: c.publishedAt, updatedAt: c.updatedAt };
  }
  return map;
}

// ── スコアリング ──────────────────────────────────────────────────────────

function scoreArticle(gsc, ga4, mp) {
  let pts = 0;
  const reasons  = [];   // 問題の説明
  const actions  = [];   // 具体施策
  const triggers = [];   // 内部フラグ（種別判定用）

  // ── GSC シグナル ──
  if (gsc) {
    const { impressions, ctr, position, clicks } = gsc;
    const ctrPct = (ctr * 100).toFixed(1);
    const posFmt = position.toFixed(1);

    // 高インプレ・低CTR → タイトル/メタ改善が最優先
    if (impressions >= 500 && ctr < 0.02) {
      pts += 50;
      triggers.push('low_ctr_high_imp');
      reasons.push(`インプレ ${impressions.toLocaleString()} / CTR ${ctrPct}%（目標3%+）`);
      actions.push('タイトルに数字・ベネフィット・年を追加してCTRを改善');
      actions.push('metaDescriptionの冒頭1文で「誰に・何がわかるか」を明記');
    } else if (impressions >= 200 && ctr < 0.03) {
      pts += 25;
      triggers.push('low_ctr');
      reasons.push(`インプレ ${impressions.toLocaleString()} / CTR ${ctrPct}%（改善余地）`);
      actions.push('タイトルの検索意図との一致度を再確認する');
    }

    // 順位 4〜10 → あと少しでトップ3、最も費用対効果の高い改善帯
    if (position >= 4 && position <= 10 && impressions >= 100) {
      pts += 45;
      triggers.push('position_4_10');
      reasons.push(`順位 ${posFmt}（トップ3まであと少し・最優先帯）`);
      actions.push('FAQを5問以上追加してSGE・ゼロクリック対策を強化');
      actions.push('H2/H3 見出しにロングテールキーワードを組み込む');
      actions.push('更新日・著者情報を明示してE-E-A-T を強化');
    } else if (position >= 11 && position <= 20 && impressions >= 50) {
      pts += 20;
      triggers.push('position_11_20');
      reasons.push(`順位 ${posFmt}（2ページ目）`);
      actions.push('競合上位記事と比べて不足している情報・見出しを追加');
      actions.push('内部リンクを2件以上追加して権威性を補強');
    }

    // 高インプレかつ圏外 → 記事の抜本的リライトが必要
    if (impressions >= 300 && position > 20) {
      pts += 15;
      triggers.push('high_imp_low_pos');
      reasons.push(`インプレ ${impressions.toLocaleString()} / 順位 ${posFmt}（圏外）`);
      actions.push('検索意図を再分析し、導入・構成・見出しを全面見直し');
    }
  }

  // ── GA4 シグナル ──
  if (ga4) {
    const { sessions, avgDuration, bounceRate } = ga4;
    const bouncePct = (bounceRate * 100).toFixed(0);

    // 低滞在・高直帰 → コンテンツ品質・構成の問題
    if (avgDuration < 30 && bounceRate > 0.75 && sessions >= 30) {
      pts += 30;
      triggers.push('high_bounce');
      reasons.push(`滞在 ${avgDuration.toFixed(0)}秒 / 直帰率 ${bouncePct}%`);
      actions.push('導入文を改善（最初の2文で記事の価値を明確に）');
      actions.push('ファーストビューにTOCを設置してスキャナビリティを上げる');
      actions.push('中間CTAを追加して離脱前にコンバージョンを促す');
    } else if (bounceRate > 0.68 && sessions >= 50) {
      pts += 15;
      triggers.push('bounce');
      reasons.push(`直帰率 ${bouncePct}%`);
      actions.push('関連記事への内部リンクを増やして回遊を促す');
    }
  }

  // ── Mixpanel: CV シグナル ──
  if (mp && ga4) {
    const cvTotal = (mp.contactClicks ?? 0) + (mp.ctaClicks ?? 0);
    if (ga4.sessions >= 100 && cvTotal === 0) {
      pts += 20;
      triggers.push('no_cv');
      reasons.push('CV 0件（100+ セッションあり）');
      actions.push('CTAボタンの文言を「相談する」「診断する」に変更');
      actions.push('CTA をH2の直後にも中間配置する');
    }
  }

  return { pts, triggers, reasons, actions };
}

// ── Slack 通知 ────────────────────────────────────────────────────────────

function priorityBadge(pts) {
  if (pts >= 70) return '🔴 緊急';
  if (pts >= 45) return '🟠 高';
  if (pts >= 20) return '🟡 中';
  return '🟢 低';
}

async function sendSlack(webhookUrl, ranked, dataAvail) {
  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const availLabels = [
    dataAvail.gsc       ? '✅ GSC'       : '⬜ GSC（未設定）',
    dataAvail.ga4       ? '✅ GA4'       : '⬜ GA4（未設定）',
    dataAvail.mixpanel  ? '✅ Mixpanel'  : '⬜ Mixpanel（未設定）',
  ].join('  ');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 SEO改善レポート — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `過去${REPORT_DAYS}日間 ｜ 改善優先度 TOP${ranked.length}\n${availLabels}`,
      },
    },
    { type: 'divider' },
  ];

  for (let i = 0; i < ranked.length; i++) {
    const { slug, title, score, gsc, ga4 } = ranked[i];
    const articleUrl = `${SITE}/blog/${slug}/`;

    // 指標の組み立て
    const metrics = [];
    if (gsc) {
      metrics.push(`インプレ *${gsc.impressions.toLocaleString()}*`);
      metrics.push(`CTR *${(gsc.ctr * 100).toFixed(1)}%*`);
      metrics.push(`順位 *${gsc.position.toFixed(1)}*`);
      metrics.push(`クリック *${gsc.clicks}*`);
    }
    if (ga4) {
      metrics.push(`滞在 *${ga4.avgDuration.toFixed(0)}s*`);
      metrics.push(`直帰 *${(ga4.bounceRate * 100).toFixed(0)}%*`);
      metrics.push(`セッション *${ga4.sessions}*`);
    }

    const actionLines = score.actions
      .slice(0, 3)
      .map((a, j) => `>${j + 1}. ${a}`)
      .join('\n');

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${i + 1}位  ${priorityBadge(score.pts)}  スコア ${score.pts}pts*`,
          `*<${articleUrl}|${title}>*`,
          metrics.length ? metrics.join('   ') : '_データなし_',
          `_${score.reasons.join(' / ')}_`,
          '',
          '*改善施策:*',
          actionLines,
        ].join('\n'),
      },
    });

    if (i < ranked.length - 1) blocks.push({ type: 'divider' });
  }

  blocks.push(
    { type: 'divider' },
    {
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: [
          '変更を適用する場合は対応するリライトスクリプトを手動で実行してください。',
          '`node scripts/rewrite-*.mjs` ｜ microCMS への自動反映・自動公開は行いません。',
        ].join('  '),
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
    MIXPANEL_PROJECT_ID,
    MIXPANEL_API_SECRET,
    SLACK_WEBHOOK_URL,
    MICROCMS_API_KEY,
  } = process.env;

  if (!SLACK_WEBHOOK_URL)  throw new Error('SLACK_WEBHOOK_URL is required');
  if (!MICROCMS_API_KEY)   throw new Error('MICROCMS_API_KEY is required');

  // ── microCMS 記事一覧 ──
  console.log('[microCMS] 記事リスト取得中...');
  const articles = await fetchArticles(MICROCMS_API_KEY);
  console.log(`  → ${Object.keys(articles).length} 記事`);

  // ── Google APIs ──
  let gscData = {};
  let ga4Data = {};

  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN && GSC_SITE_URL) {
    try {
      console.log('[Google] アクセストークン取得中...');
      const token = await getGoogleToken(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN);

      console.log('[GSC] データ取得中...');
      gscData = await fetchGsc(token, GSC_SITE_URL);
      console.log(`  → ${Object.keys(gscData).length} URL`);

      if (GA4_PROPERTY_ID) {
        console.log('[GA4] データ取得中...');
        ga4Data = await fetchGa4(token, GA4_PROPERTY_ID);
        console.log(`  → ${Object.keys(ga4Data).length} ページ`);
      }
    } catch (err) {
      console.warn(`[Google] スキップ: ${err.message}`);
    }
  } else {
    console.warn('[Google] OAuth認証情報 / GSC_SITE_URL 未設定 → スキップ');
  }

  // ── Mixpanel ──
  let mpData = {};
  if (MIXPANEL_PROJECT_ID && MIXPANEL_API_SECRET) {
    try {
      console.log('[Mixpanel] CVイベント取得中...');
      mpData = await fetchMixpanel(MIXPANEL_PROJECT_ID, MIXPANEL_API_SECRET);
      console.log(`  → ${Object.keys(mpData).length} ページにイベントあり`);
    } catch (err) {
      console.warn(`[Mixpanel] スキップ: ${err.message}`);
    }
  } else {
    console.warn('[Mixpanel] 認証情報未設定 → スキップ');
  }

  // ── 全記事スコアリング ──
  console.log('[Score] 全記事スコアリング中...');
  const scored = Object.entries(articles).map(([slug, article]) => ({
    slug,
    title:     article.title,
    updatedAt: article.updatedAt,
    score:     scoreArticle(gscData[slug], ga4Data[slug], mpData[slug]),
    gsc:       gscData[slug] ?? null,
    ga4:       ga4Data[slug] ?? null,
    mp:        mpData[slug]  ?? null,
  }));

  // pts > 0 かつ reasons があるものだけ対象にしてスコア降順
  const ranked = scored
    .filter(a => a.score.pts > 0 && a.score.reasons.length > 0)
    .sort((a, b) => b.score.pts - a.score.pts)
    .slice(0, TOP_N);

  console.log(`[Score] 改善優先度 TOP${ranked.length}:`);
  ranked.forEach((a, i) =>
    console.log(`  ${i + 1}. [${a.score.pts}pts] ${a.title.slice(0, 60)}`)
  );

  // ── JSON レポート保存（GitHub Actions Artifact） ──
  const report = {
    generatedAt: new Date().toISOString(),
    period: { days: REPORT_DAYS, from: isoDate(REPORT_DAYS), to: isoDate(2) },
    dataAvailability: {
      gsc:      Object.keys(gscData).length > 0,
      ga4:      Object.keys(ga4Data).length > 0,
      mixpanel: Object.keys(mpData).length > 0,
    },
    ranked,
    all: scored.sort((a, b) => b.score.pts - a.score.pts),
  };
  writeFileSync('seo-report.json', JSON.stringify(report, null, 2));
  console.log('[Report] seo-report.json を保存しました');

  // ── Slack 通知 ──
  const dataAvail = report.dataAvailability;

  if (ranked.length === 0) {
    console.log('[Slack] スコアが付いた記事なし → 通知をスキップ');
    return;
  }

  console.log('[Slack] 通知送信中...');
  await sendSlack(SLACK_WEBHOOK_URL, ranked, dataAvail);
  console.log('[Slack] 送信完了');
}

main().catch(err => { console.error('[Fatal]', err); process.exit(1); });
