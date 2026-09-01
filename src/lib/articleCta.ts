/**
 * articleCta.ts — 主要流入記事の記事末「島（テーマ）別CTA」＋ミニCTA
 * 島①制作系 / 島②チーム系 / 島③拡散系 / 島④トラブル系
 * 当面は slug ベースでマッピング（将来は microCMS の island フィールドへ移行）。
 */

const DL = 'https://www.cocomake-guide.com/download?documentId=';
const DIAGNOSIS = 'https://www.cocomake-guide.com/analysis';

export type Island = 'story' | 'team' | 'spread' | 'trouble';

// 記事末CTAの主対象（タスク①の9記事）
const EXPLICIT_ISLAND: Record<string, Island> = {
  // 島① 制作系
  'how-to-add-original-audio-to-instagram-stories': 'story',
  'sns-image-size-guide-2026': 'story',
  'instagram-live-how-to-guide-2026': 'story',
  // 島② チーム系
  'instagram-account-multiple-users-share-2025-safe': 'team',
  // 島③ 拡散系
  'instagram-collab-post-guide-2025': 'spread',
  'instagram-hashtag-5-limit-2025': 'spread',
  'instagram-mention-how-to': 'spread',
  // 島④ トラブル系
  'instagram-dm-troubleshooting-guide': 'trouble',
  'instagram-like-limit-account-suspension': 'trouble',
};

interface IslandConfig {
  mode: 'doc' | 'diagnose';
  url: string;
  eyebrow: string;
  heading: string;
  body: string;
  badge: string;
  itemTitle: string;
  itemNote: string;
  btn: string;
  contact: string;        // 末尾の小さな問い合わせ導線の前置き
  miniText: string;
  miniBtn: string;
}

const ISLAND: Record<Island, IslandConfig> = {
  story: {
    mode: 'doc',
    url: DL + '76d757e7-21db-4c17-8a03-0a12e4e8587b',
    eyebrow: 'ストーリーをもっと活用したい方へ',
    heading: '音源やスタンプの「次の一手」、制作のコツをまとめて知りませんか？',
    body: '音源やスタンプの追加は、土台となる投稿設計があってこそ活きます。伸びるアカウントの「土台構築」と「コンテンツ最適化」のノウハウを1冊にまとめました。',
    badge: '無料ダウンロード',
    itemTitle: '【基礎・制作編】土台構築＆コンテンツ最適化ガイド',
    itemNote: 'メールアドレスだけで今すぐ受け取れます',
    btn: '資料を受け取る',
    contact: '本格的に運用を任せたい方は',
    miniText: '📄 投稿制作のコツをまとめた無料資料があります',
    miniBtn: '受け取る',
  },
  team: {
    mode: 'doc',
    url: DL + '3092f22b-1623-49be-90c7-d4350878c517',
    eyebrow: 'チーム・複数人で運用している方へ',
    heading: '担当者によって投稿の判断がバラついていませんか？',
    body: '複数人運用でブレがちなのが「何を基準に投稿するか」です。チーム全員が同じものさしを持てるよう、最新のアルゴリズム傾向と運用判断のポイントをまとめました。',
    badge: '無料ダウンロード',
    itemTitle: 'Instagramアルゴリズム攻略ガイド 2026',
    itemNote: 'メールアドレスだけで今すぐ受け取れます',
    btn: '資料を受け取る',
    contact: '社内運用の負担を減らしたい方は',
    miniText: '📄 チームの運用判断を揃える無料ガイドがあります',
    miniBtn: '受け取る',
  },
  spread: {
    mode: 'doc',
    url: DL + '05682e59-978c-4d17-9b57-dec55d9bab00',
    eyebrow: 'リーチをもっと広げたい方へ',
    heading: 'コラボ投稿のリーチを、「拡散」と「保存」につなげるには？',
    body: 'コラボ投稿はリーチ拡大の第一歩。そこからさらに広げ、保存・エンゲージメントを高めるための拡散・運用ノウハウを実践的にまとめました。',
    badge: '無料ダウンロード',
    itemTitle: '【拡散・運用編】アルゴリズム攻略＆エンゲージメント強化ガイド',
    itemNote: 'メールアドレスだけで今すぐ受け取れます',
    btn: '資料を受け取る',
    contact: '成果が出る運用を相談したい方は',
    miniText: '📄 拡散・保存につなげる無料ガイドがあります',
    miniBtn: '受け取る',
  },
  trouble: {
    mode: 'diagnose',
    url: DIAGNOSIS,
    eyebrow: 'アカウントの不調が気になる方へ',
    heading: 'そのトラブル、アカウントからの「サイン」かもしれません',
    body: 'DMやいいねの不調は、アカウント全体の状態が原因のことがあります。まずは現状を無料で診断し、原因と次の打ち手を整理しませんか。',
    badge: '1分で無料診断',
    itemTitle: 'アカウント無料診断｜伸びない原因をチェック',
    itemNote: '簡単30秒・その場で結果がわかります',
    btn: '無料診断する',
    contact: '運用ごと相談したい方は',
    miniText: '🔍 アカウントの不調、無料診断で原因をチェックできます',
    miniBtn: '無料診断',
  },
};

// 島ごとの「おすすめ記事」代表セット（回遊用・記事末レーン）。定義順で優先表示。
export const ISLAND_RELATED: Record<Island, string[]> = {
  story: [
    'instagram-story-strategy-2025',
    'instagram-carousel-post-guide',
    'instagram-post-ideas-2025',
    'edits-how-to-2025-instagram-reels-save-post',
  ],
  team: [
    'instagram-account-multiple-users-share-2025-safe',
    'instagram-repost-complete-guide-2025',
    'instagram-insights-guide-2025',
    'how-to-create-instagram-business-account-benefits',
  ],
  spread: [
    'instagram-mention-how-to',
    'instagram-reels-saves-increase',
    'instagram-hashtag-5-limit-2025',
    'instagram-reels-tips-to-go-viral-2025',
  ],
  trouble: [
    'how-to-check-instagram-dm-without-marking-as-read',
    'instagram-like-limit-account-suspension',
    'instagram-account-freeze',
    'insta-identity-verification-fix',
  ],
};

// slug → 島：9記事（記事末CTA主対象）＋ おすすめ代表記事 をまとめてマッピング。
// これにより、おすすめ/最新で出る代表記事にも島に応じたCTAが表示される。
const SLUG_ISLAND: Record<string, Island> = { ...EXPLICIT_ISLAND };
for (const [isl, slugs] of Object.entries(ISLAND_RELATED) as [Island, string[]][]) {
  for (const s of slugs) if (!SLUG_ISLAND[s]) SLUG_ISLAND[s] = isl;
}

export function getIsland(slug: string | undefined): Island | null {
  return (slug && SLUG_ISLAND[slug]) || null;
}

const CONTACT_URL = 'https://www.cocomarke.com/contact/';

// 外部CTA(cocomake-guide)に流入分析用のUTMを付与する。
// 着地は別ドメインのため、UTMはcocomarke側のGA4アトリビューションを汚さない。
function withUtm(url: string, medium: string, campaign: string, content: string): string {
  const sep = url.includes('?') ? '&' : '?';
  const qs = `utm_source=cocomarke&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${encodeURIComponent(content)}`;
  return url + sep + qs;
}

// 記事末CTA（大きめのブロック）を出さない記事。
const NO_END_CTA = new Set<string>([
  'insta-identity-verification-fix',
]);

// 記事末CTA（資料DL or 無料診断を主役に、問い合わせは小さく添える）
export function articleEndCta(island: Island, slug = ''): string {
  if (NO_END_CTA.has(slug)) return '';
  const c = ISLAND[island];
  const url = withUtm(c.url, 'article_cta', island, slug || island);
  return (
    `<div class="cm-cta cm-cta--${island}">` +
      `<p class="cm-cta__eyebrow">${c.eyebrow}</p>` +
      `<p class="cm-cta__head">${c.heading}</p>` +
      `<p class="cm-cta__body">${c.body}</p>` +
      '<div class="cm-cta__row">' +
        '<div class="cm-cta__info">' +
          `<span class="cm-cta__badge">${c.badge}</span>` +
          `<p class="cm-cta__doctitle">${c.itemTitle}</p>` +
          `<p class="cm-cta__note">${c.itemNote}</p>` +
        '</div>' +
        `<a class="cm-cta__btn" href="${url}" target="_blank" rel="noopener noreferrer" data-ga="article_cta_click">${c.btn}</a>` +
      '</div>' +
      `<p class="cm-cta__contact">${c.contact} <a href="${CONTACT_URL}" data-ga="article_cta_contact">無料相談はこちら</a></p>` +
    '</div>'
  );
}

// 2つ目の本文段落末に置く軽量CTA（離脱前接触）
export function articleMiniCta(island: Island, slug = ''): string {
  const c = ISLAND[island];
  const url = withUtm(c.url, 'article_mini', island, slug || island);
  return (
    `<div class="cm-cta-mini cm-cta-mini--${island}">` +
      `<span class="cm-cta-mini__text">${c.miniText}</span>` +
      `<a class="cm-cta-mini__btn" href="${url}" target="_blank" rel="noopener noreferrer" data-ga="article_cta_mini">${c.miniBtn}</a>` +
    '</div>'
  );
}

// ミニCTA（本文2段落目のあとに入る細い帯）を出さない記事。
// 記事末CTAと文言が重なる等の理由で、個別に除外する。
const NO_MINI_CTA = new Set<string>([
  'insta-identity-verification-fix',
]);

// 本文2つ目の段落（<p>）の直後にミニCTAを挿入（離脱前接触・配置を統一）。
// わかること/目次（ul/ol）には <p> が無いため、自然と本文プロローグ後に入る。
export function injectMiniCta(body: string, island: Island, slug = ''): string {
  if (NO_MINI_CTA.has(slug)) return body;
  const mini = articleMiniCta(island, slug);
  const re = /<\/p>/g;
  let count = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    count++;
    if (count === 2) {
      const end = m.index + m[0].length;
      return body.slice(0, end) + mini + body.slice(end);
    }
  }
  // 段落が2つ未満なら最初の段落末、それも無ければ先頭
  re.lastIndex = 0;
  const first = re.exec(body);
  if (first) {
    const end = first.index + first[0].length;
    return body.slice(0, end) + mini + body.slice(end);
  }
  return mini + body;
}

// ── タイトル下サブワード（カテゴリーとは別軸・井桁テキスト） ────────────────
const SUBTAGS: { label: string; color: string; re: RegExp }[] = [
  { label: 'やり方',      color: '#185FA5', re: /やり方|の方法|使い方|手順|つけ方|作り方|出し方/ },
  { label: 'トラブル解決', color: '#085041', re: /凍結|シャドウバン|ログイン|制限|できない|解除|不具合|削除|消え|バレ|対処/ },
  { label: '伸ばす',      color: '#185FA5', re: /リール|フォロワー|エンゲージ|アルゴリズム|伸ば|バズ|再生回数|保存数|上位表示/ },
  { label: '集客・売上',   color: '#993C1D', re: /集客|来店|ショッピング|収益化|売上|販売|アフィリ|予約/ },
  { label: '基礎知識',     color: '#0C447C', re: /インスタとは|ビジネスアカウント|用語|始め方|入門/ },
  { label: '分析・改善',   color: '#6B21A8', re: /インサイト|分析|KPI/ },
  { label: '広告',        color: '#9A3412', re: /広告|費用相場|出稿/ },
  { label: '最新情報',     color: '#0F6E56', re: /アップデート|新機能|ニュース|大型/ },
];

// 記事のサブタグ（テーマ）ラベルを返す。関連記事のレコメンドにも使う。
export function subTagLabels(title: string, slug = ''): string[] {
  const hay = `${title} ${slug}`;
  return SUBTAGS.filter(t => t.re.test(hay)).map(t => t.label);
}

export function subTags(title: string, slug = ''): string {
  const hay = `${title} ${slug}`;
  const tags = SUBTAGS.filter(t => t.re.test(hay)).slice(0, 3);
  if (!tags.length) return '';
  const items = tags.map(t =>
    `<a class="cm-subtag" style="color:${t.color}" href="/blog?q=${encodeURIComponent(t.label)}">#${t.label}</a>`
  ).join('');
  return `<div class="cm-subtags">${items}</div>`;
}

// ── 著者ボックス（記事末・E-E-A-T。JSON-LD authorは別途schemaに既存） ────────
export function authorBox(): string {
  return (
    '<div class="cm-author">' +
      '<div class="cm-author__head">' +
        '<div class="cm-author__avatar"><img src="/images/coco-icon.png" alt="COCOマーケ"></div>' +
        '<div class="cm-author__meta">' +
          '<p class="cm-author__name">COCOマーケ編集部</p>' +
          '<p class="cm-author__role">Instagram運用代行 COCOマーケ（株式会社ホットセラー）</p>' +
        '</div>' +
      '</div>' +
      '<p class="cm-author__bio">3,000社のInstagram運用支援で蓄積したアルゴリズム解析データをもとに、「現場で成果の出る運用ノウハウ」を発信。発見・おすすめ表示の最適化を強みとし、飲食・美容・ブライダルなど幅広い業種の集客支援を行う。コンテンツとアカウントの上位設計を得意とする。</p>' +
      '<div class="cm-author__links">' +
        '<span class="cm-author__links-label">公式アカウント</span>' +
        '<a class="cm-author__sns" href="https://www.instagram.com/cocomarke_official_jp/" target="_blank" rel="noopener noreferrer" aria-label="COCOマーケ公式Instagram">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>' +
          '<span>@cocomarke_official_jp</span>' +
        '</a>' +
      '</div>' +
    '</div>'
  );
}

export const ARTICLE_CTA_CSS = `<style>
.cm-subtags{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 4px;}
.cm-subtag{font-size:13px;font-weight:700;text-decoration:none;}
.cm-subtag:hover{opacity:.7;}
.cm-author{background:#fff;border:1px solid #e3ecf7;border-radius:16px;padding:24px;margin:0;font-family:"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;}
.cm-author__head{display:flex;align-items:center;gap:16px;margin-bottom:16px;}
.cm-author__avatar{width:64px;height:64px;border-radius:50%;background:#eaf3ff;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.cm-author__avatar img{width:100%;height:100%;object-fit:contain;}
.cm-author__name{font-size:16px;font-weight:800;color:#11243a;margin:0 0 3px;}
.cm-author__role{font-size:13px;color:#6a7a8a;margin:0;}
.cm-author__bio{font-size:14px;line-height:1.85;color:#3a4a5a;margin:0 0 16px;}
.cm-author__links{border-top:1px solid #eef3f9;padding-top:14px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
.cm-author__links-label{font-size:12px;color:#9aa7b4;}
.cm-author__sns{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#185FA5;text-decoration:none;border:1px solid #e3ecf7;padding:6px 14px;border-radius:8px;transition:.2s;}
.cm-author__sns:hover{background:#f7faff;border-color:#B5D4F4;}
.cm-cta{background:#f7faff;border:1px solid #e3ecf7;border-radius:14px;padding:22px;margin:0;font-family:"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;}
.cm-cta__eyebrow{font-size:13px;font-weight:700;color:#185FA5;margin:0 0 6px;}
.cm-cta--trouble .cm-cta__eyebrow{color:#185FA5;}
.cm-cta__head{font-size:18px;font-weight:700;line-height:1.5;color:#11243a;margin:0 0 10px;}
.cm-cta__body{font-size:14px;line-height:1.85;color:#555;margin:0 0 16px;}
.cm-cta__row{display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border:1px solid #e3ecf7;border-radius:10px;padding:16px 18px;flex-wrap:wrap;}
.cm-cta__info{min-width:0;}
.cm-cta__badge{display:inline-block;background:#E6F1FB;color:#185FA5;font-size:12px;font-weight:700;padding:3px 10px;border-radius:6px;margin-bottom:6px;}
.cm-cta--trouble .cm-cta__badge{background:#E1F5EE;color:#0F6E56;}
.cm-cta__doctitle{font-size:15px;font-weight:700;line-height:1.5;color:#11243a;margin:0 0 3px;}
.cm-cta__note{font-size:13px;color:#6a7a8a;margin:0;}
.cm-cta__btn{display:inline-block;background:#185FA5;color:#fff !important;padding:13px 26px;border-radius:8px;font-weight:700;font-size:14px;white-space:nowrap;text-decoration:none !important;flex-shrink:0;}
.cm-cta__btn:hover{background:#0C447C;opacity:1;}
.cm-cta--trouble .cm-cta__btn{background:#0F6E56;}
.cm-cta--trouble .cm-cta__btn:hover{background:#085041;}
.cm-cta__contact{font-size:13px;color:#6a7a8a;margin:14px 0 0;text-align:center;}
.cm-cta__contact a{color:#185FA5;font-weight:700;text-decoration:underline;}
.cm-cta-mini{display:flex;align-items:center;justify-content:space-between;gap:12px;background:#EFF6FF;border:1px solid #BAE6FD;border-radius:10px;padding:10px 14px;margin:18px 0;flex-wrap:wrap;font-family:"Helvetica Neue",Arial,"Hiragino Kaku Gothic ProN","Noto Sans JP",sans-serif;}
.cm-cta-mini--trouble{background:#E1F5EE;border-color:#9FE1CB;}
.cm-cta-mini__text{font-size:13px;font-weight:700;color:#11243a;line-height:1.5;}
.cm-cta-mini__btn{display:inline-block;background:#185FA5;color:#fff !important;padding:8px 18px;border-radius:7px;font-weight:700;font-size:13px;white-space:nowrap;text-decoration:none !important;flex-shrink:0;}
.cm-cta-mini__btn:hover{background:#0C447C;opacity:1;}
.cm-cta-mini--trouble .cm-cta-mini__btn{background:#0F6E56;}
.cm-cta-mini--trouble .cm-cta-mini__btn:hover{background:#085041;}
@media(max-width:600px){
  .cm-cta__row{flex-direction:column;align-items:stretch;}
  .cm-cta__btn{text-align:center;}
}
</style>`;
