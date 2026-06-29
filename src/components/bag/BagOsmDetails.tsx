'use client';

import { useMemo } from 'react';
import { useBag } from '@/lib/bag-context';
import { BAG_ICONS } from '@/lib/bag-icons';
import { classifyHoreca, classifyWinkel } from '@/lib/bag-mapping';
import { DMI, heading, bodyText, labelMono } from '@/lib/dmi-theme';
import { FUNCTIONS } from '@/lib/model-data';
import type { BagVboProperties } from '@/lib/bag-types';

const FUNC_NAME: Record<string, string> = Object.fromEntries(
  FUNCTIONS.map((f) => [f.id, f.name])
);

interface Row {
  vboId: string;
  gebruiksdoel: 'winkelfunctie' | 'bijeenkomstfunctie';
  oppervlakte: number;
  funcId: string;
  osm?: BagVboProperties['osm'];
}

export default function BagOsmDetails() {
  const { queryResult } = useBag();

  const rows = useMemo<Row[]>(() => {
    if (!queryResult) return [];
    const out: Row[] = [];
    queryResult.features.features.forEach((f, idx) => {
      const g = f.properties.gebruiksdoel;
      if (g !== 'winkelfunctie' && g !== 'bijeenkomstfunctie') return;
      const funcId =
        g === 'winkelfunctie' ? classifyWinkel(f.properties) : classifyHoreca(f.properties);
      out.push({
        vboId: f.properties.id ?? `idx-${idx}`,
        gebruiksdoel: g,
        oppervlakte: f.properties.oppervlakte,
        funcId,
        osm: f.properties.osm,
      });
    });
    return out.sort((a, b) => {
      if (a.funcId !== b.funcId) return a.funcId.localeCompare(b.funcId);
      if (!!a.osm !== !!b.osm) return a.osm ? -1 : 1;
      return b.oppervlakte - a.oppervlakte;
    });
  }, [queryResult]);

  if (!queryResult || rows.length === 0) return null;

  const matched = rows.filter((r) => !!r.osm).length;
  const total = rows.length;
  const matchPct = Math.round((matched / total) * 100);

  return (
    <div
      style={{
        marginTop: 16,
        backgroundColor: DMI.white,
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 6,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h3 style={{ ...heading, fontSize: 16, margin: 0 }}>
          OSM-verrijking — winkel &amp; horeca detail
        </h3>
        <span style={{ ...labelMono, fontSize: 11, color: DMI.darkGray }}>
          {matched}/{total} VBO&apos;s ({matchPct}%) gematcht met OpenStreetMap binnen 25 m
        </span>
      </div>
      <p style={{ ...bodyText, fontSize: 12, color: DMI.darkGray, margin: '0 0 14px' }}>
        BAG geeft alleen <code>winkelfunctie</code> en <code>bijeenkomstfunctie</code> als ruwe
        categorie. De OSM-tags hieronder bepalen of het naar F2 (Supermarkt), F3 (Retail Food),
        F4 (Retail Keten), F5 (Retail Onafh.), F6/F7 (Restaurant) of F8 (Café) gaat.
        VBO&apos;s zonder OSM-match krijgen de standaard F5 (winkel) of F7 (horeca).
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 720 }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: `1px solid ${DMI.blueTint2}` }}>
              <Th>Functie</Th>
              <Th>BAG</Th>
              <Th align="right">m²</Th>
              <Th>OSM naam</Th>
              <Th>OSM tags</Th>
              <Th>VBO id</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const cfg = BAG_ICONS[r.gebruiksdoel];
              const Icon = cfg.icon;
              return (
                <tr key={r.vboId} style={{ borderBottom: `1px solid ${DMI.blueTint2}` }}>
                  <Td>
                    <strong>{r.funcId}</strong>{' '}
                    <span style={{ color: DMI.darkGray }}>
                      {FUNC_NAME[r.funcId] ?? r.funcId}
                    </span>
                  </Td>
                  <Td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon size={12} color={cfg.color} />
                      <span style={{ fontSize: 11, color: DMI.darkGray }}>
                        {r.gebruiksdoel}
                      </span>
                    </span>
                  </Td>
                  <Td align="right">{r.oppervlakte.toLocaleString('nl-NL')}</Td>
                  <Td>
                    {r.osm?.name ? (
                      r.osm.name
                    ) : (
                      <em style={{ color: DMI.darkGray }}>—</em>
                    )}
                  </Td>
                  <Td>
                    {r.osm ? (
                      <span style={{ ...labelMono, fontSize: 10 }}>
                        {[
                          r.osm.shop && `shop=${r.osm.shop}`,
                          r.osm.amenity && `amenity=${r.osm.amenity}`,
                          r.osm.brand && `brand=${r.osm.brand}`,
                          r.osm.cuisine && `cuisine=${r.osm.cuisine}`,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    ) : (
                      <em style={{ color: DMI.darkGray, fontSize: 11 }}>geen OSM-match</em>
                    )}
                  </Td>
                  <Td>
                    <span style={{ ...labelMono, fontSize: 9, color: DMI.darkGray }}>
                      …{r.vboId.slice(-8)}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      style={{
        padding: '8px 10px',
        textAlign: align ?? 'left',
        ...labelMono,
        fontSize: 10,
        color: DMI.darkBlue,
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{ padding: '8px 10px', textAlign: align ?? 'left', verticalAlign: 'top' }}>
      {children}
    </td>
  );
}
