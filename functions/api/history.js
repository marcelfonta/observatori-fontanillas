const HISTORY_ENDPOINT = 'https://fonta-meteo.marcelfonta.workers.dev/history';
const RESOLUTIONS = new Set(['auto', 'raw', 'hourly', 'daily']);

function integerParam(value, fallback, minimum, maximum) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) ? Math.min(maximum, Math.max(minimum, parsed)) : fallback;
}

export async function onRequestGet({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL(HISTORY_ENDPOINT);
  const resolution = incoming.searchParams.get('resolution');
  const freshness = incoming.searchParams.get('fresh');

  upstream.searchParams.set('days', String(integerParam(incoming.searchParams.get('days'), 31, 1, 366)));
  upstream.searchParams.set('resolution', RESOLUTIONS.has(resolution) ? resolution : 'auto');
  if (/^[A-Za-z0-9_-]{1,32}$/.test(freshness || '')) upstream.searchParams.set('fresh', freshness);

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return Response.json(
      { error: 'HISTORY_UPSTREAM_UNAVAILABLE' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
