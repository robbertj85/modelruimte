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
      iconsReadyRef.current = true;
      ensurePolygonLayer(map);
      ensureMarkerLayer(map);
      wireIconClickHandlers(map);

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
