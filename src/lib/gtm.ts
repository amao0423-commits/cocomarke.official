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

// ヘッダーのお問い合わせボタンの左に LINE相談ボタンを設置（PCナビ・全ページ共通）
// LINEの緑(#06C755)はプレビルドCSSに無いためインラインstyleで指定
const HEADER_CONTACT_BTN = '<a class="flex items-center gap-2 bg-gradient-to-r from-[#00c6fb] to-[#0965f6] text-white text-sm font-bold px-6 py-3 rounded-full hover:opacity-90 transition-opacity" href="/contact/">';
// お問い合わせボタン（折返し防止・サイズ統一版）
const HEADER_CONTACT_BTN_FIXED = '<a class="flex items-center justify-center gap-2 bg-gradient-to-r from-[#00c6fb] to-[#0965f6] text-white text-sm font-bold px-5 py-3 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap shrink-0" href="/contact/">';
const HEADER_LINE_BTN = '<a href="https://page.line.me/386gtsnr?oat_content=url&openQrModal=true" target="_blank" rel="noopener noreferrer" class="flex items-center justify-center gap-2 text-white text-sm font-bold px-5 py-3 rounded-full hover:opacity-90 transition-opacity whitespace-nowrap shrink-0" style="background:#06C755"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 shrink-0"><path d="M12 2C6.48 2 2 5.69 2 10.23c0 4.07 3.55 7.48 8.35 8.13.32.07.77.21.88.49.1.25.07.64.03.9l-.14.85c-.04.25-.2.99.86.54s5.72-3.37 7.8-5.77C21.39 14.13 22 12.27 22 10.23 22 5.69 17.52 2 12 2z"/></svg>LINE相談</a>';

function injectNewsNav(html: string) {
  let r = html
    .replace(
      '<li><a class="hover:text-primary transition-colors duration-200" href="/#faq">よくある質問</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/blog/">',
      '<li><a class="hover:text-primary transition-colors duration-200" href="/#faq">よくある質問</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/news/">お知らせ</a></li><li><a class="hover:text-primary transition-colors duration-200" href="/blog/">'
    )
    .replace(
      '<li><a href="/#faq"><div class="text-base font-medium">よくある質問</div></a></li><li><a href="/blog/">',
      '<li><a href="/#faq"><div class="text-base font-medium">よくある質問</div></a></li><li><a href="/news/"><div class="text-base font-medium">お知らせ</div></a></li><li><a href="/blog/">'
    );
  // ヘッダーお問い合わせの横にLINE相談ボタン（未挿入のときのみ）。両ボタンを同サイズ・折返し防止に。
  if (!r.includes('>LINE相談</a>')) {
    r = r.replace(HEADER_CONTACT_BTN, HEADER_LINE_BTN + HEADER_CONTACT_BTN_FIXED);
    // ナビ間隔を詰めてボタン2つ分のスペースを確保＋リンク折返し防止
    r = r.replace('<nav class="hidden lg:flex items-center gap-8">', '<nav class="hidden lg:flex items-center gap-5">');
    r = r.replace('<ul class="flex items-center gap-8 text-sm font-medium">', '<ul class="flex items-center gap-5 text-sm font-medium whitespace-nowrap">');
  }
  // 既存のフローティングLINEを「無料診断＋LINE」2ボタンに差し替え（LINEは既存line-logo.png画像を流用・PCで大きく）
  if (!r.includes('cm-float')) {
    r = r.replace(FLOATING_LINE_RE, FLOATING_CTA);
  }
  return r;
}

const FLOATING_LINE_RE = /<a target="_blank" rel="noopener noreferrer" aria-label="LINEで相談" class="fixed bottom-6 right-6 z-50[\s\S]*?<\/a>/;

const FLOATING_CTA = `<div class="fixed bottom-6 right-6 z-50 flex flex-col items-center cm-float">
<a href="https://www.cocomake-guide.com/" target="_blank" rel="noopener noreferrer" aria-label="資料ダウンロード" class="cm-float__a">
<span class="cm-float__circle" style="background-color:#FFEA00"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9a7e00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="M7 10l5 5 5-5"></path><path d="M12 15V3"></path></svg></span>
<span class="cm-float__label" style="background:#FFF7C2;color:#7a6400">資料ダウンロード</span>
</a>
<a href="https://page.line.me/386gtsnr?oat_content=url&openQrModal=true" target="_blank" rel="noopener noreferrer" aria-label="LINEで相談" class="cm-float__a">
<span class="cm-float__circle cm-float__line"><img src="/images/line-logo.png" alt="LINE" class="cm-float__lineimg" loading="lazy"></span>
<span class="cm-float__label" style="background:#D6F5E0;color:#055f2e">LINE相談</span>
</a>
</div>
<style>
.cm-float{gap:14px}
.cm-float__a{display:flex;flex-direction:column;align-items:center;transition:transform .2s;text-decoration:none}
.cm-float__a:hover{transform:scale(1.05)}
.cm-float__circle{width:64px;height:64px;border-radius:9999px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,.18)}
.cm-float__circle svg{width:32px;height:32px}
/* 無料診断もLINEと同様に「透明な縁」を付ける（line-logo.pngの緑が枠の約67%＝外周に透明エッジができるのに合わせ、黄円を内側に縮めて透明ボーダーで背景を透かす） */
.cm-float__circle:not(.cm-float__line){border:10px solid transparent;background-clip:padding-box}
/* LINE: ラッパーの縁を透明にし、line-logo.png(緑が枠の約76%)を132%に拡大して余白をクロップ→黄円と同サイズの緑円に */
.cm-float__line{background:transparent;overflow:hidden}
.cm-float__lineimg{width:132%;height:132%;object-fit:contain}
.cm-float__label{margin-top:-6px;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.15)}
@media(min-width:1024px){
.cm-float{gap:18px}
.cm-float__circle{width:90px;height:90px}
.cm-float__circle svg{width:44px;height:44px}
.cm-float__circle:not(.cm-float__line){border-width:15px}
.cm-float__label{font-size:12px;padding:3px 10px;margin-top:-8px}
}
</style>`;

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
