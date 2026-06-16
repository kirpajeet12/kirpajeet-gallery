export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');
  if (!url || !url.startsWith('https://')) {
    return new Response('Invalid url', { status: 400 });
  }

  const upstreamHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0',
  };

  // Forward Range header — Chrome requires this for audio streaming
  const range = req.headers.get('Range');
  if (range) upstreamHeaders['Range'] = range;

  const upstream = await fetch(url, { headers: upstreamHeaders });

  if (!upstream.ok && upstream.status !== 206) {
    return new Response('Upstream error ' + upstream.status, { status: 502 });
  }

  const resHeaders: Record<string, string> = {
    'Content-Type': upstream.headers.get('Content-Type') ?? 'audio/mpeg',
    'Access-Control-Allow-Origin': '*',
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600',
  };

  const contentRange = upstream.headers.get('Content-Range');
  if (contentRange) resHeaders['Content-Range'] = contentRange;

  const contentLength = upstream.headers.get('Content-Length');
  if (contentLength) resHeaders['Content-Length'] = contentLength;

  return new Response(upstream.body, {
    status: upstream.status,
    headers: resHeaders,
  });
}
