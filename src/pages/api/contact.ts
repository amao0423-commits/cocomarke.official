import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

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

  const { inquiryType = '', company = '', name = '', furigana = '', url = '', email = '', phone = '', referral = '', message = '' } = data;

  // 必須チェック
  if (!name || !furigana || !email || !phone || !message) {
    return new Response(JSON.stringify({ success: false, error: 'required' }), { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ success: false, error: 'invalid_email' }), { status: 400 });
  }

  const smtpPass = import.meta.env.SMTP_PASS;
  if (!smtpPass) {
    return new Response(JSON.stringify({ success: false, error: 'config' }), { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: 'mail1028.onamae.ne.jp',
    port: 465,
    secure: true,
    auth: { user: 'info@cocomarke.com', pass: smtpPass },
  });

  const adminBody = [
    'COCOマーケ お問い合わせがありました。',
    '',
    `■ お問い合わせ区分：${inquiryType}`,
    `■ 会社・組織名　　：${company}`,
    `■ 担当者名　　　　：${name}`,
    `■ フリガナ　　　　：${furigana}`,
    `■ ホームページURL ：${url}`,
    `■ メールアドレス　：${email}`,
    `■ お電話番号　　　：${phone}`,
    `■ 弊社を知ったきっかけ：${referral}`,
    '',
    `■ お問い合わせ内容：\n${message}`,
  ].join('\n');

  const autoBody = [
    `${name} 様`,
    '',
    'お問い合わせいただきありがとうございます。',
    '以下の内容でお問い合わせを受け付けました。',
    '',
    `■ お問い合わせ区分：${inquiryType}`,
    `■ 担当者名：${name}`,
    '',
    `■ お問い合わせ内容：\n${message}`,
    '',
    '担当者より2〜3営業日以内にご連絡いたします。',
    'しばらくお待ちくださいませ。',
    '',
    '──────────────────────────',
    'COCOマーケ',
    'https://www.cocomake.com',
    'info@cocomarke.com',
    '──────────────────────────',
  ].join('\n');

  try {
    await transporter.sendMail({
      from: '"COCOマーケ" <info@cocomarke.com>',
      to: 'info@cocomarke.com',
      replyTo: email,
      subject: `【COCOマーケ】お問い合わせ：${inquiryType}`,
      text: adminBody,
    });

    await transporter.sendMail({
      from: '"COCOマーケ" <info@cocomarke.com>',
      to: email,
      subject: '【COCOマーケ】お問い合わせを受け付けました',
      text: autoBody,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Mail error:', err);
    return new Response(JSON.stringify({ success: false, error: 'mail_failed' }), { status: 500 });
  }
};
