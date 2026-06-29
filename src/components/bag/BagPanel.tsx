'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import maplibregl, { Map as MaplibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  TerraDraw,
  TerraDrawPolygonMode,
  TerraDrawFreehandMode,
} from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';
import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson';
import {
  bbox as turfBbox,
  booleanPointInPolygon,
  buffer as turfBuffer,
  lineString,
  nearestPointOnLine,
} from '@turf/turf';
import {
  Eraser,
  Highlighter,
  Loader2,
  Magnet,
  MousePointerClick,
  PenLine,
} from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useBag, type BagPolygonFeature } from '@/lib/bag-context';
import { BAG_ICONS } from '@/lib/bag-icons';
import { mapBagToApplyPlan } from '@/lib/bag-mapping';
import { DMI, labelMono, bodyText } from '@/lib/dmi-theme';
import type { BagGebruiksdoel, BagQueryResult } from '@/lib/bag-types';
import type { LocatieserverLookupResult } from '@/app/api/pdok/lookup/route';
import type { PdokReverseResult } from '@/app/api/pdok/reverse/route';
import type { NdwSignProperties } from '@/app/api/ndw/signs/route';
import BagAddressSearch from './BagAddressSearch';
import BagResultPanel from './BagResultPanel';

type DrawMode = 'polygon' | 'freehand' | 'idle';

const BRT_GRIJS_TILE =
  'https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/{z}/{x}/{y}.png';

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    'pdok-brt': {
      type: 'raster' as const,
      tiles: [BRT_GRIJS_TILE],
      tileSize: 256,
      attribution: '© <a href="https://www.kadaster.nl/" target="_blank" rel="noopener">Kadaster</a> — BRT',
      maxzoom: 19,
    },
  },
  layers: [{ id: 'pdok-brt', type: 'raster' as const, source: 'pdok-brt' }],
};

const INITIAL_CENTER: [number, number] = [4.8952, 52.3571];
const INITIAL_ZOOM = 15;
const SNAP_RADIUS_METERS = 40;
const DEFAULT_STREET_BUFFER_METERS = 10;
const MIN_BUFFER_METERS = 5;
const MAX_BUFFER_METERS = 100;

const ICON_SIZE = 32;
const E7_SIGN_BLUE = '#0e518d';
// Extra tolerance (m) around the drawn area so E7 signs right on the curb/boundary are kept.
const E7_BOUNDARY_PAD_METERS = 6;
// Official RVV E7 sign artwork (200×300), © public domain — Wikimedia Commons.
const E7_SIGN_INNER = `<rect width="200" height="300" rx="20" fill="#0e518d"/><path style="fill:none;stroke:#f7fbf5;stroke-width:6.72582531" d="M 175.62623,292.09141 C 184.58296,292.09141 191.86981,285.0188 191.86981,276.30711 L 191.86981,23.66005 C 191.86981,14.956562 184.58296,7.875758 175.62623,7.875758 L 24.34006,7.875758 C 15.38333,7.875758 8.10491,14.956562 8.10491,23.66005 L 8.10491,276.30711 C 8.10491,285.0188 15.38333,292.09141 24.34006,292.09141 L 175.62623,292.09141"/><path fill="#f7fbf5" d="M 77.47607,170.15749 L 53.05663,170.15749 L 53.05663,33.296274 L 108.82467,33.296274 C 135.33625,33.296274 150.57539,50.928494 150.57539,74.180604 C 150.57539,94.260854 137.92212,115.927 108.95856,115.927 L 77.47607,115.927 L 77.47607,170.15749 z M 101.50219,93.528884 C 123.53659,93.528884 127.98029,83.110564 127.98029,74.880034 C 127.98029,66.047654 124.42365,55.629344 101.50219,55.629344 L 77.18317,55.629344 L 77.18317,93.528884 L 101.50219,93.528884"/><path fill="#f7fbf5" d="M 42.86373,269.90809 C 47.56687,269.90809 51.39128,266.19132 51.39128,261.58807 C 51.39128,257.00923 47.56687,253.25994 42.86373,253.25994 C 38.11877,253.25994 34.26086,257.00923 34.26086,261.58807 C 34.26086,266.19132 38.11877,269.90809 42.86373,269.90809 z M 104.60692,269.90809 C 109.35189,269.90809 113.17632,266.19132 113.17632,261.58807 C 113.17632,257.00923 109.35189,253.25994 104.60692,253.25994 C 99.87031,253.25994 96.04589,257.00923 96.04589,261.58807 C 96.04589,266.19132 99.87031,269.90809 104.60692,269.90809 z M 125.17682,247.95726 L 140.95991,247.95726 L 140.95991,210.30985 L 125.17682,210.30985 L 125.17682,247.95726 z M 144.75087,266.57358 L 137.3698,258.57074 L 154.62575,243.35401 L 162.0152,251.35684 L 144.75087,266.57358 z M 150.99381,271.75427 C 152.75958,271.75427 154.19896,270.35539 154.19896,268.63934 C 154.19896,266.9233 152.75958,265.52442 150.99381,265.52442 C 149.23641,265.52442 147.79702,266.9233 147.79702,268.63934 C 147.79702,270.35539 149.23641,271.75427 150.99381,271.75427 z M 116.57395,264.92258 L 119.913,264.92258 L 124.9425,272.22598 L 140.73396,272.22598 L 140.73396,270.25779 L 126.02204,270.25779 L 120.99254,262.95441 L 117.15975,262.95441 L 116.57395,264.92258 z M 116.31453,257.87132 C 114.71613,253.10541 110.0716,249.64078 104.60692,249.64078 C 99.15061,249.64078 94.53955,253.07288 92.94115,257.83878 L 54.3956,257.83878 L 54.30355,257.20442 C 52.50431,252.78823 48.06061,249.64078 42.86373,249.64078 C 36.0601,249.64078 30.60381,254.37416 30.60381,260.98624 L 20.21007,260.98624 L 20.33558,257.35895 L 21.64109,257.13936 L 20.69544,237.63656 L 28.47819,219.9718 L 46.88065,219.9718 L 46.88065,210.30985 L 121.57835,210.30985 L 121.93818,257.83878 L 116.31453,257.83878 L 116.31453,257.87132 z M 46.88065,221.80984 L 29.6498,221.93997 L 23.21437,236.58742 L 46.88065,236.58742 L 46.88065,221.80984 z M 166.42542,236.67688 C 165.25383,236.67688 165.47978,238.32785 165.47978,239.37702 L 165.34588,250.62487 L 160.54234,250.97459 L 160.44191,252.24333 L 166.65973,252.02375 L 168.09075,245.07007 C 169.40462,247.03824 170.96954,249.83598 170.96954,249.83598 L 165.34588,260.15667 L 168.32509,270.60751 L 169.89001,270.85963 L 168.35855,261.55553 L 174.79396,253.90244 L 178.55145,259.96962 L 184.46801,269.90809 L 186.50158,269.90809 L 180.15821,256.65952 L 178.61841,250.27515 L 172.86921,241.3533 L 169.04478,236.93713 C 167.4715,235.69278 166.42542,236.67688 166.42542,236.67688 z M 164.5927,235.3756 C 166.35847,235.3756 167.79787,233.97673 167.79787,232.26067 C 167.79787,230.57715 166.35847,229.17828 164.5927,229.17828 C 162.86041,229.17828 161.42939,230.57715 161.42939,232.26067 C 161.42939,233.97673 162.86041,235.3756 164.5927,235.3756"/>`;

type SourceGeometry = LineString | MultiLineString | Polygon | MultiPolygon;

interface SourceInfo {
  geometry: SourceGeometry;
  label: string;
  isBufferable: boolean;
}

interface Props {
  onApplied?: () => void;
  panelHeight?: string;
}

export default function BagPanel({ onApplied, panelHeight = 'calc(100vh - 180px)' }: Props) {
  const { simulation } = useApp();
  const bag = useBag();

  useEffect(() => {
    if (!bag.hasVisitedBagTab) {
      simulation.resetToBlank();
      bag.markBagTabVisited();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const drawRef = useRef<TerraDraw | null>(null);
  const iconsReadyRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mode, setMode] = useState<DrawMode>('idle');
  const [hasPolygon, setHasPolygon] = useState(!!bag.polygon);
  const [snapping, setSnapping] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<SourceInfo | null>(null);
  const [bufferMeters, setBufferMeters] = useState(DEFAULT_STREET_BUFFER_METERS);
  const [e7On, setE7On] = useState(false);
  const [e7Loading, setE7Loading] = useState(false);
  const [e7Count, setE7Count] = useState<number | null>(null);
  const [e7Error, setE7Error] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      maxZoom: 19,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    mapRef.current = map;

    let draw: TerraDraw | null = null;
    let disposed = false;

    const initDraw = async () => {
      if (disposed || drawRef.current) return;

      await registerBagIcons(map);
      await registerE7Icon(map);
      iconsReadyRef.current = true;
      ensurePolygonLayer(map);
      ensureMarkerLayer(map);
      ensureE7Layer(map);
      wireIconClickHandlers(map);
      wireE7ClickHandlers(map);

      draw = new TerraDraw({
        adapter: new TerraDrawMapLibreGLAdapter({ map }),
        modes: [
          new TerraDrawPolygonMode({
            styles: {
              fillColor: DMI.mediumBlue,
              fillOpacity: 0.2,
              outlineColor: DMI.darkBlue,
              outlineWidth: 2,
              closingPointColor: DMI.yellow,
              closingPointOutlineColor: DMI.darkBlue,
              closingPointWidth: 2,
            },
          }),
          new TerraDrawFreehandMode({
            styles: {
              fillColor: DMI.mediumBlue,
              fillOpacity: 0.2,
              outlineColor: DMI.darkBlue,
              outlineWidth: 2,
            },
          }),
        ],
      });
      draw.start();
      draw.setMode('static');
      drawRef.current = draw;

      if (bag.polygon) {
        if (bag.polygon.geometry.type === 'Polygon') {
          draw.addFeatures([
            {
              id: crypto.randomUUID(),
              type: 'Feature',
              geometry: bag.polygon.geometry,
              properties: { mode: 'polygon' },
            },
          ]);
        }
        setHasPolygon(true);
        fitToBagPolygon(map, bag.polygon);
      }

      draw.on('finish', () => {
        if (!draw) return;
        const snap = draw.getSnapshot();
        const poly = snap.find((f) => f.geometry?.type === 'Polygon');
        if (poly) {
          const feat: Feature<Polygon> = {
            type: 'Feature',
            geometry: poly.geometry as Polygon,
            properties: {},
          };
          setSource(null);
          bag.setPolygon(feat);
          setHasPolygon(true);
          setMode('idle');
          draw.setMode('static');
          map.dragPan.enable();
          map.doubleClickZoom.enable();
        }
      });

      setMapReady(true);
    };

    if (map.isStyleLoaded()) initDraw();
    else map.once('load', initDraw);

    return () => {
      disposed = true;
      if (draw) draw.stop();
      map.remove();
      drawRef.current = null;
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (bag.queryResult) {
      updateMarkers(map, bag.queryResult.features);
    } else {
      clearMarkers(map);
    }
  }, [bag.queryResult, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    updatePolygonHighlight(map, bag.polygon);
  }, [bag.polygon, mapReady]);

  const activate = useCallback(
    (next: DrawMode) => {
      const draw = drawRef.current;
      const map = mapRef.current;
      if (!draw || !map) return;
      if (next === 'idle') {
        draw.setMode('static');
        map.dragPan.enable();
        map.doubleClickZoom.enable();
        setMode('idle');
        return;
      }
      draw.clear();
      bag.setPolygon(null);
      bag.setQueryResult(null);
      setSource(null);
      setHasPolygon(false);
      setError(null);
      setInfo(null);
      map.dragPan.disable();
      map.doubleClickZoom.disable();
      draw.setMode(next);
      setMode(next);
    },
    [bag]
  );

  const handleClear = useCallback(() => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw || !map) return;
    draw.clear();
    bag.reset();
    setSource(null);
    setHasPolygon(false);
    setError(null);
    setInfo(null);
    draw.setMode('static');
    map.dragPan.enable();
    map.doubleClickZoom.enable();
    setMode('idle');
  }, [bag]);

  const handleSnap = useCallback(async () => {
    const draw = drawRef.current;
    if (!draw || !bag.polygon) return;
    if (bag.polygon.geometry.type !== 'Polygon') {
      setError('Snappen werkt alleen op zelf getekende polygonen.');
      return;
    }
    const currentPolygon = bag.polygon as Feature<Polygon>;
    setSnapping(true);
    setError(null);
    setInfo(null);
    try {
      const [minX, minY, maxX, maxY] = turfBbox(currentPolygon);
      const pad = 0.002;
      const params = new URLSearchParams({
        minX: (minX - pad).toString(),
        minY: (minY - pad).toString(),
        maxX: (maxX + pad).toString(),
        maxY: (maxY + pad).toString(),
      });
      const resp = await fetch(`/api/nwb/streets?${params.toString()}`);
      if (!resp.ok) {
        const { error: msg } = await resp.json().catch(() => ({ error: `NWB ${resp.status}` }));
        setError(msg ?? 'Straten konden niet worden geladen.');
        return;
      }
      const fc = (await resp.json()) as FeatureCollection;
      const segments = fc.features
        .filter((f): f is Feature<LineString> => f.geometry?.type === 'LineString')
        .map((f) => lineString(f.geometry.coordinates));
      if (segments.length === 0) {
        setInfo('Geen straatgeometrie gevonden — polygon ongewijzigd.');
        return;
      }
      const ring = currentPolygon.geometry.coordinates[0];
      let snapped = 0;
      const snappedRing: Position[] = ring.map((pt) => {
        let bestCoord: Position | null = null;
        let bestDist = Infinity;
        for (const seg of segments) {
          const npo = nearestPointOnLine(seg, pt as Position, { units: 'meters' });
          const d = (npo.properties as { dist?: number }).dist ?? Infinity;
          if (d < bestDist) {
            bestDist = d;
            bestCoord = npo.geometry.coordinates;
          }
        }
        if (bestCoord && bestDist < SNAP_RADIUS_METERS) {
          snapped += 1;
          return bestCoord;
        }
        return pt;
      });
      const first = snappedRing[0];
      const last = snappedRing[snappedRing.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) snappedRing.push(first);
      const snappedPoly: Feature<Polygon> = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [snappedRing] },
        properties: {},
      };
      draw.clear();
      draw.addFeatures([
        {
          id: crypto.randomUUID(),
          type: 'Feature',
          geometry: snappedPoly.geometry,
          properties: { mode: 'polygon' },
        },
      ]);
      bag.setPolygon(snappedPoly);
      setInfo(`${snapped}/${ring.length} punten gehecht aan straten.`);
    } catch (err) {
      setError(`Snap mislukt: ${(err as Error).message}`);
    } finally {
      setSnapping(false);
    }
  }, [bag]);

  const handleQuery = useCallback(async () => {
    if (!bag.polygon) return;
    bag.setQuerying(true);
    setError(null);
    bag.setQueryError(null);
    try {
      const resp = await fetch('/api/bag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ polygon: bag.polygon }),
      });
      if (!resp.ok) {
        const { error: msg } = await resp.json().catch(() => ({ error: `BAG ${resp.status}` }));
        setError(msg ?? 'BAG-query mislukt.');
        bag.setQueryError(msg ?? null);
        return;
      }
      const result = (await resp.json()) as BagQueryResult;
      bag.setQueryResult(result);
    } catch (err) {
      setError(`BAG-query mislukt: ${(err as Error).message}`);
    } finally {
      bag.setQuerying(false);
    }
  }, [bag]);

  const handleAddressSelect = useCallback(
    (lookup: LocatieserverLookupResult) => {
      const map = mapRef.current;
      const draw = drawRef.current;
      if (!map || !draw) return;

      setError(null);
      setInfo(null);
      draw.clear();

      if (lookup.geometry) {
        const g = lookup.geometry;
        const isLine = g.type === 'LineString' || g.type === 'MultiLineString';
        setSource({
          geometry: g,
          label: lookup.weergavenaam,
          isBufferable: isLine || lookup.type === 'weg',
        });
        setInfo(
          isLine
            ? `${lookup.weergavenaam} — stel de buffer in en klik BAG ophalen.`
            : `${lookup.weergavenaam} geselecteerd. Klik BAG ophalen.`
        );
        return;
      }

      if (lookup.centroid) {
        setSource(null);
        bag.setPolygon(null);
        setHasPolygon(false);
        map.flyTo({ center: lookup.centroid.coordinates as [number, number], zoom: 17 });
        setInfo('Ingezoomd. Teken zelf een polygon om dit adres.');
      }
    },
    [bag]
  );

  // Recompute buffered polygon whenever source or bufferMeters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !source) return;
    let poly: BagPolygonFeature | null = null;
    if (source.isBufferable) {
      try {
        const buffered = turfBuffer(
          { type: 'Feature', geometry: source.geometry, properties: {} },
          bufferMeters,
          { units: 'meters' }
        );
        if (buffered?.geometry) {
          poly = {
            type: 'Feature',
            geometry: buffered.geometry as Polygon | MultiPolygon,
            properties: {},
          };
        }
      } catch {
        // ignore
      }
    } else if (source.geometry.type === 'Polygon' || source.geometry.type === 'MultiPolygon') {
      poly = { type: 'Feature', geometry: source.geometry, properties: {} };
    }
    if (poly) {
      bag.setPolygon(poly);
      bag.setQueryResult(null);
      setHasPolygon(true);
      fitToBagPolygon(map, poly);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, bufferMeters]);

  const handleApply = useCallback(
    (plan: ReturnType<typeof mapBagToApplyPlan>) => {
      simulation.handleApplyBagPlan(plan);
      onApplied?.();
    },
    [simulation, onApplied]
  );

  const loadE7 = useCallback(async () => {
    const map = mapRef.current;
    if (!map) return;
    let minX: number, minY: number, maxX: number, maxY: number;
    if (bag.polygon) {
      [minX, minY, maxX, maxY] = turfBbox(bag.polygon);
    } else {
      const b = map.getBounds();
      [minX, minY, maxX, maxY] = [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()];
    }
    setE7Loading(true);
    setE7Error(null);
    try {
      const params = new URLSearchParams({
        minX: String(minX),
        minY: String(minY),
        maxX: String(maxX),
        maxY: String(maxY),
      });
      const resp = await fetch(`/api/ndw/signs?${params.toString()}`);
      if (!resp.ok) {
        const { error: msg } = await resp
          .json()
          .catch(() => ({ error: `NDW ${resp.status}` }));
        setE7Error(msg ?? 'Laad/loszones konden niet worden geladen.');
        setE7Count(null);
        updateE7(map, { type: 'FeatureCollection', features: [] });
        return;
      }
      const fc = (await resp.json()) as FeatureCollection<GeoJSON.Point, NdwSignProperties>;
      const clipped = bag.polygon ? clipToPolygon(fc, bag.polygon) : fc;
      updateE7(map, clipped);
      setE7Count(clipped.features.length);
    } catch (err) {
      setE7Error(`NDW-query mislukt: ${(err as Error).message}`);
      setE7Count(null);
    } finally {
      setE7Loading(false);
    }
  }, [bag.polygon]);

  const handleToggleE7 = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const next = !e7On;
    setE7On(next);
    setE7Visibility(map, next);
    if (next) {
      loadE7();
    } else {
      setE7Error(null);
    }
  }, [e7On, loadE7]);

  // Refresh E7 signs when the selected area changes while the layer is on.
  useEffect(() => {
    if (!mapReady || !e7On) return;
    loadE7();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bag.polygon, mapReady]);

  const modeLabel =
    mode === 'polygon'
      ? 'Klik punten, dubbelklik om te sluiten'
      : mode === 'freehand'
      ? 'Sleep om vrije hand te tekenen'
      : hasPolygon
      ? 'Polygon getekend'
      : 'Zoek een straat of kies een tekentool';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: panelHeight,
        minHeight: 500,
        gap: 12,
        backgroundColor: DMI.blueTint2,
        padding: 12,
        borderRadius: 10,
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: 1,
          minWidth: 320,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 220, maxWidth: 460 }}>
            <BagAddressSearch onSelect={handleAddressSelect} />
          </div>
          <button
            onClick={handleQuery}
            disabled={!hasPolygon || bag.isQuerying}
            style={{
              backgroundColor: hasPolygon && !bag.isQuerying ? DMI.yellow : DMI.darkGray,
              color: DMI.darkBlue,
              border: 'none',
              padding: '8px 14px',
              borderRadius: 6,
              cursor: hasPolygon && !bag.isQuerying ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              opacity: hasPolygon && !bag.isQuerying ? 1 : 0.5,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {bag.isQuerying ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <MousePointerClick size={12} />
            )}
            BAG ophalen
          </button>
        </div>

        {source?.isBufferable && (
          <div
            style={{
              position: 'absolute',
              top: 56,
              right: 48,
              backgroundColor: DMI.white,
              padding: '8px 14px',
              borderRadius: 8,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              zIndex: 15,
              minWidth: 260,
            }}
          >
            <span style={{ ...labelMono, fontSize: 10, color: DMI.darkBlue }}>BUFFER</span>
            <input
              type="range"
              min={MIN_BUFFER_METERS}
              max={MAX_BUFFER_METERS}
              step={5}
              value={bufferMeters}
              onChange={(e) => setBufferMeters(Number(e.target.value))}
              style={{ flex: 1, accentColor: DMI.darkBlue }}
            />
            <span
              style={{
                ...labelMono,
                fontSize: 11,
                color: DMI.darkBlue,
                fontWeight: 600,
                minWidth: 36,
                textAlign: 'right',
              }}
            >
              {bufferMeters} m
            </span>
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            top: 60,
            left: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            backgroundColor: DMI.white,
            padding: 6,
            borderRadius: 8,
            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <ToolButton
            active={mode === 'polygon'}
            onClick={() => activate(mode === 'polygon' ? 'idle' : 'polygon')}
            icon={<PenLine size={14} />}
            label="Polygon"
          />
          <ToolButton
            active={mode === 'freehand'}
            onClick={() => activate(mode === 'freehand' ? 'idle' : 'freehand')}
            icon={<Highlighter size={14} />}
            label="Vrije hand"
          />
          <div style={{ height: 1, backgroundColor: DMI.blueTint2, margin: '2px 0' }} />
          <ToolButton
            active={false}
            disabled={!hasPolygon || snapping}
            onClick={handleSnap}
            icon={snapping ? <Loader2 size={14} className="animate-spin" /> : <Magnet size={14} />}
            label={snapping ? 'Hechten…' : 'Straat-snap'}
          />
          <ToolButton
            active={false}
            disabled={!hasPolygon}
            onClick={handleClear}
            icon={<Eraser size={14} />}
            label="Wissen"
          />
          <div style={{ height: 1, backgroundColor: DMI.blueTint2, margin: '2px 0' }} />
          <ToolButton
            active={e7On}
            disabled={e7Loading}
            onClick={handleToggleE7}
            icon={
              e7Loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <E7SignGlyph height={18} />
              )
            }
            label={
              e7On && e7Count !== null
                ? `Laden/lossen · ${e7Count}`
                : 'Laden/lossen (E7)'
            }
          />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            backgroundColor: 'rgba(255,255,255,0.92)',
            padding: '4px 10px',
            borderRadius: 4,
            fontSize: 10,
            ...labelMono,
            color: DMI.darkBlue,
            zIndex: 10,
          }}
        >
          {modeLabel}
        </div>

        {info && (
          <div
            style={{
              position: 'absolute',
              bottom: 38,
              left: 10,
              right: 10,
              backgroundColor: DMI.white,
              color: DMI.darkBlue,
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              ...bodyText,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
          >
            {info}
          </div>
        )}

        {e7Error && (
          <div
            style={{
              position: 'absolute',
              bottom: info ? 70 : 38,
              left: 10,
              right: 10,
              backgroundColor: '#fdecec',
              color: '#a11',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              ...bodyText,
              boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
              zIndex: 10,
            }}
          >
            {e7Error}
          </div>
        )}
      </div>

      <div
        style={{
          width: 360,
          flexShrink: 0,
          backgroundColor: DMI.white,
          borderRadius: 8,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        }}
      >
        <BagResultPanel
          result={bag.queryResult}
          isQuerying={bag.isQuerying}
          error={error ?? bag.queryError}
          onApply={handleApply}
          onReset={handleClear}
        />
      </div>
    </div>
  );
}

function E7SignGlyph({ height = 18 }: { height?: number }) {
  return (
    <svg
      width={(height * 2) / 3}
      height={height}
      viewBox="0 0 200 300"
      style={{ display: 'block', flexShrink: 0 }}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: E7_SIGN_INNER }}
    />
  );
}

function ToolButton({
  active,
  disabled,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        borderRadius: 4,
        border: `1px solid ${active ? DMI.darkBlue : DMI.blueTint2}`,
        backgroundColor: active ? DMI.darkBlue : DMI.white,
        color: active ? DMI.white : DMI.darkBlue,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        fontSize: 11,
        fontFamily: 'inherit',
        minWidth: 120,
        textAlign: 'left',
        whiteSpace: 'nowrap',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function fitToBagPolygon(map: MaplibreMap, polygon: BagPolygonFeature) {
  const [minX, minY, maxX, maxY] = turfBbox(polygon);
  map.fitBounds(
    [
      [minX, minY],
      [maxX, maxY],
    ],
    { padding: 60, duration: 600 }
  );
}

async function registerBagIcons(map: MaplibreMap) {
  for (const [key, cfg] of Object.entries(BAG_ICONS)) {
    const imageName = `bag-${key}`;
    if (map.hasImage(imageName)) continue;
    const svgMarkup = renderToStaticMarkup(
      <cfg.icon size={ICON_SIZE - 10} color={cfg.color} strokeWidth={2.5} />
    );
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">
      <circle cx="${ICON_SIZE / 2}" cy="${ICON_SIZE / 2}" r="${ICON_SIZE / 2 - 1}" fill="white" stroke="${cfg.color}" stroke-width="1.5" />
      <g transform="translate(5,5)">${svgMarkup}</g>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = ICON_SIZE;
      canvas.height = ICON_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(img, 0, 0, ICON_SIZE, ICON_SIZE);
      const imageData = ctx.getImageData(0, 0, ICON_SIZE, ICON_SIZE);
      map.addImage(imageName, imageData);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function ensureMarkerLayer(map: MaplibreMap) {
  if (!map.getSource('bag-vbo')) {
    map.addSource('bag-vbo', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer('bag-vbo-icons')) {
    map.addLayer({
      id: 'bag-vbo-icons',
      source: 'bag-vbo',
      type: 'symbol',
      layout: {
        'icon-image': ['concat', 'bag-', ['get', 'gebruiksdoel']],
        'icon-size': 0.6,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    });
  }
}

function wireIconClickHandlers(map: MaplibreMap) {
  let activePopup: maplibregl.Popup | null = null;

  map.on('click', 'bag-vbo-icons', async (e) => {
    const feat = e.features?.[0];
    if (!feat || feat.geometry.type !== 'Point') return;
    const coords = feat.geometry.coordinates as [number, number];
    const rawProps = feat.properties as { gebruiksdoel: BagGebruiksdoel; oppervlakte: number; osm?: string };
    // MapLibre flattens object props to JSON strings
    const osmTags = typeof rawProps.osm === 'string' ? JSON.parse(rawProps.osm) : (rawProps.osm as object | undefined);
    const cfg = BAG_ICONS[rawProps.gebruiksdoel];
    if (!cfg) return;

    if (activePopup) activePopup.remove();
    activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '300px', offset: 12 })
      .setLngLat(coords)
      .setHTML(buildPopupHtml(cfg, rawProps.oppervlakte, null, true, osmTags))
      .addTo(map);

    try {
      const resp = await fetch(`/api/pdok/reverse?lat=${coords[1]}&lon=${coords[0]}`);
      if (!resp.ok) {
        activePopup.setHTML(buildPopupHtml(cfg, rawProps.oppervlakte, null, false, osmTags));
        return;
      }
      const data = (await resp.json()) as PdokReverseResult;
      activePopup.setHTML(buildPopupHtml(cfg, rawProps.oppervlakte, data.weergavenaam, false, osmTags));
    } catch {
      activePopup.setHTML(buildPopupHtml(cfg, rawProps.oppervlakte, null, false, osmTags));
    }
  });

  map.on('mouseenter', 'bag-vbo-icons', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'bag-vbo-icons', () => {
    map.getCanvas().style.cursor = '';
  });
}

function buildPopupHtml(
  cfg: { label: string; color: string; icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }> },
  oppervlakte: number,
  address: string | null,
  loading: boolean,
  osm?: { name?: string; shop?: string; amenity?: string; brand?: string; cuisine?: string }
): string {
  const Icon = cfg.icon;
  const iconSvg = renderToStaticMarkup(<Icon size={18} color={cfg.color} strokeWidth={2.2} />);
  const addressLine = loading
    ? `<em style="color:#888;">Adres ophalen…</em>`
    : address
    ? `<div style="color:#0a3660;">${escapeHtml(address)}</div>`
    : `<em style="color:#888;">Geen adres gevonden</em>`;

  let osmBlock = '';
  if (osm && (osm.name || osm.shop || osm.amenity)) {
    const parts: string[] = [];
    if (osm.name) parts.push(`<strong>${escapeHtml(osm.name)}</strong>`);
    const tags: string[] = [];
    if (osm.shop) tags.push(`shop=${escapeHtml(osm.shop)}`);
    if (osm.amenity) tags.push(`amenity=${escapeHtml(osm.amenity)}`);
    if (osm.brand) tags.push(`brand=${escapeHtml(osm.brand)}`);
    if (osm.cuisine) tags.push(`cuisine=${escapeHtml(osm.cuisine)}`);
    if (tags.length) parts.push(`<span style="font-family: var(--font-ibm-plex-mono), ui-monospace, monospace; font-size:10px; color:#565656;">${tags.join(' · ')}</span>`);
    osmBlock = `<div style="margin-top:6px; padding:6px 8px; background:#f4f8fc; border-left:2px solid ${cfg.color}; border-radius:3px; font-size:11px;">${parts.join('<br>')}<div style="font-size:9px; color:#888; margin-top:2px;">via OpenStreetMap</div></div>`;
  }

  return `
    <div style="font-family: var(--font-ibm-plex-sans), system-ui, sans-serif; padding: 4px 2px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid #daebfb;">
        ${iconSvg}
        <strong style="font-size:13px; color:${cfg.color};">${escapeHtml(cfg.label)}</strong>
      </div>
      <div style="font-size:12px; line-height:1.45;">${addressLine}</div>
      <div style="font-size:11px; color:#565656; margin-top:4px; font-family: var(--font-ibm-plex-mono), ui-monospace, monospace;">${oppervlakte.toLocaleString('nl-NL')} m²</div>
      ${osmBlock}
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] ?? c));
}

function updateMarkers(
  map: MaplibreMap,
  fc: FeatureCollection<GeoJSON.Point, { gebruiksdoel: BagGebruiksdoel; oppervlakte: number; id?: string }>
) {
  const src = map.getSource('bag-vbo');
  if (src && 'setData' in src) {
    (src as maplibregl.GeoJSONSource).setData(fc);
  }
}

function clearMarkers(map: MaplibreMap) {
  const src = map.getSource('bag-vbo');
  if (src && 'setData' in src) {
    (src as maplibregl.GeoJSONSource).setData({ type: 'FeatureCollection', features: [] });
  }
}

function ensurePolygonLayer(map: MaplibreMap) {
  if (!map.getSource('bag-selection')) {
    map.addSource('bag-selection', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer('bag-selection-fill')) {
    map.addLayer({
      id: 'bag-selection-fill',
      source: 'bag-selection',
      type: 'fill',
      paint: {
        'fill-color': DMI.mediumBlue,
        'fill-opacity': 0.18,
      },
    });
  }
  if (!map.getLayer('bag-selection-outline')) {
    map.addLayer({
      id: 'bag-selection-outline',
      source: 'bag-selection',
      type: 'line',
      paint: {
        'line-color': DMI.darkBlue,
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });
  }
}

function updatePolygonHighlight(map: MaplibreMap, polygon: BagPolygonFeature | null) {
  const src = map.getSource('bag-selection');
  if (!src || !('setData' in src)) return;
  const data: FeatureCollection = polygon
    ? { type: 'FeatureCollection', features: [polygon] }
    : { type: 'FeatureCollection', features: [] };
  (src as maplibregl.GeoJSONSource).setData(data);
}

// ── NDW E7 (laden/lossen) sign layer ──────────────────────────────────────────

const E7_ICON_W = 40;
const E7_ICON_H = 60; // RVV E7 is a 2:3 portrait sign.

async function registerE7Icon(map: MaplibreMap) {
  const imageName = 'ndw-e7';
  if (map.hasImage(imageName)) return;
  // Render at 2× for a crisp marker on retina.
  const scale = 2;
  const w = E7_ICON_W * scale;
  const h = E7_ICON_H * scale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 200 300">${E7_SIGN_INNER}</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, w, h);
    map.addImage(imageName, ctx.getImageData(0, 0, w, h), { pixelRatio: scale });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function ensureE7Layer(map: MaplibreMap) {
  if (!map.getSource('ndw-e7')) {
    map.addSource('ndw-e7', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    });
  }
  if (!map.getLayer('ndw-e7-icons')) {
    map.addLayer({
      id: 'ndw-e7-icons',
      source: 'ndw-e7',
      type: 'symbol',
      layout: {
        'icon-image': 'ndw-e7',
        'icon-size': 0.48,
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        visibility: 'none',
      },
    });
  }
}

function updateE7(map: MaplibreMap, fc: FeatureCollection) {
  const src = map.getSource('ndw-e7');
  if (src && 'setData' in src) {
    (src as maplibregl.GeoJSONSource).setData(fc);
  }
}

// Keep only signs inside the drawn polygon, grown by a small boundary tolerance.
function clipToPolygon(
  fc: FeatureCollection<GeoJSON.Point, NdwSignProperties>,
  polygon: BagPolygonFeature
): FeatureCollection<GeoJSON.Point, NdwSignProperties> {
  let area: Feature<Polygon | MultiPolygon> = polygon;
  try {
    const buffered = turfBuffer(polygon, E7_BOUNDARY_PAD_METERS, { units: 'meters' });
    if (buffered?.geometry) area = buffered as Feature<Polygon | MultiPolygon>;
  } catch {
    // fall back to the raw polygon
  }
  const features = fc.features.filter((f) => booleanPointInPolygon(f.geometry, area));
  return { type: 'FeatureCollection', features };
}

function setE7Visibility(map: MaplibreMap, on: boolean) {
  if (map.getLayer('ndw-e7-icons')) {
    map.setLayoutProperty('ndw-e7-icons', 'visibility', on ? 'visible' : 'none');
  }
}

function wireE7ClickHandlers(map: MaplibreMap) {
  let activePopup: maplibregl.Popup | null = null;
  map.on('click', 'ndw-e7-icons', (e) => {
    const feat = e.features?.[0];
    if (!feat || feat.geometry.type !== 'Point') return;
    const coords = feat.geometry.coordinates as [number, number];
    const p = feat.properties as Record<string, unknown>;
    if (activePopup) activePopup.remove();
    activePopup = new maplibregl.Popup({ closeButton: true, maxWidth: '280px', offset: 12 })
      .setLngLat(coords)
      .setHTML(buildE7PopupHtml(p, coords))
      .addTo(map);
  });
  map.on('mouseenter', 'ndw-e7-icons', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'ndw-e7-icons', () => {
    map.getCanvas().style.cursor = '';
  });
}

// Deep-link into NDW's public "George" sign viewer, centered on a small bbox
// around the sign (the viewer has no center/zoom or sign-id param — bbox only).
function georgeViewerUrl(lon: number, lat: number): string {
  const dLon = 0.003;
  const dLat = 0.0015;
  const bbox = [lon - dLon, lat - dLat, lon + dLon, lat + dLat]
    .map((n) => n.toFixed(5))
    .join(',');
  return `https://wegkenmerken.ndw.nu/kaart?kaartlagen=BRT,TRAFFIC_SIGN&amp;zichtbaar-gebied=${bbox}`;
}

function buildE7PopupHtml(p: Record<string, unknown>, coords: [number, number]): string {
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);
  const roadName = str(p.roadName);
  const restriction = str(p.restriction);
  const status = str(p.status);
  const town = str(p.townName);
  const imageUrl = str(p.imageUrl);
  const validated = p.validated === true || p.validated === 'true';

  const restrictionBlock = restriction
    ? `<div style="margin-top:6px; padding:6px 8px; background:#eef3fe; border-left:2px solid ${E7_SIGN_BLUE}; border-radius:3px; font-size:11px; color:#0a3660;">${escapeHtml(restriction)}<div style="font-size:9px; color:#888; margin-top:2px;">onderbord</div></div>`
    : `<div style="margin-top:6px; font-size:11px; color:#888;"><em>Geen tijdvenster op onderbord — doorgaans permanent.</em></div>`;

  const imageBlock = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Bordfoto" style="margin-top:8px; width:100%; max-height:130px; object-fit:cover; border-radius:4px;" loading="lazy" />`
    : '';

  const meta = [town, status ? status.toLowerCase() : null, validated ? 'gevalideerd' : null]
    .filter(Boolean)
    .join(' · ');

  return `
    <div style="font-family: var(--font-ibm-plex-sans), system-ui, sans-serif; padding: 4px 2px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px; padding-bottom:6px; border-bottom:1px solid #daebfb;">
        <span style="display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:3px; background:${E7_SIGN_BLUE}; color:#fff; font-size:10px; font-weight:700;">E7</span>
        <strong style="font-size:13px; color:${E7_SIGN_BLUE};">Laden en lossen</strong>
      </div>
      ${roadName ? `<div style="font-size:12px; color:#0a3660;">${escapeHtml(roadName)}</div>` : ''}
      ${meta ? `<div style="font-size:10px; color:#565656; margin-top:2px; font-family: var(--font-ibm-plex-mono), ui-monospace, monospace;">${escapeHtml(meta)}</div>` : ''}
      ${restrictionBlock}
      ${imageBlock}
      <a href="${georgeViewerUrl(coords[0], coords[1])}" target="_blank" rel="noopener noreferrer"
         style="display:inline-flex; align-items:center; gap:4px; margin-top:8px; padding:5px 9px; background:${E7_SIGN_BLUE}; color:#fff; border-radius:4px; font-size:11px; font-weight:600; text-decoration:none;">
        Bekijk in NDW George ↗
      </a>
      <div style="font-size:9px; color:#999; margin-top:6px;">via NDW Verkeersborden</div>
    </div>
  `;
}
