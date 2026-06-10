import type { APIRoute } from 'astro';

const DEFAULT_PIXEL_ID = '1232285451938211';
const DEFAULT_GRAPH_API_VERSION = 'v23.0';

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() ?? '';

  return (
    request.headers.get('x-real-ip') ??
    request.headers.get('cf-connecting-ip') ??
    ''
  );
}

function getCookie(request: Request, name: string) {
  const cookie = request.headers.get('cookie') ?? '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export const POST: APIRoute = async ({ request }) => {
  const accessToken = import.meta.env.META_CAPI_ACCESS_TOKEN;
  const pixelId = import.meta.env.META_PIXEL_ID ?? DEFAULT_PIXEL_ID;
  const graphApiVersion = import.meta.env.META_GRAPH_API_VERSION ?? DEFAULT_GRAPH_API_VERSION;

  if (!accessToken) {
    return new Response(JSON.stringify({ success: false, error: 'missing_meta_capi_token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { event_id?: string; event_source_url?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const eventId = body.event_id?.trim();
  if (!eventId) {
    return new Response(JSON.stringify({ success: false, error: 'missing_event_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        action_source: 'website',
        event_source_url: body.event_source_url || 'https://www.cocomarke.com/contact/thanks/',
        user_data: {
          client_ip_address: getClientIp(request),
          client_user_agent: request.headers.get('user-agent') ?? '',
          fbp: getCookie(request, '_fbp') || undefined,
          fbc: getCookie(request, '_fbc') || undefined,
        },
      },
    ],
  };

  if (import.meta.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = import.meta.env.META_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${graphApiVersion}/${pixelId}/events`;
  const response = await fetch(`${url}?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error('Meta CAPI error:', result);
    return new Response(JSON.stringify({ success: false, error: 'meta_capi_failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
