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
  return (out as any[]).map(mapBlog);
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
