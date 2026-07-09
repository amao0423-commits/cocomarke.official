/**
 * blogSidebar.ts — ブログ一覧/記事ページ共通の右サイドバー部品
 * 参考: cocomarke-sidebar-trust.html の .cm-sidebar
 * - 検索（/blog?q=）/ カテゴリー（/blog?category=）/ 診断CTA / 資料CTA
 * - Tailwind非依存（cm-* 独自CSS）。PCはsticky、≤900pxは縦積み。
 */

// 記事ページの右バナー（画像＋流入分析用UTM）
const DIAGNOSIS_URL = 'https://www.cocomake-guide.com/analysis?utm_source=cocomarke&utm_medium=blog_sidebar&utm_campaign=blog&utm_content=banner_diagnosis';
// サブスク訴求バナー（記事ページに追加）
const SUBSCRIPTION_URL = 'https://www.cocomake-guide.com/subscription?utm_source=blog&utm_medium=sidebar&utm_campaign=instagram_engagement_article';
// サービス概要（資料）バナー：リンクを document_banner に変更
const DOC_URL = 'https://www.cocomake-guide.com/servicedocument?utm_source=blog&utm_medium=sidebar&utm_campaign=document_banner';
const BANNER_DIAGNOSIS = '/images/blog_detail-banner-01.png';
const BANNER_SUBSCRIPTION = '/images/blog_detail-banner-subscription.png';
const BANNER_DOC = '/images/blog_detail-banner-02.png'; // ※サービス概要は3枚目に差し替え（同ファイルを上書き）

const POPULAR_TAGS = ['凍結', 'リール', 'ハッシュタグ', 'DM', 'コラボ'];

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface CategoryCount { name: string; count: number; }

// ── 検索ボックス（タイトル「キーワードから探す」） ──────────────────────────
export function searchBox(): string {
  const tags = POPULAR_TAGS
    .map(t => `<a href="/blog?q=${encodeURIComponent(t)}" class="cm-tag">#${esc(t)}</a>`)
    .join('');
  return (
    '<div class="cm-side-box">' +
      '<p class="cm-side-title">キーワードから探す</p>' +
      '<form class="cm-search" action="/blog" method="get" role="search">' +
        '<input type="text" name="q" class="cm-search__input" placeholder="例：トラブル 解決／リール 伸ばす" aria-label="記事を検索">' +
        '<button type="submit" class="cm-search__btn" aria-label="検索する">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.5-4.5"></path></svg>' +
        '</button>' +
      '</form>' +
      `<div class="cm-tags">${tags}</div>` +
    '</div>'
  );
}

// ── カテゴリーボックス（記事数つき・件数降順） ──────────────────────────────
export function categoryBox(categories: CategoryCount[]): string {
  const items = [...categories]
    .sort((a, b) => b.count - a.count)
    .map(c =>
      `<li><a href="/blog/category/${encodeURIComponent(c.name)}/">${esc(c.name)} <span>${c.count}</span></a></li>`
    )
    .join('');
  return (
    '<div class="cm-side-box">' +
      '<p class="cm-side-title">カテゴリーから探す</p>' +
      `<ul class="cm-cats">${items}</ul>` +
    '</div>'
  );
}

// ── CTAバナー（記事ページの右バーと同じ画像で統一） ────────────────────────
export function ctaBanners(): string {
  return (
    `<a href="${DIAGNOSIS_URL}" target="_blank" rel="noopener noreferrer" class="cm-side-banner" aria-label="アカウント無料診断">` +
      `<img src="${BANNER_DIAGNOSIS}" alt="1分で無料診断｜アカウント分析" loading="lazy">` +
    '</a>' +
    `<a href="${DOC_URL}" target="_blank" rel="noopener noreferrer" class="cm-side-banner" aria-label="サービス資料ダウンロード">` +
      `<img src="${BANNER_DOC}" alt="COCOマーケ サービス概要 資料ダウンロード" loading="lazy">` +
    '</a>'
  );
}

// ── 一覧ページ用：完全な aside（検索＋カテゴリー＋バナーCTA） ────────────────
export function fullSidebar(categories: CategoryCount[]): string {
  return `<aside class="cm-sidebar">${searchBox()}${categoryBox(categories)}${ctaBanners()}</aside>`;
}

// ── 記事ページ用：既存asideに足す検索＋カテゴリーのみ ──────────────────────
export function searchAndCategoryBoxes(categories: CategoryCount[]): string {
  return searchBox() + categoryBox(categories);
}

// ── 記事ページの右サイドバー（診断バナー → 最新記事 → 検索 → 資料バナー） ─────
export interface LatestItem { id: string; title: string; category: string; img: string; }

function latestArticlesBox(items: LatestItem[]): string {
  if (!items.length) return '';
  const rows = items.map(it =>
    `<a href="/blog/${it.id}/">` +
      `<img class="cm-latest__thumb" src="${it.img}" alt="${esc(it.title)}" loading="lazy">` +
      '<span class="cm-latest__body">' +
        `<span class="cm-latest__t">${esc(it.title)}</span>` +
        (it.category ? `<span class="cm-latest__cat">${esc(it.category)}</span>` : '') +
      '</span>' +
    '</a>'
  ).join('');
  return (
    '<div class="cm-side-box">' +
      '<p class="cm-latest__title">最新記事</p>' +
      `<div class="cm-latest">${rows}</div>` +
    '</div>'
  );
}

function bannerLink(href: string, img: string, alt: string): string {
  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="cm-side-banner" aria-label="${esc(alt)}"><img src="${img}" alt="${esc(alt)}" loading="lazy"></a>`;
}

export function articleSidebar(latest: LatestItem[]): string {
  return '<aside class="cm-article-aside hidden lg:flex">' +
    bannerLink(DIAGNOSIS_URL, BANNER_DIAGNOSIS, '1分で無料診断｜アカウント分析') +
    bannerLink(DOC_URL, BANNER_DOC, 'COCOマーケ サービス概要 資料ダウンロード') +  // サービス概要は最新記事の上
    latestArticlesBox(latest) +
    searchBox() +
    bannerLink(SUBSCRIPTION_URL, BANNER_SUBSCRIPTION, 'インスタ運用をサブスクで｜COCOマーケ') +  // サブスクは検索の下
  '</aside>';
}

// モバイル専用：記事末（著者ボックスの下）にサブスク＋サービス概要バナーを並べる
// （右サイドバーはモバイル非表示のため、モバイルではここで表示）
export function mobileArticleBanners(): string {
  return '<div class="cm-mobile-banners">' +
    bannerLink(SUBSCRIPTION_URL, BANNER_SUBSCRIPTION, 'インスタ運用をサブスクで｜COCOマーケ') +
    bannerLink(DOC_URL, BANNER_DOC, 'COCOマーケ サービス概要 資料ダウンロード') +
  '</div>';
}

// ── スタイル（<style> 込み） ───────────────────────────────────────────────
export const SIDEBAR_STYLE = `<style>
.cm-sidebar{width:280px;display:flex;flex-direction:column;gap:16px;font-family:"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;}
.cm-side-box{background:#fff;border:1px solid #e3ecf7;border-radius:14px;padding:18px;}
.cm-side-title{font-size:14px;font-weight:800;color:#11243a;margin:0 0 12px;}
.cm-search{display:flex;gap:6px;}
.cm-search__input{flex:1;min-width:0;border:1px solid #e3ecf7;border-radius:8px;padding:10px 12px;font-size:13px;background:#f7faff;color:#11243a;}
.cm-search__input:focus{outline:none;border-color:#1877f2;background:#fff;}
.cm-search__btn{background:#1877f2;border:none;border-radius:8px;color:#fff;width:42px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.cm-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;}
.cm-tag{font-size:12px;color:#1877f2;background:#eaf3ff;padding:4px 10px;border-radius:99px;text-decoration:none;}
.cm-tag:hover{background:#d6e8ff;}
.cm-cats{list-style:none;margin:0;padding:0;}
.cm-cats li{border-bottom:1px solid #eef3f9;}
.cm-cats li:last-child{border-bottom:none;}
.cm-cats a{display:flex;justify-content:space-between;align-items:center;padding:11px 0;font-size:14px;color:#3a4a5a;text-decoration:none;}
.cm-cats a:hover{color:#1877f2;}
.cm-cats span{font-size:12px;color:#9aa7b4;}
/* CTAバナー（記事ページと統一） */
.cm-side-banner{display:block;width:100%;aspect-ratio:280/215;position:relative;border:1px solid #e2eeff;border-radius:12px;overflow:hidden;transition:opacity .2s;}
.cm-side-banner:hover{opacity:.85;}
.cm-side-banner img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
/* 記事ページ：右サイドバーを追従(sticky)させる（固定ヘッダー80px分のオフセット） */
.cm-article-aside{position:sticky;top:100px;align-self:flex-start;width:280px;flex-shrink:0;flex-direction:column;gap:14px;padding-top:8px;}
/* モバイル専用：著者ボックス下のバナー（PCは非表示＝サイドバーで表示） */
.cm-mobile-banners{display:none;}
@media(max-width:1023px){.cm-mobile-banners{display:flex;flex-direction:column;gap:16px;width:100%;max-width:400px;margin:0 auto;}.cm-mobile-banners .cm-side-banner{width:100%;}}
/* 最新記事リスト */
.cm-latest__title{font-size:14px;font-weight:800;color:#11243a;margin:0 0 12px;}
.cm-latest a{display:flex;gap:10px;text-decoration:none;margin-bottom:12px;align-items:flex-start;}
.cm-latest a:last-child{margin-bottom:0;}
.cm-latest__thumb{width:56px;height:42px;border-radius:5px;object-fit:cover;flex-shrink:0;}
.cm-latest__body{min-width:0;}
.cm-latest__t{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-size:12px;color:#11243a;line-height:1.45;margin:0 0 4px;}
.cm-latest__cat{display:inline-block;font-size:9px;color:#185FA5;border:1px solid #B5D4F4;padding:1px 7px;border-radius:99px;}
/* 一覧ページ 2カラムレイアウト */
.cm-blog-layout{display:flex;gap:32px;align-items:flex-start;margin-top:40px;}
.cm-blog-main{flex:1;min-width:0;}
.cm-blog-layout .cm-sidebar{position:sticky;top:24px;flex-shrink:0;}
.cm-blog-empty{padding:40px 0;text-align:center;color:#6a7a8a;font-size:14px;}
@media(max-width:900px){
  .cm-blog-layout{flex-direction:column;}
  .cm-sidebar{width:100%;position:static;}
  /* 記事一覧下のバナーは少しだけ小さく＋左右余白 */
  .cm-sidebar .cm-side-banner{max-width:86%;margin-left:auto;margin-right:auto;}
}
</style>`;

// ── 一覧ページ用：検索ボックスに現在の検索語を反映（絞り込みはサーバー側） ──
export const LIST_FILTER_JS = `(function(){
  var params=new URLSearchParams(location.search);
  var q=params.get('q');
  if(q){var input=document.querySelector('.cm-search__input');if(input)input.value=q;}
})();`;
