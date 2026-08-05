// 問い合わせ後の自動返信（サンクス）メールに、期間限定で下部へ差し込む案内文。
// 対象期間：2026-08-08（土）～ 2026-08-16（日）JST の間に送信されるメールのみ。
// 令和8年熊本地震のお見舞いと、当該期間の返信遅延に関するご案内。

/** 送信時点（JST）が案内表示の対象期間内かどうか */
function isNoticePeriod(now: Date = new Date()): boolean {
  // サーバはUTC想定。+9時間してJSTの暦日を得る。
  const jst = new Date(now.getTime() + 9 * 3600 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1; // 1-12
  const d = jst.getUTCDate();
  return y === 2026 && m === 8 && d >= 8 && d <= 16;
}

// 本文（段落）。両テンプレート（div型・table型）で共用する。
const INNER =
  '<p style="margin:0 0 12px;">2026年7月28日に発生した令和8年熊本地震の被災者の方々へ心よりお見舞い申し上げます。<br>' +
  '現在も現地では予断を許さない状況が続いている中、皆様のご無事を心よりお祈りしております。</p>' +
  '<p style="margin:0 0 6px;color:#0C2B25;font-weight:700;">【ご連絡について】</p>' +
  '<p style="margin:0;">誠に勝手ながら、8月8日(土) ～ 8月16日(日)の期間は、通常よりご返信にお時間をいただく場合がございます。<br>' +
  'お問い合わせにつきましては順次対応いたしますが、ご連絡までにお時間を頂戴することがございますので、あらかじめご了承いただけますと幸いです。<br>' +
  'ご不便をおかけいたしますが、何卒よろしくお願い申し上げます。</p>';

/** div レイアウトのメール（beauty-contact）向け。対象期間外は空文字。 */
export function disasterNoticeDiv(now: Date = new Date()): string {
  if (!isNoticePeriod(now)) return '';
  return (
    '<div style="margin-top:22px;padding-top:16px;border-top:1px solid #E0E7DF;font-size:12.5px;line-height:1.9;color:#5C6F69;">' +
    INNER +
    '</div>'
  );
}

/** table レイアウトのメール（contact）向け。<tr> ごと返す。対象期間外は空文字。 */
export function disasterNoticeRow(now: Date = new Date()): string {
  if (!isNoticePeriod(now)) return '';
  return (
    '<tr><td style="padding:4px 32px 24px;">' +
    '<div style="padding:16px 18px;border:1px solid #e0eaf7;border-radius:8px;background:#f9fbff;font-size:12.5px;line-height:1.9;color:#555;">' +
    INNER +
    '</div></td></tr>'
  );
}
