import { NextResponse } from 'next/server';

const WFS_URL = 'https://service.pdok.nl/rws/nwbwegen/wfs/v1_0';
const PAGE_SIZE = 5000;
const MAX_BBOX_DEG2 = 0.05;

export const runtime = 'nodejs';
export const maxDuration = 30;

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
      { error: 'Bbox too large. Zoom in closer to load streets.' },
      { status: 413 }
    );
  }

  const params = new URLSearchParams({
    service: 'WFS',
    version: '2.0.0',
    request: 'GetFeature',
    typeNames: 'nwbwegen:wegvakken',
    outputFormat: 'application/json',
    srsName: 'EPSG:4326',
    bbox: `${minY},${minX},${maxY},${maxX},EPSG:4326`,
    count: String(PAGE_SIZE),
  });

  let resp: Response;
  try {
    resp = await fetch(`${WFS_URL}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `PDOK NWB unreachable: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    return NextResponse.json(
      { error: `PDOK NWB returned ${resp.status}`, detail: text.slice(0, 500) },
      { status: 502 }
    );
  }

  const fc = await resp.json();
  return NextResponse.json(fc, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
