/**
 * rewrite-sns-image-size.mjs
 * sns-image-size-guide-2026 を改善計画に従いリライト
 */

const MICROCMS_KEY    = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN = 'cocomarke';
const PEXELS_KEY      = process.env.PEXELS_API_KEY;
const ARTICLE_ID      = 'sns-image-size-guide-2026';
const NEW_TITLE       = '2026年最新版｜SNS画像サイズ完全ガイド【Instagram・X・TikTok・YouTube対応早見表付き】';

const CTA_TOP  = `<blockquote><p><strong>SNS運用で成果を出したい方へ</strong></p><p>COCOマーケでは、Instagramアカウントの設計から運用代行まで無料でご相談いただけます。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_MID  = `<blockquote><p><strong>リール制作・投稿設計をプロに相談したい方へ</strong></p><p>COCOマーケでは、Instagramの投稿企画・リール制作支援・アカウント運用改善を一貫してサポートしています。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_END  = `<blockquote><p><strong>SNS運用・クリエイティブ制作をまとめて相談しませんか？</strong></p><p>アカウント設計・投稿企画・リール制作・デザイン改善・運用代行まで、COCOマーケが一括でサポートします。まずは無料相談でご状況をお聞かせください。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;

async function fetchPexels(query, page = 1) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}&orientation=landscape`,
    { headers: { Authorization: PEXELS_KEY } }
  );
  const d = await r.json();
  if (!d.photos?.length) throw new Error(`No results: ${query}`);
  return d.photos[0];
}
async function uploadPhoto(photo, filename) {
  const url = photo.src.large2x ?? photo.src.large;
  const buf = await (await fetch(url)).arrayBuffer();
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/jpeg' }), filename);
  const r = await fetch(`https://${MICROCMS_DOMAIN}.microcms-management.io/api/v1/media`, {
    method: 'POST', headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY }, body: fd,
  });
  if (!r.ok) throw new Error(`Upload ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return { url: data.url, alt: photo.alt || photo.photographer, credit: photo.photographer };
}

function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0 && !/この記事でわかること|目次/.test(h));
}
function makeWakaruBox(h2s) {
  return `<h2 id="h-wakaru">この記事でわかること</h2>\n<ul>\n${h2s.slice(0,7).map(h=>`<li>${h}</li>`).join('\n')}\n</ul>`;
}
function makeToc(h2s) {
  return `<h2 id="h-toc">目次</h2>\n<ol>\n${h2s.map((h,i)=>`<li><a href="#h-s${i+1}" target="_self">${h}</a></li>`).join('\n')}\n</ol>`;
}
function makeH2Ids(html, h2s) {
  let r = html;
  h2s.forEach((h, i) => {
    const esc = h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    r = r.replace(new RegExp(`(<h2[^>]*>)\\s*(?:<a[^>]*>)?${esc}(?:</a>)?\\s*</h2>`),
      `$1<a id="h-s${i+1}"></a>${h}</h2>`);
  });
  return r;
}

const BODY = `<p>SNSに画像や動画を投稿するとき、サイズを間違えると自動トリミングで肝心な情報が切れたり、画質が劣化して見栄えが悪くなります。プラットフォームごとに推奨サイズが異なるうえ、2026年に入ってからも仕様変更が続いており、古い情報のままで運用しているケースが少なくありません。</p>
<p>この記事では、Instagram・X（旧Twitter）・TikTok・YouTube・LINE・Threadsの推奨画像・動画サイズを2026年最新版でまとめています。冒頭の早見表で目的のサイズに最短到達でき、安全エリア・画質劣化対策・テンプレート設計まで実務で使える情報を一冊にまとめました。</p>

${CTA_TOP}

<h2>SNS画像サイズ早見表【2026年最新】</h2>
<p>急いで確認したい方はまずこの表を参照してください。各SNSの主要用途における推奨サイズと比率をまとめています。</p>
<table>
<tr><th>SNS</th><th>用途</th><th>推奨サイズ（px）</th><th>比率</th><th>最大容量</th></tr>
<tr><td>Instagram</td><td>フィード（縦型推奨）</td><td>1080×1350</td><td>4:5</td><td>30MB</td></tr>
<tr><td>Instagram</td><td>フィード（正方形）</td><td>1080×1080</td><td>1:1</td><td>30MB</td></tr>
<tr><td>Instagram</td><td>リール・ストーリーズ</td><td>1080×1920</td><td>9:16</td><td>動画4GB</td></tr>
<tr><td>Instagram</td><td>プロフィール画像</td><td>320×320</td><td>1:1</td><td>—</td></tr>
<tr><td>X（旧Twitter）</td><td>投稿画像（1枚）</td><td>1200×675</td><td>16:9</td><td>5MB（JPG/PNG）</td></tr>
<tr><td>X（旧Twitter）</td><td>ヘッダー画像</td><td>1500×500</td><td>3:1</td><td>5MB</td></tr>
<tr><td>X（旧Twitter）</td><td>OGP画像</td><td>1200×628</td><td>約1.91:1</td><td>5MB</td></tr>
<tr><td>TikTok</td><td>動画</td><td>1080×1920</td><td>9:16</td><td>287.6MB</td></tr>
<tr><td>TikTok</td><td>プロフィール画像</td><td>200×200以上</td><td>1:1</td><td>—</td></tr>
<tr><td>YouTube</td><td>サムネイル</td><td>1280×720</td><td>16:9</td><td>2MB</td></tr>
<tr><td>YouTube</td><td>チャンネルアート</td><td>2560×1440</td><td>16:9</td><td>6MB</td></tr>
<tr><td>YouTube Shorts</td><td>動画</td><td>1080×1920</td><td>9:16</td><td>256GB</td></tr>
<tr><td>LINE</td><td>タイムライン投稿</td><td>1040×1040</td><td>1:1</td><td>10MB</td></tr>
<tr><td>Threads</td><td>投稿画像</td><td>1080×1350</td><td>4:5</td><td>25MB</td></tr>
<tr><td>note</td><td>アイキャッチ</td><td>1280×670</td><td>約1.91:1</td><td>—</td></tr>
</table>

<blockquote><p><strong>💡 ポイント</strong></p><p>迷ったら「1080×1350（4:5）」と「1080×1920（9:16）」の2種類のテンプレートを用意しておけば、主要SNSの大半をカバーできます。縦型が基本、横型はYouTubeサムネイルとX投稿のみ別途用意するのが実務上の最短ルートです。</p></blockquote>

<h2>SNS画像サイズの基本知識</h2>
<p>サイズ表を正しく読むために、最低限知っておくべき基礎知識を整理します。専門用語に慣れていない方はここから確認してください。</p>

<h3>px（ピクセル）とアスペクト比の違い</h3>
<p>「1080×1920」のような数字はピクセル数（画像の解像度）を表します。横1080ピクセル、縦1920ピクセルという意味です。一方、「9:16」はアスペクト比（縦横の比率）で、「縦が横の1.78倍の長さ」を意味します。SNSの仕様はアスペクト比で管理されており、1080×1920でも2160×3840でも9:16であれば同じ比率として扱われます。</p>
<p>Webの画像においてDPI（印刷解像度）は関係ありません。ピクセル数だけを確認してください。</p>

<h3>ファイル形式の選び方</h3>
<table>
<tr><th>形式</th><th>向いている用途</th><th>特徴</th></tr>
<tr><td>JPEG（JPG）</td><td>写真・グラデーション画像</td><td>圧縮率が高く軽量。透過不可</td></tr>
<tr><td>PNG</td><td>ロゴ・テキスト入り画像・透過が必要な場合</td><td>劣化なし。ファイルサイズが大きい</td></tr>
<tr><td>WebP</td><td>Web表示全般</td><td>JPEGより高圧縮・高画質。一部ツールで非対応</td></tr>
<tr><td>MP4（H.264）</td><td>Instagram・TikTok・YouTube動画</td><td>最も互換性が高い動画形式</td></tr>
</table>
<p>カラーモードはRGBを使用してください。CMYKは印刷向けの設定で、SNSにアップすると色味がずれます。</p>

<h2>Instagramの画像・動画サイズ</h2>
<p>Instagramはフォーマットが多岐にわたるため、用途ごとに設定が変わります。間違えやすいポイントを中心に解説します。</p>

<h3>フィード投稿は4:5（1080×1350px）が最も有利な理由</h3>
<p>Instagramのフィードで表示される画像は、4:5（縦長）が画面占有率の観点で最も有利です。正方形（1:1）と比べて約25%多くスクリーンを使えるため、スクロール中に視線を止める可能性が高まります。横長（16:9）はフィードでは左右に黒帯が入り、視覚的に縮小して見えるため通常は避けるべきです。</p>

<h3>リールと ストーリーズの安全エリア</h3>
<p>リール・ストーリーズは1080×1920pxの9:16ですが、全面を使えるわけではありません。UI（インターフェース）が画面上下を覆うため、以下の安全エリアを守る必要があります。</p>
<table>
<tr><th>エリア</th><th>避けるべき範囲</th><th>理由</th></tr>
<tr><td>上部</td><td>上から約250px</td><td>プロフィール名・音源情報が重なる</td></tr>
<tr><td>下部</td><td>下から約400px</td><td>いいね・コメント・シェアボタン、キャプションが重なる</td></tr>
<tr><td>右端</td><td>右から約100px</td><td>リアクションボタンが重なる</td></tr>
</table>
<p>重要なテキストや商品情報は、縦1920pxのうち中央の約1270px（上250〜下400を除いた範囲）に収めてください。</p>

<h3>カルーセル（複数枚投稿）の注意点</h3>
<p>カルーセルは全スライドを同一アスペクト比で揃えることが必須です。1枚目が4:5で2枚目が1:1だとInstagramが自動で正方形にトリミングされる場合があります。特にブランド資料やノウハウ系の複数枚投稿では、全スライドを1080×1350pxで統一してください。</p>

${CTA_MID}

<h2>X（旧Twitter）の画像サイズ</h2>
<p>Xは2023〜2024年にかけて表示仕様を複数回変更しており、古い情報（16:9推奨など）が一部のサイトに残っています。2026年現在の正確な仕様を確認してください。</p>

<h3>投稿枚数によって変わる表示比率</h3>
<table>
<tr><th>投稿枚数</th><th>表示形式</th><th>推奨対応</th></tr>
<tr><td>1枚</td><td>2:1〜1:2の範囲で表示。上下自動トリミングあり</td><td>1200×675（16:9）または1080×1350（4:5）</td></tr>
<tr><td>2枚</td><td>左右並列で正方形寄りにトリミング</td><td>1080×1080で統一</td></tr>
<tr><td>3枚</td><td>左1枚・右2枚の分割表示</td><td>1枚目を縦型、2・3枚目を正方形で用意</td></tr>
<tr><td>4枚</td><td>2×2のグリッド表示</td><td>全て正方形（1080×1080）推奨</td></tr>
</table>

<h3>Xで画像が切れる原因と対処法</h3>
<p>タイムライン表示ではXが画像を自動トリミングして一定の比率に収めます。重要なテキストや顔を端に寄せると切れる原因になります。重要情報は画像の中央75%以内に収め、投稿前に「プレビュー」でどう表示されるか確認することを習慣にしてください。</p>

<h3>OGP画像（リンクカード）を最適化する方法</h3>
<p>記事やウェブページをXでシェアした際に表示されるカード画像がOGPです。推奨サイズは1200×628px（約1.91:1）で、Webサイトのheadタグに<code>og:image</code>メタタグで設定します。Xのカード表示に対応するには<code>twitter:card</code>メタタグも必要です。</p>

<h2>TikTokの動画サイズと設計のコツ</h2>
<p>TikTokは縦型動画（9:16）が基本です。横型動画も投稿できますが、フィードでの表示が小さくなり視認性が下がるため、TikTokに注力するなら縦型で統一することを推奨します。</p>

<h3>TikTokの安全エリアと字幕配置</h3>
<p>TikTokも画面上下・右端にUIが重なります。字幕や重要テキストは画面下部30%と右端20%を避けて配置してください。特にTikTok Shopを活用している場合、商品タグが画面右側に表示されるため、テキストと重ならない設計が必要です。</p>

<h3>伸びやすいTikTok動画の構成</h3>
<p>最初の1〜2秒でフック（続きを見たくなる仕掛け）を入れることがTikTokでのリーチ拡大の基本です。画面比率よりもコンテンツの質と出だしの設計が成果を左右します。テキストオーバーレイは大きめのフォント・高コントラストで、音声オフでも内容が伝わる設計にしましょう。リール運用との共通点は<a href="/blog/instagram-reels-growth-guide-2026/" target="_blank">インスタリール完全ガイド</a>にもまとめています。</p>

<h2>YouTubeの画像サイズ</h2>
<p>YouTubeでは動画の中身よりも「サムネイル」がCTR（クリック率）を大きく左右します。再生数を伸ばすには、動画品質と同じくらいサムネイル設計に注力する必要があります。</p>

<h3>CTRが高いサムネイルの特徴</h3>
<ul>
<li>推奨サイズ1280×720px（16:9）を厳守。720px未満はYouTubeに非推奨と判定される</li>
<li>テキストは画面の30〜40%以内に収める（文字が多すぎると小さい表示で読めない）</li>
<li>顔写真を入れると感情が伝わりCTRが上がる傾向がある</li>
<li>ファイル形式はJPGまたはPNG、2MB以内</li>
</ul>

<h3>YouTube ShortsとTV表示の注意点</h3>
<p>YouTube Shortsは9:16（1080×1920px）で投稿します。サムネイルは通常のYouTube動画と同じ16:9で設定しますが、Shorts専用の表示では中央が切り取られて表示されるため、重要情報を中央に集める設計が必要です。またテレビ（大画面）表示ではサムネイルの四隅が見にくくなるため、安全エリア（全体の90%の内側）に情報を収めてください。</p>

<h2>LINE・Threads・noteの画像サイズ</h2>
<p>主要SNS以外のプラットフォームも、正しいサイズで投稿しないと自動トリミングや画質劣化が起きます。</p>

<h3>LINE（タイムライン・VOOM）</h3>
<p>LINEタイムラインへの投稿は1040×1040px（1:1）が最も安定した表示になります。LINE VOOMは縦型動画（9:16）にも対応しており、1080×1920pxで制作すれば問題ありません。プロフィール画像は640×640px以上の正方形で設定してください。</p>

<h3>Threads</h3>
<p>Threads（Meta）はInstagramと同じインフラを使用しているため、Instagram推奨サイズがそのまま適用されます。フィード投稿は1080×1350px（4:5）または1080×1080px（1:1）、動画は1080×1920px（9:16）を使用してください。</p>

<h3>noteのアイキャッチ</h3>
<p>noteのアイキャッチ推奨サイズは1280×670px（約1.91:1）です。この比率で作成しないと上下が自動トリミングされます。note投稿はSNSでシェアされる際にOGP画像として表示されるため、タイトルと補足情報を含めたデザインが効果的です。</p>

<h2>Canva・Figmaでテンプレートを管理する方法</h2>
<p>毎回サイズを確認して作り直す手間を省くには、テンプレートを固定化することが最も効率的です。Instagram・TikTok・YouTube Shortsはすべて9:16で共通化できるため、1種類のテンプレートで3プラットフォームに対応できます。</p>

<h3>最低限用意すべき3つのテンプレートサイズ</h3>
<ol>
<li>1080×1350px（4:5）：Instagramフィード・Threads投稿</li>
<li>1080×1920px（9:16）：リール・ストーリーズ・TikTok・YouTube Shorts</li>
<li>1280×720px（16:9）：YouTubeサムネイル・X投稿・OGP画像</li>
</ol>
<p>Canvaであれば「カスタムサイズ」でこの3種類のテンプレートを作成し、「テンプレートとして保存」しておくことで毎回複製して使えます。Figmaはコンポーネント機能とFigma Tokensを使ったデザインシステム管理に向いており、デザイナーが複数名いるチームには特に有効です。</p>

<h3>SNS運用担当者向け制作フロー</h3>
<ol>
<li>投稿目的を決める（認知拡大 / エンゲージメント / CV誘導）</li>
<li>使用するSNSとフォーマットを選択（フィード・リール・ストーリーズ等）</li>
<li>対応するテンプレートを複製</li>
<li>テキスト・画像・配色を差し替える</li>
<li>書き出し（Canvaは「ダウンロード」→PNG/MP4）</li>
<li>実機で表示確認後に投稿</li>
</ol>

<h2>SNS画像・動画で画質劣化を防ぐ方法</h2>
<p>正しいサイズで作成しても、書き出し設定や投稿方法によって画質が下がることがあります。原因と対処法を押さえておきましょう。</p>

<h3>Instagramで画質が悪くなる原因</h3>
<p>Instagramはアップロードされた画像・動画を独自に圧縮します。これを最小限に抑えるには、圧縮前の元データを高品質で書き出すことが重要です。Canvaからの書き出しは「最高品質」を選択し、JPEGの場合はクオリティ80〜100%に設定してください。また、Wi-Fi環境でのアップロードが推奨されています（モバイル回線だとアプリが圧縮率を上げる場合がある）。</p>

<h3>TikTokでぼやける原因</h3>
<p>TikTokは動画をH.264コーデック・MP4形式で書き出すのが最も安定します。ビットレートは推奨値である最低2Mbps、できれば5〜10Mbpsで書き出してください。Canvaの動画書き出しは自動的にMP4になりますが、CapCutで書き出す場合は「高品質」を明示的に選択してください。</p>

<h3>iPhoneからアップロードするときの注意点</h3>
<p>iPhoneはデフォルトでHEIF（.heic）形式で写真を保存します。この形式はInstagramやTikTokが正常に処理できないことがあります。「設定」→「カメラ」→「フォーマット」→「互換性優先」に変更することで、JPEGで保存されるようになります。</p>

<blockquote><p><strong>⚠️ 注意</strong></p><p>一度圧縮・エクスポートした画像を再度編集・エクスポートすると画質が二重に劣化します。編集用の元データ（高解像度ファイル）は必ず保存しておき、SNS投稿用には毎回元データから書き出すようにしてください。</p></blockquote>

<h2>2026年のSNS画像・動画トレンド</h2>
<p>サイズ仕様だけでなく、クリエイティブのトレンドも知っておくと運用戦略の精度が上がります。</p>

<h3>縦型動画の完全定着と横断活用</h3>
<p>2026年現在、9:16の縦型動画はInstagramリール・TikTok・YouTube Shortsで共通フォーマットとして完全に定着しました。1本の動画を3プラットフォームで使い回す「クロスポスト運用」が一般化しており、制作コストを抑えながら複数媒体にリーチできる効率的なアプローチとして定着しています。ただしテキストや音源は各プラットフォームの仕様に合わせた微調整が必要です。</p>

<h3>高画質化とAI生成クリエイティブの増加</h3>
<p>スマートフォンのカメラ性能向上に伴い、フォロワーのクリエイティブ品質への期待値も上がっています。低解像度・手ぶれが多い動画は以前より離脱されやすい傾向にあります。また、AI画像生成ツールを使ったクリエイティブが急増していますが、Metaをはじめ各プラットフォームがAI生成コンテンツへのラベル表示を義務化しており、オリジナル素材との組み合わせが現時点での推奨アプローチです。Instagramのアルゴリズムがどのようにコンテンツを評価しているかは<a href="/blog/instagram-algorithm-latest-complete-guide/" target="_blank">Instagramアルゴリズム完全ガイド</a>で解説しています。</p>

<h2>SNS画像サイズに関するよくある質問（FAQ）</h2>

<h3>Q1. Instagramのフィード投稿で推奨サイズは？</h3>
<p>1080×1350px（4:5）が推奨です。画面占有率が最も高く、スクロール停止率の向上につながります。正方形（1080×1080px）でも問題ありませんが、縦型の方が表示面積で有利です。</p>

<h3>Q2. Instagramリールの安全エリアはどこですか？</h3>
<p>上から250px、下から400px、右から100px程度を空けることが実務上の目安です。この範囲にはUIボタンやプロフィール情報が重なるため、重要なテキストや商品情報はここを避けて中央エリアに配置してください。</p>

<h3>Q3. Xで投稿した画像が切れるのはなぜですか？</h3>
<p>タイムライン表示では自動トリミングが発生するためです。1枚投稿の場合は2:1〜1:2の範囲に自動調整されます。重要情報を中央75%以内に収め、投稿前にプレビューで確認する習慣をつけてください。</p>

<h3>Q4. YouTubeサムネイルの推奨サイズは？</h3>
<p>1280×720px（16:9）です。ファイル形式はJPGまたはPNG、2MB以内が条件です。720px未満はYouTubeに非推奨と判定されるため必ず1280×720px以上で作成してください。</p>

<h3>Q5. TikTokは横動画でも投稿できますか？</h3>
<p>投稿は可能ですが、フィードでの表示が小さくなりエンゲージメントが下がりやすいです。TikTokに力を入れるなら9:16縦型（1080×1920px）で統一することを推奨します。</p>

<h3>Q6. Canvaで各SNS用テンプレートを作るなら何サイズが効率的ですか？</h3>
<p>1080×1920px（9:16）と1080×1350px（4:5）の2種類を作っておけば、リール・ストーリーズ・TikTok・フィード投稿の大半をカバーできます。YouTubeサムネイルは別途1280×720pxを追加すると3テンプレートで主要SNSに対応できます。</p>

<h3>Q7. SNSにアップした画像が画質が悪くなるのはなぜですか？</h3>
<p>各プラットフォームがアップロード時に画像・動画を自動圧縮するためです。対策は「元データを高品質で書き出す（JPEG品質80%以上）」「Wi-Fi環境でアップロードする」「一度圧縮したファイルを再編集しない」の3点です。</p>

<h3>Q8. 複数のSNSを運用する場合、画像制作はどう効率化できますか？</h3>
<p>9:16テンプレートを1つ作ればInstagramリール・TikTok・YouTube Shortsに使い回せます。プラットフォームごとに微調整が必要な部分（テキスト位置・安全エリア）のみ修正する方法が最も効率的です。Canvaのテンプレート複製機能を活用してください。</p>

<h2>まとめ</h2>
<p>SNS画像・動画サイズの要点を整理します。</p>
<ul>
<li>迷ったら「1080×1350（4:5）」と「1080×1920（9:16）」の2テンプレートで大半をカバーできる</li>
<li>Instagram4:5はフィードの画面占有率が最高。リールは安全エリア（上250・下400・右100px）を守る</li>
<li>Xは枚数によって表示が変わる。重要情報は中央75%以内に収める</li>
<li>TikTok・YouTube Shortsは9:16縦型で統一。字幕と重要情報は画面中央70%に配置</li>
<li>YouTubeサムネイルは1280×720px必須。文字量は画面の30〜40%以内に抑える</li>
<li>画質劣化対策：高品質で書き出す・Wi-Fi接続でアップ・元データを再編集しない</li>
<li>Canvaで3種類のテンプレート（4:5・9:16・16:9）を固定化すると制作工数を大幅に削減できる</li>
</ul>
<p>サイズと画質を整えることは、コンテンツの第一印象を決める基礎作業です。正しい設定が整った上で、投稿内容・投稿頻度・エンゲージメント設計へと進んでください。Instagramの投稿設計・リール運用については<a href="/blog/instagram-reels-growth-guide-2026/" target="_blank">インスタリール完全ガイド</a>、フォロワー獲得の考え方は<a href="/blog/instagram-follower-methods/" target="_blank">フォロワーを増やす方法まとめ</a>も参考にしてください。</p>`;

async function main() {
  console.log('Pexels写真取得・アップロード...');
  let img1 = '', img2 = '';
  try {
    const p1 = await uploadPhoto(await fetchPexels('social media smartphone content creation design', 1), 'sns-size-guide-1.jpg');
    img1 = `<figure><img src="${p1.url}" alt="${p1.alt}" loading="lazy"><figcaption>Photo by ${p1.credit} / Pexels</figcaption></figure>`;
    console.log('  P1:', p1.url);
  } catch(e) { console.log('  P1失敗:', e.message); }
  await new Promise(r => setTimeout(r, 1000));
  try {
    const p2 = await uploadPhoto(await fetchPexels('instagram tiktok youtube marketing laptop', 2), 'sns-size-guide-2.jpg');
    img2 = `<figure><img src="${p2.url}" alt="${p2.alt}" loading="lazy"><figcaption>Photo by ${p2.credit} / Pexels</figcaption></figure>`;
    console.log('  P2:', p2.url);
  } catch(e) { console.log('  P2失敗:', e.message); }

  // 画像挿入（H2の1/3と2/3位置）
  const positions = [...BODY.matchAll(/<h2/gi)].map(m => m.index);
  const p1idx = positions[Math.floor(positions.length / 3)];
  const p2idx = positions[Math.floor(positions.length * 2 / 3)];
  let body = BODY;
  if (img1 && p1idx !== undefined) {
    body = body.slice(0, p1idx) + img1 + '\n' + body.slice(p1idx);
    const pos2 = [...body.matchAll(/<h2/gi)].map(m => m.index);
    const idx2 = pos2[Math.floor(pos2.length * 2 / 3)];
    if (img2 && idx2 !== undefined) {
      body = body.slice(0, idx2) + img2 + '\n' + body.slice(idx2);
    }
  }

  // H2 ID付与
  const h2s = extractH2s(body);
  console.log(`\nH2 ${h2s.length}個:`, h2s);
  const bodyWithIds = makeH2Ids(body, h2s);

  // まとめH2の前にCTA_ENDを挿入
  const summaryIdx = bodyWithIds.lastIndexOf('<h2');
  const bodyWithFinalCta = bodyWithIds.slice(0, summaryIdx) + CTA_END + '\n' + bodyWithIds.slice(summaryIdx);

  // わかること + 目次 + body
  const wakaruBox = makeWakaruBox(h2s);
  const toc = makeToc(h2s);
  const finalContent = [wakaruBox, toc, bodyWithFinalCta].filter(Boolean).join('\n\n');

  const charCount = finalContent.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`\n文字数: ${charCount}字`);

  console.log('microCMS PATCH中...');
  const res = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${ARTICLE_ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: NEW_TITLE, content: finalContent }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
  else console.log('完了: https://www.cocomarke.com/blog/sns-image-size-guide-2026/');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
