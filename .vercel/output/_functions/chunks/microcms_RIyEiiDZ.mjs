import { createClient } from 'microcms-js-sdk';

const client = createClient({
  serviceDomain: "cocomarke",
  apiKey: "qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5"
});
function mapNews(raw) {
  return {
    id: raw.id,
    title: raw["Ww95pBmMm_"] ?? raw.name ?? "",
    day: raw["o4BqI-XqAN"],
    publishedAt: raw.publishedAt
  };
}
function mapFaq(raw) {
  return {
    id: raw.id,
    question: raw["_CFp2S-EBL"] ?? "",
    answer: raw["JeorWP9LcJ"] ?? ""
  };
}
function mapBlog(raw) {
  return {
    id: raw.id,
    title: raw["Dfh-RAEXhk"] ?? "",
    content: raw["hMY2e6Qbn5"],
    eyecatch: raw["KQLMRsXR9K"],
    category: raw["_gMXTrzqYY"],
    body: raw["aCv3n1gD5L"],
    day: raw["gC18Q5qHix"],
    publishedAt: raw.publishedAt
  };
}
function formatDate(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
const TTL = 10 * 60 * 1e3;
const _cache = {};
async function cached(key, fn) {
  const now = Date.now();
  if (_cache[key] && now - _cache[key].at < TTL) {
    return _cache[key].data;
  }
  const data = await fn();
  _cache[key] = { data, at: now };
  return data;
}

export { cached as a, mapFaq as b, client as c, mapNews as d, escapeHtml as e, formatDate as f, mapBlog as m };
