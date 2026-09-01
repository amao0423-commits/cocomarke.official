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

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
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
