import type { APIRoute } from 'astro';
import { client, mapBlog } from '../lib/microcms';

const BASE = 'https://www.cocomarke.com';

const STATIC_PAGES = [
  { url: '/',          priority: '1.0', changefreq: 'weekly' },
  { url: '/about/',    priority: '0.8', changefreq: 'monthly' },
  { url: '/blog/',     priority: '0.8', changefreq: 'weekly' },
  { url: '/contact/',  priority: '0.7', changefreq: 'monthly' },
  { url: '/privacy/',  priority: '0.3', changefreq: 'yearly' },
];

export const GET: APIRoute = async () => {
  let blogEntries: { url: string; lastmod: string; priority: string; changefreq: string }[] = [];

  try {
    const res = await client.getList<any>({ endpoint: 'blogs', queries: { limit: 100, orders: '-publishedAt' } });
    blogEntries = res.contents.map((raw: any) => {
      const blog = mapBlog(raw);
      return {
        url: `/blog/${blog.id}/`,
        lastmod: (blog.day ?? blog.publishedAt).slice(0, 10),
        priority: '0.6',
        changefreq: 'monthly',
      };
    });
  } catch {
    // microCMS unavailable — static pages only
  }

  const today = new Date().toISOString().slice(0, 10);

  const urls = [
    ...STATIC_PAGES.map(p => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
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
  ].join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
