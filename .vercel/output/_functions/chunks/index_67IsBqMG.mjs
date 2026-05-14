import { c as createComponent } from './astro-component_CWOMJT8m.mjs';
import 'piccolore';
import './params-and-props_7eCVYVQa.mjs';
import 'clsx';
import fs from 'node:fs';
import path from 'node:path';
import { a as cached, c as client, b as mapFaq, d as mapNews, f as formatDate, e as escapeHtml } from './microcms_RIyEiiDZ.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const [faqs, newsItems] = await Promise.all([
    cached("faq", async () => {
      const res = await client.getList({ endpoint: "faq", queries: { limit: 100 } });
      return res.contents.map(mapFaq);
    }).catch(() => []),
    cached("news", async () => {
      const res = await client.getList({ endpoint: "news", queries: { limit: 10, orders: "-publishedAt" } });
      return res.contents.map(mapNews);
    }).catch(() => [])
  ]);
  let html = fs.readFileSync(path.join(process.cwd(), "old", "index.html"), "utf-8");
  if (newsItems.length > 0) {
    const SPLIT = 'お知らせ</h2></div><div class="flex flex-col">';
    const si = html.indexOf(SPLIT);
    if (si !== -1) {
      const pre = html.slice(0, si + SPLIT.length);
      const rest = html.slice(si + SPLIT.length);
      const faqIdx = rest.indexOf('<div id="faq"');
      const closing = rest.slice(0, faqIdx).slice(rest.slice(0, faqIdx).lastIndexOf("</div></section>"));
      const newNews = newsItems.map(
        (item, i) => '<div class="flex flex-col lg:flex-row gap-2 lg:gap-4 items-start py-6 border-b border-[#8d8d8d] ' + (i === 0 ? "border-t" : "") + '"><p class="text-base text-[#005BEA] font-normal leading-[30px] tracking-[0.03em] whitespace-nowrap">' + formatDate(item.day ?? item.publishedAt) + '</p><p class="flex-1 text-base leading-[30px] tracking-[0.03em]">' + escapeHtml(item.title) + "</p></div>"
      ).join("");
      html = pre + newNews + closing + rest.slice(faqIdx);
    }
  }
  if (faqs.length > 0) {
    const SPLIT = 'よくある質問</h2></div><div class="space-y-4">';
    const si = html.indexOf(SPLIT);
    if (si !== -1) {
      const pre = html.slice(0, si + SPLIT.length);
      const rest = html.slice(si + SPLIT.length);
      const ci = rest.indexOf("</div></section></div>");
      const plusSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="faq-icon w-5 h-5 text-primary shrink-0 transition-transform duration-200"><path d="M5 12h14"></path><path class="faq-v" d="M12 5v14"></path></svg>';
      const newFaqs = faqs.map(
        (item) => '<div class="bg-white rounded-2xl overflow-hidden"><button class="w-full flex items-center justify-between p-5 lg:p-6 text-left cursor-pointer" aria-expanded="false"><div class="flex items-center gap-3"><span class="w-6 h-6 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center shrink-0">Q</span><span class="text-base font-semibold leading-[29px] lg:leading-[30px]">' + escapeHtml(item.question) + "</span></div>" + plusSvg + '</button><div class="hidden px-5 pb-5 lg:px-6 lg:pb-6 text-sm lg:text-base leading-relaxed text-gray-700">' + item.answer + "</div></div>"
      ).join("");
      html = pre + newFaqs + rest.slice(ci);
    }
  }
  const scriptOpen = ["<", "s", "c", "r", "i", "p", "t", ">"].join("");
  const scriptClose = ["<", "/", "s", "c", "r", "i", "p", "t", ">"].join("");
  const accordionFn = "document.querySelectorAll('#faq button[aria-expanded]').forEach(function(b){b.addEventListener('click',function(){var p=this.nextElementSibling,o=this.getAttribute('aria-expanded')==='true';this.setAttribute('aria-expanded',String(!o));p.classList.toggle('hidden');var v=this.querySelector('.faq-v');if(v)v.style.display=o?'':'none';});});";
  html = html.replace("</body>", scriptOpen + accordionFn + scriptClose + "</body>");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}, "/Users/andoaoi/Downloads/out-2/src/pages/index.astro", void 0);

const $$file = "/Users/andoaoi/Downloads/out-2/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
