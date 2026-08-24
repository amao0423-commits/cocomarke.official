import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendMetaLead } from '../../lib/metaCapi';
import { disasterNoticeRow } from '../../lib/disasterNotice';

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, string>;
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    data = await request.json();
  } else {
    const form = await request.formData();
    data = Object.fromEntries(
      [...form.entries()].map(([k, v]) => [k, String(v)])
    );
  }

  const {
    company = '', name = '', email = '', tel = '', industry = '', timing = '',
    utm_source = '', utm_medium = '', utm_campaign = '', utm_content = '', utm_term = '',
    gclid = '', referrer = '', landing_page = '', event_id = '',
  } = data;

  // --- スパム対策 ---------------------------------------------------------
  // contact.ts と同様の考え方。検知したら通知は送らず、静かに success:200 を返す。
  const honeypot = (data.website ?? '').trim();
  const tsNum = Number(data._ts ?? '');
  const elapsed = Number.isFinite(tsNum) && tsNum > 0 ? Date.now() - tsNum : null;
  const nameHasUrl = /https?:\/\/|www\./i.test(`${name} ${company}`);
  const spamReason =
    honeypot !== '' ? 'honeypot'
    : nameHasUrl ? 'url_in_name'
    : '';

  if (spamReason) {
    console.warn('[document-lead] spam blocked:', spamReason, { elapsed });
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  }
  // ------------------------------------------------------------------------

  // 必須チェック（電話・検討時期は任意）
  if (!company || !name || !email || !industry) {
    return new Response(JSON.stringify({ success: false, error: 'required' }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_email' }), { status: 400 });
  }

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'config' }), { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  const adminBody = [
    'COCOマーケ サービス資料のダウンロードがありました。',
    '',
    `■ 会社・屋号　　　：${company}`,
    `■ お名前　　　　　：${name}`,
    `■ メールアドレス　：${email}`,
    `■ お電話番号　　　：${tel}`,
    `■ 業種　　　　　　：${industry}`,
    `■ 検討時期　　　　：${timing}`,
    '',
    `■ 流入元　　　　　：${landing_page}`,
    `■ リファラー　　　：${referrer}`,
    `■ UTM　　　　　　：${[utm_source, utm_medium, utm_campaign, utm_content, utm_term].filter(Boolean).join(' / ')}`,
    `■ gclid　　　　　 ：${gclid}`,
  ].join('\n');

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const lStyle = 'font-size:12px;color:#888;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em;';
  const vStyle = 'font-size:15px;color:#333;margin:0 0 18px;word-break:break-all;';
  const allFields = [
    { label: '会社・屋号', value: company },
    { label: 'お名前', value: name },
    { label: 'メールアドレス', value: email },
    { label: 'お電話番号', value: tel },
    { label: '業種', value: industry },
    { label: '検討時期', value: timing },
  ].filter(f => f.value);

  const fieldsHtml = allFields
    .map(f => `<p style="${lStyle}">■ ${esc(f.label)}</p><p style="${vStyle}">${esc(f.value)}</p>`)
    .join('');

  const autoHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="format-detection" content="telephone=no,address=no,email=no">
</head>
<body style="margin:0;padding:0;background:#f5f9fe;font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f9fe;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">${esc(name)} 様</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.8;">
              サービス資料のご請求ありがとうございます。<br>
              以下の内容で受け付けました。資料は送信直後の画面からもご覧いただけます。
            </p>

            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f5f9fe;border-radius:8px;padding:20px 24px 4px;margin-bottom:24px;">
                  ${fieldsHtml}
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 4px;font-size:15px;color:#333;line-height:1.8;">
              資料の内容についてご不明点があれば、お気軽にお問い合わせください。
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-top:1px solid #e0eaf7;padding-top:20px;margin-top:16px;">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <strong>■ COCOマーケ公式サイト</strong><br>
                  <a href="https://www.cocomarke.com/" style="color:#005bea;text-decoration:none;">https://www.cocomarke.com/</a>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <strong>■ お役立ち情報</strong><br>
                  <a href="https://www.cocomarke.com/blog/" style="color:#005bea;text-decoration:none;">インスタグラム運用に関する情報はこちら</a>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 6px;font-size:14px;color:#333;">
                  <strong>■ ご相談・お問い合わせ</strong><br>
                  <a href="https://www.cocomarke.com/contact/" style="color:#005bea;text-decoration:none;">お問い合わせフォームはこちら</a><br>
                  <span style="color:#555;font-size:13px;">※平日の営業時間9：30〜18：30に迅速に対応させていただきます。<br>
                  （土日祝日はお休みとなりますので、翌営業日の対応とさせていただきます）</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 6px;font-size:13px;color:#555;border-top:1px solid #e0eaf7;margin-top:12px;">
                  <strong style="color:#333;">■ 本メールにお心当たりが無い方へ</strong><br>
                  本メールは、COCOマーケのサービス資料ダウンロードフォームに記載をいただいたお客様にお送りしています。<br>
                  心当たりのない場合は、お手数ですがお問い合わせフォームよりご連絡をお願いいたします。
                </td>
              </tr>
            </table>
          </td>
        </tr>

        ${disasterNoticeRow()}

        <tr>
          <td style="background:#ffffff;border-top:2px solid #e8f0fe;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#333;font-size:15px;font-weight:bold;">株式会社ホットセラー</p>
            <p style="margin:0 0 4px;color:#555;font-size:13px;">COCOマーケ　サービス窓口</p>
            <p style="margin:0 0 0;color:#555;font-size:13px;">〒104-0053　東京都中央区晴海1-8-10</p>
            <p style="margin:0 0 8px;color:#555;font-size:13px;">晴海トリトンスクエアX棟８階</p>
            <p style="margin:0;color:#555;font-size:13px;">HP：https://www.cocomarke.com/</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: 'info@cocomake-guide.com',
      replyTo: email,
      subject: '<HPサービス資料ダウンロード>',
      text: adminBody,
    });

    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: email,
      subject: '【COCOマーケ】サービス資料をお送りします',
      html: autoHtml,
    });

    const slackWebhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      const slackPayload = {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📄 COCOマーケ サービス資料のダウンロードがありました', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*会社・屋号*\n${company}` },
              { type: 'mrkdwn', text: `*お名前*\n${name}` },
              { type: 'mrkdwn', text: `*メールアドレス*\n${email}` },
              { type: 'mrkdwn', text: `*お電話番号*\n${tel || '—'}` },
              { type: 'mrkdwn', text: `*業種*\n${industry}` },
              { type: 'mrkdwn', text: `*検討時期*\n${timing || '—'}` },
            ],
          },
          { type: 'divider' },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `返信先: <mailto:${email}|${email}> ／ 流入元: ${landing_page || '—'}` }],
          },
        ],
      };
      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      }).catch(err => console.error('Slack notify error:', err));
    }

    if (event_id) {
      await sendMetaLead({ request, eventId: event_id, email, phone: tel });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Mail error:', err);
    return new Response(JSON.stringify({ success: false, error: 'mail_failed' }), { status: 500 });
  }
};
