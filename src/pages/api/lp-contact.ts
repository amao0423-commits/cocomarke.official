import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendMetaLead } from '../../lib/metaCapi';

// Instagram運用代行LP（/lp/instagram）専用のお問い合わせ受付。
// フォーム: components/ContactForm.tsx（cocomarke.com版は同一オリジンでここへPOST）
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, string> = {};
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      data = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
    }
  } catch {
    return json({ success: false, error: 'bad_request' }, 400);
  }

  const {
    name = '', company = '', email = '', phone = '', industry = '',
    message = '', source = 'Instagram運用代行LP（/lp/instagram）', event_id = '', website = '',
  } = data ?? {};

  // --- スパム対策 ---------------------------------------------------------
  // 検知したらメールを送らず success:200 を返す（botに気付かせない）
  // ① ハニーポット（ボットは website を埋めがち）
  if (website) return json({ success: true });
  // ② 時間トラップ（_ts があり、表示から2.5秒未満の即時送信）＋ ③ 内容検知
  const tsNum = Number((data as Record<string, string>)._ts ?? '');
  const elapsed = Number.isFinite(tsNum) && tsNum > 0 ? Date.now() - tsNum : null;
  const msgUrlCount = (String(message).match(/https?:\/\//gi) ?? []).length;
  const hasLinkMarkup = /\[url|\[\/url\]|\[link|<a\s|href\s*=/i.test(`${message} ${company}`);
  const nameHasUrl = /https?:\/\/|www\./i.test(String(name));
  const spamReason =
    (elapsed !== null && elapsed < 2500) ? 'too_fast'
    : msgUrlCount >= 3 ? 'url_flood'
    : hasLinkMarkup ? 'link_markup'
    : nameHasUrl ? 'url_in_name'
    : '';
  if (spamReason) {
    console.warn('[lp-contact] spam blocked:', spamReason, { elapsed, msgUrlCount });
    return json({ success: true });
  }
  // ------------------------------------------------------------------------

  if (!name || !email || !message) {
    return json({ success: false, error: '必須項目をご入力ください。' }, 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ success: false, error: 'メールアドレスの形式が正しくありません。' }, 400);
  }

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('lp-contact: RESEND_API_KEY not set');
    return json({ success: false, error: 'メール送信の設定が未完了です。管理者にお問い合わせください。' }, 500);
  }

  const receivedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const adminBody = [
    'Instagram運用代行LP からお問い合わせがありました。',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `■ 流入元：${source}`,
    `■ お名前：${name}`,
    `■ 会社・店舗名：${company || '（未入力）'}`,
    `■ メールアドレス：${email}`,
    `■ 電話番号：${phone || '（未入力）'}`,
    `■ 業種：${industry || '（未入力）'}`,
    '■ お問い合わせ内容：',
    String(message),
    '━━━━━━━━━━━━━━━━━━━━━━',
    `受信日時：${receivedAt}`,
  ].join('\n');

  try {
    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: 'info@cocomake-guide.com',
      replyTo: email,
      subject: `<LP経由お問い合わせ> ${name} 様（Instagram運用代行LP）`,
      text: adminBody,
    });

    // Meta CAPI（サーバー側でLeadを計測。失敗してもフォーム送信は成功扱い）
    try {
      await sendMetaLead({
        request,
        eventId: event_id,
        email,
        phone,
        eventSourceUrl: 'https://www.cocomarke.com/lp/instagram',
      });
    } catch (e) {
      console.error('lp-contact: sendMetaLead failed', e);
    }

    return json({ success: true });
  } catch (e) {
    console.error('lp-contact: send failed', e);
    return json({ success: false, error: '送信に失敗しました。時間をおいて再度お試しください。' }, 500);
  }
};
