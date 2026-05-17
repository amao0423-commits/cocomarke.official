import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

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

  const inquiryTypeJa = INQUIRY_TYPE_MAP[inquiryType] || inquiryType;
  const referralJa = REFERRAL_MAP[referral] || referral;

  const transporter = nodemailer.createTransport({
    host: 'mail1028.onamae.ne.jp',
    port: 465,
    secure: true,
    auth: { user: 'info@cocomarke.com', pass: smtpPass },
  });

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

  const autoHtml = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f9fe;font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f9fe;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">

        <!-- ヘッダー -->
        <tr>
          <td style="background:linear-gradient(90deg,#00c6fb,#0965f6);padding:24px 32px;text-align:center;">
            <img src="https://www.cocomarke.com/images/coco-icon.png" alt="COCOマーケ" width="64" height="64"
              style="display:block;margin:0 auto 12px;border-radius:50%;background:#fff;padding:4px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:bold;letter-spacing:0.05em;">COCOマーケ</p>
          </td>
        </tr>

        <!-- 本文 -->
        <tr>
          <td style="padding:32px 32px 24px;">
            <p style="margin:0 0 8px;font-size:16px;color:#333;">${esc(name)} 様</p>
            <p style="margin:0 0 24px;font-size:15px;color:#333;line-height:1.8;">
              お問い合わせいただきありがとうございます。<br>
              以下の内容でお問い合わせを受け付けました。
            </p>

            <!-- お問い合わせ詳細 -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f5f9fe;border-radius:8px;padding:20px 24px;margin-bottom:24px;">
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#555;width:160px;vertical-align:top;">■ お問い合わせ区分</td>
                <td style="padding:6px 0;font-size:14px;color:#333;font-weight:bold;">${esc(inquiryTypeJa)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#555;vertical-align:top;">■ 担当者名</td>
                <td style="padding:6px 0;font-size:14px;color:#333;">${esc(name)}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:14px;color:#555;vertical-align:top;">■ お問い合わせ内容</td>
                <td style="padding:6px 0;font-size:14px;color:#333;white-space:pre-wrap;">${esc(message)}</td>
              </tr>
            </table>

            <p style="margin:0 0 4px;font-size:15px;color:#333;line-height:1.8;">
              担当者より2〜3営業日以内にご連絡いたします。<br>
              しばらくお待ちくださいませ。
            </p>
          </td>
        </tr>

        <!-- リンクセクション -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0"
              style="border-top:1px solid #e0eaf7;padding-top:20px;">
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
                  <strong>■ サービス窓口</strong><br>
                  サービス・その他お問い合わせについてご相談などございましたら、<br>
                  <a href="mailto:info@cocomarke.com" style="color:#005bea;text-decoration:none;">info@cocomarke.com</a> までご連絡頂ければ幸いです。<br>
                  <span style="color:#555;font-size:13px;">※平日の営業時間9：30〜18：30に迅速に対応させていただきます。<br>
                  （土日祝日はお休みとなりますので、翌営業日の対応とさせていただきます）</span>
                </td>
              </tr>
              <tr>
                <td style="padding:12px 0 6px;font-size:13px;color:#555;border-top:1px solid #e0eaf7;margin-top:12px;">
                  <strong style="color:#333;">■ 本メールにお心当たりが無い方へ</strong><br>
                  本メールは、株式会社ホットセラー　COCOマーケお問い合わせフォームに記載をいただいたお客様にお送りしています。<br>
                  このメールにお心当たりのない場合は
                  <a href="mailto:info@cocomarke.com" style="color:#005bea;text-decoration:none;">こちらにご連絡</a> お願いいたします。<br>
                  <a href="mailto:info@cocomarke.com" style="color:#005bea;text-decoration:none;">info@cocomarke.com</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="background:#1a1a2e;padding:24px 32px;text-align:center;">
            <p style="margin:0 0 4px;color:#ffffff;font-size:15px;font-weight:bold;">株式会社ホットセラー</p>
            <p style="margin:0 0 4px;color:#ccc;font-size:13px;">COCOマーケ　サービス窓口</p>
            <p style="margin:0 0 4px;color:#ccc;font-size:13px;">〒104-0053　東京都中央区晴海1-8-10</p>
            <p style="margin:0 0 12px;color:#ccc;font-size:13px;">晴海トリトンスクエアX棟８階</p>
            <p style="margin:0 0 4px;font-size:13px;">
              <a href="https://www.cocomarke.com/" style="color:#7db8f7;text-decoration:none;">HP：https://www.cocomarke.com/</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transporter.sendMail({
      from: '"COCOマーケ" <info@cocomarke.com>',
      to: 'info@cocomarke.com',
      replyTo: email,
      subject: `【COCOマーケ】お問い合わせ：${inquiryTypeJa}`,
      text: adminBody,
    });

    await transporter.sendMail({
      from: '"COCOマーケ" <info@cocomarke.com>',
      to: email,
      subject: '【COCOマーケ】お問い合わせを受け付けました',
      html: autoHtml,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Mail error:', err);
    return new Response(JSON.stringify({ success: false, error: 'mail_failed' }), { status: 500 });
  }
};
