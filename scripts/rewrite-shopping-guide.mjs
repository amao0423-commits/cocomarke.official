/**
 * rewrite-shopping-guide.mjs
 * instagram-sales-guide-recommend-dm-search を改善計画に従いリライト
 */

const MICROCMS_KEY    = process.env.MICROCMS_WRITE_API_KEY ?? process.env.MICROCMS_API_KEY;
const MICROCMS_DOMAIN = 'cocomarke';
const PEXELS_KEY      = process.env.PEXELS_API_KEY;
const ARTICLE_ID      = 'instagram-sales-guide-recommend-dm-search';
const NEW_TITLE       = 'Instagramショッピングの始め方と売れる導線設計｜おすすめ表示・検索・DM対応まで【2026年完全版】';

// ─── CTAブロック（位置別）────────────────────────────────────────────────────
const CTA_INFO = `<blockquote><p><strong>まず何から整えるべきか知りたい方へ</strong></p><p>COCOマーケでは、Instagramアカウントの現状診断と改善ロードマップのご提案を無料相談で実施しています。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_MID  = `<blockquote><p><strong>設定でつまずいている方・導線を改善したい方へ</strong></p><p>COCOマーケでは、アカウント設計から運用代行まで一貫してサポートしています。まずは無料相談をご活用ください。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;
const CTA_END  = `<blockquote><p><strong>自社アカウントで売れる導線を診断したい方へ</strong></p><p>COCOマーケの無料相談では、現状の投稿・プロフィール・DM設計を確認し、具体的な改善提案をお伝えします。</p><p><a href="https://www.cocomarke.com/contact" target="_blank" rel="noopener noreferrer">💬 無料相談を受ける</a>　　<a href="https://www.cocomake-guide.com/servicedocument" target="_blank" rel="noopener noreferrer">📄 資料をダウンロードする</a></p></blockquote>`;

// ─── Pexels ──────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function extractH2s(html) {
  return [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)]
    .map(m => m[1].replace(/<[^>]+>/g, '').trim())
    .filter(h => h.length > 0 && !/この記事でわかること|目次/.test(h));
}
function makeWakaruBox(h2s) {
  return `<h2 id="h-wakaru">この記事でわかること</h2>\n<ul>\n${h2s.slice(0,6).map(h=>`<li>${h}</li>`).join('\n')}\n</ul>`;
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

// ─── 本文 ─────────────────────────────────────────────────────────────────────
const BODY = `<p>「Instagramショッピングを設定したのに全然売れない」「おすすめに表示させたいが何をすればいいかわからない」「DMが来ても購入につながらない」——そんな声は、設定と運用の両方に課題がある典型パターンです。</p>
<p>Instagramショッピングとは、Instagram上で商品を見つけてもらい、ECサイトの購入導線につなげる販売手法です。単に商品タグを付けるだけでなく、検索されるプロフィール設計、おすすめ表示される投稿設計、DMで離脱させない対応の3点が揃って初めて成果につながります。</p>
<p>この記事では、開設の条件と手順から、集客・購入導線の設計、よくある失敗と対処法まで、実務的な順序で解説します。「設定できる」「売上導線を整えられる」「必要なら相談できる」の3段階を目標に読み進めてください。</p>

${CTA_INFO}

<h2>Instagramショッピングとは？できることと向いている事業者</h2>
<p>Instagramショッピング（Instagram Shopping）は、投稿や広告に商品タグを付けてECサイトへ誘導できる機能です。ユーザーが投稿内の商品タグをタップすると商品詳細が表示され、そのまま購入ページへ遷移できます。ショッピングタブや発見タブにも商品が掲載されるため、フォロワー以外のユーザーにリーチできます。</p>

<h3>Instagramショッピングでできること</h3>
<ul>
<li>フィード投稿・リール・ストーリーズへの商品タグ付け</li>
<li>ショッピングタブへの商品一覧掲載</li>
<li>発見タブへの商品表示（非フォロワーへのリーチ）</li>
<li>ライブショッピング（配信中に商品を紹介）</li>
<li>コレクション機能（テーマ別に商品をまとめて表示）</li>
</ul>

<h3>向いている事業者・向かない事業者</h3>
<table>
<tr><th>区分</th><th>具体例</th><th>向いている理由</th></tr>
<tr><td>向いている</td><td>アパレル・コスメ・雑貨・食品・ハンドメイド</td><td>ビジュアルで訴求できる商品は発見からそのまま購入導線につながりやすい</td></tr>
<tr><td>やや向いている</td><td>インテリア・フィットネス用品・ペット用品</td><td>ライフスタイル提案型の投稿と相性が良く、コレクション機能も活用できる</td></tr>
<tr><td>向かない</td><td>高額BtoBサービス・受注生産品・法律・医療</td><td>衝動購買が起きにくく、商品情報の複雑さからタグ設計が難しい</td></tr>
</table>

<blockquote><p><strong>💡 ポイント</strong></p><p>Instagramショッピングが「向いていない」業種でも、ブランド認知やDM誘導、イベント告知としてInstagramを活用することはできます。販売チャンネルとしてではなく、接点ツールとして使う設計も有効です。</p></blockquote>

<h2>Instagramショッピングを始める前に確認したい条件</h2>
<p>設定を進める前に、以下の条件をすべて満たしているか確認してください。条件が揃っていない状態で申請しても審査が通らず、原因究明に時間を取られます。</p>

<h3>開設前チェックリスト</h3>
<ul>
<li>ECサイトまたは商品ページが存在し、公開されている</li>
<li>Instagramアカウントをプロアカウント（ビジネスまたはクリエイター）に切り替えている</li>
<li>販売する商品がMetaの<a href="https://www.facebook.com/policies/commerce/" target="_blank" rel="noopener noreferrer">コマースポリシー</a>に適合している</li>
<li>ECサイトのドメインがMeta Business Managerで確認済みである</li>
<li>商品情報（商品名・価格・在庫・説明文・画像）が整備されている</li>
<li>InstagramアカウントとFacebookページが連携されている</li>
</ul>

<h3>審査でつまずきやすいポイント</h3>
<p>審査に時間がかかる、または却下される原因の多くは次の3点です。</p>
<ul>
<li>ドメイン未確認：ECサイトのドメインをMeta Business Managerで所有確認していない</li>
<li>商品カテゴリの不適合：アルコール・医薬品・サプリメントなど、Metaが制限するカテゴリに該当する</li>
<li>商品情報の不備：価格未設定・説明文なし・在庫情報なしの商品が含まれている</li>
</ul>
<p>審査は通常数日〜数週間かかります。審査中にアカウント情報を変更すると再審査になる場合があるため、申請前にすべてを確認・整備してから進めることを強くおすすめします。</p>

<h2>Instagramショッピングの開設手順</h2>
<p>条件が揃ったら、以下の順序で設定を進めます。Meta Commerceマネージャーを使うのが現時点での標準手順です。</p>

<h3>基本的な開設フロー</h3>
<ol>
<li>プロアカウントへの切り替え（設定 → アカウント → プロアカウントに切り替え）</li>
<li>Facebookページの作成とInstagramとの連携</li>
<li>Meta Business Managerでビジネスアカウントを作成</li>
<li>ドメイン確認（Business Manager → ブランドセーフティ → ドメイン）</li>
<li>Commerceマネージャーでカタログを作成し、商品情報を登録</li>
<li>Instagramアプリで「ショッピングを設定」から申請</li>
<li>審査通過後、投稿作成画面で商品タグが使用可能になる</li>
</ol>

<h3>カタログ連携の選択肢</h3>
<p>商品数が多い場合は手動登録ではなくカタログフィード（CSV/XMLファイルの自動連携）を使う方が効率的です。Shopify・BASE・STORESなどの主要ECプラットフォームはMeta公式の連携アプリが用意されており、在庫情報のリアルタイム同期が可能です。</p>

${CTA_MID}

<h2>売れる導線を作る3つの運用ポイント</h2>
<p>ショッピング機能を設定しただけで売上が上がることはほぼありません。「発見→興味→信頼→購入」の流れを設計する必要があります。アカウント全体の数値分析には<a href="/blog/instagram-insights-guide-2025/" target="_blank">Instagramインサイトの見方</a>を参照してください。</p>

<h3>①投稿で興味喚起し商品タグで遷移させる</h3>
<p>商品タグはあくまで「購入導線の入口」です。タグを付けるだけでは売れません。投稿の役割は「この商品を欲しいと思わせること」であり、タグはその後の動線です。商品の使用シーン・ビフォーアフター・スタッフの着用例など、「自分ごと化」できる投稿が商品ページへの遷移率を上げます。</p>

<h3>②プロフィールで信頼を形成する</h3>
<p>多くのユーザーは商品タグをタップした後、購入前にプロフィールを確認します。「誰が売っているか」「信頼できるか」を判断する場所がプロフィールです。ブランド名・何を売っているか・連絡方法・実績や受賞歴がひと目でわかる設計にしておくことが、離脱を防ぐ基本です。</p>

<h3>③DMで不安を解消して購入につなげる</h3>
<p>価格帯が高い商品や、サイズ・素材などに不安が生じやすい商品は、購入前にDMで問い合わせが入ります。このDM対応のスピードと質が、購入率に直接影響します。返信が遅い・情報が不足しているだけで、購入意欲があった顧客を逃します。</p>

<h2>おすすめ表示に載る投稿設計</h2>
<p>Instagramの「発見タブ」や「ショッピングタブ」に表示されるかどうかは、アルゴリズムが自動的に判定します。掲載される投稿には一定の共通点があります。</p>

<h3>おすすめ表示される投稿の共通点</h3>
<ul>
<li>視聴完了率・保存数・シェア数が高い（エンゲージメントの質）</li>
<li>投稿テーマがアカウント全体のジャンルと一致している</li>
<li>商品タグが適切に付いており、商品情報が整備されている</li>
<li>オリジナルコンテンツであり、他からの転載でない</li>
<li>キャプションに自然なキーワードが含まれている</li>
</ul>
<p>アルゴリズムの詳細な評価シグナルについては<a href="/blog/instagram-algorithm-latest-complete-guide/" target="_blank">Instagramアルゴリズム完全ガイド</a>で体系的に解説しています。</p>

<h3>タグの数と位置の最適化</h3>
<p>1投稿に付けられる商品タグの上限は5つです。複数タグを付けることは可能ですが、画面が煩雑になり逆効果になるケースがあります。メインで訴求したい商品1〜2点に絞り、タグの位置を商品が映っている箇所に正確に重ねることが基本です。</p>

<blockquote><p><strong>⚠️ 注意</strong></p><p>商品タグを付けすぎると、アルゴリズムが「宣伝的な投稿」と判定して表示を制限する場合があります。エンゲージメントを優先した投稿の中に、自然なかたちで商品タグを入れるのが基本的な考え方です。</p></blockquote>

<h2>Instagram検索で見つかるための対策</h2>
<p>Instagram内の検索は、キーワードでアカウントや投稿が発見されるもう一つの重要な経路です。特にアカウント名・プロフィール文に含まれるキーワードは、Instagram内検索の順位に影響します。</p>

<h3>プロフィールのキーワード設計</h3>
<p>Instagram内検索で上位に表示されやすいアカウントは、「アカウント名」と「プロフィール（自己紹介文）」に検索されるキーワードが含まれています。たとえば「大阪のセレクトショップ」「オーガニックコスメ」など、ユーザーが検索しそうな言葉をプロフィールに自然に入れておくことが基本的な対策です。</p>

<h3>キャプションとハッシュタグの役割分担</h3>
<p>キャプションは投稿のテーマと関連キーワードを自然文で書く場所です。ハッシュタグは発見タブへの補助的なエントリーポイントとして機能しますが、2026年現在は3〜5個に絞るのがベストプラクティスです。ハッシュタグの最新ルールは<a href="/blog/instagram-hashtag-5-limit-2025/" target="_blank">ハッシュタグ5個制限と対策</a>で確認してください。</p>

<h3>ALTテキストの設定</h3>
<p>Instagramの投稿には「ALTテキスト（代替テキスト）」を設定できます。これは視覚障がい者向けの説明文ですが、同時にInstagramの検索インデックスにも影響します。詳細設定から手動で設定することで、自動生成より精度の高い説明文を入れられます。</p>

<h2>DMから購入につなげる対応フロー</h2>
<p>DM対応は「返信が早い・情報が正確・次のアクションが明確」の3条件が揃って初めて購入につながります。後回しにされがちですが、購入直前のユーザーと接点を持てる最後の機会です。</p>

<h3>DM対応の基本フロー</h3>
<ol>
<li>初回受信から1時間以内に返信（営業時間内）</li>
<li>質問内容を確認し、必要情報を過不足なく回答</li>
<li>回答の最後に「他に気になる点はありますか？」と次の会話を促す</li>
<li>購入意欲が高そうであれば、商品ページのURLを案内</li>
<li>購入後はサンクスメッセージ＋レビュー誘導</li>
</ol>

<h3>よく使うDM返信テンプレート例</h3>
<table>
<tr><th>シーン</th><th>返信例</th></tr>
<tr><td>在庫確認</td><td>「ご質問ありがとうございます。〇〇（カラー・サイズ）は現在在庫ございます。よろしければこちらからご購入いただけます。→（URL）」</td></tr>
<tr><td>納期確認</td><td>「ご注文から通常3〜5営業日以内に発送しております。お急ぎの場合はお知らせください。」</td></tr>
<tr><td>営業時間外</td><td>「メッセージありがとうございます。現在対応時間外のため、翌営業日（〇時〜）にご返信いたします。」</td></tr>
<tr><td>サイズ相談</td><td>「ご身長・ご体重または普段お召しのサイズをお聞かせいただけますか？合うサイズをご提案します。」</td></tr>
</table>
<p>テンプレートを使う際も、冒頭にお客様の名前や質問内容を反映したひと言を入れると、機械的な印象を避けられます。投稿作成・返信文の効率化については<a href="/blog/instagram-profile-strategy-2025/" target="_blank">インスタプロフィール戦略</a>も参考にしてください。</p>

${CTA_MID}

<h2>よくある失敗と対処法</h2>
<p>設定はできているのに成果が出ない場合、多くはいくつかのパターンのどれかに当てはまります。当てはまる項目がないか確認してください。</p>

<h3>Instagramショッピングで売れない3つの原因</h3>
<table>
<tr><th>失敗パターン</th><th>具体的な症状</th><th>対処法</th></tr>
<tr><td>プロフィールの情報不足</td><td>訪問してもブランドや商品が伝わらない</td><td>何を売っているか・誰向けか・購入方法を1行で明示する</td></tr>
<tr><td>商品タグの乱用</td><td>1投稿に多数のタグを付けてエンゲージが下がっている</td><td>タグは1〜2点に絞りメイン商品に集中させる</td></tr>
<tr><td>DM返信の遅さ・曖昧さ</td><td>問い合わせが来ても購入に至らない</td><td>1時間以内返信・必要情報を明確に・URLで次のアクションを案内</td></tr>
</table>

<h3>その他よくある失敗</h3>
<ul>
<li>商品ページのURLが切れている、または商品情報と一致していない</li>
<li>投稿のジャンルがブレており、アルゴリズムにカテゴリが認識されない</li>
<li>ストーリーズのリンクスタンプを活用していない（フォロワーへの再訴求機会を逃している）</li>
<li>カタログの商品情報が古く、在庫切れや価格差異が生じている</li>
</ul>

<h2>自社運用が向いているケース・代行相談が向いているケース</h2>
<p>Instagramショッピングを自社で運用するか、専門事業者に依頼するかは、リソースと目標によって変わります。「どちらが正解か」ではなく、「今の状況にどちらが合っているか」が判断の軸です。</p>

<h3>自社運用が向いているケース</h3>
<ul>
<li>担当者が週3〜5時間以上の運用時間を確保できる</li>
<li>ブランドの世界観やストーリーを自分たちで発信したい</li>
<li>商品数が少なく、投稿・DM対応・分析がシンプルにまとまる</li>
<li>すでにある程度の投稿実績があり、方向性を微調整したい段階にある</li>
</ul>

<h3>代行相談が向いているケース</h3>
<ul>
<li>運用担当者がいない、または兼務で手が回っていない</li>
<li>投稿を続けているが数字が全く動かない状態が3ヶ月以上続いている</li>
<li>設定は完了しているが、何を改善すべきかわからない</li>
<li>新商品・シーズン施策に合わせて短期間で成果を出す必要がある</li>
</ul>
<p>COCOマーケのInstagram運用代行は、アカウント設計・投稿管理・エンゲージメント対応・インサイト分析・改善提案を一貫して担当します。フォロワー数や売上規模を問わず、現状の課題からスタートする無料相談をお気軽にご利用ください。アカウント全体のフォロワー獲得戦略については<a href="/blog/instagram-follower-methods/" target="_blank">インスタフォロワーを増やす方法</a>もあわせて確認してください。</p>

<h2>よくある質問（FAQ）</h2>

<h3>Q1. Instagramショッピングとは何ですか？</h3>
<p>Instagram上で商品タグを使い、ECサイトの購入ページへ直接誘導できる機能です。フィード・リール・ストーリーズ・発見タブなど複数の接点で商品を見せられるため、認知から購入までをInstagram内でほぼ完結させられます。</p>

<h3>Q2. Instagramショッピングを始めるには何が必要ですか？</h3>
<p>最低限必要なのは「ECサイト（商品ページ）」「プロアカウント」「Metaコマースポリシーに適合した商品」の3つです。加えてドメイン確認・Facebookページ連携・商品カタログの整備が必要で、審査通過後に機能が有効になります。</p>

<h3>Q3. Instagramショッピングができない原因は何ですか？</h3>
<p>最も多い原因はドメイン未確認と商品情報の不備です。次いで商品カテゴリがMetaのコマースポリシーに抵触しているケースが多く見られます。審査が通らない場合は、Meta Business Managerの「サポート」からエラー内容を確認することが先決です。</p>

<h3>Q4. Instagramショッピングは個人でも使えますか？</h3>
<p>使えます。ただし商品を販売するためのECサイト（またはBASE・STORESなどのプラットフォーム）が必要です。個人のハンドメイド作家やフリーランスのクリエイターでも、販売ページとプロアカウントがあれば開設できます。</p>

<h3>Q5. Instagram検索で見つかれないのはなぜですか？</h3>
<p>アカウント名とプロフィール文にユーザーが検索するキーワードが含まれていないことが主な原因です。Instagram内検索はプロフィールのテキスト情報を参照するため、「何を売っているか」を明示するキーワードをプロフィールに入れることが基本的な対策です。</p>

<h3>Q6. ハッシュタグとプロフィール名はどちらが検索に重要ですか？</h3>
<p>検索での発見に限れば、プロフィール名・アカウント名の方が重要です。ハッシュタグは発見タブへの補助的な経路ですが、アルゴリズムの変化により2026年現在の影響力は以前より低下しています。まずプロフィールを整備し、ハッシュタグは3〜5個に絞るのが現在のベストプラクティスです。</p>

<h3>Q7. DM対応はどれくらい早く返すべきですか？</h3>
<p>営業時間内であれば1時間以内が目安です。購入直前に不安を感じて問い合わせているユーザーは、返信が遅いだけで他のサービスや店舗に流れます。営業時間外の自動返信設定も、Metaビジネスツールから設定できます。</p>

<h3>Q8. Instagram販売は自社運用と代行のどちらが向いていますか？</h3>
<p>週3〜5時間の運用時間を確保できるなら自社運用から始めることをおすすめします。担当者がいない・成果が出ない状態が続いている・短期間で成果が必要という場合は、専門事業者への相談が現実的な選択肢です。まず現状の課題を整理してから判断することが重要で、無料相談でその判断をサポートしています。</p>

<h2>まとめ</h2>
<p>Instagramショッピングで売上を作るために押さえるべき要点を整理します。</p>
<ul>
<li>開設前に条件（ECサイト・プロアカウント・ドメイン確認・商品整備）をすべて確認する</li>
<li>発見→興味→信頼→購入の導線を「投稿・プロフィール・商品タグ・DM」の4点で設計する</li>
<li>おすすめ表示は投稿の質（視聴完了率・保存・シェア）とジャンルの一貫性で決まる</li>
<li>Instagram検索への対策はプロフィール文のキーワード設計が起点</li>
<li>DM対応は1時間以内・情報明確・次のアクション案内の3点セットで購入率が変わる</li>
<li>商品タグの付けすぎ・プロフィールの情報不足・DM返信の遅さが売れない主な原因</li>
<li>自社運用か代行かは「時間があるか」「成果が出ているか」の2軸で判断する</li>
</ul>`;

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Pexels写真取得・アップロード...');
  let img1 = '', img2 = '';
  try {
    const p1 = await uploadPhoto(await fetchPexels('online shopping smartphone ecommerce purchase', 1), 'shopping-guide-1.jpg');
    img1 = `<figure><img src="${p1.url}" alt="${p1.alt}" loading="lazy"><figcaption>Photo by ${p1.credit} / Pexels</figcaption></figure>`;
    console.log('  P1:', p1.url);
  } catch(e) { console.log('  P1失敗:', e.message); }
  await new Promise(r => setTimeout(r, 1000));
  try {
    const p2 = await uploadPhoto(await fetchPexels('instagram social media business marketing strategy', 2), 'shopping-guide-2.jpg');
    img2 = `<figure><img src="${p2.url}" alt="${p2.alt}" loading="lazy"><figcaption>Photo by ${p2.credit} / Pexels</figcaption></figure>`;
    console.log('  P2:', p2.url);
  } catch(e) { console.log('  P2失敗:', e.message); }

  // 画像挿入（H2の1/3と2/3位置）
  const positions = [...BODY.matchAll(/<h2/gi)].map(m => m.index);
  const p1idx = positions[Math.floor(positions.length / 3)];
  const p2idx = positions[Math.floor(positions.length * 2 / 3)];
  let body = BODY;
  if (img1 && img2 && p1idx !== p2idx) {
    body = body.slice(0, p1idx) + img1 + '\n' + body.slice(p1idx, p2idx) + img2 + '\n' + body.slice(p2idx);
  }

  // H2 ID付与
  const h2s = extractH2s(body);
  console.log(`\nH2 ${h2s.length}個:`, h2s);
  const bodyWithIds = makeH2Ids(body, h2s);

  // CTAをまとめ直前に追加（bodyWithIdsの末尾・まとめH2の前）
  const summaryH2 = bodyWithIds.lastIndexOf('<h2');
  const bodyWithFinalCta = bodyWithIds.slice(0, summaryH2) + CTA_END + '\n' + bodyWithIds.slice(summaryH2);

  // わかること + 目次 + body
  const wakaruBox = makeWakaruBox(h2s);
  const toc = makeToc(h2s);
  const finalContent = [wakaruBox, toc, bodyWithFinalCta].filter(Boolean).join('\n\n');

  const charCount = finalContent.replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
  console.log(`\n文字数: ${charCount}字`);

  // タイトルとコンテンツをPATCH
  console.log('microCMS PATCH中...');
  const res = await fetch(`https://${MICROCMS_DOMAIN}.microcms.io/api/v1/blogs/${ARTICLE_ID}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': MICROCMS_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: NEW_TITLE, content: finalContent }),
  });
  console.log(`PATCH: ${res.status} ${res.ok ? '✅' : '❌'}`);
  if (!res.ok) console.error(await res.text());
  else console.log('完了: https://www.cocomarke.com/blog/instagram-sales-guide-recommend-dm-search/');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
