/**
 * test-connections.mjs
 * GA4・Clarity の接続テスト
 * 実行: GOOGLE_OAUTH_CLIENT_ID=... GOOGLE_OAUTH_CLIENT_SECRET=... GOOGLE_OAUTH_REFRESH_TOKEN=... GA4_PROPERTY_ID=... CLARITY_PROJECT_ID=... CLARITY_API_TOKEN=... node scripts/test-connections.mjs
 */

const {
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_REFRESH_TOKEN,
  GA4_PROPERTY_ID,
  CLARITY_PROJECT_ID,
  CLARITY_API_TOKEN,
} = process.env;

async function getGoogleToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     GOOGLE_OAUTH_CLIENT_ID,
      client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
      refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN,
      grant_type:    'refresh_token',
    }),
  });
  const body = await res.json();
  console.log('[OAuth] レスポンス:', JSON.stringify(body).slice(0, 200));
  return body.access_token;
}

async function testGA4(token) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${GA4_PROPERTY_ID}:runReport`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'sessions' }],
      dateRanges: [{ startDate: '7daysAgo', endDate: '2daysAgo' }],
      limit: 5,
    }),
  });
  const text = await res.text();
  console.log(`[GA4] status: ${res.status}`);
  console.log('[GA4] response:', text.slice(0, 500));
}

async function testClarity() {
  const endpoints = [
    `https://www.clarity.ms/export/api/v1/${CLARITY_PROJECT_ID}/pages?startDate=2026-05-01&endDate=2026-05-31&pageSize=5`,
    `https://www.clarity.ms/export/api/v1/${CLARITY_PROJECT_ID}/metrics?startDate=2026-05-01&endDate=2026-05-31`,
    `https://www.clarity.ms/export/api/v1/${CLARITY_PROJECT_ID}`,
  ];

  for (const url of endpoints) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${CLARITY_API_TOKEN}` },
    });
    const text = await res.text();
    console.log(`[Clarity] ${url.split('/').slice(-1)[0]} → status: ${res.status}`);
    console.log('[Clarity] response:', text.slice(0, 300));
    console.log('---');
  }
}

console.log('=== 接続テスト開始 ===\n');

console.log('[1] Google OAuth トークン取得...');
const token = await getGoogleToken();
console.log('  access_token取得:', token ? '✅' : '❌');

if (token && GA4_PROPERTY_ID) {
  console.log('\n[2] GA4 接続テスト...');
  await testGA4(token);
}

if (CLARITY_PROJECT_ID && CLARITY_API_TOKEN) {
  console.log('\n[3] Clarity 接続テスト...');
  await testClarity();
}

console.log('\n=== 完了 ===');
