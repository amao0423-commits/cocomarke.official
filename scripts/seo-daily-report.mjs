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

// ── GA4: 汎用 runReport ───────────────────────────────────────────────────

async function ga4RunReport(token, propertyId, body) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) throw new Error(`GA4 ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const dimIdx = Object.fromEntries((data.dimensionHeaders ?? []).map((h, i) => [h.name, i]));
  const metIdx = Object.fromEntries((data.metricHeaders ?? []).map((h, i) => [h.name, i]));
  return (data.rows ?? []).map(row => ({
    dim: (name) => row.dimensionValues[dimIdx[name]]?.value ?? '',
    met: (name) => parseFloat(row.metricValues[metIdx[name]]?.value ?? '0'),
  }));
}

// ── 流入元・コンバージョン分析（GA4） ──────────────────────────────────────
// CV = フォーム完了(/contact/thanks/) + LP CTAクリック(cocomake-guideへの外部クリック)

const ACQ_DAYS = 7; // 流入分析は直近7日（広告の効きを見やすく）
const CV_PATH = '/contact/thanks';
const CTA_DOMAIN = 'cocomake-guide';

async function fetchAcquisition(token, propertyId) {
  const range = [{ startDate: `${ACQ_DAYS}daysAgo`, endDate: 'yesterday' }];

  // A: 流入元別セッション
  const traffic = await ga4RunReport(token, propertyId, {
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
    dateRanges: range,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 25,
  });

  // B: フォーム完了（/contact/thanks/ のPV）を流入元別に
  const formCv = await ga4RunReport(token, propertyId, {
    dimensions: [{ name: 'sessionSourceMedium' }],
    metrics: [{ name: 'screenPageViews' }],
    dateRanges: range,
    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'CONTAINS', value: CV_PATH } } },
    limit: 50,
  });

  // C: LP CTAクリック（cocomake-guideへの外部リンククリック）を流入元別に
  let clickCv = [];
  try {
    clickCv = await ga4RunReport(token, propertyId, {
      dimensions: [{ name: 'sessionSourceMedium' }],
      metrics: [{ name: 'eventCount' }],
      dateRanges: range,
      dimensionFilter: {
        andGroup: { expressions: [
          { filter: { fieldName: 'eventName', stringFilter: { value: 'click' } } },
          { filter: { fieldName: 'linkDomain', stringFilter: { matchType: 'CONTAINS', value: CTA_DOMAIN } } },
        ] },
      },
      limit: 50,
    });
  } catch (e) { console.warn(`[GA4] CTAクリック取得スキップ: ${e.message.slice(0, 80)}`); }

  // D: ランディングページ別セッション（どのコンテンツが入口か）
  const landing = await ga4RunReport(token, propertyId, {
    dimensions: [{ name: 'landingPage' }],
    metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
    dateRanges: range,
    orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    limit: 12,
  });

  // マージ: 流入元ごとに sessions / formCv / clickCv / CVR
  const formMap = Object.fromEntries(formCv.map(r => [r.dim('sessionSourceMedium'), r.met('screenPageViews')]));
  const clickMap = Object.fromEntries(clickCv.map(r => [r.dim('sessionSourceMedium'), r.met('eventCount')]));

  const sources = traffic.map(r => {
    const sm = r.dim('sessionSourceMedium');
    const sessions = r.met('sessions');
    const engaged = r.met('engagedSessions');
    const form = formMap[sm] ?? 0;
    const click = clickMap[sm] ?? 0;
    const cv = form + click;
    return {
      sourceMedium: sm,
      sessions,
      engageRate: sessions ? engaged / sessions : 0,
      formCv: form,
      clickCv: click,
      cv,
      cvr: sessions ? cv / sessions : 0,
    };
  });

  const landingPages = landing.map(r => ({
    path: r.dim('landingPage'),
    sessions: r.met('sessions'),
    engageRate: r.met('sessions') ? r.met('engagedSessions') / r.met('sessions') : 0,
  }));

  const totals = {
    sessions: sources.reduce((s, x) => s + x.sessions, 0),
    formCv: sources.reduce((s, x) => s + x.formCv, 0),
    clickCv: sources.reduce((s, x) => s + x.clickCv, 0),
  };
  totals.cv = totals.formCv + totals.clickCv;
  totals.cvr = totals.sessions ? totals.cv / totals.sessions : 0;

  return { sources, landingPages, totals, days: ACQ_DAYS };
}

// ── Clarity: 行動分析（改善点の発見） ──────────────────────────────────────

async function fetchClarity(projectId, token) {
  // Clarity Data Export API は直近1〜3日のみ対応。tokenはプロジェクト単位。
  const res = await fetch(
    `https://www.clarity.ms/export/api/v1/project-live-insights?numOfDays=3&dimension1=URL`,
    { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) }
  );
  if (!res.ok) throw new Error(`Clarity ${res.status}: ${(await res.text()).slice(0, 120)}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`Clarity 予期しない応答: ${JSON.stringify(data).slice(0, 120)}`);

  const num = (v) => parseFloat(String(v ?? '0').replace(/[^0-9.\-]/g, '')) || 0;
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');

  // metricName を正規化してキーワードで照合（API差異に強くする）
  const findMetric = (...keywords) => {
    const kw = keywords.map(norm);
    const m = data.find(x => kw.some(k => norm(x.metricName).includes(k)));
    return m?.information ?? [];
  };
  // 行から「件数」っぽいフィールドを推定（subTotal優先、なければ最大の数値フィールド）
  const rowCount = (row) => {
    if (row.subTotal != null) return num(row.subTotal);
    const candidates = Object.entries(row)
      .filter(([k, v]) => !/url|name|percent|percentage|date/i.test(k) && !isNaN(num(v)))
      .map(([, v]) => num(v));
    return candidates.length ? Math.max(...candidates) : 0;
  };
  const rowUrl = (row) => row.Url ?? row.URL ?? row.url ?? '(全体)';

  const summarize = (...keywords) => {
    const rows = findMetric(...keywords);
    const total = rows.reduce((s, x) => s + rowCount(x), 0);
    const top = rows
      .map(x => ({ url: rowUrl(x), count: rowCount(x) }))
      .filter(x => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return { total, top };
  };

  const traffic = findMetric('traffic');
  const totalSessions = traffic.reduce((s, x) => s + num(x.totalSessionCount ?? x.totalsessioncount ?? x.sessionsCount), 0);

  return {
    totalSessions,
    deadClicks: summarize('deadclick'),
    rageClicks: summarize('rageclick'),
    quickBacks: summarize('quickback'),
    scriptErrors: summarize('scripterror', 'jserror'),
    excessiveScroll: summarize('excessivescroll'),
  };
}

// ── AI要約（GitHub Models・無料・GITHUB_TOKEN） ────────────────────────────

async function generateAiSummary(payload, githubToken) {
  if (!githubToken) return null;
  try {
    const res = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${githubToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          {
            role: 'system',
            content:
              'あなたはBtoBのWebマーケティングアナリストです。Instagram運用代行サービスのサイト分析データを受け取り、日本語で簡潔に示唆を出します。' +
              '出力は次の3見出しのみ。各2〜3行、箇条書き可、Slack向けに短く。' +
              '【効果的だった流入・コンテンツ】【改善すべき点】【今日の打ち手（最大3つ）】。' +
              '数値は与えられたデータの範囲だけで述べ、推測で数字を作らない。',
          },
          { role: 'user', content: '以下が直近の分析データ(JSON)です。\n' + JSON.stringify(payload) },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) { console.warn(`[GitHub Models] ${res.status}: ${(await res.text()).slice(0, 120)}`); return null; }
    const d = await res.json();
    return d.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.warn(`[GitHub Models] スキップ: ${e.message.slice(0, 80)}`);
    return null;
  }
}

// ── ルールベース要約（AI不可時のフォールバック） ──────────────────────────

function ruleSummary(acq) {
  if (!acq || !acq.sources.length) return '_流入データが取得できませんでした。_';
  const withCv = acq.sources.filter(s => s.cv > 0).sort((a, b) => b.cv - a.cv);
  const topTraffic = acq.sources[0];
  const lines = [];
  if (withCv.length) {
    const best = withCv[0];
    lines.push(`• CVが最も多い流入元: *${best.sourceMedium}*（CV ${best.cv}・CVR ${(best.cvr * 100).toFixed(1)}%）`);
  }
  if (topTraffic) {
    lines.push(`• 最も流入が多い: *${topTraffic.sourceMedium}*（${topTraffic.sessions}セッション・CVR ${(topTraffic.cvr * 100).toFixed(1)}%）`);
  }
  const wasteful = acq.sources.filter(s => s.sessions >= 30 && s.cv === 0);
  if (wasteful.length) {
    lines.push(`• 流入はあるがCV 0の要改善: ${wasteful.slice(0, 3).map(s => s.sourceMedium).join(', ')}`);
  }
  return lines.join('\n') || '_特筆すべき傾向はありません。_';
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

// ── 流入元・CV分析の Slack ブロック ────────────────────────────────────────

function pad(s, n) { s = String(s); return s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length); }

function acquisitionBlocks(acq) {
  if (!acq || !acq.sources.length) {
    return [{ type: 'section', text: { type: 'mrkdwn', text: '*🎯 流入元・コンバージョン分析*\n_GA4データなし_' } }];
  }
  const t = acq.totals;
  const top = acq.sources.slice(0, 8);
  const header = pad('流入元(source/medium)', 26) + pad('Sess', 6) + pad('CV', 4) + 'CVR';
  const rows = top.map(s =>
    pad(s.sourceMedium, 26) + pad(s.sessions, 6) + pad(s.cv, 4) + (s.cvr * 100).toFixed(1) + '%'
  ).join('\n');

  const blocks = [
    { type: 'section', text: { type: 'mrkdwn', text:
      `*🎯 流入元・コンバージョン分析（直近${acq.days}日）*\n` +
      `合計 *${t.sessions.toLocaleString()}* セッション / CV *${t.cv}* 件` +
      `（フォーム ${t.formCv} ・ LP CTA ${t.clickCv}） / CVR *${(t.cvr * 100).toFixed(1)}%*`,
    } },
    { type: 'section', text: { type: 'mrkdwn', text: '```' + header + '\n' + rows + '```' } },
  ];

  // CVがある流入元のうち効率の良い順 TOP3
  const eff = acq.sources.filter(s => s.cv > 0 && s.sessions >= 5).sort((a, b) => b.cvr - a.cvr).slice(0, 3);
  if (eff.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text:
      '*✅ 効率の良い流入元（CVR順）*\n' +
      eff.map(s => `• ${s.sourceMedium} — CVR ${(s.cvr * 100).toFixed(1)}%（CV ${s.cv} / ${s.sessions}セッション）`).join('\n'),
    } });
  }
  // 入口コンテンツ TOP5
  if (acq.landingPages.length) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text:
      '*📄 流入の多い入口ページ*\n' +
      acq.landingPages.slice(0, 5).map(p => `• \`${p.path}\` — ${p.sessions}セッション（接触率 ${(p.engageRate * 100).toFixed(0)}%）`).join('\n'),
    } });
  }
  return blocks;
}

function clarityBlocks(clarity) {
  if (!clarity) return [];
  const fmt = (m, label) => {
    if (!m || !m.total) return null;
    const top = m.top[0];
    return `• ${label}: *${m.total}*${top ? `（最多: \`${(top.url || '').replace('https://www.cocomarke.com', '')}\`）` : ''}`;
  };
  const lines = [
    fmt(clarity.rageClicks, '怒りクリック（イライラ操作）'),
    fmt(clarity.deadClicks, 'デッドクリック（反応しない箇所）'),
    fmt(clarity.quickBacks, 'クイックバック（即離脱）'),
    fmt(clarity.scriptErrors, 'JSエラー'),
    fmt(clarity.excessiveScroll, '過剰スクロール（探し回り）'),
  ].filter(Boolean);
  if (!lines.length) return [];
  return [
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: `*🧭 行動分析（Clarity・直近3日 / ${clarity.totalSessions.toLocaleString()}セッション）*\n` + lines.join('\n') } },
  ];
}

async function sendSlack(webhookUrl, { ranked, fixedPages, techSeo, dataAvail, today, acq, clarity, aiSummary }) {
  const availLabels = [
    dataAvail.gsc ? '✅ GSC' : '⬜ GSC',
    dataAvail.ga4 ? '✅ GA4' : '⬜ GA4',
    dataAvail.clarity ? '✅ Clarity' : '⬜ Clarity',
    dataAvail.ai ? '🤖 AI' : '',
  ].filter(Boolean).join('  ');

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📊 Daily Marketing Report — ${today}`, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `${availLabels}` },
    },
    { type: 'divider' },
    // ── 流入元・コンバージョン分析（最優先） ──
    ...acquisitionBlocks(acq),
    // ── 行動分析（Clarity） ──
    ...clarityBlocks(clarity),
    // ── AI要約 ──
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: `*🤖 今日の示唆*\n${aiSummary || ruleSummary(acq)}` } },
    { type: 'divider' },
    // ── 記事ページ（SEO） ──
    { type: 'section', text: { type: 'mrkdwn', text: `*📝 記事ページ TOP${ranked.length}（SEO・過去${REPORT_DAYS}日）*` } },
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
    CLARITY_PROJECT_ID,
    CLARITY_API_TOKEN,
    GITHUB_TOKEN,
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
  let acq = null;

  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN && GSC_SITE_URL) {
    try {
      console.log('[Google] アクセストークン取得中...');
      const token = await getGoogleToken(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REFRESH_TOKEN);

      console.log('[GSC] データ取得中...');
      gscAll = await fetchGsc(token, GSC_SITE_URL);
      console.log(`  → ${Object.keys(gscAll).length} URL`);

      if (GA4_PROPERTY_ID) {
        console.log('[GA4] ページ別データ取得中...');
        ga4All = await fetchGa4(token, GA4_PROPERTY_ID);
        console.log(`  → ${Object.keys(ga4All).length} ページ`);

        console.log('[GA4] 流入元・CV分析取得中...');
        try {
          acq = await fetchAcquisition(token, GA4_PROPERTY_ID);
          console.log(`  → ${acq.sources.length} 流入元 / CV ${acq.totals.cv}件`);
        } catch (e) { console.warn(`[GA4] 流入分析スキップ: ${e.message.slice(0, 100)}`); }
      }
    } catch (err) {
      console.warn(`[Google] スキップ: ${err.message}`);
    }
  }

  // ── Clarity 行動分析 ──
  let clarity = null;
  if (CLARITY_PROJECT_ID && CLARITY_API_TOKEN) {
    try {
      console.log('[Clarity] 行動データ取得中...');
      clarity = await fetchClarity(CLARITY_PROJECT_ID, CLARITY_API_TOKEN);
      console.log(`  → ${clarity.totalSessions} セッション`);
    } catch (e) { console.warn(`[Clarity] スキップ: ${e.message.slice(0, 100)}`); }
  }

  // ── AI要約（GitHub Models・無料） ──
  let aiSummary = null;
  if (GITHUB_TOKEN && acq) {
    console.log('[GitHub Models] AI要約生成中...');
    aiSummary = await generateAiSummary({
      期間: `直近${acq.days}日`,
      流入元別: acq.sources.slice(0, 10).map(s => ({
        流入元: s.sourceMedium, セッション: s.sessions, CV: s.cv,
        フォームCV: s.formCv, LPクリックCV: s.clickCv, CVR: +(s.cvr * 100).toFixed(1),
      })),
      入口ページ: acq.landingPages.slice(0, 6).map(p => ({ path: p.path, sessions: p.sessions })),
      Clarity: clarity ? {
        怒りクリック: clarity.rageClicks.total, デッドクリック: clarity.deadClicks.total,
        クイックバック: clarity.quickBacks.total, JSエラー: clarity.scriptErrors.total,
      } : null,
    }, GITHUB_TOKEN);
    console.log(aiSummary ? '  → 生成成功' : '  → 失敗（ルールベースにフォールバック）');
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
    dataAvailability: {
      gsc: Object.keys(gscAll).length > 0,
      ga4: Object.keys(ga4All).length > 0,
      clarity: !!clarity,
      ai: !!aiSummary,
    },
    acquisition: acq,
    clarity,
    aiSummary,
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
    acq,
    clarity,
    aiSummary,
  });
  console.log('[Slack] 送信完了');
}

main().catch(err => { console.error('[Fatal]', err); process.exit(1); });
