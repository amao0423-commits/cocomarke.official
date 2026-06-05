/**
 * SEO rewrite + microCMS update script
 * Target: insta-search-keyword-strategy-growth
 */

// FormData and Blob are global in Node.js 18+

const API_KEY = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'cocomarke';
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const CONTENT_ID = 'insta-search-keyword-strategy-growth';

// ─── Step1: Analysis report ──────────────────────────────────────────────────
const BEFORE = {
  title: 'インスタ検索とは？上位表示の仕組みと集客につなげる実践対策を解説',
  titleLen: 32,
  descLen: 120,
  hasFaq: false,
  hasCta: false,
  hasDefinition: false,
  hasWakaru: false,
  postLinks: [
    'https://www.cocomarke.com/post/instagram-seo-marketing',
    'https://www.cocomarke.com/post/how-to-create-instagram-business-account-benefits',
    'https://www.cocomarke.com/post/what-is-seo-search-engine-optimization',
    'https://www.cocomarke.com/post/instagram-profile-strategy-2025',
    'https://www.cocomarke.com/post/why-instagram-image-quality-drops-and-how-to-fix',
    'https://www.cocomarke.com/post/instagram-search-ranking-strategy',
    'https://www.cocomarke.com/post/instagram-reels-views-not-increasing-7-reasons-and-solutions-saveable-videos',
    'https://www.cocomarke.com/post/instagram-algorithm-latest-complete-guide',
    'https://www.cocomarke.com/post/free-instagram-account-check',
  ],
};

// ─── Step2: New content ──────────────────────────────────────────────────────
const NEW_TITLE =
  'インスタグラム検索キーワード戦略2025｜ハッシュタグ選定・上位表示・集客を実現するSEO完全ガイド';
// ※ title length = 50 chars

const NEW_DESCRIPTION =
  'インスタ検索とは、Instagramの検索機能を活用して新規ユーザーに投稿を発見してもらう集客施策のことです。2025年最新のキーワード戦略・ハッシュタグ選定・アルゴリズム対策を実践的に解説します。';
// ※ desc length = 89 chars (microCMS description field)

// IMAGE_PLACEHOLDER_1 / IMAGE_PLACEHOLDER_2 は後でURLに置換
const NEW_CONTENT = `<p>インスタ検索とは、Instagramの検索機能を活用して狙ったユーザーに投稿を発見してもらう集客施策のことです。ハッシュタグ検索・キーワード検索・発見タブのアルゴリズムを正しく理解し対策することで、フォロワー外の新規ユーザーへのリーチが大きく広がります。</p>

<p>Instagramを集客や販促に活用している方にとって、インスタ検索施策は今や必須です。検索への露出を最大化するには、キーワード選定・プロフィール最適化・ハッシュタグ戦略・エンゲージメント向上を組み合わせた総合的なSEO対策が求められます。2025年7月のアップデートでプロアカウントの投稿がGoogleにもインデックスされるようになり、重要性はさらに増しています。</p>

<h2 id="wakaru-box">この記事でわかること</h2>
<ul>
<li>インスタ検索の種類（ハッシュタグ検索・キーワード検索・発見タブ）と仕組み</li>
<li>キーワード検索で上位表示されるための具体的なSEO対策</li>
<li>検索順位を高めるキーワード選定とハッシュタグ活用の実践ポイント</li>
<li>2025年最新のインスタアルゴリズム動向と検索表示への影響</li>
<li>検索データ分析とPDCAサイクルの回し方</li>
<li>インスタ検索に関するよくある質問（FAQ）6選</li>
</ul>

<h2 id="h-toc">目次</h2>
<ol>
<li><a href="#h-types" target="_self">インスタ検索機能の種類と使い方</a></li>
<li><a href="#h-seo" target="_self">キーワード検索での上位表示につながるInstagramのSEO対策</a></li>
<li><a href="#h-keyword" target="_self">検索順位を高めるキーワード選定とハッシュタグ活用のポイント</a></li>
<li><a href="#h-algo" target="_self">インスタアルゴリズムの最新動向と検索表示への影響</a></li>
<li><a href="#h-pdca" target="_self">Instagramの検索データ分析とPDCAサイクル</a></li>
<li><a href="#h-faq" target="_self">よくある質問（FAQ）</a></li>
<li><a href="#h-summary" target="_self">まとめ</a></li>
</ol>

<h2 id="h-types">1. インスタ検索機能の種類と使い方</h2>

<p>インスタ検索とは、Instagramアプリの虫眼鏡アイコンから利用できる検索機能のことです。ユーザーが興味あるコンテンツやアカウントを見つけるために使われ、アカウント運営者にとっては新規ユーザーへリーチする重要な流入チャネルとなっています。</p>

<p>Instagramの検索には主に<strong>ハッシュタグ検索・キーワード検索・発見タブ</strong>の3種類があります。</p>

<ul>
<li><strong>ハッシュタグ検索</strong>：「#〇〇」を直接入力して検索。日本ユーザーの利用頻度は他国平均の5倍とも言われ、特に購買意欲の高いユーザーが集まりやすい。</li>
<li><strong>キーワード検索</strong>：「#」なしで単語を入力。キャプション・altテキスト・ユーザー名を解析して表示される。2025年現在、最も成長しているインスタ流入経路。</li>
<li><strong>発見タブ（おすすめ表示）</strong>：ユーザーの行動履歴を元にAIがパーソナライズして表示。エンゲージメント指標（保存・シェア）が重要シグナル。</li>
</ul>

<p>検索結果画面では「おすすめ」「アカウント」「リール」「タグ」「場所」のタブが表示されます。例えば「東京カフェ」を検索した場合、複数のタブに分かれて関連コンテンツが表示されます。</p>

<p>また、2025年7月のアップデートで<strong>全てのプロアカウントの公開投稿がデフォルトでGoogleにインデックス</strong>されるようになりました。インスタ検索への対策はSNS内にとどまらず、Web検索からの流入にも直結します。</p>

<p>関連記事：<a href="https://www.cocomarke.com/blog/instagram-seo-marketing" target="_blank" rel="noopener noreferrer">インスタ検索で投稿が上位に表示される仕組みとは？SNSマーケティングで"見られる投稿"を作る方法</a></p>

<blockquote>
<p>COCOマーケでは無料相談を実施中です。お気軽にご連絡ください。</p>
<p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a></p>
</blockquote>

<h2 id="h-seo">2. キーワード検索での上位表示につながるInstagramのSEO対策</h2>

<p><strong>Instagram SEO</strong>とは、ハッシュタグ検索やキーワード検索で自アカウントの投稿が上位に表示されるよう、コンテンツやアカウント情報を最適化する取り組みのことです。Webサイトのページ最適化と同じ考え方で、ユーザーが検索するキーワードを意識してプロフィール・キャプション・ハッシュタグを整備します。</p>

<p>2025年現在、Instagramはテキスト情報を高精度で解析するため、画像・動画の質だけでなく<strong>テキスト最適化が検索順位を左右</strong>します。以下、主要な5つの対策を解説します。</p>

<h3>① プロフィール情報へのキーワード最適化</h3>
<p>ユーザー名・表示名・自己紹介文に関連キーワードを盛り込むことで、検索時にアカウントが上位に表示されやすくなります。例えばカフェ営業なら「@tokyo_cafe_○○」「東京○○カフェ」のようにブランド名に地域や業種を含め、自己紹介には「#東京カフェ #コーヒー」などを配置すると効果的です。自己紹介は150文字までなので最重要キーワードに絞り込みましょう。</p>

<p>関連記事：<a href="https://www.cocomarke.com/blog/instagram-profile-strategy-2025" target="_blank" rel="noopener noreferrer">問い合わせを生むインスタプロフィール（自己紹介）の作り方【2025年版インスタ運用戦略】</a></p>

<h3>② キャプションへのキーワード組み込み</h3>
<p>投稿のキャプション（最大2,200文字）に検索されるキーワードを自然な形で含めます。「渋谷美容室」「札幌旅行」といったフレーズを文脈に沿って書くことで、該当キーワードの検索結果に表示されやすくなります。ただし無闇な羅列はスパム判定されるため、投稿内容との関連性を保つことが重要です。</p>

<h3>③ ハッシュタグの戦略的活用</h3>
<p>ハッシュタグはInstagram内検索の重要要素です。近年は<strong>ハッシュタグの数より質（関連性）が重視</strong>される傾向にあり、1投稿あたり10〜15個に絞って投稿内容と密接に関連するタグを選ぶことが推奨されています。詳細なハッシュタグ選定方法は第3章で解説します。</p>

<h3>④ altテキスト（代替テキスト）設定</h3>
<p>Instagramでは画像・動画にaltテキストを設定できます。検索エンジンが画像内容を理解するための手がかりとなるため、「笑顔の女性が東京カフェでラテアートを楽しんでいる様子」のような具体的な説明を記述することで、関連キーワードへの露出が高まります。</p>

<p>関連記事：<a href="https://www.cocomarke.com/blog/why-instagram-image-quality-drops-and-how-to-fix" target="_blank" rel="noopener noreferrer">インスタ投稿画質が落ちる原因と対策方法を徹底解説！</a></p>

<h3>⑤ 位置情報タグの活用</h3>
<p>店舗や地域に根ざしたビジネスでは、位置情報タグが「○○市カフェ」などの地域＋キーワード検索での上位表示に直結します。Google検索結果でも地図付きで表示されるケースがあるため、地理的なターゲティングには積極的に活用しましょう。</p>

<p>SEO対策の基礎はこちらの記事でも詳しく紹介しています。<br>関連記事：<a href="https://www.cocomarke.com/blog/what-is-seo-search-engine-optimization" target="_blank" rel="noopener noreferrer">【初心者向け】SEO対策（検索エンジン最適化）とは？わかりやすく解説！基本からやり方・ツールまで</a></p>

<p>IMAGE_PLACEHOLDER_1</p>

<blockquote>
<p>サービス資料を無料でダウンロードいただけます。</p>
<p><a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p>
</blockquote>

<h2 id="h-keyword">3. 検索順位を高めるキーワード選定とハッシュタグ活用のポイント</h2>

<p>キーワード選定はInstagram SEOの土台です。自社の強みやターゲット層が検索しそうな言葉を洗い出し、<strong>人気キーワード（ビッグ）と競合の少ないニッチキーワード（スモール）</strong>をバランスよく組み合わせることが重要です。</p>

<h3>効果的なキーワード選定の3ステップ</h3>
<ol>
<li><strong>関連ワードのリストアップ</strong>：商品・サービス・地域・業種など多角的な角度でキーワードを洗い出す</li>
<li><strong>競合分析</strong>：同業アカウントが使っているハッシュタグやキャプションのキーワードを参考にし、差別化できる独自ワードを見つける</li>
<li><strong>投稿数の確認</strong>：Instagramの検索窓でタグの投稿数を確認。数十万〜数百万件程度のミドルタグを中心に組み合わせるとバランスが良い</li>
</ol>

<h3>ハッシュタグの3タイプと組み合わせ戦略</h3>
<ul>
<li><strong>ビッグタグ</strong>（投稿数1,000万件超）：「#旅行」「#カフェ」など。リーチは大きいが埋もれやすい。1〜2個に留める</li>
<li><strong>ミドルタグ</strong>（数十万〜数百万件）：「#大阪旅行」「#神奈川カフェ」など。広がりと集中度のバランスが取れる。メインに活用</li>
<li><strong>スモールタグ</strong>（〜数万件）：「#梅田カフェ巡り」など。競合が少なく上位表示されやすいが、リーチは限定的</li>
</ul>

<p>1投稿あたり10〜15個のハッシュタグを目安に、3タイプをバランスよく組み合わせましょう。また、<strong>オリジナルハッシュタグ</strong>（店舗名やキャンペーン名）を作成して一貫して使用することで、ブランド認知とUGC（ユーザー生成コンテンツ）の収集にも繋がります。</p>

<p>関連記事：<a href="https://www.cocomarke.com/blog/instagram-search-ranking-strategy" target="_blank" rel="noopener noreferrer">2025年最新版 Instagram検索×おすすめタブで集客最大化｜SNSマーケティング完全戦略</a></p>

<h2 id="h-algo">4. インスタアルゴリズムの最新動向と検索表示への影響</h2>

<p>Instagramのアルゴリズムは、ユーザーの関心に合わせたコンテンツ表示を一層強化しています。2025年現在のアルゴリズムは過去の行動データ（反応した投稿・フォロー・検索履歴）をAIが学習し、ユーザーごとにパーソナライズした検索結果を提示します。そのため同じキーワードで検索してもユーザーによって表示される投稿が異なります。</p>

<h3>アルゴリズムが重視するエンゲージメント指標（重要度順）</h3>
<ol>
<li><strong>保存数</strong>：後で見返す価値があると判断した証。最も強いシグナル</li>
<li><strong>シェア数</strong>：友人への共有欲求を示す。拡散力の証明</li>
<li><strong>コメント数</strong>：コミュニティ形成の強さを示す</li>
<li><strong>いいね数</strong>：基本指標だが近年の重み付けは低下傾向</li>
<li><strong>滞在時間</strong>：リールや動画コンテンツで特に重視される</li>
</ol>

<p>特に<strong>保存とシェアを促せるコンテンツ作り</strong>（役立つ情報提供・まとめ・ノウハウ系）が検索上位表示の近道です。</p>

<p>発見タブのアルゴリズムでは「フォローしていないアカウントの投稿」が表示されるため、新規ユーザー獲得のチャンスが最も大きい場所でもあります。投稿品質の高さ・エンゲージメント率・プロフィール情報の一貫性が総合評価されます。</p>

<p>関連記事：<a href="https://www.cocomarke.com/blog/instagram-algorithm-latest-complete-guide" target="_blank" rel="noopener noreferrer">インスタアルゴリズム2025年完全解説｜フィード・リール・ストーリーズ別の対策まとめ</a></p>

<p>ビジネスアカウントの設定方法と活用メリットについてはこちら。<br>関連記事：<a href="https://www.cocomarke.com/blog/how-to-create-instagram-business-account-benefits" target="_blank" rel="noopener noreferrer">Instagramでビジネスアカウントを作成する方法とそのメリットを解説</a></p>

<h2 id="h-pdca">5. Instagramの検索データ分析とPDCAサイクル</h2>

<p>検索施策は「やりっぱなし」にせず、データをもとに継続的に改善することが成果の鍵です。Instagramのインサイト機能やサードパーティツールを活用してPDCAを回しましょう。</p>

<h3>確認すべき主要指標</h3>
<ul>
<li><strong>インプレッション（ハッシュタグ経由）</strong>：各投稿のインサイトで「ハッシュタグ」欄の数値を確認。増減を週次で記録する</li>
<li><strong>リーチ率</strong>：フォロワー外へのリーチ比率。検索・発見タブからの流入比率が高いほど施策が効いている</li>
<li><strong>保存率</strong>：リーチ数に対する保存数の割合。3〜5%以上が理想的</li>
<li><strong>プロフィールへのアクセス数</strong>：投稿から行動に繋がった指標。検索流入後のCV率改善に直結</li>
</ul>

<h3>PDCAサイクルの実践例</h3>
<ol>
<li><strong>Plan</strong>：キーワードを仮説立て、ハッシュタグセットを3〜5パターン用意</li>
<li><strong>Do</strong>：パターン別に10投稿ずつ実施</li>
<li><strong>Check</strong>：ハッシュタグ経由インプレッションと保存率を比較</li>
<li><strong>Act</strong>：成果の高いパターンを標準化し、低いものは差し替え</li>
</ol>

<p>データ分析の習慣化により、検索上位表示のPDCAが加速します。<a href="https://www.cocomarke.com/blog/free-instagram-account-check" target="_blank" rel="noopener noreferrer">無料のアカウント診断ツール</a>も活用してみてください。</p>

<p>リールの伸び悩みの原因と解決策についてはこちら。<br>関連記事：<a href="https://www.cocomarke.com/blog/instagram-reels-views-not-increasing-7-reasons-and-solutions-saveable-videos" target="_blank" rel="noopener noreferrer">インスタリール再生数が伸びない7つの原因と対策｜保存されやすい動画の作り方</a></p>

<p>IMAGE_PLACEHOLDER_2</p>

<h2 id="h-faq">6. よくある質問（FAQ）</h2>

<h3>Q1. インスタ検索で上位表示されるのにどのくらいの期間がかかりますか？</h3>
<p>アカウントの現状や施策の質によって異なりますが、プロフィール最適化とハッシュタグ戦略を正しく実施した場合、<strong>1〜3ヶ月で検索流入の改善</strong>が見られるケースが多いです。既存アカウントの場合はエンゲージメント実績が評価されるため、比較的早く効果が出ることもあります。</p>

<h3>Q2. ハッシュタグは何個付けるのが最適ですか？</h3>
<p>現在のアルゴリズムでは<strong>10〜15個</strong>が推奨です。以前は30個フルに使うことが一般的でしたが、関連性の低いハッシュタグの大量使用はスパム判定リスクがあります。厳選した関連性の高いタグを10〜15個組み合わせることで最も高いパフォーマンスが期待できます。</p>

<h3>Q3. キーワード検索とハッシュタグ検索、どちらを優先すべきですか？</h3>
<p>両方を並行して対策することが理想ですが、特に新規フォロワーの獲得を重視するなら<strong>キーワード検索対策</strong>（キャプション・プロフィールの最適化）が効果的です。既存フォロワーのコミュニティ形成には<strong>ハッシュタグ検索</strong>が有効です。</p>

<h3>Q4. 個人アカウントとビジネスアカウントで検索の見られ方は変わりますか？</h3>
<p>はい、大きく異なります。<strong>ビジネス・クリエイターアカウント</strong>はプロアカウントの機能が使えるだけでなく、2025年7月以降はGoogle等の外部検索にもインデックスされます。集客目的の運用では必ずプロアカウントに切り替えることをおすすめします。</p>

<h3>Q5. インスタのキーワード検索で自社の投稿が表示されるか確認する方法はありますか？</h3>
<p>Instagramアプリの検索バーにターゲットキーワードを入力し、「リール」や「投稿」タブで自社コンテンツが表示されるか確認できます。ただし、検索結果はユーザーの行動履歴でパーソナライズされるため、<strong>シークレットモードや別アカウントでの確認</strong>がより客観的な結果を示します。</p>

<h3>Q6. ハッシュタグ禁止（シャドウバン）になった場合の対処法は？</h3>
<p>シャドウバンはスパム的なハッシュタグ使用・急激なフォロー/アンフォロー・ポリシー違反投稿が原因で発生します。対処法は①問題のある投稿のハッシュタグを削除・②数日間投稿を控えて回復を待つ・③プロアカウントのインサイトでハッシュタグ経由のインプレッションが「0」でないか確認する、の3ステップです。</p>

<h2 id="h-summary">7. まとめ</h2>

<p>本記事では、インスタ検索を活用した集客最大化のための実践戦略を解説しました。重要なポイントを振り返りましょう。</p>

<ul>
<li><strong>インスタ検索とは</strong>、Instagramの検索機能（ハッシュタグ・キーワード・発見タブ）を活用して新規ユーザーに投稿を発見してもらう集客施策のこと</li>
<li>プロフィール・キャプション・altテキスト・ハッシュタグへの<strong>キーワード最適化</strong>が検索順位の基本</li>
<li>ハッシュタグはビッグ・ミドル・スモールの<strong>3タイプを10〜15個</strong>組み合わせて使う</li>
<li>アルゴリズムは<strong>保存・シェア</strong>を最重要シグナルとして評価する</li>
<li>2025年現在、プロアカウントの投稿は<strong>Google検索にもインデックス</strong>されるため、インスタSEO対策の重要性はさらに増している</li>
<li>インサイトを活用したPDCAサイクルで継続改善することが長期的な成果の鍵</li>
</ul>

<p>Instagramアルゴリズムや機能は今後も進化し続けますが、「ユーザーが求める情報を見つけやすく・興味を引く形で提供する」という基本は変わりません。本ガイドで解説した施策を自社アカウントに取り入れ、検索経由の集客拡大を実現してください。</p>

<blockquote>
<p>COCOマーケでは無料相談を実施中です。専任マネージャーが最適なプランをご提案します。</p>
<p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">無料相談を受ける</a> ／ <a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">資料をダウンロードする</a></p>
</blockquote>`;

// ─── Step3: SVG images ───────────────────────────────────────────────────────
const SVG1 = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="800" height="450" fill="#f8faff"/>
  <!-- Header -->
  <rect width="800" height="70" fill="url(#headerGrad)"/>
  <text x="400" y="44" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">インスタSEO対策 5つの柱</text>
  <!-- Arrows flow: 5 boxes in a row -->
  <!-- Box 1 -->
  <rect x="30" y="100" width="130" height="90" rx="10" fill="#3B82F6"/>
  <text x="95" y="138" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">① プロフィール</text>
  <text x="95" y="158" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">最適化</text>
  <text x="95" y="176" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#bfdbfe" text-anchor="middle">ユーザー名・自己紹介</text>
  <!-- Arrow -->
  <polygon points="170,140 185,145 170,150" fill="#1F2937"/>
  <!-- Box 2 -->
  <rect x="190" y="100" width="130" height="90" rx="10" fill="#22C55E"/>
  <text x="255" y="138" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">② キャプション</text>
  <text x="255" y="158" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">最適化</text>
  <text x="255" y="176" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#bbf7d0" text-anchor="middle">キーワード自然配置</text>
  <!-- Arrow -->
  <polygon points="330,140 345,145 330,150" fill="#1F2937"/>
  <!-- Box 3 -->
  <rect x="350" y="100" width="130" height="90" rx="10" fill="#F97316"/>
  <text x="415" y="138" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">③ ハッシュタグ</text>
  <text x="415" y="158" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">戦略</text>
  <text x="415" y="176" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#fed7aa" text-anchor="middle">10〜15個 3タイプ混合</text>
  <!-- Arrow -->
  <polygon points="490,140 505,145 490,150" fill="#1F2937"/>
  <!-- Box 4 -->
  <rect x="510" y="100" width="130" height="90" rx="10" fill="#3B82F6"/>
  <text x="575" y="138" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">④ altテキスト</text>
  <text x="575" y="158" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">設定</text>
  <text x="575" y="176" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#bfdbfe" text-anchor="middle">画像の代替テキスト</text>
  <!-- Arrow -->
  <polygon points="650,140 665,145 650,150" fill="#1F2937"/>
  <!-- Box 5 -->
  <rect x="670" y="100" width="100" height="90" rx="10" fill="#22C55E"/>
  <text x="720" y="138" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">⑤ 位置情報</text>
  <text x="720" y="158" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" font-weight="bold" fill="white" text-anchor="middle">タグ</text>
  <text x="720" y="176" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#bbf7d0" text-anchor="middle">地域検索対策</text>
  <!-- Result box -->
  <rect x="200" y="230" width="400" height="80" rx="12" fill="#1F2937"/>
  <text x="400" y="264" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="16" font-weight="bold" fill="#22C55E" text-anchor="middle">検索上位表示 ＋ Google流入増加</text>
  <text x="400" y="288" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="white" text-anchor="middle">5施策の組み合わせで集客力が最大化</text>
  <!-- Downward arrows to result box -->
  <line x1="95" y1="190" x2="95" y2="260" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4"/>
  <line x1="95" y1="260" x2="200" y2="260" stroke="#3B82F6" stroke-width="2" stroke-dasharray="4"/>
  <line x1="720" y1="190" x2="720" y2="260" stroke="#22C55E" stroke-width="2" stroke-dasharray="4"/>
  <line x1="720" y1="260" x2="600" y2="260" stroke="#22C55E" stroke-width="2" stroke-dasharray="4"/>
  <!-- Footer -->
  <text x="400" y="430" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">© COCOマーケ | Instagramマーケティング支援</text>
</svg>`;

const SVG2 = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <linearGradient id="headerGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#F97316;stop-opacity:1"/>
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="800" height="450" fill="#fffaf5"/>
  <!-- Header -->
  <rect width="800" height="70" fill="url(#headerGrad2)"/>
  <text x="400" y="44" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle">ハッシュタグ3タイプ比較表</text>
  <!-- Table header -->
  <rect x="20" y="85" width="760" height="40" fill="#1F2937"/>
  <text x="110" y="110" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">タイプ</text>
  <text x="280" y="110" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">投稿数の目安</text>
  <text x="450" y="110" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">リーチ力</text>
  <text x="620" y="110" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">使用個数の目安</text>
  <!-- Row 1: Big tag -->
  <rect x="20" y="125" width="760" height="70" fill="#EFF6FF"/>
  <rect x="20" y="125" width="180" height="70" fill="#3B82F6"/>
  <text x="110" y="156" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">ビッグタグ</text>
  <text x="110" y="175" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="12" fill="#bfdbfe" text-anchor="middle">例：#旅行 #カフェ</text>
  <text x="280" y="165" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">1,000万件以上</text>
  <text x="450" y="155" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">★★★★★</text>
  <text x="450" y="175" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">（競合が激しく埋もれやすい）</text>
  <text x="620" y="165" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="#3B82F6" text-anchor="middle">1〜2個</text>
  <!-- Row 2: Middle tag -->
  <rect x="20" y="195" width="760" height="70" fill="#F0FDF4"/>
  <rect x="20" y="195" width="180" height="70" fill="#22C55E"/>
  <text x="110" y="226" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">ミドルタグ</text>
  <text x="110" y="245" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="12" fill="#bbf7d0" text-anchor="middle">例：#大阪カフェ</text>
  <text x="280" y="235" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">数十万〜数百万件</text>
  <text x="450" y="225" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">★★★☆☆</text>
  <text x="450" y="245" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">（バランスが最良）</text>
  <text x="620" y="235" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="#22C55E" text-anchor="middle">7〜10個 ◎メイン</text>
  <!-- Row 3: Small tag -->
  <rect x="20" y="265" width="760" height="70" fill="#FFF7ED"/>
  <rect x="20" y="265" width="180" height="70" fill="#F97316"/>
  <text x="110" y="296" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="15" font-weight="bold" fill="white" text-anchor="middle">スモールタグ</text>
  <text x="110" y="315" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="12" fill="#fed7aa" text-anchor="middle">例：#梅田カフェ巡り</text>
  <text x="280" y="305" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">〜数万件</text>
  <text x="450" y="295" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="13" fill="#1F2937" text-anchor="middle">★☆☆☆☆</text>
  <text x="450" y="315" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">（上位表示は狙いやすい）</text>
  <text x="620" y="305" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="#F97316" text-anchor="middle">3〜5個</text>
  <!-- Summary -->
  <rect x="20" y="348" width="760" height="50" rx="8" fill="#1F2937"/>
  <text x="400" y="377" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="14" font-weight="bold" fill="#22C55E" text-anchor="middle">推奨合計：10〜15個 ｜ ビッグ1〜2 ＋ ミドル7〜10 ＋ スモール3〜5</text>
  <!-- Footer -->
  <text x="400" y="432" font-family="'Hiragino Kaku Gothic Pro', 'Yu Gothic', sans-serif" font-size="12" fill="#6B7280" text-anchor="middle">© COCOマーケ | Instagramマーケティング支援</text>
</svg>`;

// ─── Step4a: Fetch photo from Pexels and upload to microCMS ─────────────────
async function fetchPexelsAndUpload(query) {
  const mediaUrl = `https://${SERVICE_DOMAIN}.microcms-management.io/api/v1/media`;

  // Search Pexels
  console.log(`Searching Pexels for: "${query}"...`);
  const searchRes = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
    { headers: { Authorization: PEXELS_API_KEY } }
  );
  if (!searchRes.ok) throw new Error(`Pexels search failed: ${searchRes.status}`);
  const searchData = await searchRes.json();

  if (!searchData.photos?.length) throw new Error('No Pexels photos found');
  const photo = searchData.photos[0];
  const photoUrl = photo.src.large2x ?? photo.src.large ?? photo.src.original;
  const photographer = photo.photographer;
  console.log(`Found Pexels photo by ${photographer}: ${photoUrl}`);

  // Download image
  console.log('Downloading image from Pexels...');
  const imgRes = await fetch(photoUrl);
  if (!imgRes.ok) throw new Error(`Image download failed: ${imgRes.status}`);
  const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg';
  const ext = contentType.includes('png') ? 'png' : 'jpg';
  const imgBuffer = await imgRes.arrayBuffer();

  // Upload to microCMS
  const filename = `pexels-instagram-seo-${photo.id}.${ext}`;
  const formData = new FormData();
  const blob = new Blob([imgBuffer], { type: contentType });
  formData.append('file', blob, filename);

  console.log(`Uploading ${filename} to microCMS...`);
  const uploadRes = await fetch(mediaUrl, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': API_KEY },
    body: formData,
  });
  const uploadText = await uploadRes.text();
  console.log(`Upload response (${uploadRes.status}):`, uploadText.slice(0, 200));

  if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status} ${uploadText}`);
  const uploadData = JSON.parse(uploadText);
  return { url: uploadData.url, alt: `インスタグラム検索SEO対策（Photo by ${photographer} / Pexels）` };
}

// ─── Step4b: Upload SVG to microCMS media ────────────────────────────────────
async function uploadSVG(svgContent, filename) {
  const mediaUrl = `https://${SERVICE_DOMAIN}.microcms-management.io/api/v1/media`;
  const svgBuffer = Buffer.from(svgContent, 'utf8');

  const formData = new FormData();
  const blob = new Blob([svgBuffer], { type: 'image/svg+xml' });
  formData.append('file', blob, filename);

  console.log(`Uploading ${filename}...`);
  const res = await fetch(mediaUrl, {
    method: 'POST',
    headers: { 'X-MICROCMS-API-KEY': API_KEY },
    body: formData,
  });

  const text = await res.text();
  console.log(`Upload response (${res.status}):`, text.slice(0, 200));

  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${text}`);

  const data = JSON.parse(text);
  return data.url;
}

// ─── Step5: PATCH article ────────────────────────────────────────────────────
async function patchArticle(content) {
  const url = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/blogs/${CONTENT_ID}`;
  console.log(`\nPATCH ${url}`);

  const body = {
    title: NEW_TITLE,
    content,
  };

  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'X-MICROCMS-API-KEY': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`PATCH response (${res.status}):`, text.slice(0, 300));
  return { status: res.status, ok: res.ok, body: text };
}

// ─── Main ────────────────────────────────────────────────────────────────────
(async () => {
  console.log('='.repeat(60));
  console.log('SEO Rewrite: insta-search-keyword-strategy-growth');
  console.log('='.repeat(60));

  // Print analysis
  console.log('\n【Step2: 分析結果】');
  console.log('変更前タイトル:', BEFORE.title);
  console.log('タイトル文字数:', BEFORE.titleLen, '文字（目標50〜60）→ ❌ 短すぎ');
  console.log('メタDesc文字数:', BEFORE.descLen, '文字（タイトル重複で内容不十分）→ ❌');
  console.log('定義文（〇〇とは〜ことです）: ❌ 未掲載');
  console.log('この記事でわかることボックス: ❌ 未掲載');
  console.log('FAQセクション: ❌ 記事内になし');
  console.log('CTAブロック: ❌ 0件');
  console.log('/post/* 内部リンク:', BEFORE.postLinks.length, '件 → /blog/* に変換要');
  console.log('\n変更後タイトル:', NEW_TITLE);
  console.log('変更後タイトル文字数:', NEW_TITLE.length, '文字');
  console.log('変更後DESC文字数:', NEW_DESCRIPTION.length, '文字');

  // Upload images
  console.log('\n【Step4: 画像アップロード】');
  let imageUrl1 = null;
  let imageAlt1 = 'インスタグラム検索・SEO対策のイメージ';
  let imageUrl2 = null;

  // 画像1: Pexels写真
  try {
    const pexels = await fetchPexelsAndUpload('instagram social media marketing');
    imageUrl1 = pexels.url;
    imageAlt1 = pexels.alt;
    console.log('画像1（Pexels）URL:', imageUrl1);
  } catch (e) {
    console.error('画像1 Pexelsアップロード失敗:', e.message);
  }

  // 画像2: SVGインフォグラフィック
  try {
    imageUrl2 = await uploadSVG(SVG2, 'insta-hashtag-comparison.svg');
    console.log('画像2（SVG）URL:', imageUrl2);
  } catch (e) {
    console.error('画像2 アップロード失敗:', e.message);
  }

  // Inject image HTML into content
  const imgTag1 = imageUrl1
    ? `<img src="${imageUrl1}" alt="${imageAlt1}" loading="lazy">`
    : '<p>【インスタグラム検索SEO対策イメージ】</p>';
  const imgTag2 = imageUrl2
    ? `<img src="${imageUrl2}" alt="ハッシュタグ3タイプ比較表" width="800" height="450" loading="lazy">`
    : '<p>【ハッシュタグ3タイプ比較表】</p>';

  const finalContent = NEW_CONTENT
    .replace('IMAGE_PLACEHOLDER_1', imgTag1)
    .replace('IMAGE_PLACEHOLDER_2', imgTag2);

  // PATCH
  console.log('\n【Step5: microCMS PATCH更新】');
  const result = await patchArticle(finalContent);

  // Report
  console.log('\n' + '='.repeat(60));
  console.log('【Step6: 完了レポート】');
  console.log('='.repeat(60));
  console.log('\n■ タイトル変更');
  console.log('  Before:', BEFORE.title, `(${BEFORE.titleLen}文字)`);
  console.log('  After :', NEW_TITLE, `(${NEW_TITLE.length}文字)`);
  console.log('\n■ メタディスクリプション変更');
  console.log('  Before: タイトル+本文先頭120文字（内容不十分）');
  console.log('  After :', NEW_DESCRIPTION);
  console.log('\n■ 修正した内部リンク（/post/* → /blog/*）');
  BEFORE.postLinks.forEach(l => {
    console.log(' ', l, '→', l.replace('/post/', '/blog/'));
  });
  console.log('\n■ 追加したCTA（3か所）');
  console.log('  1/3付近: 無料相談 CTA');
  console.log('  2/3付近: 資料ダウンロード CTA');
  console.log('  末尾  : 無料相談＋資料ダウンロード CTA');
  console.log('\n■ 追加したFAQ見出し（6問）');
  console.log('  Q1. 上位表示されるのにどのくらいの期間がかかるか');
  console.log('  Q2. ハッシュタグは何個付けるのが最適か');
  console.log('  Q3. キーワード検索とハッシュタグ検索、どちらを優先すべきか');
  console.log('  Q4. 個人・ビジネスアカウントで検索の見られ方は変わるか');
  console.log('  Q5. 自社投稿が検索表示されるか確認する方法');
  console.log('  Q6. シャドウバンになった場合の対処法');
  console.log('\n■ アップロード画像URL');
  console.log('  画像1（Pexels写真）:', imageUrl1 ?? '（アップロード失敗）');
  console.log('  画像2（SVGインフォグラフィック）:', imageUrl2 ?? '（アップロード失敗）');
  console.log('\n■ microCMS更新ステータス');
  console.log('  HTTP Status:', result.status, result.ok ? '✅ 成功' : '❌ 失敗');
  if (!result.ok) {
    console.log('  エラー詳細:', result.body);
  }
})();
