import { NextResponse } from 'next/server';

const REVERSE_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse';

export const runtime = 'nodejs';

export interface PdokReverseResult {
  weergavenaam: string | null;
  straatnaam: string | null;
  huisnummer: number | null;
  huisletter: string | null;
  huisnummertoevoeging: string | null;
  postcode: string | null;
  woonplaats: string | null;
  distanceMeters: number | null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = parseFloat(url.searchParams.get('lat') ?? '');
  const lon = parseFloat(url.searchParams.get('lon') ?? '');
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: 'lat & lon required' }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    rows: '1',
    type: 'adres',
    fl: 'weergavenaam,straatnaam,huisnummer,huisletter,huisnummertoevoeging,postcode,woonplaatsnaam,afstand',
  });

  let resp: Response;
  try {
    resp = await fetch(`${REVERSE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `PDOK reverse unreachable: ${(err as Error).message}` },
      { status: 502 }
    );
  }
  if (!resp.ok) {
    return NextResponse.json({ error: `PDOK returned ${resp.status}` }, { status: 502 });
  }

  const data = (await resp.json()) as {
    response?: {
      docs?: Array<{
        weergavenaam?: string;
        straatnaam?: string;
        huisnummer?: number;
        huisletter?: string;
        huisnummertoevoeging?: string;
        postcode?: string;
        woonplaatsnaam?: string;
        afstand?: number;
      }>;
    };
  };
  const d = data.response?.docs?.[0];
  if (!d) return NextResponse.json({ error: 'No address found' }, { status: 404 });

  const result: PdokReverseResult = {
    weergavenaam: d.weergavenaam ?? null,
    straatnaam: d.straatnaam ?? null,
    huisnummer: d.huisnummer ?? null,
    huisletter: d.huisletter ?? null,
    huisnummertoevoeging: d.huisnummertoevoeging ?? null,
    postcode: d.postcode ?? null,
    woonplaats: d.woonplaatsnaam ?? null,
    distanceMeters: d.afstand ?? null,
  };

  return NextResponse.json(result);
}
