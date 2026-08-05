import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { sendMetaLead } from '../../lib/metaCapi';

// 美容サロン向け広告LP（/lp/beauty）専用のお問い合わせ受付。
// フォーム: templates/lp/beauty/index.html（ENDPOINT = /api/beauty-contact）
// 項目: name / account(Instagram) / keyword / option[] / email / tel / message / plan
const json = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json' } });

const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

export const POST: APIRoute = async ({ request }) => {
  let data: Record<string, unknown> = {};
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      data = await request.json();
    } else {
      const form = await request.formData();
      const obj: Record<string, unknown> = {};
      for (const [k, v] of form.entries()) {
        if (k === 'option') {
          (obj.option = (obj.option as string[]) ?? []).push?.(String(v));
        } else {
          obj[k] = String(v);
        }
      }
      data = obj;
    }
  } catch {
    return json({ success: false, error: 'bad_request' }, 400);
  }

  const name = str(data.name);
  const account = str(data.account);
  const keyword = str(data.keyword);
  const email = str(data.email);
  const tel = str(data.tel);
  const message = str(data.message);
  const plan = str(data.plan) || 'アカウント上位表示（月額30,000円〜／税別）';
  const website = str(data.website); // ハニーポット
  const eventId = str(data.event_id);
  const options = Array.isArray(data.option)
    ? (data.option as unknown[]).map(str).filter((s) => s !== '')
    : str(data.option)
      ? [str(data.option)]
      : [];

  // --- スパム対策 ---------------------------------------------------------
  // 検知したらメールを送らず success:200 を返す（botに気付かせない）
  // ① ハニーポット（ボットは website を埋めがち）
  if (website) return json({ success: true });
  // ② 時間トラップ（_ts が無い直POST／表示から2.5秒未満）＋ ③ 内容検知
  const tsNum = Number(str(data._ts));
  const elapsed = Number.isFinite(tsNum) && tsNum > 0 ? Date.now() - tsNum : null;
  const msgUrlCount = (message.match(/https?:\/\//gi) ?? []).length;
  const hasLinkMarkup = /\[url|\[\/url\]|\[link|<a\s|href\s*=/i.test(`${message} ${account} ${keyword}`);
  const nameHasUrl = /https?:\/\/|www\./i.test(name);
  const spamReason =
    elapsed === null ? 'no_ts'
    : (elapsed < 2500) ? 'too_fast'
    : msgUrlCount >= 3 ? 'url_flood'
    : hasLinkMarkup ? 'link_markup'
    : nameHasUrl ? 'url_in_name'
    : '';
  if (spamReason) {
    console.warn('[beauty-contact] spam blocked:', spamReason, { elapsed, msgUrlCount });
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
    console.error('beauty-contact: RESEND_API_KEY not set');
    return json({ success: false, error: 'メール送信の設定が未完了です。管理者にお問い合わせください。' }, 500);
  }

  const receivedAt = new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
  const adminBody = [
    '美容サロン向けLP（/lp/beauty）からお問い合わせがありました。',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `■ お名前：${name}`,
    `■ Instagramアカウント名：${account}`,
    `■ 狙いたいキーワード：${keyword || '（未入力）'}`,
    `■ ご希望プラン：${plan}`,
    `■ ご希望のオプション：${options.length ? options.join(' / ') : '（なし）'}`,
    `■ メールアドレス：${email}`,
    `■ お電話番号：${tel || '（未入力）'}`,
    '■ ご相談内容：',
    message || '（未入力）',
    '━━━━━━━━━━━━━━━━━━━━━━',
    `受信日時：${receivedAt}`,
  ].join('\n');

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    const resend = new Resend(resendApiKey);

    // 1. 社内通知
    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: 'info@cocomake-guide.com',
      replyTo: email,
      subject: `<美容LP経由お見積り> ${name} 様（${account}）`,
      text: adminBody,
    });

    // 2. 送信者への自動返信（受付お礼）
    await resend.emails.send({
      from: 'COCOマーケ <support@cocomarke.com>',
      to: email,
      subject: '【COCOマーケ】お見積りのご依頼を受け付けました',
      html: `<div style="font-family:'Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif;color:#0C2B25;line-height:1.9;font-size:14px">
        <p>${esc(name)} 様</p>
        <p>このたびはCOCOマーケへお見積りをご依頼いただき、ありがとうございます。<br>
        以下の内容で受け付けました。アカウントを確認のうえ、狙いたいキーワードのご提案と料金をあわせてご連絡いたします。</p>
        <div style="background:#F1F5F0;border:1px solid #E0E7DF;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:13px">
          <p style="margin:0 0 6px"><b>Instagramアカウント名</b>：${esc(account)}</p>
          <p style="margin:0 0 6px"><b>ご希望プラン</b>：${esc(plan)}</p>
          <p style="margin:0 0 6px"><b>ご希望のオプション</b>：${options.length ? esc(options.join(' / ')) : '（なし）'}</p>
          ${keyword ? `<p style="margin:0"><b>狙いたいキーワード</b>：${esc(keyword)}</p>` : ''}
        </div>
        <p>担当より、初回のご連絡は土日祝を除く営業日に順次お送りいたします。<br>
        しばらくお待ちくださいませ。</p>
        <p style="color:#5C6F69;font-size:12px">※本メールは自動送信です。ご返信の必要がある場合は、このメールへそのままご返信ください。</p>
        <hr style="border:none;border-top:1px solid #E0E7DF;margin:22px 0">
        <p style="font-size:12px;color:#5C6F69">
          COCOマーケ（株式会社ホットセラー）<br>
          東京都中央区晴海1-8-10 晴海アイランドトリトンスクエア X棟8階<br>
          <a href="https://www.cocomarke.com/" style="color:#A98443">https://www.cocomarke.com/</a>
        </p>
      </div>`,
    });

    // Meta CAPI（サーバー側でLeadを計測。失敗してもフォーム送信は成功扱い）
    try {
      await sendMetaLead({
        request,
        eventId,
        email,
        phone: tel,
        eventSourceUrl: 'https://www.cocomarke.com/lp/beauty',
      });
    } catch (e) {
      console.error('beauty-contact: sendMetaLead failed', e);
    }

    return json({ success: true });
  } catch (e) {
    console.error('beauty-contact: send failed', e);
    return json({ success: false, error: '送信に失敗しました。時間をおいて再度お試しください。' }, 500);
  }
};
