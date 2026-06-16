export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url || !url.startsWith('https://')) {
    return new Response('Invalid url', { status: 400 });
  }

  const upstream = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });

  if (!upstream.ok) {
    return new Response('Upstream fetch failed', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'audio/mpeg',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
