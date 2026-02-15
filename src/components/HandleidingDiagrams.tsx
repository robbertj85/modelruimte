'use client';

import { useState, useEffect } from 'react';
import type { DiagramKey } from '@/lib/content';
import { Home, ShoppingCart, UtensilsCrossed, Building2, ShoppingBag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * SVG diagrams for the Handleiding (manual) sections.
 * All text is in Dutch. Accepts a color theme so Rebel uses its warm Excel
 * palette while DMI / Webapp use the DMI style-guide blues.
 */

// ---------------------------------------------------------------------------
// Theme definitions
// ---------------------------------------------------------------------------

export type DiagramTheme = 'rebel' | 'dmi';

interface ThemeColors {
  /** Primary accent (step boxes, headers) */
  primary: string;
  /** Secondary / category 1 */
  cat1: string;
  /** Category 2 */
  cat2: string;
  /** Category 3 */
  cat3: string;
  /** Category 4 */
  cat4: string;
  /** Category 5 */
  cat5: string;
  /** Highlight / call-to-action */
  highlight: string;
  /** Dark background / totals */
  dark: string;
  darkText: string;
  mid: string;
  light: string;
  white: string;
  bg: string;
  font: string;
  /** Period bar colors [P1..P4] */
  periods: [string, string, string, string];
}

const REBEL_THEME: ThemeColors = {
  primary: '#c0504d',
  cat1: '#4bacc6',
  cat2: '#f79646',
  cat3: '#9bbb59',
  cat4: '#8064a2',
  cat5: '#4f81bd',
  highlight: '#c0504d',
  dark: '#2d2d2d',
  darkText: '#333333',
  mid: '#666666',
  light: '#e8e8e8',
  white: '#ffffff',
  bg: '#f9f9f9',
  font: 'Calibri, Arial, sans-serif',
  periods: ['#4f81bd', '#c0504d', '#f79646', '#9bbb59'],
};

const DMI_THEME: ThemeColors = {
  primary: '#0a3660',
  cat1: '#115491',
  cat2: '#ffba08',
  cat3: '#9ce4a3',
  cat4: '#dfbdf9',
  cat5: '#b3edeb',
  highlight: '#ffba08',
  dark: '#0a3660',
  darkText: '#0a3660',
  mid: '#565656',
  light: '#daebfb',
  white: '#ffffff',
  bg: '#f6f9fd',
  font: 'var(--font-ibm-plex-sans-condensed), sans-serif',
  periods: ['#a3cdf4', '#115491', '#ffba08', '#ffd493'],
};

function themeFor(t: DiagramTheme): ThemeColors {
  return t === 'rebel' ? REBEL_THEME : DMI_THEME;
}

// ---------------------------------------------------------------------------
// 1. Model Overview Flowchart — section "1. Algemeen"
// ---------------------------------------------------------------------------
function DiagramModelOverview({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const boxW = 160;
  const boxH = 48;
  const gap = 24;
  const totalW = 400;
  const cx = totalW / 2;
  const startX = cx - boxW / 2;

  const steps = [
    { label: 'Functies', sub: '(woningen, winkels, ...)', color: c.cat1 },
    { label: 'Voertuigbewegingen', sub: '(stops per week)', color: c.cat2 },
    { label: 'Monte Carlo Simulatie', sub: '(1000+ scenario\'s)', color: c.primary },
    { label: 'Piekbelasting', sub: '(gelijktijdig aanwezig)', color: c.cat4 },
    { label: 'Benodigde Ruimte', sub: '(meters laad-/losruimte)', color: c.cat3 },
  ];

  const totalH = steps.length * (boxH + gap) + 20;

  return (
    <svg viewBox={`0 0 ${totalW} ${totalH}`} width="100%" style={{ maxWidth: 400, display: 'block', margin: '20px auto' }}>
      <defs>
        <marker id="arrow-overview" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={c.mid} />
        </marker>
      </defs>
      {steps.map((step, i) => {
        const y = 10 + i * (boxH + gap);
        return (
          <g key={i}>
            <rect x={startX} y={y} width={boxW} height={boxH} rx={6} fill={step.color} />
            <text x={cx} y={y + 19} textAnchor="middle" fill={c.white} fontSize={13} fontWeight={700} fontFamily={c.font}>
              {step.label}
            </text>
            <text x={cx} y={y + 34} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={10} fontFamily={c.font}>
              {step.sub}
            </text>
            {i < steps.length - 1 && (
              <line x1={cx} y1={y + boxH} x2={cx} y2={y + boxH + gap} stroke={c.mid} strokeWidth={2} markerEnd="url(#arrow-overview)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 2. Input Structure Diagram — section "2. Input voor het model"
// ---------------------------------------------------------------------------
function DiagramInputStructure({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const w = 520;
  const h = 280;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 520, display: 'block', margin: '20px auto' }}>
      <defs>
        <marker id="arrow-input" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={c.mid} />
        </marker>
      </defs>

      {/* Left column: Functies */}
      <rect x={10} y={10} width={130} height={30} rx={4} fill={c.cat1} />
      <text x={75} y={30} textAnchor="middle" fill={c.white} fontSize={12} fontWeight={700} fontFamily={c.font}>Functies</text>

      {['Woningen', 'Supermarkt', 'Horeca', 'Kantoren', 'Retail', '...'].map((f, i) => (
        <g key={f}>
          <rect x={20} y={50 + i * 28} width={110} height={22} rx={3} fill={c.bg} stroke={c.light} />
          <text x={75} y={65 + i * 28} textAnchor="middle" fill={c.darkText} fontSize={10} fontFamily={c.font}>{f}</text>
        </g>
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`la${i}`} x1={135} y1={61 + i * 28} x2={175} y2={140} stroke={c.mid} strokeWidth={1.2} markerEnd="url(#arrow-input)" />
      ))}

      {/* Center box: Leveringsprofielen */}
      <rect x={175} y={105} width={160} height={70} rx={6} fill={c.primary} />
      <text x={255} y={130} textAnchor="middle" fill={c.white} fontSize={12} fontWeight={700} fontFamily={c.font}>Leveringsprofielen</text>
      <text x={255} y={146} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={9.5} fontFamily={c.font}>stops/week, duur,</text>
      <text x={255} y={159} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize={9.5} fontFamily={c.font}>verdeling per dagdeel</text>

      {/* Right column: Voertuigtypen */}
      <rect x={380} y={10} width={130} height={30} rx={4} fill={c.cat2} />
      <text x={445} y={30} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={12} fontWeight={700} fontFamily={c.font}>Voertuigtypen</text>

      {['Cargobike', 'Bestelwagen', 'Vrachtwagen (N2)', 'Vrachtwagen (N3)', 'Service bestel.'].map((v, i) => (
        <g key={v}>
          <rect x={385} y={50 + i * 28} width={120} height={22} rx={3} fill={c.bg} stroke={c.light} />
          <text x={445} y={65 + i * 28} textAnchor="middle" fill={c.darkText} fontSize={10} fontFamily={c.font}>{v}</text>
        </g>
      ))}

      {[0, 1, 2, 3, 4].map((i) => (
        <line key={`ra${i}`} x1={385} y1={61 + i * 28} x2={340} y2={140} stroke={c.mid} strokeWidth={1.2} markerEnd="url(#arrow-input)" />
      ))}

      <line x1={255} y1={175} x2={255} y2={210} stroke={c.mid} strokeWidth={2} markerEnd="url(#arrow-input)" />

      {/* Bottom: Output */}
      <rect x={175} y={215} width={160} height={50} rx={6} fill={c.cat3} />
      <text x={255} y={237} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={12} fontWeight={700} fontFamily={c.font}>Aankomstpatroon</text>
      <text x={255} y={253} textAnchor="middle" fill={t === 'dmi' ? c.mid : 'rgba(255,255,255,0.8)'} fontSize={10} fontFamily={c.font}>per voertuig per tijdvak</text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 3. Functions Overview — section "3. Overzicht functies"
// ---------------------------------------------------------------------------
function DiagramFunctionsOverview({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const w = 500;
  const h = 210;
  const functions: { name: string; Icon: LucideIcon; stops: string }[] = [
    { name: 'Woningen', Icon: Home, stops: 'Pakket, service, thuisbez.' },
    { name: 'Supermarkt', Icon: ShoppingCart, stops: 'Supermarktlev., service' },
    { name: 'Horeca', Icon: UtensilsCrossed, stops: 'Groothandel, specialisten' },
    { name: 'Kantoren', Icon: Building2, stops: 'Facilitair, pakket, service' },
    { name: 'Retail', Icon: ShoppingBag, stops: 'Keten/onafh. lev., pakket' },
  ];
  const colW = w / functions.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 500, display: 'block', margin: '20px auto' }}>
      <defs>
        <marker id="arrow-func" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={c.mid} />
        </marker>
      </defs>
      {functions.map((f, i) => {
        const cx = colW * i + colW / 2;
        return (
          <g key={f.name}>
            <rect x={cx - 42} y={10} width={84} height={50} rx={5} fill={c.cat1} />
            <text x={cx} y={30} textAnchor="middle" fill={c.white} fontSize={11} fontWeight={700} fontFamily={c.font}>{f.name}</text>
            <foreignObject x={cx - 8} y={36} width={16} height={16}>
              <f.Icon size={16} color="rgba(255,255,255,0.7)" strokeWidth={1.5} />
            </foreignObject>

            <line x1={cx} y1={60} x2={cx} y2={82} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-func)" />

            <rect x={cx - 48} y={86} width={96} height={40} rx={4} fill={c.bg} stroke={c.light} />
            <text x={cx} y={103} textAnchor="middle" fill={c.darkText} fontSize={9} fontFamily={c.font}>{f.stops.split(',')[0]}</text>
            <text x={cx} y={117} textAnchor="middle" fill={c.mid} fontSize={9} fontFamily={c.font}>{f.stops.split(',').slice(1).join(',').trim()}</text>

            <line x1={cx} y1={126} x2={cx} y2={148} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-func)" />

            <rect x={cx - 42} y={152} width={84} height={36} rx={4} fill={c.cat2} />
            <text x={cx} y={167} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={9.5} fontWeight={600} fontFamily={c.font}>Voertuig-</text>
            <text x={cx} y={180} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={9.5} fontWeight={600} fontFamily={c.font}>bewegingen</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 4. Simulation Process — section "5. Werking Rekentool"
// ---------------------------------------------------------------------------
function DiagramSimulationProcess({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const w = 540;
  const h = 460;
  const boxW = 220;
  const boxH = 56;
  const gap = 28;

  const steps = [
    { num: '1', title: 'Berekenen stops per functie', desc: 'Eenheden \u00D7 stops/week \u00F7 dagen', color: c.cat1 },
    { num: '2', title: 'Kansverdeling voertuigtypen', desc: 'Verdeling over 6 voertuigcategorie\u00EBn', color: c.cat2 },
    { num: '3', title: 'Monte Carlo simulatie', desc: '1000+ scenario\u2019s per 10-min interval', color: c.primary },
    { num: '4', title: 'Clusters & service levels', desc: 'Groeperen voertuigen, percentiel', color: c.cat4 },
    { num: '5', title: 'Benodigde ruimte', desc: 'Piek voertuigen \u00D7 voertuiglengte', color: c.cat3 },
  ];

  const details = [
    'bijv. 362 woningen \u00D7\n1,43 stops/week \u00F7 6 dagen',
    'Fiets \u2192 LEVV \u2192 Bestel \u2192\nVracht \u2192 Groot \u2192 Service',
    'Willekeurige aankomsten\nper dagdeel (4 perioden)',
    'Cluster 1: licht, Cluster 2:\nzwaar, Cluster 3: service',
    'Totaal meters L&L ruimte\nper cluster en totaal',
  ];

  // For DMI yellow boxes, use dark text
  const textColor = (color: string) =>
    (t === 'dmi' && (color === c.cat2 || color === c.cat3 || color === c.cat5)) ? c.dark : c.white;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 540, display: 'block', margin: '20px auto' }}>
      <defs>
        <marker id="arrow-sim" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={c.mid} />
        </marker>
      </defs>

      {steps.map((step, i) => {
        const y = 16 + i * (boxH + gap);
        const bx = 20;
        const tc = textColor(step.color);
        return (
          <g key={i}>
            <circle cx={bx + 18} cy={y + boxH / 2} r={16} fill={step.color} />
            <text x={bx + 18} y={y + boxH / 2 + 5} textAnchor="middle" fill={tc} fontSize={14} fontWeight={700} fontFamily={c.font}>
              {step.num}
            </text>

            <rect x={bx + 42} y={y} width={boxW} height={boxH} rx={6} fill={step.color} />
            <text x={bx + 42 + boxW / 2} y={y + 22} textAnchor="middle" fill={tc} fontSize={12} fontWeight={700} fontFamily={c.font}>
              {step.title}
            </text>
            <text x={bx + 42 + boxW / 2} y={y + 40} textAnchor="middle" fill={tc === c.dark ? c.mid : 'rgba(255,255,255,0.8)'} fontSize={10} fontFamily={c.font}>
              {step.desc}
            </text>

            <line x1={bx + 42 + boxW + 4} y1={y + boxH / 2} x2={bx + 42 + boxW + 20} y2={y + boxH / 2} stroke={c.light} strokeWidth={1} strokeDasharray="3,3" />
            {details[i].split('\n').map((line, li) => (
              <text key={li} x={bx + 42 + boxW + 24} y={y + boxH / 2 - 4 + li * 14} fill={c.mid} fontSize={9.5} fontFamily={c.font}>
                {line}
              </text>
            ))}

            {i < steps.length - 1 && (
              <line x1={bx + 42 + boxW / 2} y1={y + boxH} x2={bx + 42 + boxW / 2} y2={y + boxH + gap} stroke={c.mid} strokeWidth={2} markerEnd="url(#arrow-sim)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 5a. Animated Cluster Allocation Diagram — section "4. Resultaten"
//     Shows how reallocating vehicles between clusters impacts space needs.
// ---------------------------------------------------------------------------

interface VehicleDef {
  id: string;
  name: string;
  length: number;
  /** Simulated avg simultaneous vehicles at 95% SL for this demo */
  peakVehicles: number;
}

const DEMO_VEHICLES: VehicleDef[] = [
  { id: 'V1', name: 'Fiets/cargobike', length: 2, peakVehicles: 3 },
  { id: 'V2', name: 'LEVV/personenwagen', length: 6, peakVehicles: 2 },
  { id: 'V3', name: 'Bestelwagen', length: 8, peakVehicles: 4 },
  { id: 'V4', name: 'Vrachtwagen N2', length: 11, peakVehicles: 2 },
  { id: 'V5', name: 'Vrachtwagen N3', length: 16, peakVehicles: 1 },
  { id: 'V6', name: 'Service bestelwagen', length: 8, peakVehicles: 1 },
];

type ClusterAllocation = Record<string, number>;

const ALLOCATION_PHASES: { label: string; allocation: ClusterAllocation }[] = [
  {
    label: 'Standaard: 3 clusters',
    allocation: { V1: 1, V2: 1, V3: 2, V4: 2, V5: 2, V6: 3 },
  },
  {
    label: 'Service samengevoegd met zwaar verkeer',
    allocation: { V1: 1, V2: 1, V3: 2, V4: 2, V5: 2, V6: 2 },
  },
  {
    label: 'LEVV verplaatst naar zwaar verkeer',
    allocation: { V1: 1, V2: 2, V3: 2, V4: 2, V5: 2, V6: 3 },
  },
];

function computeClusterSpace(allocation: ClusterAllocation, vehicles: VehicleDef[]): Record<number, number> {
  const space: Record<number, number> = {};
  for (const v of vehicles) {
    const cId = allocation[v.id];
    if (cId == null) continue;
    space[cId] = (space[cId] || 0) + v.peakVehicles * v.length;
  }
  return space;
}

const CLUSTER_LABELS: Record<number, string> = { 1: 'Cluster 1', 2: 'Cluster 2', 3: 'Cluster 3' };

function DiagramClusterAllocation({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhase((p) => (p + 1) % ALLOCATION_PHASES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const currentPhase = ALLOCATION_PHASES[phase];
  const allocation = currentPhase.allocation;
  const clusterSpace = computeClusterSpace(allocation, DEMO_VEHICLES);

  // Cluster colors
  const clColors: Record<number, string> = { 1: c.cat1, 2: c.cat2, 3: c.cat3 };

  const w = 540;
  const h = 340;
  const vehicleAreaX = 10;
  const vehicleAreaW = 170;
  const clusterAreaX = 250;
  const clusterW = 85;
  const vehicleRowH = 32;
  const vehicleStartY = 60;

  // Cluster positions (vertical)
  const clusterIds = [1, 2, 3];
  const clusterY: Record<number, number> = { 1: 60, 2: 140, 3: 230 };

  // Max space for scaling bars
  const maxSpace = 100;

  const headerText = (color: string) =>
    (t === 'dmi' && (color === c.cat2 || color === c.cat3 || color === c.cat5)) ? c.dark : c.white;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 540, display: 'block', margin: '20px auto' }}>
      {/* Title */}
      <text x={w / 2} y={20} textAnchor="middle" fill={c.darkText} fontSize={13} fontWeight={700} fontFamily={c.font}>
        Impact van clusterindeling op ruimtevraag
      </text>

      {/* Phase label */}
      <text x={w / 2} y={40} textAnchor="middle" fill={c.mid} fontSize={10} fontFamily={c.font}>
        {currentPhase.label}
      </text>

      {/* Phase dots */}
      {ALLOCATION_PHASES.map((_, i) => (
        <circle key={i} cx={w / 2 - 12 + i * 12} cy={h - 8} r={3.5}
          fill={i === phase ? c.primary : c.light}
          style={{ transition: 'fill 0.3s ease' }}
        />
      ))}

      {/* Vehicle labels (left column) */}
      {DEMO_VEHICLES.map((v, i) => {
        const y = vehicleStartY + i * vehicleRowH;
        const cId = allocation[v.id];
        const vColor = clColors[cId] || c.mid;
        return (
          <g key={v.id}>
            <rect
              x={vehicleAreaX} y={y} width={vehicleAreaW} height={24} rx={4}
              fill={c.bg} stroke={vColor} strokeWidth={2}
              style={{ transition: 'stroke 0.6s ease' }}
            />
            <text x={vehicleAreaX + vehicleAreaW / 2} y={y + 16}
              textAnchor="middle" fill={c.darkText} fontSize={10} fontFamily={c.font}>
              {v.name}
            </text>
          </g>
        );
      })}

      {/* Connection lines from vehicles to clusters */}
      {DEMO_VEHICLES.map((v, i) => {
        const vy = vehicleStartY + i * vehicleRowH + 12;
        const cId = allocation[v.id];
        const cy = clusterY[cId] + 18;
        const vColor = clColors[cId] || c.mid;
        return (
          <line
            key={`line-${v.id}`}
            x1={vehicleAreaX + vehicleAreaW}
            y1={vy}
            x2={clusterAreaX}
            y2={cy}
            stroke={vColor}
            strokeWidth={1.5}
            strokeOpacity={0.5}
            style={{ transition: 'y2 0.6s ease, stroke 0.6s ease' }}
          />
        );
      })}

      {/* Cluster boxes */}
      {clusterIds.map((cId) => {
        const y = clusterY[cId];
        const color = clColors[cId];
        const ht = headerText(color);
        const space = clusterSpace[cId] || 0;
        const hasVehicles = Object.values(allocation).some((a) => a === cId);

        return (
          <g key={cId} style={{ opacity: hasVehicles ? 1 : 0.3, transition: 'opacity 0.6s ease' }}>
            <rect x={clusterAreaX} y={y} width={clusterW} height={36} rx={5} fill={color}
              style={{ transition: 'opacity 0.6s ease' }}
            />
            <text x={clusterAreaX + clusterW / 2} y={y + 16} textAnchor="middle"
              fill={ht} fontSize={11} fontWeight={700} fontFamily={c.font}>
              {CLUSTER_LABELS[cId]}
            </text>
            <text x={clusterAreaX + clusterW / 2} y={y + 30} textAnchor="middle"
              fill={ht === c.dark ? c.mid : 'rgba(255,255,255,0.75)'} fontSize={9} fontFamily={c.font}>
              {space > 0 ? `${space} m` : 'leeg'}
            </text>

            {/* Space bar */}
            <rect
              x={clusterAreaX + clusterW + 16} y={y + 6} rx={3}
              width={Math.max(0, (space / maxSpace) * 160)} height={24}
              fill={color} fillOpacity={0.35}
              style={{ transition: 'width 0.6s ease' }}
            />
            <rect
              x={clusterAreaX + clusterW + 16} y={y + 6} rx={3}
              width={Math.max(0, (space / maxSpace) * 160)} height={24}
              fill="none" stroke={color} strokeWidth={1.5}
              style={{ transition: 'width 0.6s ease' }}
            />
            {space > 0 && (
              <text
                x={clusterAreaX + clusterW + 16 + Math.max(0, (space / maxSpace) * 160) + 6}
                y={y + 22}
                fill={c.darkText} fontSize={10} fontWeight={600} fontFamily={c.font}
                style={{ transition: 'x 0.6s ease' }}
              >
                {space} m
              </text>
            )}
          </g>
        );
      })}

      {/* Total space */}
      {(() => {
        const totalSpace = Object.values(clusterSpace).reduce((a, b) => a + b, 0);
        return (
          <g>
            <rect x={clusterAreaX} y={h - 40} width={clusterW + 180} height={26} rx={5} fill={c.dark} />
            <text x={clusterAreaX + (clusterW + 180) / 2} y={h - 23} textAnchor="middle"
              fill={c.white} fontSize={11} fontWeight={700} fontFamily={c.font}>
              Totaal: {totalSpace} strekkende meter
            </text>
          </g>
        );
      })()}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 5b. Cluster & Service Level Diagram — section "4. Resultaten"
// ---------------------------------------------------------------------------
function DiagramClusterServiceLevel({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const w = 500;
  const h = 300;

  const clusters = [
    { name: 'Cluster 1', sub: 'Licht verkeer', vehicles: ['Fiets/cargobike', 'LEVV/personenwagen'], color: c.cat1, x: 30 },
    { name: 'Cluster 2', sub: 'Zwaar verkeer', vehicles: ['Bestelwagen', 'Vrachtwagen N2', 'Vrachtwagen N3'], color: c.cat2, x: 185 },
    { name: 'Cluster 3', sub: 'Service', vehicles: ['Service bestelwagen'], color: c.cat3, x: 355 },
  ];

  const headerText = (color: string) =>
    (t === 'dmi' && (color === c.cat2 || color === c.cat3 || color === c.cat5)) ? c.dark : c.white;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 500, display: 'block', margin: '20px auto' }}>
      <defs>
        <marker id="arrow-cl" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 z" fill={c.mid} />
        </marker>
      </defs>

      <text x={250} y={20} textAnchor="middle" fill={c.darkText} fontSize={13} fontWeight={700} fontFamily={c.font}>
        Voertuigen gegroepeerd in clusters
      </text>

      {clusters.map((cl) => {
        const ht = headerText(cl.color);
        return (
          <g key={cl.name}>
            <rect x={cl.x} y={35} width={125} height={32} rx={5} fill={cl.color} />
            <text x={cl.x + 62.5} y={50} textAnchor="middle" fill={ht} fontSize={11} fontWeight={700} fontFamily={c.font}>{cl.name}</text>
            <text x={cl.x + 62.5} y={62} textAnchor="middle" fill={ht === c.dark ? c.mid : 'rgba(255,255,255,0.75)'} fontSize={9} fontFamily={c.font}>{cl.sub}</text>

            {cl.vehicles.map((v, vi) => (
              <g key={v}>
                <rect x={cl.x + 5} y={76 + vi * 26} width={115} height={20} rx={3} fill={c.bg} stroke={c.light} />
                <text x={cl.x + 62.5} y={90 + vi * 26} textAnchor="middle" fill={c.darkText} fontSize={9.5} fontFamily={c.font}>{v}</text>
              </g>
            ))}

            {(() => {
              const bottomY = 76 + cl.vehicles.length * 26 + 4;
              return <line x1={cl.x + 62.5} y1={bottomY} x2={cl.x + 62.5} y2={200} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-cl)" />;
            })()}

            <rect x={cl.x + 10} y={206} width={105} height={34} rx={4} fill={c.highlight} />
            <text x={cl.x + 62.5} y={220} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={9.5} fontWeight={600} fontFamily={c.font}>Service Level</text>
            <text x={cl.x + 62.5} y={234} textAnchor="middle" fill={t === 'dmi' ? c.dark : c.white} fontSize={12} fontWeight={700} fontFamily={c.font}>95%</text>
          </g>
        );
      })}

      <line x1={92} y1={240} x2={250} y2={270} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-cl)" />
      <line x1={248} y1={240} x2={250} y2={270} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-cl)" />
      <line x1={418} y1={240} x2={250} y2={270} stroke={c.mid} strokeWidth={1.5} markerEnd="url(#arrow-cl)" />

      <rect x={175} y={270} width={150} height={24} rx={5} fill={c.dark} />
      <text x={250} y={286} textAnchor="middle" fill={c.white} fontSize={11} fontWeight={700} fontFamily={c.font}>
        Totale benodigde ruimte (m)
      </text>
    </svg>
  );
}

// ---------------------------------------------------------------------------
// 6. Time Period Distribution — section "4. Resultaten"
// ---------------------------------------------------------------------------
function DiagramTimePeriods({ theme: t }: { theme: DiagramTheme }) {
  const c = themeFor(t);
  const w = 460;
  const h = 160;

  const periods = [
    { label: '0:00\u20136:00', pct: 5, color: c.periods[0] },
    { label: '6:00\u201312:00', pct: 50, color: c.periods[1] },
    { label: '12:00\u201318:00', pct: 35, color: c.periods[2] },
    { label: '18:00\u20130:00', pct: 10, color: c.periods[3] },
  ];

  const barAreaX = 120;
  const barAreaW = 300;
  const barH = 24;
  const maxPct = 55;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ maxWidth: 460, display: 'block', margin: '20px auto' }}>
      <text x={w / 2} y={16} textAnchor="middle" fill={c.darkText} fontSize={12} fontWeight={700} fontFamily={c.font}>
        Verdeling leveringen over de dag
      </text>

      {periods.map((p, i) => {
        const y = 30 + i * (barH + 8);
        const barW = (p.pct / maxPct) * barAreaW;
        return (
          <g key={p.label}>
            <text x={barAreaX - 8} y={y + barH / 2 + 4} textAnchor="end" fill={c.darkText} fontSize={10} fontFamily={c.font}>{p.label}</text>
            <rect x={barAreaX} y={y} width={barW} height={barH} rx={3} fill={p.color} />
            <text x={barAreaX + barW + 6} y={y + barH / 2 + 4} fill={c.mid} fontSize={10} fontWeight={600} fontFamily={c.font}>{p.pct}%</text>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Diagram renderer — maps DiagramKey to themed component
// ---------------------------------------------------------------------------

const DIAGRAM_MAP: Record<DiagramKey, React.FC<{ theme: DiagramTheme }>> = {
  'model-overview': DiagramModelOverview,
  'input-structure': DiagramInputStructure,
  'functions-overview': DiagramFunctionsOverview,
  'cluster-allocation-animation': DiagramClusterAllocation,
  'cluster-service-level': DiagramClusterServiceLevel,
  'time-periods': DiagramTimePeriods,
  'simulation-process': DiagramSimulationProcess,
};

export function HandleidingDiagram({ diagramKey, theme = 'dmi' }: { diagramKey: DiagramKey; theme?: DiagramTheme }) {
  const Component = DIAGRAM_MAP[diagramKey];
  if (!Component) return null;
  return <Component theme={theme} />;
}
