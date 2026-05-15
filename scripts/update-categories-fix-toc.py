"""
microCMS 記事一括更新スクリプト
- カテゴリーを設定
- 目次リンクのアンカーIDを修正
"""

import json
import re
import time
from urllib.request import urlopen, Request
from urllib.error import HTTPError

import sys

API_KEY = sys.argv[1] if len(sys.argv) > 1 else "qkw2TEC77QumO0EIJnS1wp0FtMlXQQuelmY5"
BASE_URL = "https://cocomarke.microcms.io/api/v1/blogs"

# ── カテゴリーマッピング ──────────────────────────────
CATEGORY_MAP = {
    # 検索対策
    "insta-search-keyword-strategy-growth":       "検索対策",
    "how-to-get-on-instagram-top-posts-tips":     "検索対策",
    "instagram-search-ranking-strategy":          "検索対策",
    "instagram-seo-marketing":                    "検索対策",
    "what-is-seo-search-engine-optimization":     "検索対策",
    "instagram-hashtag-5-limit-2025":             "検索対策",

    # SNS戦略
    "psychological-techniques-to-boost-conversion-rate": "SNS戦略",
    "instagram-profile-strategy-2025":            "SNS戦略",
    "instagram-algorithm-latest-complete-guide":  "SNS戦略",
    "marketing-strategies-list-how-to-choose":    "SNS戦略",
    "instagram-marketing-strategies-pros-cons":   "SNS戦略",
    "how-to-use-sns-for-business-success":        "SNS戦略",
    "instagram-story-strategy-2025":              "SNS戦略",
    "instagram-reels-views-not-increasing-7-reasons": "SNS戦略",
    "content-marketing-strategy-examples-benefits": "SNS戦略",
    "what-is-4p-marketing-mix-analysis":          "SNS戦略",
    "instagram-reels-tips-to-go-viral-2025":      "SNS戦略",
    "instagram-pros-cons-marketing-managers":     "SNS戦略",
    "instagram-broadcast-channel-how-to-guide":   "SNS戦略",

    # 運用の基本
    "edits-how-to-2025-instagram-reels-save-post":       "運用の基本",
    "instagram-account-freeze":                          "運用の基本",
    "instagram-like-limit-account-suspension":           "運用の基本",
    "why-instagram-image-quality-drops-and-how-to-fix":  "運用の基本",
    "instagram-post-ideas-2025":                         "運用の基本",
    "chatgpt-instagram-caption-tips-prompts":            "運用の基本",
    "insta-identity-verification-fix":                   "運用の基本",
    "instagram-repost-complete-guide-2025":              "運用の基本",
    "how-to-add-original-audio-to-instagram-stories":    "運用の基本",
    "instagram-insights-guide-2025":                     "運用の基本",
    "how-to-use-instagram-on-pc-web-version":            "運用の基本",
    "instagram-account-multiple-users-share-2025-safe":  "運用の基本",
    "instagram-viewing-history-and-watch-only-guide":    "運用の基本",
    "instagram-collab-post-guide-2025":                  "運用の基本",
    "how-to-create-instagram-business-account-benefits": "運用の基本",
    "insta-profile-share-method-merit":                  "運用の基本",
    "how-to-save-instagram-photos-videos":               "運用の基本",
    "instagram-mention-how-to":                          "運用の基本",
    "instagram-account-deletion-2026":                   "運用の基本",
    "instagram-live-how-to-guide-2026":                  "運用の基本",
    "instagram-feed-size-1080x1440-update":              "運用の基本",
    "instagram-icon-commercial-use-download-rules":      "運用の基本",
    "insta-liked-posts-history-fix-2026":                "運用の基本",
    "instagram-dm-troubleshooting-guide":                "運用の基本",
    "instagram-poll-how-to-fix-delete-results":          "運用の基本",
    "how-to-check-instagram-dm-without-marking-as-read": "運用の基本",
    "instagram-plus-complete-guide-features-pricing":    "運用の基本",
    "instagram-analysis-tools-recommended":              "運用の基本",

    # 活用事例
    "insta-salon-marketing-booking-guide":        "活用事例",
    "restaurant-instagram-promotion":             "活用事例",
    "top-sns-platforms-success-examples":         "活用事例",
    "restaurant-instagram-marketing-google-maps-2026": "活用事例",
    "insta-influencer-marketing-guide":           "活用事例",

    # 最新情報
    "instagram-2025-strategy-new-features-algorithm":    "最新情報",
    "ai-marketing-merits-cases":                         "最新情報",
    "instagram-highlight-update-2025-marketing-strategy": "最新情報",

    # 集客
    "ppc-advertising-beginners-success-guide":        "集客",
    "instagram-sales-guide-recommend-dm-search":      "集客",
    "instagram-monetization-guide-2025":              "集客",
    "instagram-management-service-cost-benefits":     "集客",
    "facebook-ads-guide-how-to-start":                "集客",
    "instagram-monetization-complete-guide":          "集客",
    "instagram-ads-cost-strategy-2025-trends-success": "集客",
    "instagram-follower-methods":                     "集客",
    "instagram-outsourcing-success":                  "集客",
    "free-instagram-account-check":                   "集客",
    "instagram-ads-guide-cost-how-to-run-beginners":  "集客",
    "instagram-management-agency-comparison":          "集客",
    "affiliate-marketing-basics-explained":           "集客",
}

def api_get(path):
    req = Request(f"{BASE_URL}/{path}", headers={"X-MICROCMS-API-KEY": API_KEY})
    with urlopen(req) as r:
        return json.load(r)

def api_patch(content_id, data):
    body = json.dumps(data).encode()
    req = Request(
        f"{BASE_URL}/{content_id}",
        data=body,
        method="PATCH",
        headers={"X-MICROCMS-API-KEY": API_KEY, "Content-Type": "application/json"},
    )
    try:
        with urlopen(req) as r:
            return r.status, ""
    except HTTPError as e:
        return e.code, e.read().decode()

def fix_toc_links(content):
    """
    目次の <ol> または <ul> 内にある href="#viewer-..." リンクのアンカーIDと
    実際の見出し (h2/h3) の id 属性を一致させる。
    見出しIDを TOC リンクのアンカーIDに書き換える。
    """
    if not content:
        return content, False

    # TOC リストを探す（viewer- 系アンカーを含む ol/ul ブロック）
    toc_block = re.search(r'<(?:ol|ul)[^>]*>(.*?)</(?:ol|ul)>', content, re.DOTALL)
    if not toc_block:
        return content, False

    toc_anchors = re.findall(r'href="#(viewer-[^"]+)"', toc_block.group(1))
    if not toc_anchors:
        return content, False

    # TOC ブロック終了位置より後ろの見出し要素を順番に取得
    after_toc_start = toc_block.end()
    after_toc = content[after_toc_start:]

    heading_iter = re.finditer(r'(<h[23]\s[^>]*id=")([^"]+)(")', after_toc)
    heading_matches = list(heading_iter)

    if not heading_matches:
        return content, False

    changed = False
    # TOC アンカー数と見出し数の少ない方にあわせてペアリング
    for anchor, match in zip(toc_anchors, heading_matches):
        old_id = match.group(2)
        if old_id != anchor:
            after_toc = after_toc.replace(f'id="{old_id}"', f'id="{anchor}"', 1)
            changed = True

    if changed:
        content = content[:after_toc_start] + after_toc

    return content, changed

def main():
    data = api_get("?limit=100&fields=id,title,content,day")
    articles = data["contents"]
    print(f"対象記事: {len(articles)} 件\n")

    ok = []
    failed = []

    for i, art in enumerate(articles):
        art_id = art["id"]
        title = art.get("title", "")
        content = art.get("content", "") or ""
        day = art.get("day")

        cat = CATEGORY_MAP.get(art_id)
        fixed_content, toc_changed = fix_toc_links(content)

        label = []
        if cat:
            label.append(f"カテゴリ→{cat}")
        if toc_changed:
            label.append("目次ID修正")
        if not cat and not toc_changed:
            print(f"[{i+1:2}/{len(articles)}] {art_id[:50]} … スキップ（変更なし）")
            continue

        print(f"[{i+1:2}/{len(articles)}] {art_id[:50]}")
        print(f"         {', '.join(label)}")

        # PUT は全フィールドを含める必要がある
        put_data = {"title": title, "content": fixed_content if toc_changed else content}
        if cat:
            put_data["category"] = cat
        if day:
            put_data["day"] = day

        status, err = api_patch(art_id, put_data)
        if status in (200, 201, 204):
            print(f"         ✅ OK")
            ok.append(art_id)
        else:
            print(f"         ❌ HTTP {status}: {err[:120]}")
            failed.append((art_id, err[:120]))

        time.sleep(0.6)

    print(f"\n── 完了 ──")
    print(f"成功: {len(ok)} 件")
    print(f"失敗: {len(failed)} 件")
    for fid, ferr in failed:
        print(f"  {fid}: {ferr}")

if __name__ == "__main__":
    main()
