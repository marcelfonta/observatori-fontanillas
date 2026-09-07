const RECORDS_ENDPOINT = 'https://fonta-meteo.marcelfonta.workers.dev/records';

export async function onRequestGet({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL(RECORDS_ENDPOINT);
  const freshness = incoming.searchParams.get('fresh');
  if (/^[A-Za-z0-9_-]{1,32}$/.test(freshness || '')) upstream.searchParams.set('fresh', freshness);

  try {
    const response = await fetch(upstream, {
      headers: { Accept: 'application/json', Origin: incoming.origin },
      cache: 'no-store'
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return Response.json(
      { error: 'RECORDS_UPSTREAM_UNAVAILABLE' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
