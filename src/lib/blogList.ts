/**
 * blogList.ts — ブログ一覧・カテゴリーページ・検索結果の共通レンダリング
 */
import { formatDate, escapeHtml, type Blog } from './microcms';
import type { CategoryCount } from './blogSidebar';

export const catName = (b: Blog): string =>
  typeof b.category === 'string' ? b.category : (b.category as any)?.name ?? '';

// 記事カード
export function renderCard(blog: Blog): string {
  const date = formatDate(blog.day ?? blog.publishedAt);
  const cat = catName(blog);
  const img = blog.eyecatch?.url ?? '/images/blog-01.jpg';
  return (
    `<a class="blog-card block hover:opacity-90 transition-opacity" href="/blog/${blog.id}/" data-category="${escapeHtml(cat)}" data-search="${escapeHtml((blog.title + ' ' + cat).toLowerCase())}">` +
    `<div class="rounded-[10px] lg:rounded-[20px] overflow-hidden shadow-[0px_0px_24px_0px_rgba(128,170,218,0.3)] bg-white">` +
    `<div class="w-full aspect-[384/200] relative">` +
    `<img alt="${escapeHtml(blog.title)}" loading="lazy" class="object-cover" src="${img}" style="position:absolute;height:100%;width:100%;inset:0;"></div>` +
    `<div class="bg-white p-3 lg:p-6 flex flex-col gap-1 lg:gap-2">` +
    `<div class="flex flex-col lg:flex-row gap-1 lg:gap-2">` +
    `<span class="text-xs lg:text-base font-black font-[Roboto] text-black">${date}</span>` +
    (cat ? `<span class="self-start border border-[#005bea] text-[#005bea] text-[10px] lg:text-xs px-2 lg:px-4 py-0 lg:py-0.5 rounded-[10px]">${escapeHtml(cat)}</span>` : '') +
    `</div>` +
    `<p class="text-xs lg:text-lg font-extrabold leading-[1.6] tracking-[0.03em] text-[#005bea] line-clamp-2">${escapeHtml(blog.title)}</p>` +
    `</div></div></a>`
  );
}

export function renderCards(blogs: Blog[]): string {
  return blogs.map(renderCard).join('');
}

// 上部カテゴリータブ
//  mode='filter' … クライアント側で即時フィルタ（/blog 用）
//  mode='link'   … 各カテゴリーページへのリンク（/blog/category/X 用）
export function categoryTabs(
  categories: string[],
  mode: 'filter' | 'link',
  activeCategory = ''
): { desktop: string; mobile: string } {
  const baseDesktop = 'cat-tab flex-1 py-4 text-center text-lg font-semibold leading-[1.7] tracking-[0.03em] whitespace-nowrap transition-colors';
  const tab = (label: string, cat: string, i: number) => {
    const active = mode === 'link' ? cat === activeCategory : (cat === 'all' && !activeCategory);
    const isLast = i === categories.length; // categories は「すべて」を除いた配列
    const radius = i === -1 ? 'rounded-l-[40px]' : isLast ? 'rounded-r-[40px]' : '';
    const color = active ? 'bg-[#005bea] text-white' : 'bg-[#f5f9fe] text-[#041840]';
    const cls = `${baseDesktop} ${color} ${radius} border-r border-[#b8c5bd]`;
    if (mode === 'link') {
      const href = cat === 'all' ? '/blog/' : `/blog/category/${encodeURIComponent(cat)}/`;
      return `<a class="${cls}" href="${href}">${escapeHtml(label)}</a>`;
    }
    return `<button class="${cls}" data-cat="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
  };
  const desktop =
    '<div class="hidden lg:flex rounded-[50px] overflow-hidden bg-white">' +
    tab('すべて', 'all', -1) +
    categories.map((c, i) => tab(c, c, i)).join('') +
    '</div>';

  const mItem = (label: string, cat: string) => {
    if (mode === 'link') {
      const href = cat === 'all' ? '/blog/' : `/blog/category/${encodeURIComponent(cat)}/`;
      return `<a class="mobile-cat-tab w-full text-left px-4 py-2 text-sm hover:bg-gray-50 block" href="${href}">${escapeHtml(label)}</a>`;
    }
    return `<button class="mobile-cat-tab w-full text-left px-4 py-2 text-sm hover:bg-gray-50" data-cat="${escapeHtml(cat)}">${escapeHtml(label)}</button>`;
  };
  const mobileLabel = activeCategory || 'すべて';
  const mobile =
    '<div class="lg:hidden relative">' +
    '<button id="mobile-cat-btn" class="w-full flex items-center justify-between px-4 py-3 bg-white text-[#041840] rounded-full text-sm font-semibold border border-gray-300">' +
    `<span id="mobile-cat-label">${escapeHtml(mobileLabel)}</span>` +
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 transition-transform"><path d="m6 9 6 6 6-6"></path></svg>' +
    '</button>' +
    '<div id="mobile-cat-dropdown" class="hidden absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1">' +
    mItem('すべて', 'all') +
    categories.map(c => mItem(c, c)).join('') +
    '</div></div>';

  return { desktop, mobile };
}

// 検索/カテゴリーの結果見出し
export function resultsHeading(opts: { q?: string; category?: string; count: number }): string {
  let label = '';
  if (opts.q && opts.category) label = `カテゴリー「${escapeHtml(opts.category)}」内で「${escapeHtml(opts.q)}」`;
  else if (opts.q) label = `「${escapeHtml(opts.q)}」の検索結果`;
  else if (opts.category) label = `カテゴリー：${escapeHtml(opts.category)}`;
  return (
    `<div style="margin:24px 0 8px;">` +
    `<p style="font-size:20px;font-weight:800;color:#11243a;">${label}</p>` +
    `<p style="font-size:13px;color:#6a7a8a;margin-top:4px;">${opts.count}件の記事</p>` +
    `</div>`
  );
}

// 0件時の回遊用ブロック（人気タグ＋診断CTA）
const POPULAR_TAGS = ['凍結', 'リール', 'ハッシュタグ', 'DM', 'コラボ', '集客', 'インサイト'];
const DIAGNOSIS = 'https://www.cocomake-guide.com/analysis?utm_source=cocomarke&utm_medium=blog_search_empty&utm_campaign=blog&utm_content=no_result';

export function searchEmptyState(q: string): string {
  const tags = POPULAR_TAGS.map(t => `<a href="/blog?q=${encodeURIComponent(t)}" class="cm-tag">#${escapeHtml(t)}</a>`).join('');
  return (
    '<div class="cm-empty">' +
      `<p class="cm-empty__title">「${escapeHtml(q)}」に一致する記事は見つかりませんでした。</p>` +
      '<p class="cm-empty__sub">キーワードを変えるか、人気のテーマから探してみてください。</p>' +
      `<div class="cm-empty__tags">${tags}</div>` +
      '<div class="cm-empty__cta">' +
        '<p class="cm-empty__ctatitle">お探しの内容が見つからない方へ</p>' +
        '<p class="cm-empty__ctasub">アカウントの伸びない原因を、1分の無料診断でチェックできます。</p>' +
        `<a class="cm-empty__btn" href="${DIAGNOSIS}" target="_blank" rel="noopener noreferrer">1分で無料診断</a>` +
      '</div>' +
    '</div>'
  );
}

export const EMPTY_STATE_CSS = `<style>
.cm-empty{max-width:560px;margin:32px auto 8px;text-align:center;}
.cm-empty__title{font-size:17px;font-weight:800;color:#11243a;margin:0 0 6px;}
.cm-empty__sub{font-size:14px;color:#6a7a8a;margin:0 0 18px;}
.cm-empty__tags{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:28px;}
.cm-empty .cm-tag{font-size:13px;color:#1877f2;background:#eaf3ff;padding:5px 12px;border-radius:99px;text-decoration:none;}
.cm-empty .cm-tag:hover{background:#d6e8ff;}
.cm-empty__cta{background:#E1F5EE;border:1px solid #9FE1CB;border-radius:14px;padding:24px;}
.cm-empty__ctatitle{font-size:15px;font-weight:800;color:#04342C;margin:0 0 6px;}
.cm-empty__ctasub{font-size:13px;color:#0F6E56;margin:0 0 16px;line-height:1.7;}
.cm-empty__btn{display:inline-block;background:#0F6E56;color:#fff !important;padding:12px 28px;border-radius:8px;font-weight:800;font-size:14px;text-decoration:none;}
.cm-empty__btn:hover{background:#085041;}
</style>`;
