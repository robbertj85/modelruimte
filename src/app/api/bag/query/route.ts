import { NextResponse } from 'next/server';
import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon, Position } from 'geojson';
import { bbox as turfBbox, booleanPointInPolygon } from '@turf/turf';
import {
  BAG_GEBRUIKSDOELEN,
  type BagBucket,
  type BagGebruiksdoel,
  type BagQueryResult,
  type BagVboProperties,
} from '@/lib/bag-types';
import { fetchOsmPois, findNearestOsm, isHorecaPoi, isShopPoi } from '@/lib/osm';

const WFS_URL = 'https://service.pdok.nl/lv/bag/wfs/v2_0';
const PAGE_SIZE = 1000;
const MAX_PAGES = 30;
const MAX_BBOX_DEG2 = 0.02;

export const runtime = 'nodejs';
export const maxDuration = 60;

interface WfsFeature {
  geometry?: { type: string; coordinates: Position | Position[] | Position[][] };
  properties?: Record<string, unknown>;
}

function normalizeGebruiksdoelen(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return [];
}

function extractPoint(feat: WfsFeature): [number, number] | null {
  const g = feat.geometry;
  if (!g) return null;
  if (g.type === 'Point' && Array.isArray(g.coordinates) && typeof g.coordinates[0] === 'number') {
    return [g.coordinates[0] as number, g.coordinates[1] as number];
  }
  return null;
}

export async function POST(req: Request) {
  let body: { polygon?: Feature<Polygon | MultiPolygon> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const polygon = body.polygon;
  if (
    !polygon ||
    polygon.type !== 'Feature' ||
    !polygon.geometry ||
    (polygon.geometry.type !== 'Polygon' && polygon.geometry.type !== 'MultiPolygon')
  ) {
    return NextResponse.json(
      { error: 'Body must be { polygon: Feature<Polygon | MultiPolygon> }' },
      { status: 400 }
    );
  }

  const [minX, minY, maxX, maxY] = turfBbox(polygon);
  const bboxDeg2 = (maxX - minX) * (maxY - minY);
  if (bboxDeg2 > MAX_BBOX_DEG2) {
    return NextResponse.json(
      { error: 'Selected area is too large — teken een kleiner gebied (< ~20 km²).' },
      { status: 413 }
    );
  }

  const allFeatures: WfsFeature[] = [];
  let truncated = false;

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: 'bag:verblijfsobject',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      bbox: `${minY},${minX},${maxY},${maxX},EPSG:4326`,
      count: String(PAGE_SIZE),
      startIndex: String(page * PAGE_SIZE),
    });

    let resp: Response;
    try {
      resp = await fetch(`${WFS_URL}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      });
    } catch (err) {
      return NextResponse.json(
        { error: `PDOK BAG WFS unreachable: ${(err as Error).message}` },
        { status: 502 }
      );
    }

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      return NextResponse.json(
        { error: `PDOK BAG WFS returned ${resp.status}`, detail: text.slice(0, 500) },
        { status: 502 }
      );
    }

    const fc = (await resp.json()) as { features?: WfsFeature[] };
    const feats = fc.features ?? [];
    allFeatures.push(...feats);

    if (feats.length === 0) break;
    if (page === MAX_PAGES - 1) truncated = true;
  }

  const subPolygons: Feature<Polygon>[] =
    polygon.geometry.type === 'Polygon'
      ? [polygon as Feature<Polygon>]
      : polygon.geometry.coordinates.map((coords) => ({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: coords },
          properties: {},
        }));

  const inPolygon: WfsFeature[] = [];
  for (const feat of allFeatures) {
    const pt = extractPoint(feat);
    if (!pt) continue;
    for (const sub of subPolygons) {
      if (booleanPointInPolygon(pt, sub)) {
        inPolygon.push(feat);
        break;
      }
    }
  }

  // Fire-and-forget OSM fetch in parallel; we'll await later.
  const osmPromise = fetchOsmPois([minX, minY, maxX, maxY]).catch((err) => {
    console.error('[bag/query] OSM fetch failed:', (err as Error).message);
    return [];
  });

  const buckets: Partial<Record<BagGebruiksdoel, BagBucket>> = {};
  let multiUseCount = 0;
  const vboFeatures: Feature<Point, BagVboProperties>[] = [];
  let totalCounted = 0;

  for (const feat of inPolygon) {
    const props = feat.properties ?? {};
    const statusRaw = typeof props.status === 'string' ? props.status.toLowerCase() : '';
    if (statusRaw.includes('ingetrokken') || statusRaw.includes('niet gerealiseerd')) continue;

    const doelen = normalizeGebruiksdoelen(props.gebruiksdoel);
    if (doelen.length === 0) continue;
    if (doelen.length > 1) multiUseCount += 1;

    const primary = doelen[0];
    if (!BAG_GEBRUIKSDOELEN.includes(primary as BagGebruiksdoel)) continue;

    const key = primary as BagGebruiksdoel;
    const oppervlakte = Number(props.oppervlakte ?? 0) || 0;
    if (!buckets[key]) {
      buckets[key] = { gebruiksdoel: key, count: 0, totalOppervlakte: 0, oppervlakten: [] };
    }
    const bucket = buckets[key]!;
    bucket.count += 1;
    bucket.totalOppervlakte += oppervlakte;
    bucket.oppervlakten.push(oppervlakte);
    totalCounted += 1;

    const pt = extractPoint(feat);
    if (pt) {
      vboFeatures.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pt },
        properties: {
          id: typeof props.identificatie === 'string' ? props.identificatie : undefined,
          gebruiksdoel: key,
          oppervlakte,
        },
      });
    }
  }

  const osmPois = await osmPromise;
  if (osmPois.length > 0) {
    for (const f of vboFeatures) {
      const g = f.properties.gebruiksdoel;
      const coords = f.geometry.coordinates as [number, number];
      let nearest = null;
      if (g === 'winkelfunctie') {
        nearest = findNearestOsm(coords, osmPois, 25, isShopPoi);
      } else if (g === 'bijeenkomstfunctie') {
        nearest = findNearestOsm(coords, osmPois, 25, isHorecaPoi);
      }
      if (nearest) {
        f.properties.osm = {
          shop: nearest.shop,
          amenity: nearest.amenity,
          brand: nearest.brand,
          name: nearest.name,
          cuisine: nearest.cuisine,
        };
      }
    }
  }

  const featureCollection: FeatureCollection<Point, BagVboProperties> = {
    type: 'FeatureCollection',
    features: vboFeatures,
  };

  const result: BagQueryResult = {
    totalVerblijfsobjecten: totalCounted,
    buckets,
    polygon,
    features: featureCollection,
    queriedAt: new Date().toISOString(),
    truncated,
    multiUseCount,
  };

  return NextResponse.json(result);
}
