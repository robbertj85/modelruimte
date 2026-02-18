'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { SimulationState, LayoutType } from '@/lib/use-simulation-state';
import { VEHICLES, LOADING_BAY_WIDTH_M } from '@/lib/model-data';
import { SERVICE_LEVEL_OPTIONS, MAX_CLUSTERS } from '@/lib/dmi-theme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Loader2, Play } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import LayoutSwitcher from '@/components/LayoutSwitcher';
import FeedbackButton from '@/components/FeedbackButton';
import { useIsMobile } from '@/lib/useIsMobile';
import { COVER, HANDLEIDING_SECTIONS, PARTNER_SECTIONS, CONTACT, CASUS_GERARD_DOUSTRAAT, renderBold } from '@/lib/content';
import { HandleidingDiagram } from '@/components/HandleidingDiagrams';
import { HandleidingTableRenderer } from '@/components/HandleidingTable';
import { AlgemeenEditor, DeliveryProfileEditor } from '@/components/ParameterEditor';

// ---------------------------------------------------------------------------
// Rebel Color Scheme
// ---------------------------------------------------------------------------
const REBEL = {
  coral: '#c0504d',
  coralLight: '#d4756f',
  coralDark: '#a03a37',
  darkBg: '#2d2d2d',
  darkBg2: '#3a3a3a',
  white: '#ffffff',
  offWhite: '#f5f5f5',
  green: '#4caf50',
  greenDark: '#2e7d32',
  textDark: '#333333',
  textLight: '#cccccc',
  tabActive: '#c0504d',
  tabInactive: '#666666',
  tabInactiveHover: '#777777',
  border: '#e0e0e0',
  gridLine: '#e8e8e8',
};

// Chart colors matching warm Excel palette
const CHART_COLORS = ['#c0504d', '#4bacc6', '#f79646', '#9bbb59', '#8064a2', '#4f81bd'];

// Function colors for pie chart
const FUNCTION_COLORS = [
  '#c0504d', '#4bacc6', '#f79646', '#9bbb59',
  '#8064a2', '#4f81bd', '#c0504d', '#f79646',
  '#4bacc6', '#9bbb59', '#8064a2', '#4f81bd',
];

// Cluster colors
const CLUSTER_COLORS: Record<number, string> = {
  1: '#4bacc6',
  2: '#f79646',
  3: '#9bbb59',
  4: '#8064a2',
  5: '#4f81bd',
  6: '#c0504d',
  7: '#4bacc6',
};

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'cover', label: 'Cover' },
  { id: 'handleiding', label: 'Handleiding' },
  { id: 'cockpit', label: 'Cockpit' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'algemeen', label: 'Algemeen' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ---------------------------------------------------------------------------
// Rebel Logo (stylized "A")
// ---------------------------------------------------------------------------
function RebelLogo() {
  return (
    <Image
      src="/logos/rebel-badge.png"
      alt="Rebel"
      width={44}
      height={44}
      style={{ objectFit: 'contain' }}
    />
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ExcelPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: REBEL.white,
        border: `1px solid ${REBEL.border}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: REBEL.coral,
          color: REBEL.white,
          fontWeight: 700,
          fontSize: '0.8rem',
          fontFamily: 'Calibri, Arial, sans-serif',
        }}
      >
        {title}
      </div>
      <div style={{ padding: '12px' }}>{children}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix: string;
}) {
  return (
    <div
      style={{
        backgroundColor: REBEL.white,
        border: `1px solid ${REBEL.border}`,
        padding: '10px 14px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          fontFamily: 'Calibri, Arial, sans-serif',
          fontWeight: 600,
          color: REBEL.textDark,
          marginBottom: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
        <span
          style={{
            fontFamily: 'Calibri, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '1.5rem',
            color: REBEL.greenDark,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              fontSize: '0.75rem',
              color: REBEL.textDark,
              fontFamily: 'Calibri, Arial, sans-serif',
            }}
            dangerouslySetInnerHTML={{ __html: suffix }}
          />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        height: '280px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: REBEL.offWhite,
        border: `1px solid ${REBEL.border}`,
      }}
    >
      <p
        style={{
          fontSize: '0.8rem',
          color: REBEL.tabInactive,
          textAlign: 'center',
          fontFamily: 'Calibri, Arial, sans-serif',
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export default function RebelExcelLayout({
  state,
  layout,
  onLayoutChange,
}: {
  state: SimulationState;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}) {
  const {
    functionCounts,
    clusterAssignments,
    clusterServiceLevels,
    numSimulations,
    isRunning,
    results,
    expandedClusters,
    clusterIds,
    totalFunctions,
    computedTotalVehicles,
    handleFunctionCountChange,
    handleClusterMatrixChange,
    handleServiceLevelChange,
    handleRun,
    toggleCluster,
    setNumSimulations,
  } = state;

  const [activeTab, setActiveTab] = useState<TabId>('cockpit');
  const [handleidingSubTab, setHandleidingSubTab] = useState<'handleiding' | 'casus'>('handleiding');
  const [selectedFunction, setSelectedFunction] = useState<string | null>('algemeen');
  const [extendedSim, setExtendedSim] = useState(false);
  const { isMobile, isCompact } = useIsMobile();

  // --- Derived data for charts ---

  const chosenServiceLevel = useMemo(() => {
    const levels = Object.values(clusterServiceLevels);
    if (levels.length === 0) return 0.95;
    return levels[0];
  }, [clusterServiceLevels]);

  const donutData = useMemo(() => {
    return state.allFunctions
      .filter((f) => (functionCounts[f.id] ?? 0) > 0)
      .map((f, idx) => ({
        name: f.name,
        value: functionCounts[f.id] ?? 0,
        fill: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
      }));
  }, [functionCounts, state.allFunctions]);

  const vehicleArrivalsData = useMemo(() => {
    if (!results) return [];
    return results.vehicleResults.map((vr) => ({
      name: vr.vehicleName.length > 25 ? vr.vehicleName.substring(0, 22) + '...' : vr.vehicleName,
      fullName: vr.vehicleName,
      arrivals: Math.round(vr.totalArrivalsPerDay * 10) / 10,
    }));
  }, [results]);

  const vehicleLengthData = useMemo(() => {
    if (!results) return [];
    return results.vehicleResults.map((vr) => ({
      name: vr.vehicleName.length > 25 ? vr.vehicleName.substring(0, 22) + '...' : vr.vehicleName,
      fullName: vr.vehicleName,
      length: vr.requiredSpaceM2,
    }));
  }, [results]);

  const clusterSpaceData = useMemo(() => {
    if (!results) return [];
    return results.clusterResults.map((cr) => ({
      name: state.clusterNames[cr.clusterId] || `Cluster ${cr.clusterId}`,
      space: Math.round(cr.totalSpaceM2),
      clusterId: cr.clusterId,
    }));
  }, [results, state.clusterNames]);

  const maxFunctionCount = useMemo(() => {
    return Math.max(1, ...Object.values(functionCounts));
  }, [functionCounts]);

  // Service level curve data for line chart
  const serviceLevelCurveData = useMemo(() => {
    if (!results) return [];
    return results.serviceLevelCurve.map((pt) => ({
      serviceLevel: Math.round(pt.serviceLevel * 100),
      space: Math.round(pt.space),
    }));
  }, [results]);

  // Per-cluster service level curves (derived from cluster results)
  const clusterServiceLevelCurves = useMemo(() => {
    if (!results) return {};
    const curves: Record<number, { serviceLevel: number; vehicles: number }[]> = {};
    for (const cr of results.clusterResults) {
      const points: { serviceLevel: number; vehicles: number }[] = [];
      for (const slKey of Object.keys(cr.maxVehiclesPerServiceLevel).sort((a, b) => Number(a) - Number(b))) {
        points.push({
          serviceLevel: Number(slKey),
          vehicles: cr.maxVehiclesPerServiceLevel[Number(slKey)],
        });
      }
      curves[cr.clusterId] = points;
    }
    return curves;
  }, [results]);

  // Per-vehicle service level curves
  const vehicleServiceLevelCurves = useMemo(() => {
    if (!results) return {};
    const curves: Record<string, { serviceLevel: number; vehicles: number }[]> = {};
    for (const vr of results.vehicleResults) {
      const points: { serviceLevel: number; vehicles: number }[] = [];
      for (const slKey of Object.keys(vr.maxVehiclesPerServiceLevel).sort((a, b) => Number(a) - Number(b))) {
        points.push({
          serviceLevel: Number(slKey),
          vehicles: vr.maxVehiclesPerServiceLevel[Number(slKey)],
        });
      }
      curves[vr.vehicleId] = points;
    }
    return curves;
  }, [results]);

  // ---------------------------------------------------------------------------
  // Render tab content
  // ---------------------------------------------------------------------------

  function renderCoverTab() {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 140px)',
          backgroundColor: REBEL.darkBg,
          padding: isMobile ? '20px 16px' : '60px',
        }}
      >
        <div
          style={{
            backgroundColor: REBEL.white,
            padding: isMobile ? '24px 20px' : '60px 80px',
            textAlign: 'center',
            border: `4px solid ${REBEL.coral}`,
            maxWidth: '800px',
          }}
        >
          <Image
            src="/logos/rebel-badge.png"
            alt="Rebel Badge"
            width={120}
            height={120}
            style={{ objectFit: 'contain', margin: '0 auto 16px auto' }}
          />
          <h1
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '2.2rem',
              fontWeight: 700,
              color: REBEL.coral,
              margin: '20px 0 10px 0',
            }}
          >
            {COVER.title}
          </h1>
          {COVER.subtitle && (
            <p
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '1rem',
                color: REBEL.textDark,
                marginBottom: '16px',
              }}
            >
              {COVER.subtitle}
            </p>
          )}
          <p
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '0.9rem',
              color: REBEL.tabInactive,
              lineHeight: 1.6,
              marginBottom: '12px',
              fontStyle: 'italic',
            }}
          >
            {COVER.description}
          </p>
          {COVER.paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '0.85rem',
                color: REBEL.tabInactive,
                lineHeight: 1.6,
                marginBottom: '10px',
                textAlign: 'left',
              }}
            >
              {para}
            </p>
          ))}
          <div style={{ marginBottom: '24px' }} />
          <div style={{ borderTop: `2px solid ${REBEL.coral}`, paddingTop: '24px' }}>
            {PARTNER_SECTIONS.map((section) => (
              <div key={section.label} style={{ marginBottom: '20px' }}>
                <p
                  style={{
                    fontFamily: 'Calibri, Arial, sans-serif',
                    fontSize: '0.7rem',
                    fontStyle: 'italic',
                    color: REBEL.tabInactive,
                    marginBottom: '10px',
                  }}
                >
                  {section.label}
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '24px',
                    alignItems: 'center',
                  }}
                >
                  {section.logos.map((logo) => (
                    <Image
                      key={logo.src}
                      src={logo.src}
                      alt={logo.alt}
                      width={100}
                      height={44}
                      style={{ objectFit: 'contain', maxHeight: '44px' }}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* License */}
            <div style={{ marginTop: '16px', borderTop: `1px solid ${REBEL.border}`, paddingTop: '12px' }}>
              <p style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: REBEL.textDark, marginBottom: '4px' }}>
                {COVER.license.label}
              </p>
              <p style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.7rem', color: REBEL.tabInactive, margin: 0, lineHeight: 1.6 }}>
                {COVER.license.text}
              </p>
            </div>

            {/* Contact */}
            <div style={{ marginTop: '12px', borderTop: `1px solid ${REBEL.border}`, paddingTop: '12px' }}>
              <p style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.7rem', fontWeight: 700, color: REBEL.textDark, marginBottom: '4px' }}>
                {CONTACT.label}
              </p>
              {CONTACT.lines.map((line) => (
                <p key={line} style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.7rem', color: REBEL.tabInactive, margin: 0, lineHeight: 1.6 }}>
                  {line}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderHandleidingTab() {
    return (
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <ExcelPanel title="Handleiding Rekentool Ruimte voor Stadslogistiek">
          {/* Sub-toggle: Handleiding / Casus */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '16px', backgroundColor: '#f5f5f5', borderRadius: '4px', padding: '3px', width: 'fit-content' }}>
            {([['handleiding', 'Uitleg'], ['casus', 'Casus Gerard Doustraat']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setHandleidingSubTab(id)}
                style={{
                  padding: '5px 14px', borderRadius: '3px', border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: handleidingSubTab === id ? 700 : 400,
                  backgroundColor: handleidingSubTab === id ? REBEL.white : 'transparent',
                  color: handleidingSubTab === id ? REBEL.coral : REBEL.tabInactive,
                  boxShadow: handleidingSubTab === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {handleidingSubTab === 'handleiding' && (
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '0.85rem',
                color: REBEL.textDark,
                lineHeight: 1.7,
              }}
            >
              {HANDLEIDING_SECTIONS.map((section, sIdx) => (
                <div key={section.title}>
                  <h3
                    style={{
                      color: REBEL.coral,
                      fontSize: '1rem',
                      marginTop: sIdx === 0 ? 0 : '24px',
                      marginBottom: '10px',
                    }}
                  >
                    {section.title}
                  </h3>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} style={{ marginBottom: '10px' }}>
                      {renderBold(p)}
                    </p>
                  ))}
                  {section.tables?.map((table, ti) => (
                    <HandleidingTableRenderer key={ti} table={table} theme="rebel" />
                  ))}
                  {section.diagrams?.map((key) => (
                    <HandleidingDiagram key={key} diagramKey={key} theme="rebel" />
                  ))}
                </div>
              ))}

              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#fff8e1',
                  border: `1px solid #f79646`,
                  borderLeft: `4px solid #f79646`,
                }}
              >
                <strong style={{ color: '#f79646' }}>Tip:</strong> Standaard is het service level 95%.
                Een lager percentage resulteert in minder benodigde ruimte, maar een groter risico op
                tekorten bij piekdrukte.
              </div>
            </div>
          )}

          {handleidingSubTab === 'casus' && (
            <div style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.85rem', color: REBEL.textDark, lineHeight: 1.7 }}>
              <div
                style={{
                  backgroundColor: REBEL.white,
                  border: `1px solid ${REBEL.border}`,
                  borderRadius: '4px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: REBEL.coral, marginBottom: '10px' }}>
                  {CASUS_GERARD_DOUSTRAAT.subtitle}
                </h3>
                <p style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                  {CASUS_GERARD_DOUSTRAAT.intro}
                </p>
              </div>

              {CASUS_GERARD_DOUSTRAAT.sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  style={{
                    backgroundColor: REBEL.white,
                    border: `1px solid ${REBEL.border}`,
                    borderRadius: '4px',
                    padding: '16px 20px',
                    marginBottom: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: REBEL.coral, marginBottom: '10px' }}>
                    {section.title}
                  </h3>
                  {section.paragraphs.map((p, pIdx) => (
                    <p key={pIdx} style={{ whiteSpace: 'pre-line', marginBottom: '8px' }}>
                      {renderBold(p)}
                    </p>
                  ))}
                  {section.tables?.map((table, ti) => (
                    <HandleidingTableRenderer key={ti} table={table} theme="rebel" />
                  ))}
                  {section.images && section.images.map((img, iIdx) => (
                    <figure key={iIdx} style={{ margin: '12px 0 0 0' }}>
                      <Image
                        src={img.src}
                        alt={img.alt}
                        width={1200}
                        height={675}
                        style={{ width: '100%', height: 'auto', borderRadius: '4px', border: `1px solid ${REBEL.border}` }}
                      />
                      {img.caption && (
                        <figcaption style={{ fontSize: '0.75rem', color: REBEL.tabInactive, marginTop: '6px', fontStyle: 'italic' }}>
                          {img.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              ))}

              <div
                style={{
                  backgroundColor: REBEL.white,
                  border: `1px solid ${REBEL.border}`,
                  borderRadius: '4px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: REBEL.coral, marginBottom: '10px' }}>
                  Probeer het zelf
                </h3>
                <p style={{ marginBottom: '14px' }}>
                  Laad de invoerwaarden van de Gerard Doustraat casus in het model, of begin met een leeg model.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => { state.resetToGerardDoustraat(); setActiveTab('cockpit' as TabId); }}
                    style={{
                      padding: '8px 16px', borderRadius: '4px', border: 'none',
                      backgroundColor: REBEL.coral, color: REBEL.white,
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    Laad Casus Gerard Doustraat
                  </button>
                  <button
                    onClick={() => { state.resetToBlank(); setActiveTab('cockpit' as TabId); }}
                    style={{
                      padding: '8px 16px', borderRadius: '4px',
                      border: `2px solid ${REBEL.coral}`, backgroundColor: 'transparent',
                      color: REBEL.coral,
                      fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                    }}
                  >
                    Begin met leeg model
                  </button>
                </div>
              </div>
            </div>
          )}
        </ExcelPanel>
      </div>
    );
  }

  function renderAlgemeenTab() {
    return (
      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <ExcelPanel title="Algemene Informatie">
          <div
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '0.85rem',
              color: REBEL.textDark,
              lineHeight: 1.7,
            }}
          >
            <p style={{ marginBottom: '12px' }}>
              De Rekentool Ruimte voor Stadslogistiek is ontwikkeld om gemeenten, gebiedsontwikkelaars en
              logistieke planners te ondersteunen bij het bepalen van de benodigde ruimte voor
              stedelijke logistiek.
            </p>
            <p style={{ marginBottom: '12px' }}>
              Het model maakt gebruik van Monte Carlo-simulatie om stochastische
              voertuigaankomsten te modelleren en op basis daarvan de piekbelasting te berekenen.
            </p>
            <p>
              De resultaten geven inzicht in hoeveel meter laad- en losruimte nodig is om een
              bepaald service level te garanderen.
            </p>
          </div>
        </ExcelPanel>
      </div>
    );
  }

  function renderCockpitTab() {
    return (
      <div style={{ padding: isMobile ? '8px' : '16px' }}>
        {/* Title bar with navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '8px 12px' : '10px 16px',
            backgroundColor: REBEL.coral,
            color: REBEL.white,
            marginBottom: '12px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? '8px' : '0',
          }}
        >
          <h2
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              margin: 0,
            }}
          >
            Rekentool: Cockpit
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['cover', 'handleiding', 'inputs'].map((tabId) => (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId as TabId)}
                style={{
                  padding: '4px 14px',
                  backgroundColor: REBEL.white,
                  color: REBEL.coral,
                  border: 'none',
                  fontSize: '0.75rem',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}
              >
                {tabId === 'cover' ? 'Cover' : tabId === 'handleiding' ? 'Handleiding' : 'Inputs'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isCompact ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <KpiCard
            label="Totaal # Functies"
            value={totalFunctions.toLocaleString('nl-NL')}
            suffix=""
          />
          <KpiCard
            label="Verwacht # Voertuigen (#/Dag)"
            value={computedTotalVehicles !== null ? Math.round(computedTotalVehicles).toLocaleString('nl-NL') : '--'}
            suffix=""
          />
          <KpiCard
            label="Gekozen Service Level (%)"
            value={`${Math.round(chosenServiceLevel * 100)}%`}
            suffix=""
          />
          <KpiCard
            label="Benodigde Lengte Laden & Lossen (m)"
            value={results ? Math.round(results.totalSpaceM2).toLocaleString('nl-NL') : '--'}
            suffix=""
          />
          <KpiCard
            label="Benodigde Oppervlakte Laden & Lossen (m&sup2;)"
            value={results ? Math.round(results.totalSpaceM2 * LOADING_BAY_WIDTH_M).toLocaleString('nl-NL') : '--'}
            suffix=""
          />
        </div>

        {/* Row 1: Three panels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Panel 1: Inventarisatie Functies with pie chart */}
          <ExcelPanel title="Inventarisatie Functies">
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px' }}>
              {/* Left: function inputs */}
              <div style={{ flex: '1 1 55%', maxHeight: isMobile ? 'none' : '380px', overflowY: 'auto' }}>
                {state.allFunctions.map((func, idx) => {
                  const count = functionCounts[func.id] ?? 0;
                  const barWidth = maxFunctionCount > 0 ? (count / maxFunctionCount) * 100 : 0;
                  return (
                    <div key={func.id} style={{ marginBottom: '4px' }}>
                      <div
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontSize: '0.65rem',
                          color: REBEL.textDark,
                          marginBottom: '1px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {func.name}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input
                          type="number"
                          min={0}
                          value={count}
                          onChange={(e) => handleFunctionCountChange(func.id, e.target.value)}
                          style={{
                            width: '72px',
                            padding: '2px 4px',
                            border: `1px solid ${REBEL.border}`,
                            fontSize: '0.7rem',
                            fontFamily: 'Calibri, Arial, sans-serif',
                            color: REBEL.textDark,
                            outline: 'none',
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            height: '10px',
                            backgroundColor: REBEL.offWhite,
                            border: `1px solid ${REBEL.gridLine}`,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${barWidth}%`,
                              height: '100%',
                              backgroundColor: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Right: pie chart */}
              <div style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {donutData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {donutData.map((entry, idx) => (
                          <Cell key={idx} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString('nl-NL')}`,
                          '',
                        ]}
                      />
                      <Legend
                        layout="vertical"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '0.55rem', color: REBEL.textDark }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p
                    style={{
                      fontFamily: 'Calibri, Arial, sans-serif',
                      fontSize: '0.75rem',
                      color: REBEL.tabInactive,
                      textAlign: 'center',
                    }}
                  >
                    Vul functies in om de verdeling te zien
                  </p>
                )}
              </div>
            </div>
          </ExcelPanel>

          {/* Panel 2: Verwacht # Voertuigen */}
          <ExcelPanel title="Verwacht # Voertuigen">
            {results ? (
              <div style={{ height: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicleArrivalsData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 9, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 8, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                    />
                    <RechartsTooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('nl-NL')} /dag`,
                        'Voertuigen',
                      ]}
                    />
                    <Bar dataKey="arrivals" radius={[0, 2, 2, 0]} barSize={18}>
                      {vehicleArrivalsData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Voer eerst de simulatie uit om voertuigdata te zien" />
            )}
          </ExcelPanel>

          {/* Panel 3: Benodigde Lengte per Voertuig */}
          <ExcelPanel title="Benodigde Lengte per Voertuig">
            {results ? (
              <div style={{ height: '380px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={vehicleLengthData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 9, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                      label={{
                        value: 'meter',
                        position: 'insideBottomRight',
                        offset: -5,
                        style: { fontSize: 9, fill: REBEL.textDark },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fontSize: 8, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                    />
                    <RechartsTooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('nl-NL')} m`,
                        'Lengte',
                      ]}
                    />
                    <Bar dataKey="length" radius={[0, 2, 2, 0]} barSize={18}>
                      {vehicleLengthData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState message="Voer eerst de simulatie uit om lengtedata te zien" />
            )}
          </ExcelPanel>
        </div>

        {/* Row 2: Three panels */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Panel 1: Benodigde ruimte per Cluster */}
          <ExcelPanel title="Benodigde ruimte per Cluster">
            {results ? (
              <div>
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={clusterSpaceData}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 9, fill: REBEL.textDark }}
                        axisLine={{ stroke: REBEL.border }}
                        label={{
                          value: 'meter',
                          position: 'insideBottomRight',
                          offset: -5,
                          style: { fontSize: 9, fill: REBEL.textDark },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={140}
                        tick={{ fontSize: 8, fill: REBEL.textDark }}
                        axisLine={{ stroke: REBEL.border }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString('nl-NL')} m`,
                          'Ruimte',
                        ]}
                      />
                      <Bar dataKey="space" radius={[0, 2, 2, 0]} barSize={22}>
                        {clusterSpaceData.map((entry) => (
                          <Cell
                            key={entry.clusterId}
                            fill={CLUSTER_COLORS[entry.clusterId] || REBEL.coral}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Total summary */}
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 14px',
                    backgroundColor: REBEL.coral,
                    color: REBEL.white,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Calibri, Arial, sans-serif',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                    }}
                  >
                    TOTAAL
                  </span>
                  <span
                    style={{
                      fontFamily: 'Calibri, Arial, sans-serif',
                      fontWeight: 700,
                      fontSize: '1.2rem',
                    }}
                  >
                    {Math.round(results.totalSpaceM2).toLocaleString('nl-NL')} m
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState message="Voer eerst de simulatie uit om clusterdata te zien" />
            )}
          </ExcelPanel>

          {/* Panel 2: Service Levels & Clustering */}
          <ExcelPanel title="Service Levels & Clustering">
            <div
              style={{
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '0.8rem',
                color: REBEL.textDark,
                lineHeight: 1.6,
              }}
            >
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: REBEL.coral }}>Service Level</strong> bepaalt hoeveel procent van de tijd
                de beschikbare laad- en losruimte voldoende is. Een hoger service level
                betekent meer ruimte om pieken op te vangen.
              </p>
              <p style={{ marginBottom: '10px' }}>
                <strong style={{ color: REBEL.coral }}>Clustering</strong> groepeert voertuigtypen die
                dezelfde laad-/losruimte delen. Voertuigen binnen een cluster worden
                samen gesimuleerd en krijgen een gezamenlijk service level.
              </p>
              <p style={{ marginBottom: '10px' }}>
                Gebruik de matrix rechts om voertuigen aan clusters toe te wijzen.
                Elk voertuigtype kan slechts aan &eacute;&eacute;n cluster worden toegewezen.
                Stel vervolgens per cluster het gewenste service level in.
              </p>
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px',
                  backgroundColor: '#fff8e1',
                  border: `1px solid #f79646`,
                  borderLeft: `4px solid #f79646`,
                }}
              >
                <p style={{ fontWeight: 700, fontSize: '0.7rem', color: '#f79646', marginBottom: '3px', textTransform: 'uppercase' }}>
                  TIP
                </p>
                <p style={{ fontSize: '0.75rem', margin: 0 }}>
                  Standaard is het service level 95%. Een lager percentage resulteert in
                  minder benodigde ruimte, maar een groter risico op tekorten bij piekdrukte.
                </p>
              </div>
            </div>
          </ExcelPanel>

          {/* Panel 3: Bepaling Clusters & Service Level */}
          <ExcelPanel title="Bepaling Clusters & Service Level">
            {/* Cluster checkbox matrix */}
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.65rem',
                  fontFamily: 'Calibri, Arial, sans-serif',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '3px 5px',
                        borderBottom: `2px solid ${REBEL.border}`,
                        fontWeight: 700,
                        color: REBEL.textDark,
                        whiteSpace: 'nowrap',
                        fontSize: '0.6rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      Voertuigtype
                    </th>
                    {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => (
                      <th
                        key={cid}
                        style={{
                          textAlign: 'center',
                          padding: '3px 3px',
                          borderBottom: `2px solid ${REBEL.border}`,
                          fontWeight: 700,
                          color: CLUSTER_COLORS[cid] || REBEL.textDark,
                          whiteSpace: 'nowrap',
                          fontSize: '0.6rem',
                          textTransform: 'uppercase',
                        }}
                      >
                        C{cid}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VEHICLES.map((v) => (
                    <tr key={v.id}>
                      <td
                        style={{
                          fontSize: '0.65rem',
                          padding: '3px 5px',
                          borderBottom: `1px solid ${REBEL.gridLine}`,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '130px',
                          color: REBEL.textDark,
                        }}
                      >
                        {v.name}
                      </td>
                      {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => (
                        <td
                          key={cid}
                          style={{
                            textAlign: 'center',
                            padding: '3px 3px',
                            borderBottom: `1px solid ${REBEL.gridLine}`,
                          }}
                        >
                          <input
                            type="radio"
                            name={`rebel-cluster-${v.id}`}
                            checked={clusterAssignments[v.id] === cid}
                            onChange={() => handleClusterMatrixChange(v.id, cid)}
                            style={{
                              accentColor: CLUSTER_COLORS[cid] || REBEL.coral,
                              cursor: 'pointer',
                              width: '13px',
                              height: '13px',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Service level per cluster */}
            <div style={{ marginTop: '10px' }}>
              <p
                style={{
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: REBEL.textDark,
                  marginBottom: '6px',
                }}
              >
                Service Level per Cluster
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {clusterIds.map((cid) => (
                  <div
                    key={cid}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '3px 6px',
                      backgroundColor: REBEL.offWhite,
                      border: `1px solid ${REBEL.border}`,
                      borderLeft: `3px solid ${CLUSTER_COLORS[cid] || REBEL.coral}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Calibri, Arial, sans-serif',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        color: REBEL.textDark,
                      }}
                    >
                      C{cid}:
                    </span>
                    <input
                      type="text"
                      placeholder="Naam..."
                      value={state.clusterNames[cid] || ''}
                      onChange={(e) => state.handleClusterNameChange(cid, e.target.value)}
                      style={{
                        padding: '1px 3px',
                        border: `1px solid ${REBEL.border}`,
                        fontSize: '0.6rem',
                        color: REBEL.textDark,
                        fontFamily: 'Calibri, Arial, sans-serif',
                        backgroundColor: REBEL.white,
                        width: '75px',
                      }}
                    />
                    <select
                      value={String(clusterServiceLevels[cid] ?? 0.95)}
                      onChange={(e) => handleServiceLevelChange(cid, e.target.value)}
                      style={{
                        padding: '1px 3px',
                        border: `1px solid ${REBEL.border}`,
                        fontSize: '0.65rem',
                        color: REBEL.textDark,
                        fontFamily: 'Calibri, Arial, sans-serif',
                        backgroundColor: REBEL.white,
                        cursor: 'pointer',
                      }}
                    >
                      {SERVICE_LEVEL_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation count + Run button */}
            <div style={{ marginTop: '10px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-end', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <p
                  style={{
                    fontFamily: 'Calibri, Arial, sans-serif',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: REBEL.textDark,
                    marginBottom: '4px',
                  }}
                >
                  Simulaties: {numSimulations.toLocaleString('nl-NL')}
                </p>
                <Slider
                  min={100}
                  max={extendedSim ? 50000 : 5000}
                  step={extendedSim ? 500 : 100}
                  value={[numSimulations]}
                  onValueChange={(vals) => setNumSimulations(vals[0])}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '3px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', userSelect: 'none' }}>
                    <input
                      type="checkbox"
                      checked={extendedSim}
                      onChange={(e) => {
                        setExtendedSim(e.target.checked);
                        if (!e.target.checked && numSimulations > 5000) {
                          setNumSimulations(5000);
                        }
                      }}
                      style={{ accentColor: REBEL.coral }}
                    />
                    <span style={{ fontFamily: 'Calibri, Arial, sans-serif', fontSize: '0.55rem', color: REBEL.textDark }}>
                      Uitgebreid (max 50.000)
                    </span>
                  </label>
                </div>
              </div>
              <button
                onClick={handleRun}
                disabled={isRunning}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  backgroundColor: isRunning ? REBEL.coralLight : REBEL.coral,
                  color: REBEL.white,
                  border: 'none',
                  fontSize: '0.8rem',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: 700,
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isRunning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = REBEL.coralDark;
                }}
                onMouseLeave={(e) => {
                  if (!isRunning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = REBEL.coral;
                }}
              >
                {isRunning ? (
                  <>
                    <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                    Berekenen...
                  </>
                ) : (
                  <>
                    <Play style={{ width: 14, height: 14 }} />
                    Run Simulaties
                  </>
                )}
              </button>
            </div>
            {state.simulationError && (
              <div style={{ marginTop: 8, padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, color: '#991b1b', fontSize: '0.8rem' }}>
                {state.simulationError}
              </div>
            )}
          </ExcelPanel>
        </div>

        {/* Row 3: Details per Cluster */}
        {results && (
          <ExcelPanel title="Details per Cluster">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {results.clusterResults.map((cr) => {
              const vehiclesInCluster = results.vehicleResults.filter(
                (vr) => vr.clusterId === cr.clusterId
              );
              const isExpanded = expandedClusters[cr.clusterId] ?? false;
              const curveData = clusterServiceLevelCurves[cr.clusterId] || [];

              return (
                <div
                  key={cr.clusterId}
                  style={{
                    border: `1px solid ${REBEL.border}`,
                    borderLeft: `4px solid ${CLUSTER_COLORS[cr.clusterId] || REBEL.coral}`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Cluster header (clickable) */}
                  <button
                    type="button"
                    onClick={() => toggleCluster(cr.clusterId)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: REBEL.offWhite,
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          color: REBEL.textDark,
                        }}
                      >
                        {state.clusterNames[cr.clusterId] || `Cluster ${cr.clusterId}`}
                      </span>
                      <span
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          padding: '2px 8px',
                          backgroundColor: CLUSTER_COLORS[cr.clusterId] || REBEL.coral,
                          color: REBEL.white,
                        }}
                      >
                        SL {Math.round(cr.serviceLevel * 100)}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: REBEL.greenDark,
                        }}
                      >
                        {Math.round(cr.totalSpaceM2).toLocaleString('nl-NL')} m
                      </span>
                      <span style={{ fontSize: '0.75rem', color: REBEL.tabInactive }}>
                        {isExpanded ? '\u25B2' : '\u25BC'}
                      </span>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* Table */}
                        <div>
                          <table
                            style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '0.7rem',
                              fontFamily: 'Calibri, Arial, sans-serif',
                            }}
                          >
                            <thead>
                              <tr>
                                <th
                                  style={{
                                    textAlign: 'left',
                                    padding: '4px 6px',
                                    borderBottom: `2px solid ${REBEL.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.6rem',
                                    textTransform: 'uppercase',
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Voertuigtype
                                </th>
                                <th
                                  style={{
                                    textAlign: 'right',
                                    padding: '4px 6px',
                                    borderBottom: `2px solid ${REBEL.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.6rem',
                                    textTransform: 'uppercase',
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Lengte (m)
                                </th>
                                <th
                                  style={{
                                    textAlign: 'right',
                                    padding: '4px 6px',
                                    borderBottom: `2px solid ${REBEL.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.6rem',
                                    textTransform: 'uppercase',
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Aankomsten/dag
                                </th>
                                <th
                                  style={{
                                    textAlign: 'right',
                                    padding: '4px 6px',
                                    borderBottom: `2px solid ${REBEL.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.6rem',
                                    textTransform: 'uppercase',
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Max gelijktijdig
                                </th>
                                <th
                                  style={{
                                    textAlign: 'right',
                                    padding: '4px 6px',
                                    borderBottom: `2px solid ${REBEL.border}`,
                                    fontWeight: 700,
                                    fontSize: '0.6rem',
                                    textTransform: 'uppercase',
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Ruimte (m)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {vehiclesInCluster.map((vr) => (
                                <tr key={vr.vehicleId}>
                                  <td
                                    style={{
                                      padding: '4px 6px',
                                      borderBottom: `1px solid ${REBEL.gridLine}`,
                                      color: REBEL.textDark,
                                    }}
                                  >
                                    {vr.vehicleName}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderBottom: `1px solid ${REBEL.gridLine}`,
                                      color: REBEL.textDark,
                                    }}
                                  >
                                    {vr.vehicleLength}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderBottom: `1px solid ${REBEL.gridLine}`,
                                      color: REBEL.textDark,
                                    }}
                                  >
                                    {vr.totalArrivalsPerDay.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderBottom: `1px solid ${REBEL.gridLine}`,
                                      fontWeight: 600,
                                      color: REBEL.textDark,
                                    }}
                                  >
                                    {vr.maxVehiclesPerServiceLevel[
                                      Math.round((clusterServiceLevels[vr.clusterId] ?? 0.95) * 100)
                                    ] ?? '-'}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      padding: '4px 6px',
                                      borderBottom: `1px solid ${REBEL.gridLine}`,
                                      fontWeight: 700,
                                      color: REBEL.greenDark,
                                    }}
                                  >
                                    {vr.requiredSpaceM2.toLocaleString('nl-NL')}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr>
                                <td
                                  colSpan={4}
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.7rem',
                                    padding: '6px 6px',
                                    borderTop: `2px solid ${REBEL.coral}`,
                                    color: REBEL.textDark,
                                  }}
                                >
                                  Totaal Cluster {cr.clusterId}
                                </td>
                                <td
                                  style={{
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    textAlign: 'right',
                                    padding: '6px 6px',
                                    borderTop: `2px solid ${REBEL.coral}`,
                                    color: REBEL.greenDark,
                                  }}
                                >
                                  {Math.round(cr.totalSpaceM2).toLocaleString('nl-NL')} m
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                        {/* Service level curve line chart */}
                        <div>
                          {curveData.length > 0 ? (
                            <div style={{ height: '200px' }}>
                              <p
                                style={{
                                  fontFamily: 'Calibri, Arial, sans-serif',
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  color: REBEL.textDark,
                                  marginBottom: '4px',
                                }}
                              >
                                Service Level Curve - Cluster {cr.clusterId}
                              </p>
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={curveData} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                                  <XAxis
                                    dataKey="serviceLevel"
                                    tick={{ fontSize: 8, fill: REBEL.textDark }}
                                    axisLine={{ stroke: REBEL.border }}
                                    label={{ value: 'SL %', position: 'insideBottomRight', offset: -3, style: { fontSize: 8, fill: REBEL.textDark } }}
                                  />
                                  <YAxis
                                    tick={{ fontSize: 8, fill: REBEL.textDark }}
                                    axisLine={{ stroke: REBEL.border }}
                                    label={{ value: 'Voertuigen', angle: -90, position: 'insideLeft', offset: 10, style: { fontSize: 8, fill: REBEL.textDark } }}
                                  />
                                  <RechartsTooltip
                                    formatter={(value) => [
                                      `${Number(value).toLocaleString('nl-NL')}`,
                                      'Max voertuigen',
                                    ]}
                                    labelFormatter={(label) => `SL: ${label}%`}
                                  />
                                  <Line
                                    type="monotone"
                                    dataKey="vehicles"
                                    stroke={CLUSTER_COLORS[cr.clusterId] || REBEL.coral}
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: CLUSTER_COLORS[cr.clusterId] || REBEL.coral }}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </ExcelPanel>
        )}

        {/* Row 4: Details per Voertuig */}
        {results && (
          <div style={{ marginTop: '8px' }}>
            <ExcelPanel title="Details per Voertuig">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isCompact ? '1fr' : 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                {results.vehicleResults.map((vr) => {
                  const curveData = vehicleServiceLevelCurves[vr.vehicleId] || [];
                  if (curveData.length === 0) return null;

                  return (
                    <div
                      key={vr.vehicleId}
                      style={{
                        border: `1px solid ${REBEL.border}`,
                        padding: '8px',
                        backgroundColor: REBEL.white,
                      }}
                    >
                      <p
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          color: REBEL.textDark,
                          marginBottom: '4px',
                        }}
                      >
                        {vr.vehicleName}
                      </p>
                      <p
                        style={{
                          fontFamily: 'Calibri, Arial, sans-serif',
                          fontSize: '0.6rem',
                          color: REBEL.tabInactive,
                          marginBottom: '4px',
                        }}
                      >
                        Aankomsten/dag: {vr.totalArrivalsPerDay.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                        {' | '}Ruimte: {vr.requiredSpaceM2.toLocaleString('nl-NL')} m
                      </p>
                      <div style={{ height: '160px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={curveData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                            <XAxis
                              dataKey="serviceLevel"
                              tick={{ fontSize: 7, fill: REBEL.textDark }}
                              axisLine={{ stroke: REBEL.border }}
                            />
                            <YAxis
                              tick={{ fontSize: 7, fill: REBEL.textDark }}
                              axisLine={{ stroke: REBEL.border }}
                            />
                            <RechartsTooltip
                              formatter={(value) => [
                                `${Number(value).toLocaleString('nl-NL')}`,
                                'Max voertuigen',
                              ]}
                              labelFormatter={(label) => `SL: ${label}%`}
                            />
                            <Line
                              type="monotone"
                              dataKey="vehicles"
                              stroke={CHART_COLORS[VEHICLES.findIndex((v) => v.id === vr.vehicleId) % CHART_COLORS.length]}
                              strokeWidth={2}
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExcelPanel>
          </div>
        )}

        {/* Overall Service Level Curve */}
        {results && serviceLevelCurveData.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <ExcelPanel title="Totale Ruimte vs Service Level">
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={serviceLevelCurveData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={REBEL.gridLine} />
                    <XAxis
                      dataKey="serviceLevel"
                      tick={{ fontSize: 9, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                      label={{ value: 'Service Level (%)', position: 'insideBottom', offset: -5, style: { fontSize: 10, fill: REBEL.textDark } }}
                    />
                    <YAxis
                      tick={{ fontSize: 9, fill: REBEL.textDark }}
                      axisLine={{ stroke: REBEL.border }}
                      label={{ value: 'Ruimte (m)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 10, fill: REBEL.textDark } }}
                    />
                    <RechartsTooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('nl-NL')} m`,
                        'Totale ruimte',
                      ]}
                      labelFormatter={(label) => `SL: ${label}%`}
                    />
                    <Line
                      type="monotone"
                      dataKey="space"
                      stroke={REBEL.coral}
                      strokeWidth={2.5}
                      dot={{ r: 0 }}
                      activeDot={{ r: 4, fill: REBEL.coral }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ExcelPanel>
          </div>
        )}
      </div>
    );
  }

  function renderInputsTab() {
    return (
      <div style={{ padding: isMobile ? '8px' : '16px' }}>
        {/* Title bar */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: REBEL.coral,
            color: REBEL.white,
            marginBottom: '12px',
          }}
        >
          <h2
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              margin: 0,
            }}
          >
            Rekentool: Inputs
          </h2>
        </div>

        {/* Reset buttons */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          <button
            onClick={state.resetToGerardDoustraat}
            style={{
              padding: '6px 14px', border: `1px solid ${REBEL.border}`,
              backgroundColor: REBEL.offWhite, color: REBEL.textDark,
              fontFamily: 'Calibri, Arial, sans-serif', fontWeight: 600, fontSize: '0.75rem',
              cursor: 'pointer', borderRadius: '2px',
            }}
          >
            Gerard Doustraat
          </button>
          <button
            onClick={state.resetToBlank}
            style={{
              padding: '6px 14px', border: `1px solid ${REBEL.border}`,
              backgroundColor: REBEL.offWhite, color: REBEL.textDark,
              fontFamily: 'Calibri, Arial, sans-serif', fontWeight: 600, fontSize: '0.75rem',
              cursor: 'pointer', borderRadius: '2px',
            }}
          >
            Leeg model
          </button>
        </div>

        {/* Buttons row */}
        <div style={{ marginBottom: '12px' }}>
          <p
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: REBEL.textDark,
              marginBottom: '8px',
            }}
          >
            Algemene Inputs
          </p>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <button
              onClick={() => setSelectedFunction('algemeen')}
              style={{
                padding: '8px 20px',
                backgroundColor: selectedFunction === 'algemeen' ? REBEL.coral : REBEL.darkBg2,
                color: REBEL.white,
                border: 'none',
                fontSize: '0.8rem',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Aantal per Functie
            </button>
            <button
              onClick={() => setSelectedFunction('parameters')}
              style={{
                padding: '8px 20px',
                backgroundColor: selectedFunction === 'parameters' ? REBEL.coral : REBEL.darkBg2,
                color: REBEL.white,
                border: 'none',
                fontSize: '0.8rem',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Parameters
            </button>
          </div>

          <p
            style={{
              fontFamily: 'Calibri, Arial, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: REBEL.textDark,
              marginBottom: '8px',
            }}
          >
            Beleveringsprofielen
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {state.allFunctions.map((func) => (
              <button
                key={func.id}
                onClick={() => setSelectedFunction(func.id)}
                style={{
                  padding: '6px 14px',
                  backgroundColor: selectedFunction === func.id ? REBEL.coral : REBEL.darkBg2,
                  color: REBEL.white,
                  border: 'none',
                  fontSize: '0.75rem',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: selectedFunction === func.id ? 700 : 400,
                  cursor: 'pointer',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedFunction !== func.id)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = REBEL.tabInactiveHover;
                }}
                onMouseLeave={(e) => {
                  if (selectedFunction !== func.id)
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = REBEL.darkBg2;
                }}
              >
                {func.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content area */}
        {selectedFunction === 'algemeen' && (
          <ExcelPanel title="Algemene Inputs - Aantal per Functie">
            <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontSize: '0.8rem',
              }}
            >
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.textDark, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: REBEL.offWhite }}>Functie</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.textDark, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: REBEL.offWhite }}>Omschrijving</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.textDark, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: REBEL.offWhite }}>Eenheid</th>
                  <th style={{ textAlign: 'center', padding: '8px 10px', borderBottom: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.textDark, fontSize: '0.7rem', textTransform: 'uppercase', backgroundColor: REBEL.offWhite }}>Aantal</th>
                </tr>
              </thead>
              <tbody>
                {state.allFunctions.map((func, idx) => (
                  <tr key={func.id} style={{ backgroundColor: idx % 2 === 0 ? REBEL.white : REBEL.offWhite }}>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${REBEL.gridLine}`, fontWeight: 600, color: REBEL.textDark }}>{func.name}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${REBEL.gridLine}`, color: REBEL.tabInactive, fontSize: '0.75rem' }}>{func.description}</td>
                    <td style={{ padding: '6px 10px', borderBottom: `1px solid ${REBEL.gridLine}`, color: REBEL.textDark, fontSize: '0.75rem' }}>{func.unit}</td>
                    <td style={{ textAlign: 'center', padding: '6px 10px', borderBottom: `1px solid ${REBEL.gridLine}` }}>
                      <input
                        type="number" min={0}
                        value={functionCounts[func.id] ?? 0}
                        onChange={(e) => handleFunctionCountChange(func.id, e.target.value)}
                        style={{ width: '80px', padding: '4px 8px', border: `1px solid ${REBEL.border}`, fontSize: '0.8rem', fontFamily: 'Calibri, Arial, sans-serif', color: REBEL.greenDark, fontWeight: 700, textAlign: 'center', outline: 'none' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ padding: '8px 10px', borderTop: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.textDark }}>Totaal Functies</td>
                  <td style={{ textAlign: 'center', padding: '8px 10px', borderTop: `2px solid ${REBEL.coral}`, fontWeight: 700, color: REBEL.greenDark, fontSize: '1rem' }}>{totalFunctions.toLocaleString('nl-NL')}</td>
                </tr>
              </tfoot>
            </table>
            </div>
          </ExcelPanel>
        )}

        {selectedFunction === 'parameters' && (
          <ExcelPanel title="Parameters">
            <AlgemeenEditor state={state} theme="rebel" />
          </ExcelPanel>
        )}

        {selectedFunction && selectedFunction !== 'algemeen' && selectedFunction !== 'parameters' && (
          <ExcelPanel title={`Beleveringsprofiel: ${state.allFunctions.find((f) => f.id === selectedFunction)?.name ?? selectedFunction}`}>
            <DeliveryProfileEditor
              state={state}
              theme="rebel"
              functionId={selectedFunction}
              onBack={() => setSelectedFunction('algemeen')}
            />
          </ExcelPanel>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: REBEL.darkBg,
        fontFamily: 'Calibri, Arial, sans-serif',
      }}
    >
      {/* Floating layout switcher */}
      <LayoutSwitcher current={layout} onChange={onLayoutChange} />

      {/* Left sidebar - hidden on mobile */}
      {!isMobile && (
      <div
        style={{
          width: '48px',
          backgroundColor: REBEL.coral,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '12px',
          paddingBottom: '60px',
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <RebelLogo />
        </div>
        <div
          style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            transform: 'rotate(180deg)',
            color: REBEL.white,
            fontFamily: 'Calibri, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '0.85rem',
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
          }}
        >
          Rekentool Ruimte voor Stadslogistiek
        </div>
      </div>
      )}

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          paddingBottom: '44px', // space for tab bar
        }}
      >
        {/* Content */}
        <div
          style={{
            flex: 1,
            backgroundColor: REBEL.darkBg,
            overflow: 'auto',
          }}
        >
          {activeTab === 'cover' && renderCoverTab()}
          {activeTab === 'handleiding' && renderHandleidingTab()}
          {activeTab === 'cockpit' && renderCockpitTab()}
          {activeTab === 'inputs' && renderInputsTab()}
          {activeTab === 'algemeen' && renderAlgemeenTab()}
        </div>
      </div>

      {/* Bottom tab bar - sticky */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'stretch',
          height: '36px',
          backgroundColor: REBEL.darkBg2,
          borderTop: `1px solid ${REBEL.tabInactive}`,
          zIndex: 1000,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0 20px',
                backgroundColor: isActive ? REBEL.tabActive : 'transparent',
                color: isActive ? REBEL.white : REBEL.textLight,
                border: 'none',
                borderRight: `1px solid ${REBEL.tabInactive}`,
                fontSize: '0.75rem',
                fontFamily: 'Calibri, Arial, sans-serif',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = REBEL.tabInactiveHover;
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
              }}
            >
              {tab.label}
            </button>
          );
        })}
        {/* Filler space after tabs */}
        <div style={{ flex: 1 }} />
        {/* Feedback button */}
        <FeedbackButton variant="rebel" />
        {/* Rebel branding in tab bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            paddingRight: '16px',
            color: REBEL.textLight,
            fontSize: '0.65rem',
            fontFamily: 'Calibri, Arial, sans-serif',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 40 40">
            <path d="M20 4L6 36h8l2-6h8l2 6h8L20 4zm0 14l3 8h-6l3-8z" fill={REBEL.coralLight} />
          </svg>
          Rebel Group
        </div>
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
