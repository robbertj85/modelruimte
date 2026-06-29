import type {
  LineString,
  MultiLineString,
  MultiPolygon,
  Point,
  Polygon,
  Position,
} from 'geojson';

function parseRing(ring: string): Position[] {
  return ring.split(',').map((pair) => {
    const [x, y] = pair.trim().split(/\s+/).map(Number);
    return [x, y] as Position;
  });
}

export function wktToGeoJSON(
  wkt: string
): Point | LineString | MultiLineString | Polygon | MultiPolygon | null {
  const trimmed = wkt.trim();
  if (trimmed.startsWith('POINT')) {
    const inner = trimmed.replace(/^POINT\s*\(/, '').replace(/\)$/, '').trim();
    const [x, y] = inner.split(/\s+/).map(Number);
    if (Number.isNaN(x) || Number.isNaN(y)) return null;
    return { type: 'Point', coordinates: [x, y] };
  }

  if (trimmed.startsWith('LINESTRING')) {
    const inner = trimmed.replace(/^LINESTRING\s*\(/, '').replace(/\)$/, '');
    return { type: 'LineString', coordinates: parseRing(inner) };
  }

  if (trimmed.startsWith('MULTILINESTRING')) {
    const body = trimmed.replace(/^MULTILINESTRING\s*\(/, '').replace(/\)$/, '');
    const lines = body.split(/\)\s*,\s*\(/).map((l) => l.replace(/^\(/, '').replace(/\)$/, ''));
    return { type: 'MultiLineString', coordinates: lines.map(parseRing) };
  }

  if (trimmed.startsWith('POLYGON')) {
    const body = trimmed.replace(/^POLYGON\s*\(/, '').replace(/\)$/, '');
    const rings = body
      .split(/\)\s*,\s*\(/)
      .map((r) => r.replace(/^\(/, '').replace(/\)$/, ''))
      .map(parseRing);
    return { type: 'Polygon', coordinates: rings };
  }

  if (trimmed.startsWith('MULTIPOLYGON')) {
    const body = trimmed.replace(/^MULTIPOLYGON\s*\(\s*/, '').replace(/\s*\)$/, '');
    const polygonStrings = body.split(/\)\s*\)\s*,\s*\(\s*\(/);
    const polygons = polygonStrings.map((polyStr, idx) => {
      let p = polyStr;
      if (idx === 0) p = p.replace(/^\(\(/, '').replace(/^\(/, '');
      if (idx === polygonStrings.length - 1) p = p.replace(/\)\)$/, '').replace(/\)$/, '');
      const rings = p.split(/\)\s*,\s*\(/).map(parseRing);
      return rings;
    });
    return { type: 'MultiPolygon', coordinates: polygons };
  }

  return null;
}
