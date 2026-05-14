import { createClient } from 'microcms-js-sdk';

export const client = createClient({
  serviceDomain: 'cocomarke',
  apiKey: import.meta.env.MICROCMS_API_KEY,
});

// ---- Raw API types (microCMS field IDs as keys) ----

type RawNews = {
  id: string;
  'o4BqI-XqAN'?: string;
  'Ww95pBmMm_'?: string;
  '7Fn39Ufj8p'?: string;
  name?: string;
  publishedAt: string;
};

type RawFaq = {
  id: string;
  '_CFp2S-EBL'?: string;
  'JeorWP9LcJ'?: string;
  publishedAt: string;
};

type RawBlog = {
  id: string;
  'Dfh-RAEXhk'?: string;
  'hMY2e6Qbn5'?: string;
  'KQLMRsXR9K'?: { url: string; width?: number; height?: number };
  '_gMXTrzqYY'?: { name: string } | string;
  'aCv3n1gD5L'?: string;
  'gC18Q5qHix'?: string;
  publishedAt: string;
};

// ---- Clean types ----

export type News = {
  id: string;
  title: string;
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
  publishedAt: string;
};

// ---- Mappers ----

export function mapNews(raw: RawNews): News {
  return {
    id: raw.id,
    title: raw['Ww95pBmMm_'] ?? raw.name ?? '',
    day: raw['o4BqI-XqAN'],
    publishedAt: raw.publishedAt,
  };
}

export function mapFaq(raw: RawFaq): Faq {
  return {
    id: raw.id,
    question: raw['_CFp2S-EBL'] ?? '',
    answer: raw['JeorWP9LcJ'] ?? '',
  };
}

export function mapBlog(raw: RawBlog): Blog {
  return {
    id: raw.id,
    title: raw['Dfh-RAEXhk'] ?? '',
    content: raw['hMY2e6Qbn5'],
    eyecatch: raw['KQLMRsXR9K'],
    category: raw['_gMXTrzqYY'],
    body: raw['aCv3n1gD5L'],
    day: raw['gC18Q5qHix'],
    publishedAt: raw.publishedAt,
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
