import type { APIRoute } from 'astro';
import { client, mapBlog, mapNews, isoDateJst } from '../lib/microcms';

const BASE = 'https://www.cocomarke.com';

// microCMS は1回のリクエストで最大100件までのため、全件をたどって取得する。
// limit:100 のままだと100件を超えた記事がサイトマップから漏れる。
async function fetchAll(endpoint: string, fields: string, orders: string) {
  const out: any[] = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList<any>({ endpoint, queries: { limit: 100, offset, orders, fields } });
    out.push(...res.contents);
    if (out.length >= res.totalCount || !res.contents.length) break;
  }
  return out;
}

const STATIC_PAGES = [
  { url: '/',          priority: '1.0', changefreq: 'weekly' },
  { url: '/about/',    priority: '0.8', changefreq: 'monthly' },
  { url: '/blog/',     priority: '0.8', changefreq: 'weekly' },
  { url: '/news/',     priority: '0.6', changefreq: 'weekly' },
  { url: '/contact/',  priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy/',  priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  const today = isoDateJst(new Date().toISOString());
  let blogEntries: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];
  let newsEntries: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];

  let categoryEntries: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];

  try {
    const contents = await fetchAll('blogs', 'id,day,publishedAt,updatedAt,updatedDate,category', '-publishedAt');
    const res = { contents };
    blogEntries = res.contents.map((raw: any) => {
      const blog = mapBlog(raw);
      return {
        url: `/blog/${blog.id}/`,
        // 表示している更新日（CMSの updatedDate）と揃える。
        // updatedAt は軽微な編集でも動くため lastmod には使わない。
        lastmod: isoDateJst(blog.updatedDate ?? raw.updatedAt ?? blog.day ?? blog.publishedAt),
        priority: '0.7',
        changefreq: 'monthly',
      };
    });
    // カテゴリーページ（SEO流入源としてインデックス）
    const cats = new Set<string>();
    for (const raw of res.contents) {
      const c = typeof raw.category === 'string' ? raw.category : raw.category?.name;
      if (c) cats.add(c);
    }
    categoryEntries = [...cats].map(c => ({
      url: `/blog/category/${encodeURIComponent(c)}/`,
      lastmod: today,
      priority: '0.6',
      changefreq: 'weekly',
    }));
  } catch {
    // microCMS unavailable — static pages only
  }

  try {
    const contents = await fetchAll('news', 'id,day,publishedAt,updatedAt', '-day');
    const res = { contents };
    newsEntries = res.contents.map((raw: any) => {
      const news = mapNews(raw);
      return {
        url: `/news/${news.id}/`,
        lastmod: isoDateJst(raw.updatedAt ?? news.day ?? news.publishedAt),
        priority: '0.5',
        changefreq: 'monthly',
      };
    });
  } catch {
    // microCMS unavailable — static pages only
  }

  const urls = [
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...categoryEntries.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...blogEntries.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...newsEntries.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
