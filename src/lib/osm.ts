export interface OsmPoi {
  lon: number;
  lat: number;
  shop?: string;
  amenity?: string;
  brand?: string;
  name?: string;
  cuisine?: string;
}

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const HORECA_AMENITIES = ['restaurant', 'cafe', 'bar', 'fast_food', 'pub', 'biergarten'];

export async function fetchOsmPois(bbox: [number, number, number, number]): Promise<OsmPoi[]> {
  const [minX, minY, maxX, maxY] = bbox;
  const ovBbox = `${minY},${minX},${maxY},${maxX}`;
  const amenityRegex = HORECA_AMENITIES.join('|');
  const query = `
[out:json][timeout:25];
(
  node["shop"](${ovBbox});
  node["amenity"~"^(${amenityRegex})$"](${ovBbox});
  way["shop"](${ovBbox});
  way["amenity"~"^(${amenityRegex})$"](${ovBbox});
);
out tags center;`;

  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'ruimtemodel-stadslogistiek/0.1 (https://github.com/robbertj85/modelruimte)',
      Accept: 'application/json',
    },
    body: 'data=' + encodeURIComponent(query),
  });
  if (!resp.ok) throw new Error(`Overpass returned ${resp.status}`);

  const data = (await resp.json()) as {
    elements?: Array<{
      type: string;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }>;
  };

  const pois: OsmPoi[] = [];
  for (const el of data.elements ?? []) {
    const lon = el.type === 'node' ? el.lon : el.center?.lon;
    const lat = el.type === 'node' ? el.lat : el.center?.lat;
    if (typeof lon !== 'number' || typeof lat !== 'number') continue;
    pois.push({
      lon,
      lat,
      shop: el.tags?.shop,
      amenity: el.tags?.amenity,
      brand: el.tags?.brand,
      name: el.tags?.name,
      cuisine: el.tags?.cuisine,
    });
  }
  return pois;
}

export function findNearestOsm(
  pt: [number, number],
  pois: OsmPoi[],
  maxMeters = 25,
  filter?: (poi: OsmPoi) => boolean
): OsmPoi | null {
  let best: OsmPoi | null = null;
  let bestD = Infinity;
  for (const p of pois) {
    if (filter && !filter(p)) continue;
    const d = haversineMeters(pt, [p.lon, p.lat]);
    if (d < bestD && d <= maxMeters) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

const HORECA_AMENITY_SET = new Set(HORECA_AMENITIES);

export function isShopPoi(p: OsmPoi): boolean {
  return Boolean(p.shop) && p.shop !== 'vacant';
}

export function isHorecaPoi(p: OsmPoi): boolean {
  return Boolean(p.amenity && HORECA_AMENITY_SET.has(p.amenity));
}

function haversineMeters(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const x =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
