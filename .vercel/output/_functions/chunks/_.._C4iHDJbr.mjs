import { c as createComponent } from './astro-component_CWOMJT8m.mjs';
import 'piccolore';
import './params-and-props_7eCVYVQa.mjs';
import 'clsx';
import fs from 'node:fs';
import path from 'node:path';

const $$ = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$;
  const { slug } = Astro2.params;
  const base = path.join(process.cwd(), "old");
  let htmlFile = path.join(base, String(slug), "index.html");
  if (!fs.existsSync(htmlFile)) {
    htmlFile = path.join(base, String(slug) + ".html");
  }
  if (!fs.existsSync(htmlFile)) {
    return Astro2.redirect("/404");
  }
  const html = fs.readFileSync(htmlFile, "utf-8");
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}, "/Users/andoaoi/Downloads/out-2/src/pages/[...slug].astro", void 0);

const $$file = "/Users/andoaoi/Downloads/out-2/src/pages/[...slug].astro";
const $$url = "/[...slug]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
