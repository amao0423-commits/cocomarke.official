import { createClient } from 'microcms-js-sdk';

export const client = createClient({
  serviceDomain: 'cocomarke',
  apiKey: import.meta.env.MICROCMS_API_KEY,
  customRequestInit: { cache: 'no-store' },
});

// ---- Raw API types (microCMS field IDs as keys) ----

type RawNews = {
  id: string;
  title?: string;
  day?: string;
  content?: string;
  publishedAt: string;
};

type RawFaq = {
  id: string;
  title?: string;
  content?: string;
  publishedAt: string;
};

type RawBlog = {
  id: string;
  title?: string;
  content?: string;
  eyecatch?: { url: string; width?: number; height?: number; alt?: string };
  category?: { name: string } | string;
  day?: string;
  // 任意フィールド。microCMS側に日付フィールド updatedDate を追加すると、
  // 編集者が「更新日」を明示的に指定できる（未設定なら updatedAt を使う）。
  updatedDate?: string;
  publishedAt: string;
  updatedAt: string;
};

// ---- Clean types ----

export type News = {
  id: string;
  title: string;
  content?: string;
  day?: string;
  publishedAt: string;
};

export type Faq = {
  id: string;
  question: string;
  answer: string;
};

export type Blog = {
  id: string;
  title: string;
  content?: string;
  eyecatch?: { url: string; width?: number; height?: number };
  category?: { name: string } | string;
  body?: string;
  day?: string;
  updatedDate?: string;
  publishedAt: string;
  updatedAt: string;
};

// ---- Mappers ----

export function mapNews(raw: RawNews): News {
  return {
    id: raw.id,
    title: raw.title ?? '',
    content: raw.content,
    day: raw.day,
    publishedAt: raw.publishedAt,
  };
}

export function mapFaq(raw: RawFaq): Faq {
  return {
    id: raw.id,
    question: raw.title ?? '',
    answer: raw.content ?? '',
  };
}

export function mapBlog(raw: RawBlog): Blog {
  return {
    id: raw.id,
    title: raw.title ?? '',
    content: raw.content ? raw.content.replace(/<[^>]*>/g, '').slice(0, 200) : undefined,
    eyecatch: raw.eyecatch,
    category: raw.category,
    body: raw.content,
    day: raw.day,
    updatedDate: raw.updatedDate,
    publishedAt: raw.publishedAt,
    updatedAt: raw.updatedAt,
  };
}

// ---- Utilities ----

// 日付は必ず日本時間で表示する。
// microCMSは日時をUTCで返し、実行環境（Vercel）のTZもUTCのため、
// ローカル時刻で組み立てると「CMSで9/1と入力した記事が8/31と表示される」
// （JSTの0:00 = UTCの前日15:00）というズレが起きていた。
export function formatDate(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

// 構造化データ・サイトマップ用の YYYY-MM-DD。表示（formatDate）と同じく日本時間で切り出す。
// ISO文字列を単純に slice すると UTC 基準になり、JSTの0時指定が前日になってしまう。
export function isoDateJst(iso: string | undefined | null): string {
  if (!iso) return '';
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return d.toISOString().slice(0, 10);
}

// 記事一覧は必ず全件取得する。
// microCMSは1回のリクエストで最大100件しか返さないため、limit:100 のままだと
// 記事数が100を超えた時点で古い記事が一覧・カテゴリー件数・関連記事から漏れる。
// さらに、APIの絞り込みは publishedAt 順・画面の並びは day 順で基準が違うため、
// 「新しい投稿日の記事が一覧に出てこない」という形で表面化する。
const BLOG_LIST_FIELDS = 'id,title,day,publishedAt,eyecatch,category';

// 配信APIキーに「下書き全取得」権限が付いているため、配信APIは下書き・公開終了の
// 記事もそのまま返してしまう（＝CMSで下書きにしてもサイトに出る）。権限を外せないので、
// 管理APIから公開中のIDを取得して配信APIの結果を絞り込む。
// 管理APIが落ちている・レート制限にかかった場合は null を返し、絞り込みを行わない
// （記事一覧が丸ごと空になるほうが実害が大きいため、フェイルオープンにする）。
// closedAt は再公開後も値が残るため判定には使わず、status だけを見る。
export async function fetchPublishedBlogIds(): Promise<Set<string> | null> {
  try {
    const ids = new Set<string>();
    for (let offset = 0; ; offset += 100) {
      const res = await fetch(
        `https://cocomarke.microcms-management.io/api/v1/contents/blogs?limit=100&offset=${offset}`,
        { headers: { 'X-MICROCMS-API-KEY': import.meta.env.MICROCMS_API_KEY } },
      );
      if (!res.ok) return null;
      const json = await res.json();
      for (const c of json.contents ?? []) {
        if (Array.isArray(c.status) && c.status.includes('PUBLISH')) ids.add(c.id);
      }
      const seen = offset + (json.contents?.length ?? 0);
      if (seen >= (json.totalCount ?? 0) || !json.contents?.length) break;
    }
    return ids.size ? ids : null;
  } catch {
    return null;
  }
}

// 1記事だけ公開中かを管理APIで直接確認する。
// 一覧は10分キャッシュしているため、公開直後やスラッグ変更直後の記事は
// キャッシュに載っておらず「存在しない」と誤判定される。その取りこぼしを拾う用途。
// 判定できなかった場合は true（公開扱い）を返し、記事を開けなくしない。
export async function isBlogPublished(id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://cocomarke.microcms-management.io/api/v1/contents/blogs/${encodeURIComponent(id)}`,
      { headers: { 'X-MICROCMS-API-KEY': import.meta.env.MICROCMS_API_KEY } },
    );
    if (!res.ok) return true;
    const json = await res.json();
    return Array.isArray(json.status) ? json.status.includes('PUBLISH') : true;
  } catch {
    return true;
  }
}

export async function fetchAllBlogs(fields: string = BLOG_LIST_FIELDS): Promise<Blog[]> {
  const out: unknown[] = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList<any>({
      endpoint: 'blogs',
      queries: { limit: 100, offset, orders: '-publishedAt', fields },
    });
    out.push(...res.contents);
    if (out.length >= res.totalCount || !res.contents.length) break;
  }
  const published = await fetchPublishedBlogIds();
  const list = published ? (out as any[]).filter((c) => published.has(c.id)) : (out as any[]);
  return list.map(mapBlog);
}

// 一覧の並び順は「投稿日（day）の新しい順」に統一する。
// day が未設定の記事だけ publishedAt で代用する。
export function sortByPostDate(blogs: Blog[]): Blog[] {
  return [...blogs].sort((a, b) =>
    (b.day ?? b.publishedAt).localeCompare(a.day ?? a.publishedAt));
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---- In-memory cache ----
type Cache<T> = { data: T; at: number };
const TTL = 10 * 60 * 1000;

const _cache: Record<string, Cache<unknown>> = {};

export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].at < TTL) {
    return _cache[key].data as T;
  }
  const data = await fn();
  _cache[key] = { data, at: now };
  return data;
}
