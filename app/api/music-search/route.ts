export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') ?? '';
  if (!q.trim()) return Response.json({ data: [] });

  const res = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=8`,
    { next: { revalidate: 60 } }
  );
  const data = await res.json();
  return Response.json(data);
}
