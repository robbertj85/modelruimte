import { NextResponse } from 'next/server';
import { wktToGeoJSON } from '@/lib/wkt';
import type { LineString, MultiLineString, MultiPolygon, Point, Polygon } from 'geojson';

const LOOKUP_URL = 'https://api.pdok.nl/bzk/locatieserver/search/v3_1/lookup';

export const runtime = 'nodejs';

export interface LocatieserverLookupResult {
  id: string;
  weergavenaam: string;
  type: string;
  centroid: Point | null;
  geometry: LineString | MultiLineString | Polygon | MultiPolygon | null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id')?.trim();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const params = new URLSearchParams({ id, fl: '*' });
  let resp: Response;
  try {
    resp = await fetch(`${LOOKUP_URL}?${params.toString()}`, {
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
    response?: {
      docs?: Array<{
        id: string;
        weergavenaam: string;
        type: string;
        centroide_ll?: string;
        geometrie_ll?: string;
      }>;
    };
  };
  const doc = data.response?.docs?.[0];
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const centroidWkt = doc.centroide_ll ? wktToGeoJSON(doc.centroide_ll) : null;
  const geomWkt = doc.geometrie_ll ? wktToGeoJSON(doc.geometrie_ll) : null;

  const geometry =
    geomWkt?.type === 'Polygon' ||
    geomWkt?.type === 'MultiPolygon' ||
    geomWkt?.type === 'LineString' ||
    geomWkt?.type === 'MultiLineString'
      ? geomWkt
      : null;

  const result: LocatieserverLookupResult = {
    id: doc.id,
    weergavenaam: doc.weergavenaam,
    type: doc.type,
    centroid: centroidWkt?.type === 'Point' ? centroidWkt : null,
    geometry,
  };

  return NextResponse.json(result);
}
