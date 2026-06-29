import { NextResponse } from 'next/server';
import type { Feature, FeatureCollection, Point } from 'geojson';

// NDW Verkeersborden REST API v4 — open data, no auth.
// Returns GeoJSON points in EPSG:4326. Filterable by rvvCode + countyCode (gemeente).
// Docs: https://docs.ndw.nu/data-uitwisseling/interface-beschrijvingen/verkeersborden-api/
const NDW_URL =
  'https://data.ndw.nu/api/rest/static-road-data/traffic-signs/v4/current-state';
const PDOK_REVERSE_URL =
  'https://api.pdok.nl/bzk/locatieserver/search/v3_1/reverse';

const RVV_CODE = 'E7'; // "Gelegenheid voor het onmiddellijk laden en lossen van goederen"
const MAX_BBOX_DEG2 = 0.02; // E7 lookups are area-scoped; keep the request tight.
const BBOX_PAD_DEG = 0.0004; // ~40 m padding so signs just outside the area still show.

export const runtime = 'nodejs';
export const maxDuration = 30;

export interface NdwTextSign {
  type?: string;
  text?: string;
}

export interface NdwSignProperties {
  /** Stable NDW sign UUID (GeoJSON feature id). */
  ndwId: string | null;
  rvvCode: string;
  status: string | null;
  roadName: string | null;
  /** Onderbord text(s) joined — typically the time window, e.g. "ma t/m za 08.00-18.00". */
  restriction: string | null;
  bearing: number | null;
  placement: string | null;
  side: string | null;
  townName: string | null;
  imageUrl: string | null;
  validated: boolean;
}

interface NdwRawProperties {
  rvvCode?: string;
  status?: string;
  roadName?: string;
  textSigns?: NdwTextSign[];
  bearing?: number;
  placement?: string;
  side?: string;
  townName?: string;
  imageUrl?: string;
  validated?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const minX = parseFloat(url.searchParams.get('minX') ?? '');
  const minY = parseFloat(url.searchParams.get('minY') ?? '');
  const maxX = parseFloat(url.searchParams.get('maxX') ?? '');
  const maxY = parseFloat(url.searchParams.get('maxY') ?? '');

  if ([minX, minY, maxX, maxY].some((v) => Number.isNaN(v))) {
    return NextResponse.json(
      { error: 'Query params minX, minY, maxX, maxY (EPSG:4326) are required.' },
      { status: 400 }
    );
  }
  if (minX >= maxX || minY >= maxY) {
    return NextResponse.json({ error: 'Invalid bbox: min must be < max.' }, { status: 400 });
  }
  if ((maxX - minX) * (maxY - minY) > MAX_BBOX_DEG2) {
    return NextResponse.json(
      { error: 'Gebied te groot om laad/loszones op te halen. Zoom verder in.' },
      { status: 413 }
    );
  }

  // 1. Reverse-geocode the bbox centre to a gemeentecode (NDW filters by municipality).
  const centerLat = (minY + maxY) / 2;
  const centerLon = (minX + maxX) / 2;
  const gemeentecode = await reverseGemeentecode(centerLat, centerLon);
  if (!gemeentecode) {
    return NextResponse.json(
      { error: 'Geen gemeente gevonden voor dit gebied (alleen Nederland wordt ondersteund).' },
      { status: 404 }
    );
  }
  const countyCode = `GM${gemeentecode}`;

  // 2. Fetch all E7 signs for that municipality (cached per gemeente for a day).
  const params = new URLSearchParams({ rvvCode: RVV_CODE, countyCode });
  let resp: Response;
  try {
    resp = await fetch(`${NDW_URL}?${params.toString()}`, {
      headers: { Accept: 'application/geo+json' },
      next: { revalidate: 86400 },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `NDW onbereikbaar: ${(err as Error).message}` },
      { status: 502 }
    );
  }
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json(
      { error: `NDW gaf ${resp.status} terug`, detail: text.slice(0, 300) },
      { status: 502 }
    );
  }

  const raw = (await resp.json()) as FeatureCollection<Point, NdwRawProperties>;

  // 3. Filter to the requested bbox (padded) and slim down the properties.
  const padMinX = minX - BBOX_PAD_DEG;
  const padMinY = minY - BBOX_PAD_DEG;
  const padMaxX = maxX + BBOX_PAD_DEG;
  const padMaxY = maxY + BBOX_PAD_DEG;

  const features: Feature<Point, NdwSignProperties>[] = [];
  for (const f of raw.features ?? []) {
    if (f.geometry?.type !== 'Point') continue;
    const [lon, lat] = f.geometry.coordinates;
    if (lon < padMinX || lon > padMaxX || lat < padMinY || lat > padMaxY) continue;
    const p = f.properties ?? {};
    features.push({
      type: 'Feature',
      id: typeof f.id === 'string' || typeof f.id === 'number' ? f.id : undefined,
      geometry: f.geometry,
      properties: {
        ndwId: typeof f.id === 'string' ? f.id : null,
        rvvCode: p.rvvCode ?? RVV_CODE,
        status: p.status ?? null,
        roadName: p.roadName ?? null,
        restriction:
          (p.textSigns ?? [])
            .map((t) => t.text?.trim())
            .filter(Boolean)
            .join(' · ') || null,
        bearing: typeof p.bearing === 'number' ? p.bearing : null,
        placement: p.placement ?? null,
        side: p.side ?? null,
        townName: p.townName ?? null,
        imageUrl: p.imageUrl ?? null,
        validated: p.validated === 'j',
      },
    });
  }

  const out: FeatureCollection<Point, NdwSignProperties> & {
    countyCode: string;
    count: number;
  } = {
    type: 'FeatureCollection',
    features,
    countyCode,
    count: features.length,
  };

  return NextResponse.json(out, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  });
}

async function reverseGemeentecode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lon.toString(),
    rows: '1',
    type: 'adres',
    fl: 'gemeentecode',
  });
  try {
    const resp = await fetch(`${PDOK_REVERSE_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      response?: { docs?: Array<{ gemeentecode?: string }> };
    };
    return data.response?.docs?.[0]?.gemeentecode ?? null;
  } catch {
    return null;
  }
}
