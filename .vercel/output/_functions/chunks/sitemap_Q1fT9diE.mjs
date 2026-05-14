import { c as client, m as mapBlog } from './microcms_RIyEiiDZ.mjs';

const BASE = "https://www.cocomake.com";
const STATIC_PAGES = [
  { url: "/", priority: "1.0", changefreq: "weekly" },
  { url: "/about/", priority: "0.8", changefreq: "monthly" },
  { url: "/blog/", priority: "0.8", changefreq: "weekly" },
  { url: "/contact/", priority: "0.7", changefreq: "monthly" },
  { url: "/privacy/", priority: "0.3", changefreq: "yearly" }
];
const GET = async () => {
  let blogEntries = [];
  try {
    const res = await client.getList({ endpoint: "blogs", queries: { limit: 100, orders: "-publishedAt" } });
    blogEntries = res.contents.map((raw) => {
      const blog = mapBlog(raw);
      return {
        url: `/blog/${blog.id}/`,
        lastmod: (blog.day ?? blog.publishedAt).slice(0, 10),
        priority: "0.6",
        changefreq: "monthly"
      };
    });
  } catch {
  }
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const urls = [
    ...STATIC_PAGES.map((p) => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`),
    ...blogEntries.map((p) => `
  <url>
    <loc>${BASE}${p.url}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`)
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
