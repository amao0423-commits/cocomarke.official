import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendMetaLead } from '../../lib/metaCapi';

const INQUIRY_TYPE_MAP: Record<string, string> = {
  service: 'サービスについて',
  estimate: 'お見積りについて',
  other: 'その他',
};

const REFERRAL_MAP: Record<string, string> = {
  search: '検索エンジン',
  sns: 'SNS',
  introduction: '紹介',
  other: 'その他',
};

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

  const { inquiryType = '', company = '', name = '', furigana = '', url = '', email = '', phone = '', referral = '', message = '', event_id = '' } = data;

  // 必須チェック（電話・本文は任意）
  if (!name || !furigana || !email) {
    return new Response(JSON.stringify({ success: false, error: 'required' }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_email' }), { status: 400 });
  }

  const resendApiKey = import.meta.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return new Response(JSON.stringify({ success: false, error: 'config' }), { status: 500 });
  }

  const inquiryTypeJa = INQUIRY_TYPE_MAP[inquiryType] || inquiryType;
  const referralJa = REFERRAL_MAP[referral] || referral;

  const resend = new Resend(resendApiKey);

  const adminBody = [
    'COCOマーケ お問い合わせがありました。',
    '',
    `■ お問い合わせ区分：${inquiryTypeJa}`,
    `■ 会社・組織名　　：${company}`,
    `■ 担当者名　　　　：${name}`,
    `■ フリガナ　　　　：${furigana}`,
    `■ ホームページURL ：${url}`,
    `■ メールアドレス　：${email}`,
    `■ お電話番号　　　：${phone}`,
    `■ 弊社を知ったきっかけ：${referralJa}`,
    '',
    `■ お問い合わせ内容：\n${message}`,
  ].join('\n');

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Build all filled fields (stacked: label above value)
  const lStyle = 'font-size:12px;color:#888;font-weight:bold;margin:0 0 4px;letter-spacing:0.05em;';
  const vStyle = 'font-size:15px;color:#333;margin:0 0 18px;word-break:break-all;';
  const allFields = [
    { label: 'お問い合わせ区分', value: inquiryTypeJa },
    { label: '会社・組織名', value: company },
    { label: '担当者名', value: name },
    { label: 'フリガナ', value: furigana },
    { label: 'ホームページURL', value: url },
    { label: 'メールアドレス', value: email },
    { label: 'お電話番号', value: phone },
    { label: '弊社を知ったきっかけ', value: referralJa },
    { label: 'お問い合わせ内容', value: message },
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

        <!-- 本文 -->
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">${esc(name)} 様</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.8;">
              お問い合わせいただきありがとうございます。<br>
              以下の内容でお問い合わせを受け付けました。
            </p>

            <!-- お問い合わせ詳細（縦積みレイアウト） -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f5f9fe;border-radius:8px;padding:20px 24px 4px;margin-bottom:24px;">
                  ${fieldsHtml}
                </td>
              </tr>
            </table>

            <p style="margin:16px 0 4px;font-size:15px;color:#333;line-height:1.8;">
              担当者より2〜3営業日以内にご連絡いたします。<br>
              しばらくお待ちくださいませ。
            </p>
          </td>
        </tr>

        <!-- リンクセクション -->
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
                <td style="padding:6px 0;font-size:14px;color:#333;">
                  <strong>■ 資料請求</strong><br>
                  <a href="https://www.cocomake-guide.com/servicedocument" style="color:#005bea;text-decoration:none;">COCOマーケの資料ダウンロードはこちら</a>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 6px;font-size:14px;color:#333;">
                  <strong>■ ご返信について</strong><br>
                  本メールは自動送信のため、このメールへの返信はお受けできません。<br>
                  ご返信の必要がある場合は、公式LINEよりご連絡ください。<br>
                  <a href="https://page.line.me/386gtsnr?oat_content=url&amp;openQrModal=true" style="color:#005bea;text-decoration:none;">@cocomarke</a><br>
                  <span style="color:#555;font-size:13px;">※平日の営業時間9：30〜18：30に迅速に対応させていただきます。<br>
                  （土日祝日はお休みとなりますので、翌営業日の対応とさせていただきます）</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 6px;font-size:13px;color:#555;border-top:1px solid #e0eaf7;margin-top:12px;">
                  <strong style="color:#333;">■ 本メールにお心当たりが無い方へ</strong><br>
                  本メールは、COCOマーケのお問い合わせフォームに記載をいただいたお客様にお送りしています。<br>
                  心当たりのない場合は、お手数ですが公式LINEよりご連絡をお願いいたします。<br>
                  <a href="https://page.line.me/386gtsnr?oat_content=url&amp;openQrModal=true" style="color:#005bea;text-decoration:none;">@cocomarke</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- フッター（白背景・黒文字・リンクなし） -->
        <tr>
          <td style="background:#ffffff;border-top:2px solid #e8f0fe;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#333;font-size:15px;font-weight:bold;">株式会社ホットセラー</p>
            <p style="margin:0 0 4px;color:#555;font-size:13px;">COCOマーケ　サービス窓口</p>
            <p style="margin:0 0 0;color:#555;font-size:13px;">
              <a href="#" style="color:#555;text-decoration:none;pointer-events:none;" x-apple-data-detectors="false">〒104-0053　東京都中央区晴海1-8-10</a>
            </p>
            <p style="margin:0 0 8px;color:#555;font-size:13px;">
              <a href="#" style="color:#555;text-decoration:none;pointer-events:none;" x-apple-data-detectors="false">晴海トリトンスクエアX棟８階</a>
            </p>
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
      subject: '<HPお問い合わせ>',
      text: adminBody,
    });

    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: email,
      subject: '【COCOマーケ】お問い合わせを受け付けました',
      html: autoHtml,
    });

    // Slack通知
    const slackWebhookUrl = import.meta.env.SLACK_WEBHOOK_URL;
    if (slackWebhookUrl) {
      const slackPayload = {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: '📩 COCOマーケ お問い合わせがありました', emoji: true },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*区分*\n${inquiryTypeJa}` },
              { type: 'mrkdwn', text: `*担当者名*\n${name}` },
              { type: 'mrkdwn', text: `*会社・組織名*\n${company || '—'}` },
              { type: 'mrkdwn', text: `*フリガナ*\n${furigana}` },
              { type: 'mrkdwn', text: `*メールアドレス*\n${email}` },
              { type: 'mrkdwn', text: `*お電話番号*\n${phone}` },
              ...(url ? [{ type: 'mrkdwn', text: `*HP URL*\n${url}` }] : []),
              ...(referralJa ? [{ type: 'mrkdwn', text: `*きっかけ*\n${referralJa}` }] : []),
            ],
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*お問い合わせ内容*\n${message}` },
          },
          { type: 'divider' },
          {
            type: 'context',
            elements: [{ type: 'mrkdwn', text: `返信先: <mailto:${email}|${email}>` }],
          },
        ],
      };
      await fetch(slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload),
      }).catch(err => console.error('Slack notify error:', err));
    }

    // Meta Conversions API: Lead送信（メール・電話はサーバー側でハッシュ化）。
    // ブラウザPixel(thanksページ)と同じ event_id で重複排除される。ベストエフォート。
    if (event_id) {
      await sendMetaLead({ request, eventId: event_id, email, phone });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Mail error:', err);
    return new Response(JSON.stringify({ success: false, error: 'mail_failed' }), { status: 500 });
  }
};
