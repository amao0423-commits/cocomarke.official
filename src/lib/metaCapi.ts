import { createHash } from 'node:crypto';

const DEFAULT_PIXEL_ID = '1232285451938211';
const DEFAULT_GRAPH_API_VERSION = 'v23.0';
const THANKS_URL = 'https://www.cocomarke.com/contact/thanks/';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Meta仕様: 小文字化・前後空白除去してSHA-256 */
export function hashEmail(email?: string) {
  const normalized = (email ?? '').trim().toLowerCase();
  return normalized ? sha256(normalized) : undefined;
}

/** Meta仕様: 数字のみ・国番号付与（日本: 先頭0→81）してSHA-256 */
export function hashPhone(phone?: string) {
  let digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return undefined;
  if (digits.startsWith('0')) digits = '81' + digits.slice(1);
  return sha256(digits);
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? '';
  return request.headers.get('x-real-ip') ?? request.headers.get('cf-connecting-ip') ?? '';
}

export function getCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

interface SendLeadOptions {
  request: Request;
  eventId: string;
  eventSourceUrl?: string;
  /** 平文。この関数内でハッシュ化される（保存・ログ出力しない） */
  email?: string;
  phone?: string;
}

/**
 * Meta Conversions API へ Lead イベントを送信する。
 * email / phone はサーバー内でハッシュ化してアドバンスドマッチングに使う。
 * ベストエフォート（失敗しても例外は投げず、結果を返すだけ）。
 */
export async function sendMetaLead({ request, eventId, eventSourceUrl, email, phone }: SendLeadOptions) {
  const accessToken = import.meta.env.META_CAPI_ACCESS_TOKEN;
  const pixelId = import.meta.env.META_PIXEL_ID ?? DEFAULT_PIXEL_ID;
  const graphApiVersion = import.meta.env.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_API_VERSION;

  if (!accessToken) return { ok: false as const, error: 'missing_meta_capi_token' };
  if (!eventId) return { ok: false as const, error: 'missing_event_id' };

  const userData: Record<string, unknown> = {
    client_ip_address: getClientIp(request),
    client_user_agent: request.headers.get('user-agent') ?? '',
  };
  const em = hashEmail(email);
  const ph = hashPhone(phone);
  if (em) userData.em = em;
  if (ph) userData.ph = ph;
  const fbp = getCookie(request, '_fbp');
  const fbc = getCookie(request, '_fbc');
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: eventSourceUrl || THANKS_URL,
        user_data: userData,
      },
    ],
  };

  if (import.meta.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = import.meta.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${graphApiVersion}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Meta CAPI error:', result);
      return { ok: false as const, error: 'meta_capi_failed', result };
    }
    return { ok: true as const, result };
  } catch (err) {
    console.error('Meta CAPI fetch error:', err);
    return { ok: false as const, error: 'meta_capi_fetch_failed' };
  }
}
