import { c as createComponent } from './astro-component_CWOMJT8m.mjs';
import 'piccolore';
import './params-and-props_7eCVYVQa.mjs';
import 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import { a as cached, f as formatDate, e as escapeHtml, c as client, m as mapBlog } from './microcms_RIyEiiDZ.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const blogs = await cached("blogs", async () => {
    const res = await client.getList({ endpoint: "blogs", queries: { limit: 100, orders: "-publishedAt" } });
    return res.contents.map(mapBlog);
  }).catch(() => []);
  let html = fs.readFileSync(path.join(process.cwd(), "old", "blog", "index.html"), "utf-8");
  if (blogs.length > 0) {
    const SPLIT = '<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-6 mt-10 lg:mt-16">';
    const AFTER = '</div><div class="flex justify-center mt-16">';
    const si = html.indexOf(SPLIT);
    if (si !== -1) {
      const pre = html.slice(0, si + SPLIT.length);
      const rest = html.slice(si + SPLIT.length);
      const ai = rest.indexOf(AFTER);
      const fromAfter = rest.slice(ai);
      const newArticles = blogs.map((blog) => {
        const date = formatDate(blog.day ?? blog.publishedAt);
        const cat = typeof blog.category === "string" ? blog.category : blog.category?.name ?? "";
        const img = blog.eyecatch?.url ?? "/images/blog-01.jpg";
        return '<a class="block hover:opacity-90 transition-opacity" href="/blog/' + blog.id + '/"><div class="rounded-[10px] lg:rounded-[20px] overflow-hidden shadow-[0px_0px_24px_0px_rgba(128,170,218,0.3)] bg-white"><div class="w-full aspect-[384/200] relative"><img alt="' + escapeHtml(blog.title) + '" loading="lazy" class="object-cover" src="' + img + '" style="position:absolute;height:100%;width:100%;inset:0;"></div><div class="bg-white p-3 lg:p-6 flex flex-col gap-1 lg:gap-2"><div class="flex flex-col lg:flex-row gap-1 lg:gap-2"><span class="text-xs lg:text-base font-black font-[Roboto] text-black">' + date + "</span>" + (cat ? '<span class="self-start border border-[#005bea] text-[#005bea] text-[10px] lg:text-xs px-2 lg:px-4 py-0 lg:py-0.5 rounded-[10px]">' + escapeHtml(cat) + "</span>" : "") + '</div><p class="text-xs lg:text-lg font-extrabold leading-[1.6] tracking-[0.03em] text-[#005bea] line-clamp-2">' + escapeHtml(blog.title) + "</p>" + (blog.content ? '<p class="text-xs lg:text-base leading-[1.7] tracking-[0.03em] text-black line-clamp-3 lg:line-clamp-4">' + escapeHtml(blog.content) + "</p>" : "") + "</div></div></a>";
      }).join("");
      html = pre + newArticles + fromAfter;
    }
  }
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}, "/Users/andoaoi/Downloads/out-2/src/pages/blog/index.astro", void 0);

const $$file = "/Users/andoaoi/Downloads/out-2/src/pages/blog/index.astro";
const $$url = "/blog";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
