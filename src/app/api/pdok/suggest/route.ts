import { NextResponse } from 'next/server';

const SUGGEST_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/suggest';

export const runtime = 'nodejs';

export interface LocatieserverSuggestion {
  id: string;
  weergavenaam: string;
  type: string;
  score: number;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get('q')?.trim();
  if (!q) return NextResponse.json({ suggestions: [] });

  const params = new URLSearchParams({
    q,
    rows: '8',
    fq: 'type:(adres OR weg OR woonplaats OR buurt OR wijk)',
  });

  let resp: Response;
  try {
    resp = await fetch(`${SUGGEST_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `PDOK Locatieserver unreachable: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  if (!resp.ok) {
    return NextResponse.json({ error: `PDOK returned ${resp.status}` }, { status: 502 });
  }

  const data = (await resp.json()) as {
    response?: { docs?: Array<{ id: string; weergavenaam: string; type: string; score: number }> };
  };

  const suggestions: LocatieserverSuggestion[] = (data.response?.docs ?? []).map((d) => ({
    id: d.id,
    weergavenaam: d.weergavenaam,
    type: d.type,
    score: d.score,
  }));

  return NextResponse.json({ suggestions });
}
