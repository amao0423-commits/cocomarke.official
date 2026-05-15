/**
 * WIX → microCMS 記事移行スクリプト
 * 使い方: node scripts/migrate-wix.mjs <WRITE_API_KEY>
 */

import { chromium } from 'playwright';

const WRITE_KEY = process.argv[2];
const MICROCMS_URL = 'https://cocomarke.microcms.io/api/v1/blogs';
const RSS_URL = 'https://www.cocomarke.com/blog-feed.xml';
const BLOG_INDEX = 'https://www.cocomarke.com/blog';

if (!WRITE_KEY) {
  console.error('使い方: node scripts/migrate-wix.mjs <WRITE_API_KEY>');
  process.exit(1);
}

// RSSから記事URLを全件取得
async function getUrlsFromRss() {
  const res = await fetch(RSS_URL);
  const xml = await res.text();
  const links = [...xml.matchAll(/<link>(https:\/\/www\.cocomarke\.com\/post\/[^<]+)<\/link>/g)]
    .map(m => m[1].trim());
  return [...new Set(links)];
}

// サイトマップから全記事URLを取得
async function getUrlsFromSitemap() {
  const urls = new Set();
  const candidates = [
    'https://www.cocomarke.com/sitemap.xml',
    'https://www.cocomarke.com/blog-sitemap.xml',
    'https://www.cocomarke.com/post-sitemap.xml',
  ];
  for (const sitemapUrl of candidates) {
    try {
      const res = await fetch(sitemapUrl);
      if (!res.ok) continue;
      const xml = await res.text();
      // サイトマップインデックス（入れ子）の場合、子サイトマップを再帰取得
      const childMaps = [...xml.matchAll(/<loc>(https?:\/\/[^<]*sitemap[^<]*)<\/loc>/gi)]
        .map(m => m[1].trim());
      for (const child of childMaps) {
        try {
          const r2 = await fetch(child);
          if (!r2.ok) continue;
          const xml2 = await r2.text();
          [...xml2.matchAll(/<loc>(https:\/\/www\.cocomarke\.com\/post\/[^<]+)<\/loc>/g)]
            .forEach(m => urls.add(m[1].trim()));
        } catch {}
      }
      // 直接記事URLが含まれる場合
      [...xml.matchAll(/<loc>(https:\/\/www\.cocomarke\.com\/post\/[^<]+)<\/loc>/g)]
        .forEach(m => urls.add(m[1].trim()));
    } catch {}
  }
  return [...urls];
}

// ブログ一覧ページから全URLを取得（RSSが20件上限のため）
async function getAllUrls(page) {
  console.log('📋 記事URL一覧を取得中...');
  const urls = new Set();

  // サイトマップから取得（最も確実）
  const sitemapUrls = await getUrlsFromSitemap();
  sitemapUrls.forEach(u => urls.add(u));
  console.log(`  サイトマップから ${urls.size} 件取得`);

  // RSSから取得
  const rssUrls = await getUrlsFromRss();
  rssUrls.forEach(u => urls.add(u));
  console.log(`  RSS追加後: ${urls.size} 件`);

  // ブログ一覧ページをスクロール＋「もっと見る」ボタンクリックで追加取得
  await page.goto(BLOG_INDEX, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(3000);

  let prevCount = 0;
  for (let i = 0; i < 20; i++) {
    // 「もっと見る」「Load more」ボタンをクリック
    try {
      const clicked = await page.evaluate(() => {
        const btns = [...document.querySelectorAll('button, a')];
        const loadMore = btns.find(el => {
          const t = (el.textContent || '').trim();
          return /もっと見る|さらに表示|load more|show more|view more/i.test(t);
        });
        if (loadMore) { loadMore.click(); return true; }
        return false;
      });
      if (clicked) await page.waitForTimeout(2000);
    } catch {}

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const links = await page.$$eval('a[href*="/post/"]', els =>
      els.map(el => el.href).filter(h => h.includes('/post/'))
    );
    links.forEach(u => urls.add(u.split('?')[0]));

    if (urls.size === prevCount) break;
    prevCount = urls.size;
    console.log(`  スクロール後: ${urls.size} 件`);
  }

  return [...urls].filter(u => u.includes('/post/'));
}

// 1記事をスクレイプ
async function scrapePost(page, url) {
  const slug = url.split('/post/')[1]?.split('?')[0];
  if (!slug) return null;

  await page.goto(url, { waitUntil: 'load', timeout: 40000 });
  await page.waitForTimeout(4000);

  // OGタグから基本情報取得
  const title = await page.$eval('meta[property="og:title"]', el => el.content)
    .catch(() => page.$eval('h1', el => el.textContent?.trim()).catch(() => ''));
  const ogImage = await page.$eval('meta[property="og:image"]', el => el.content)
    .catch(() => '');
  const publishedAt = await page.$eval('meta[property="article:published_time"]', el => el.content)
    .catch(() => null);

  // 本文HTML取得（複数セレクタを試行）
  let content = '';
  const selectors = [
    '[data-hook="post-page-content"]',
    '[data-testid="post-content"]',
    '.wixui-rich-text__text',
    'article',
    '[role="main"] .rtz3ah3',
  ];

  for (const sel of selectors) {
    try {
      const html = await page.$eval(sel, el => el.innerHTML);
      if (html && html.length > 200) {
        content = html;
        break;
      }
    } catch {}
  }

  // セレクタで取れない場合はページテキストから
  if (!content) {
    content = await page.evaluate(() => {
      const main = document.querySelector('main') || document.querySelector('[role="main"]');
      return main ? main.innerHTML : '';
    });
  }

  // WIX特有の不要な属性を軽く除去
  content = content
    .replace(/\s*data-[a-z-]+=["'][^"']*["']/g, '')
    .replace(/\s*class="[^"]*"/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '');

  return { slug, title, content, eyecatch: ogImage, day: publishedAt };
}

// コンテンツID（最大50文字、単語区切りで切る）
function toContentId(slug) {
  if (slug.length <= 50) return slug;
  const truncated = slug.slice(0, 50);
  const lastHyphen = truncated.lastIndexOf('-');
  return lastHyphen > 20 ? truncated.slice(0, lastHyphen) : truncated;
}

// microCMSに投稿
async function postToMicrocms(data) {
  const contentId = toContentId(data.slug);
  const body = {
    title: data.title,
    content: data.content,
  };
  if (data.day) body.day = data.day;
  // eyecatchは外部URLが使えないためスキップ（microCMSで手動設定 or 後続スクリプトで追加）

  const res = await fetch(`${MICROCMS_URL}/${contentId}`, {
    method: 'PUT',
    headers: {
      'X-MICROCMS-API-KEY': WRITE_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return { status: res.status, ok: res.ok, text: await res.text() };
}

// メイン処理
async function main() {
  console.log('🚀 WIX → microCMS 移行開始\n');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(60000);

  let urls = [];
  try {
    urls = await getAllUrls(page);
  } catch (e) {
    console.error('URL取得エラー:', e.message);
    urls = await getUrlsFromRss();
  }

  console.log(`\n📝 合計 ${urls.length} 件の記事を処理します\n`);

  const results = { ok: [], failed: [] };

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const slug = url.split('/post/')[1]?.split('?')[0];
    console.log(`[${i + 1}/${urls.length}] ${slug}`);

    try {
      const data = await scrapePost(page, url);
      if (!data || !data.title) {
        console.log('  ⚠️  データ取得失敗、スキップ');
        results.failed.push({ url, reason: 'no data' });
        continue;
      }

      const result = await postToMicrocms(data);
      if (result.ok) {
        console.log(`  ✅ 投稿成功`);
        results.ok.push(slug);
      } else {
        console.log(`  ❌ 投稿失敗: ${result.status} ${result.text.slice(0, 100)}`);
        results.failed.push({ url, reason: result.text.slice(0, 100) });
      }
    } catch (e) {
      console.log(`  ❌ エラー: ${e.message}`);
      results.failed.push({ url, reason: e.message });
    }

    // レート制限対策
    await page.waitForTimeout(1500);
  }

  await browser.close();

  console.log('\n📊 完了レポート');
  console.log(`  成功: ${results.ok.length} 件`);
  console.log(`  失敗: ${results.failed.length} 件`);
  if (results.failed.length > 0) {
    console.log('\n失敗した記事:');
    results.failed.forEach(f => console.log(`  - ${f.url}: ${f.reason}`));
  }
}

main().catch(console.error);
