const GTM_ID = 'GTM-TRWPWMJ4';
const META_PIXEL_ID = '1232285451938211';

const GTM_HEAD = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');</script>
<!-- End Google Tag Manager -->`;

const GTM_BODY = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

// モバイルメニュー: オーバーレイ内リンク（サービス等の同一ページ内アンカー）をタップしても
// オーバーレイが閉じず、全画面のまま被さって「無反応」に見える → 連打(イライラクリック)の原因。
// リンクタップ時に即クローズして、スクロール先がすぐ見えるようにする。全ページ共通で注入。
const MENU_LINK_CLOSE = `<script>(function(){
var o=document.querySelector('header div.fixed');
if(!o)return;
o.addEventListener('click',function(e){
  var t=e.target,a=(t&&t.closest)?t.closest('a'):null;
  if(a&&o.contains(a)){o.style.opacity='0';o.style.pointerEvents='none';}
},true);
})();</script>`;

const META_PIXEL_HEAD = `<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

// PCヘッダーの<nav>を「正規版」で丸ごと置き換える（全ページ共通・全テンプレート個別編集不要）。
// テンプレートファイルごとに旧ヘッダーの断片が微妙に異なる/古いままになる問題を避けるため、
// 個々のクラス文字列に依存した部分置換ではなく<nav class="hidden lg:flex...">〜</nav>全体を
// 正規表現で丸ごと差し替える方式にしている。ここを直せば全ページに反映される。
const CANONICAL_HEADER_NAV = '<nav class="hidden lg:flex items-center gap-6"><ul class="flex items-center gap-6 text-sm font-medium whitespace-nowrap"><li><a class="hover:text-primary transition-colors duration-200" href="/#service">サービス</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/#plan">料金</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/#case">導入事例</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/blog/">お役立ち情報</a></li><li><a class="hover:text-primary transition-colors duration-200" href="https://www.cocomake-guide.com/" target="_blank" rel="noopener noreferrer">お役立ち資料</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/about/">会社情報</a></li></ul><div class="flex items-center gap-3"><a class="flex items-center gap-2 bg-white border-2 border-[#005BEA] text-[#005BEA] text-sm font-bold px-6 py-3 rounded-full hover:opacity-80 transition-opacity whitespace-nowrap shrink-0" href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-download w-4 h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line></svg>資料ダウンロード</a><a class="flex items-center justify-center gap-2 bg-gradient-to-r from-[#00c6fb] to-[#0965f6] text-white text-sm font-bold px-5 py-3 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap shrink-0" href="/contact/"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mail w-4 h-4"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>お問い合わせ</a></div></nav>';

const DESKTOP_NAV_RE = /<nav class="hidden lg:flex[\s\S]*?<\/nav>/;

function injectNewsNav(html: string) {
  let r = html
    .replace(
      '<li><a href="/#faq"><div class="text-base font-medium">よくある質問</div></a></li><li><a href="/blog/">',
      '<li><a href="/#faq"><div class="text-base font-medium">よくある質問</div></a></li><li><a href="/news/"><div class="text-base font-medium">お知らせ</div></a></li><li><a href="/blog/">'
    );
  // PCヘッダーのnavを正規版に丸ごと差し替え（全ページ共通化）
  if (DESKTOP_NAV_RE.test(r)) {
    r = r.replace(DESKTOP_NAV_RE, CANONICAL_HEADER_NAV);
  }
  // 右下フローティングCTA：資料ダウンロードのみに統一（LINE相談は廃止）
  if (!r.includes('cm-float')) {
    r = r.replace(FLOATING_LINE_RE, FLOATING_CTA);
  }
  return r;
}

const FLOATING_LINE_RE = /<a target="_blank" rel="noopener noreferrer" aria-label="LINEで相談" class="fixed bottom-6 right-6 z-50[\s\S]*?<\/a>/;

const FLOATING_CTA = `<a href="https://www.cocomake-guide.com/" target="_blank" rel="noopener noreferrer" aria-label="資料ダウンロード" class="fixed bottom-6 right-6 z-50 flex flex-col items-center cm-float">
<span class="cm-float__circle" style="background-color:#FFEA00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9a7e00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg></span>
<span class="cm-float__label" style="background:#FFF7C2;color:#7a6400">資料ダウンロード</span>
<style>
.cm-float{transition:transform .2s;text-decoration:none}
.cm-float:hover{transform:scale(1.05)}
.cm-float__circle{width:64px;height:64px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.18);border:10px solid transparent;background-clip:padding-box}
.cm-float__circle svg{width:32px;height:32px}
.cm-float__label{margin-top:-6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15)}
@media(min-width:1024px){
.cm-float__circle{width:90px;height:90px;border-width:15px}
.cm-float__circle svg{width:44px;height:44px}
.cm-float__label{font-size:12px;padding:3px 10px;margin-top:-8px}
}
</style>
</a>`;

export function injectGtm(html: string) {
  let result = injectNewsNav(html);

  if (!result.includes(GTM_ID)) {
    result = result.includes('</head>')
      ? result.replace('</head>', `${GTM_HEAD}</head>`)
      : result;
    result = result.replace(/<body([^>]*)>/i, `<body$1>${GTM_BODY}`);
  }

  if (!result.includes(META_PIXEL_ID)) {
    result = result.includes('</head>')
      ? result.replace('</head>', `${META_PIXEL_HEAD}</head>`)
      : result;
  }

  // モバイルメニューのリンクタップで即クローズ（ヘッダーの開閉オーバーレイがある場合のみ）
  if (result.includes('aria-label="Toggle menu"') && result.includes('</body>')) {
    result = result.replace('</body>', `${MENU_LINK_CLOSE}</body>`);
  }

  return result;
}
