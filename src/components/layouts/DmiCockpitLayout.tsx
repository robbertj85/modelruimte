'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Slider } from '@/components/ui/slider';
import { VEHICLES, FUNCTIONS } from '@/lib/model-data';
import type { SimulationState, LayoutType } from '@/lib/use-simulation-state';
import { COVER, HANDLEIDING_SECTIONS, PARTNER_LOGOS } from '@/lib/content';
import LayoutSwitcher from '@/components/LayoutSwitcher';
import {
  DMI,
  PERIOD_COLORS,
  FUNCTION_COLORS,
  CLUSTER_COLORS,
  CLUSTER_NAMES,
  SERVICE_LEVEL_OPTIONS,
  MAX_CLUSTERS,
  heading,
  bodyText,
  labelMono,
} from '@/lib/dmi-theme';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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
        backgroundColor: DMI.white,
        borderRadius: '8px',
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
      }}
    >
      <span style={{ ...labelMono, fontSize: '0.6rem' }}>
        {label}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span
          style={{
            fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
            fontWeight: 700,
            fontSize: '1.75rem',
            color: DMI.darkBlue,
            lineHeight: 1,
          }}
        >
          {value}
        </span>
        {suffix && (
          <span
            style={{
              ...bodyText,
              fontSize: '0.8rem',
              color: DMI.darkGray,
            }}
            dangerouslySetInnerHTML={{ __html: suffix }}
          />
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: DMI.white,
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `2px solid ${DMI.blueTint2}`,
        }}
      >
        <h3
          style={{
            ...heading,
            fontSize: '0.9rem',
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        height: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: DMI.blueTint3,
        borderRadius: '6px',
      }}
    >
      <p
        style={{
          ...bodyText,
          fontSize: '0.8rem',
          color: DMI.blueTint1,
          textAlign: 'center',
        }}
      >
        {message}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Layout Component
// ---------------------------------------------------------------------------

type DmiNavMode = 'cockpit' | 'cover' | 'handleiding';

export default function DmiCockpitLayout({
  state,
  layout,
  onLayoutChange,
}: {
  state: SimulationState;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}) {
  const [navMode, setNavMode] = useState<DmiNavMode>('cockpit');

  // --- Computed values ---
  const chosenServiceLevel = useMemo(() => {
    const levels = Object.values(state.clusterServiceLevels);
    if (levels.length === 0) return 0.95;
    return levels[0];
  }, [state.clusterServiceLevels]);

  // Donut chart data
  const donutData = useMemo(() => {
    return FUNCTIONS
      .filter((f) => (state.functionCounts[f.id] ?? 0) > 0)
      .map((f, idx) => ({
        name: f.name,
        value: state.functionCounts[f.id] ?? 0,
        fill: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
      }));
  }, [state.functionCounts]);

  // Vehicle arrivals chart data (horizontal bars per vehicle type)
  const vehicleArrivalsData = useMemo(() => {
    if (!state.results) return [];
    return state.results.vehicleResults.map((vr) => ({
      name: vr.vehicleName.length > 25 ? vr.vehicleName.substring(0, 22) + '...' : vr.vehicleName,
      fullName: vr.vehicleName,
      arrivals: Math.round(vr.totalArrivalsPerDay * 10) / 10,
    }));
  }, [state.results]);

  // Required length per vehicle chart data
  const vehicleLengthData = useMemo(() => {
    if (!state.results) return [];
    return state.results.vehicleResults.map((vr) => ({
      name: vr.vehicleName.length > 25 ? vr.vehicleName.substring(0, 22) + '...' : vr.vehicleName,
      fullName: vr.vehicleName,
      length: vr.requiredSpaceM2,
    }));
  }, [state.results]);

  // Cluster space data (horizontal bars)
  const clusterSpaceData = useMemo(() => {
    if (!state.results) return [];
    return state.results.clusterResults.map((cr) => ({
      name: `Cluster ${cr.clusterId}${CLUSTER_NAMES[cr.clusterId] ? ` - ${CLUSTER_NAMES[cr.clusterId]}` : ''}`,
      space: Math.round(cr.totalSpaceM2),
      clusterId: cr.clusterId,
    }));
  }, [state.results]);

  // Max horizontal bar value for function inputs visualization
  const maxFunctionCount = useMemo(() => {
    return Math.max(1, ...Object.values(state.functionCounts));
  }, [state.functionCounts]);

  return (
    <TooltipProvider>
      <div style={{ minHeight: '100vh', backgroundColor: DMI.lightGray }}>
        {/* ================================================================
            TOP HEADER BAR
        ================================================================ */}
        <header
          style={{
            backgroundColor: DMI.darkBlue,
            color: DMI.white,
            padding: '16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div>
              <h1
                style={{
                  ...heading,
                  color: DMI.white,
                  fontSize: '1.5rem',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Ruimtemodel Stadslogistiek
              </h1>
              <p
                style={{
                  ...bodyText,
                  color: DMI.blueTint1,
                  fontSize: '0.875rem',
                  margin: '4px 0 0 0',
                }}
              >
                {navMode === 'cockpit' ? 'Cockpit' : navMode === 'cover' ? 'Cover' : 'Handleiding'}
              </p>
            </div>
            {/* Nav buttons */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['cover', 'handleiding', 'cockpit'] as DmiNavMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setNavMode(mode)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                    fontWeight: navMode === mode ? 700 : 500,
                    backgroundColor: navMode === mode ? DMI.yellow : 'rgba(255,255,255,0.12)',
                    color: navMode === mode ? DMI.darkBlue : '#ffffffcc',
                    transition: 'all 0.2s ease',
                    textTransform: 'capitalize',
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <LayoutSwitcher current={layout} onChange={onLayoutChange} />
            <Image
              src="/dmi-logo-diap.png"
              alt="DMI Logo"
              width={120}
              height={40}
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        </header>

        {/* ================================================================
            COVER VIEW
        ================================================================ */}
        {navMode === 'cover' && (
          <div style={{ padding: '48px 32px', maxWidth: '960px', margin: '0 auto' }}>
            <div
              style={{
                backgroundColor: DMI.white,
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                padding: '48px 64px',
                textAlign: 'center',
              }}
            >
              <h1
                style={{
                  ...heading,
                  fontSize: '2.2rem',
                  marginBottom: '12px',
                }}
              >
                {COVER.title}
              </h1>
              <p
                style={{
                  ...bodyText,
                  fontSize: '1.1rem',
                  color: DMI.mediumBlue,
                  marginBottom: '24px',
                }}
              >
                {COVER.subtitle}
              </p>
              <div
                style={{
                  width: '80px',
                  height: '3px',
                  backgroundColor: DMI.yellow,
                  margin: '0 auto 24px',
                  borderRadius: '2px',
                }}
              />
              <p
                style={{
                  ...bodyText,
                  fontSize: '0.9rem',
                  lineHeight: 1.7,
                  maxWidth: '640px',
                  margin: '0 auto 40px',
                }}
              >
                {COVER.description}
              </p>

              {/* Partner logos grid */}
              <div
                style={{
                  borderTop: `1px solid ${DMI.blueTint2}`,
                  paddingTop: '32px',
                }}
              >
                <p style={{ ...labelMono, marginBottom: '20px' }}>Partners</p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: '32px',
                    alignItems: 'center',
                  }}
                >
                  {PARTNER_LOGOS.map((logo) => (
                    <div
                      key={logo.src}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <Image
                        src={logo.src}
                        alt={logo.alt}
                        width={100}
                        height={50}
                        style={{ objectFit: 'contain', maxHeight: '50px' }}
                      />
                      <span style={{ ...bodyText, fontSize: '0.65rem', color: DMI.darkGray }}>
                        {logo.organization}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            HANDLEIDING VIEW
        ================================================================ */}
        {navMode === 'handleiding' && (
          <div style={{ padding: '32px', maxWidth: '860px', margin: '0 auto' }}>
            <h2 style={{ ...heading, fontSize: '1.5rem', marginBottom: '24px' }}>
              Handleiding Ruimtemodel Stadslogistiek
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {HANDLEIDING_SECTIONS.map((section) => (
                <div
                  key={section.title}
                  style={{
                    backgroundColor: DMI.white,
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 20px',
                      borderBottom: `2px solid ${DMI.blueTint2}`,
                      backgroundColor: DMI.blueTint3,
                    }}
                  >
                    <h3 style={{ ...heading, fontSize: '1rem', margin: 0 }}>
                      {section.title}
                    </h3>
                  </div>
                  <div style={{ padding: '20px' }}>
                    {section.paragraphs.map((p, i) => (
                      <p
                        key={i}
                        style={{
                          ...bodyText,
                          fontSize: '0.85rem',
                          lineHeight: 1.7,
                          marginBottom: i < section.paragraphs.length - 1 ? '12px' : 0,
                        }}
                      >
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tip box */}
            <div
              style={{
                marginTop: '24px',
                padding: '16px 20px',
                backgroundColor: DMI.blueTint3,
                borderRadius: '8px',
                borderLeft: `4px solid ${DMI.yellow}`,
              }}
            >
              <p style={{ ...labelMono, marginBottom: '6px' }}>TIP</p>
              <p style={{ ...bodyText, fontSize: '0.8rem', lineHeight: 1.6 }}>
                Standaard is het service level 95%. Een lager percentage resulteert in
                minder benodigde ruimte, maar een groter risico op tekorten bij piekdrukte.
              </p>
            </div>
          </div>
        )}

        {/* ================================================================
            COCKPIT VIEW (existing content)
        ================================================================ */}
        {navMode === 'cockpit' && (<>

        {/* ================================================================
            KPI ROW
        ================================================================ */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '16px',
            padding: '20px 32px',
            backgroundColor: DMI.blueTint3,
          }}
        >
          {/* KPI 1: Total Functions */}
          <KpiCard
            label="Totaal # Functies"
            value={state.totalFunctions.toLocaleString('nl-NL')}
            suffix=""
          />
          {/* KPI 2: Expected Vehicles */}
          <KpiCard
            label="Verwacht # Voertuigen"
            value={state.computedTotalVehicles !== null ? Math.round(state.computedTotalVehicles).toLocaleString('nl-NL') : '--'}
            suffix="#/Dag"
          />
          {/* KPI 3: Service Level */}
          <KpiCard
            label="Gekozen Service Level"
            value={`${Math.round(chosenServiceLevel * 100)}%`}
            suffix=""
          />
          {/* KPI 4: Required Length */}
          <KpiCard
            label="Benodigde Lengte Laden & Lossen"
            value={state.results ? Math.round(state.results.totalSpaceM2).toLocaleString('nl-NL') : '--'}
            suffix="m"
          />
          {/* KPI 5: Required Area */}
          <KpiCard
            label="Benodigde Oppervlakte Laden & Lossen"
            value={state.results ? Math.round(state.results.totalSpaceM2 * 3).toLocaleString('nl-NL') : '--'}
            suffix="m&sup2;"
          />
        </div>

        {/* ================================================================
            MAIN CONTENT AREA
        ================================================================ */}
        <div style={{ padding: '20px 32px' }}>

          {/* ============================================================
              ROW 1: Three panels side by side
          ============================================================ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {/* Panel 1: Inventarisatie Functies */}
            <Panel title="Inventarisatie Functies">
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Left: function inputs with mini bars */}
                <div style={{ flex: '1 1 55%', maxHeight: '440px', overflowY: 'auto' }}>
                  {FUNCTIONS.map((func, idx) => {
                    const count = state.functionCounts[func.id] ?? 0;
                    const barWidth = maxFunctionCount > 0 ? (count / maxFunctionCount) * 100 : 0;
                    return (
                      <div key={func.id} style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                          <span style={{ ...bodyText, fontSize: '0.7rem', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {func.name}
                          </span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button type="button" style={{ color: DMI.blueTint1, background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                                <Info style={{ width: 12, height: 12 }} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              {func.description}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            min={0}
                            value={count}
                            onChange={(e) => state.handleFunctionCountChange(func.id, e.target.value)}
                            style={{
                              width: '60px',
                              padding: '3px 6px',
                              border: `1px solid ${DMI.blueTint2}`,
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              color: DMI.darkBlue,
                              fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                              outline: 'none',
                            }}
                          />
                          <div style={{ flex: 1, height: '12px', backgroundColor: DMI.blueTint3, borderRadius: '2px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${barWidth}%`,
                                height: '100%',
                                backgroundColor: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
                                borderRadius: '2px',
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Right: donut chart */}
                <div style={{ flex: '1 1 45%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {donutData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
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
                          wrapperStyle={{ fontSize: '0.6rem', color: DMI.darkGray }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p style={{ ...bodyText, fontSize: '0.75rem', textAlign: 'center' }}>
                      Vul functies in om de verdeling te zien
                    </p>
                  )}
                </div>
              </div>
            </Panel>

            {/* Panel 2: Verwacht # Voertuigen */}
            <Panel title="Verwacht # Voertuigen">
              {state.results ? (
                <div style={{ height: '420px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={vehicleArrivalsData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: DMI.darkGray }}
                        axisLine={{ stroke: DMI.blueTint1 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 9, fill: DMI.darkGray }}
                        axisLine={{ stroke: DMI.blueTint1 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString('nl-NL')} /dag`,
                          'Voertuigen',
                        ]}
                      />
                      <Bar dataKey="arrivals" radius={[0, 4, 4, 0]} barSize={20}>
                        {vehicleArrivalsData.map((_, idx) => (
                          <Cell key={idx} fill={PERIOD_COLORS[idx % PERIOD_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Voer eerst de simulatie uit om voertuigdata te zien" />
              )}
            </Panel>

            {/* Panel 3: Benodigde Lengte per Voertuig */}
            <Panel title="Benodigde Lengte per Voertuig">
              {state.results ? (
                <div style={{ height: '420px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={vehicleLengthData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: DMI.darkGray }}
                        axisLine={{ stroke: DMI.blueTint1 }}
                        label={{
                          value: 'meter',
                          position: 'insideBottomRight',
                          offset: -5,
                          style: { fontSize: 10, fill: DMI.darkGray },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 9, fill: DMI.darkGray }}
                        axisLine={{ stroke: DMI.blueTint1 }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          `${Number(value).toLocaleString('nl-NL')} m`,
                          'Lengte',
                        ]}
                      />
                      <Bar dataKey="length" radius={[0, 4, 4, 0]} barSize={20}>
                        {vehicleLengthData.map((_, idx) => (
                          <Cell key={idx} fill={PERIOD_COLORS[idx % PERIOD_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="Voer eerst de simulatie uit om lengtedata te zien" />
              )}
            </Panel>
          </div>

          {/* ============================================================
              ROW 2: Three panels side by side
          ============================================================ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {/* Panel 1: Benodigde ruimte per Cluster */}
            <Panel title="Benodigde ruimte (/m) per Cluster">
              {state.results ? (
                <div>
                  <div style={{ height: '340px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={clusterSpaceData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                        <XAxis
                          type="number"
                          tick={{ fontSize: 10, fill: DMI.darkGray }}
                          axisLine={{ stroke: DMI.blueTint1 }}
                          label={{
                            value: 'meter',
                            position: 'insideBottomRight',
                            offset: -5,
                            style: { fontSize: 10, fill: DMI.darkGray },
                          }}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={150}
                          tick={{ fontSize: 9, fill: DMI.darkGray }}
                          axisLine={{ stroke: DMI.blueTint1 }}
                        />
                        <RechartsTooltip
                          formatter={(value) => [
                            `${Number(value).toLocaleString('nl-NL')} m`,
                            'Ruimte',
                          ]}
                        />
                        <Bar dataKey="space" radius={[0, 4, 4, 0]} barSize={24}>
                          {clusterSpaceData.map((entry) => (
                            <Cell
                              key={entry.clusterId}
                              fill={CLUSTER_COLORS[entry.clusterId] || DMI.mediumBlue}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Total summary box */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      backgroundColor: DMI.darkBlue,
                      color: DMI.white,
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ ...heading, color: DMI.white, fontSize: '0.85rem' }}>
                      TOTAAL
                    </span>
                    <span style={{ ...heading, color: DMI.yellow, fontSize: '1.25rem' }}>
                      {Math.round(state.results.totalSpaceM2).toLocaleString('nl-NL')} m
                    </span>
                  </div>
                </div>
              ) : (
                <EmptyState message="Voer eerst de simulatie uit om clusterdata te zien" />
              )}
            </Panel>

            {/* Panel 2: Service Levels & Clustering */}
            <Panel title="Service Levels & Clustering">
              <div style={{ ...bodyText, fontSize: '0.8rem', lineHeight: 1.6 }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: DMI.darkBlue }}>Service Level</strong> bepaalt hoeveel procent van de tijd
                  de beschikbare laad- en losruimte voldoende is. Een hoger service level
                  betekent meer ruimte om pieken op te vangen.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  <strong style={{ color: DMI.darkBlue }}>Clustering</strong> groepeert voertuigtypen die
                  dezelfde laad-/losruimte delen. Voertuigen binnen een cluster worden
                  samen gesimuleerd en krijgen een gezamenlijk service level.
                </p>
                <p style={{ marginBottom: '12px' }}>
                  Gebruik de matrix rechts om voertuigen aan clusters toe te wijzen.
                  Elk voertuigtype kan slechts aan een cluster worden toegewezen.
                  Stel vervolgens per cluster het gewenste service level in.
                </p>
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: DMI.blueTint3,
                    borderRadius: '6px',
                    borderLeft: `4px solid ${DMI.yellow}`,
                  }}
                >
                  <p style={{ ...labelMono, marginBottom: '4px' }}>TIP</p>
                  <p style={{ ...bodyText, fontSize: '0.75rem' }}>
                    Standaard is het service level 95%. Een lager percentage resulteert in
                    minder benodigde ruimte, maar een groter risico op tekorten bij piekdrukte.
                  </p>
                </div>
              </div>
            </Panel>

            {/* Panel 3: Bepaling Clusters & Service Level */}
            <Panel title="Bepaling Clusters & Service Level">
              {/* Cluster checkbox matrix */}
              <div style={{ overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.7rem',
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...labelMono,
                          textAlign: 'left',
                          padding: '4px 6px',
                          borderBottom: `2px solid ${DMI.blueTint2}`,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Voertuigtype
                      </th>
                      {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => (
                        <th
                          key={cid}
                          style={{
                            ...labelMono,
                            textAlign: 'center',
                            padding: '4px 4px',
                            borderBottom: `2px solid ${DMI.blueTint2}`,
                            whiteSpace: 'nowrap',
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
                            ...bodyText,
                            fontSize: '0.7rem',
                            padding: '4px 6px',
                            borderBottom: `1px solid ${DMI.blueTint3}`,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '140px',
                          }}
                        >
                          {v.name}
                        </td>
                        {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => (
                          <td
                            key={cid}
                            style={{
                              textAlign: 'center',
                              padding: '4px 4px',
                              borderBottom: `1px solid ${DMI.blueTint3}`,
                            }}
                          >
                            <input
                              type="radio"
                              name={`cluster-${v.id}`}
                              checked={state.clusterAssignments[v.id] === cid}
                              onChange={() => state.handleClusterMatrixChange(v.id, cid)}
                              style={{
                                accentColor: CLUSTER_COLORS[cid] || DMI.mediumBlue,
                                cursor: 'pointer',
                                width: '14px',
                                height: '14px',
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
              <div style={{ marginTop: '14px' }}>
                <p style={{ ...labelMono, marginBottom: '8px' }}>Service Level per Cluster</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {state.clusterIds.map((cid) => (
                    <div
                      key={cid}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: DMI.blueTint3,
                        borderRadius: '4px',
                        borderLeft: `3px solid ${CLUSTER_COLORS[cid] || DMI.mediumBlue}`,
                      }}
                    >
                      <span style={{ ...bodyText, fontSize: '0.7rem', fontWeight: 600 }}>
                        C{cid}:
                      </span>
                      <select
                        value={String(state.clusterServiceLevels[cid] ?? 0.95)}
                        onChange={(e) => state.handleServiceLevelChange(cid, e.target.value)}
                        style={{
                          padding: '2px 4px',
                          border: `1px solid ${DMI.blueTint2}`,
                          borderRadius: '3px',
                          fontSize: '0.7rem',
                          color: DMI.darkBlue,
                          fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                          backgroundColor: DMI.white,
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
              <div style={{ marginTop: '14px', display: 'flex', alignItems: 'flex-end', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ ...labelMono, marginBottom: '6px' }}>Simulaties: {state.numSimulations.toLocaleString('nl-NL')}</p>
                  <Slider
                    min={100}
                    max={5000}
                    step={100}
                    value={[state.numSimulations]}
                    onValueChange={(vals) => state.setNumSimulations(vals[0])}
                  />
                </div>
                <button
                  onClick={state.handleRun}
                  disabled={state.isRunning}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 24px',
                    backgroundColor: state.isRunning ? DMI.blueTint1 : DMI.darkBlue,
                    color: DMI.white,
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                    fontWeight: 700,
                    cursor: state.isRunning ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    if (!state.isRunning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = DMI.mediumBlue;
                  }}
                  onMouseLeave={(e) => {
                    if (!state.isRunning) (e.currentTarget as HTMLButtonElement).style.backgroundColor = DMI.darkBlue;
                  }}
                >
                  {state.isRunning ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      Berekenen...
                    </>
                  ) : (
                    <>
                      <Play style={{ width: 16, height: 16 }} />
                      Run Simulaties
                    </>
                  )}
                </button>
              </div>
            </Panel>
          </div>

          {/* ============================================================
              ROW 3: Details per Cluster
          ============================================================ */}
          {state.results && (
            <Panel title="Details per Cluster">
              {state.results.clusterResults.map((cr) => {
                const vehiclesInCluster = state.results!.vehicleResults.filter(
                  (vr) => vr.clusterId === cr.clusterId
                );
                const isExpanded = state.expandedClusters[cr.clusterId] ?? false;

                return (
                  <div
                    key={cr.clusterId}
                    style={{
                      marginBottom: '8px',
                      border: `1px solid ${DMI.blueTint2}`,
                      borderRadius: '6px',
                      borderLeft: `4px solid ${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}`,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Cluster header (clickable) */}
                    <button
                      type="button"
                      onClick={() => state.toggleCluster(cr.clusterId)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        backgroundColor: DMI.blueTint3,
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ ...heading, fontSize: '0.9rem' }}>
                          Cluster {cr.clusterId}
                          {CLUSTER_NAMES[cr.clusterId] && (
                            <span style={{ ...bodyText, fontWeight: 400, marginLeft: '6px', fontSize: '0.8rem' }}>
                              ({CLUSTER_NAMES[cr.clusterId]})
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            ...labelMono,
                            padding: '2px 8px',
                            backgroundColor: DMI.blueTint2,
                            borderRadius: '10px',
                          }}
                        >
                          SL {Math.round(cr.serviceLevel * 100)}%
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ ...heading, fontSize: '1.1rem' }}>
                          {Math.round(cr.totalSpaceM2).toLocaleString('nl-NL')} m
                        </span>
                        {isExpanded ? (
                          <ChevronUp style={{ width: 18, height: 18, color: DMI.darkBlue }} />
                        ) : (
                          <ChevronDown style={{ width: 18, height: 18, color: DMI.darkBlue }} />
                        )}
                      </div>
                    </button>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div style={{ padding: '12px 16px' }}>
                        <table
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.75rem',
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={{ ...labelMono, textAlign: 'left', padding: '6px 8px', borderBottom: `2px solid ${DMI.blueTint2}` }}>
                                Voertuigtype
                              </th>
                              <th style={{ ...labelMono, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${DMI.blueTint2}` }}>
                                Lengte (m)
                              </th>
                              <th style={{ ...labelMono, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${DMI.blueTint2}` }}>
                                Aankomsten/dag
                              </th>
                              <th style={{ ...labelMono, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${DMI.blueTint2}` }}>
                                Max gelijktijdig
                              </th>
                              <th style={{ ...labelMono, textAlign: 'right', padding: '6px 8px', borderBottom: `2px solid ${DMI.blueTint2}` }}>
                                Ruimte (m)
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehiclesInCluster.map((vr) => (
                              <tr key={vr.vehicleId}>
                                <td style={{ ...bodyText, fontSize: '0.75rem', padding: '6px 8px', borderBottom: `1px solid ${DMI.blueTint3}` }}>
                                  {vr.vehicleName}
                                </td>
                                <td style={{ ...bodyText, fontSize: '0.75rem', textAlign: 'right', padding: '6px 8px', borderBottom: `1px solid ${DMI.blueTint3}` }}>
                                  {vr.vehicleLength}
                                </td>
                                <td style={{ ...bodyText, fontSize: '0.75rem', textAlign: 'right', padding: '6px 8px', borderBottom: `1px solid ${DMI.blueTint3}` }}>
                                  {vr.totalArrivalsPerDay.toLocaleString('nl-NL', { maximumFractionDigits: 1 })}
                                </td>
                                <td style={{ ...bodyText, fontSize: '0.75rem', textAlign: 'right', padding: '6px 8px', borderBottom: `1px solid ${DMI.blueTint3}`, fontWeight: 600 }}>
                                  {vr.maxVehiclesPerServiceLevel[
                                    Math.round((state.clusterServiceLevels[vr.clusterId] ?? 0.95) * 100)
                                  ] ?? '-'}
                                </td>
                                <td style={{ ...bodyText, fontSize: '0.75rem', textAlign: 'right', padding: '6px 8px', borderBottom: `1px solid ${DMI.blueTint3}`, fontWeight: 700, color: DMI.darkBlue }}>
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
                                  ...heading,
                                  fontSize: '0.75rem',
                                  padding: '8px 8px',
                                  borderTop: `2px solid ${DMI.darkBlue}`,
                                }}
                              >
                                Totaal Cluster {cr.clusterId}
                              </td>
                              <td
                                style={{
                                  ...heading,
                                  fontSize: '0.85rem',
                                  textAlign: 'right',
                                  padding: '8px 8px',
                                  borderTop: `2px solid ${DMI.darkBlue}`,
                                }}
                              >
                                {Math.round(cr.totalSpaceM2).toLocaleString('nl-NL')} m
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </Panel>
          )}
        </div>

        </>)}

        {/* ================================================================
            FOOTER
        ================================================================ */}
        <footer
          style={{
            textAlign: 'center',
            padding: '16px 32px',
            borderTop: `1px solid ${DMI.blueTint2}`,
            backgroundColor: DMI.blueTint3,
          }}
        >
          <p style={{ ...bodyText, fontSize: '0.7rem', color: DMI.blueTint1 }}>
            Ruimtemodel Stadslogistiek &mdash; DMI Ecosysteem &mdash; Monte Carlo-simulatie voor het dimensioneren van laad- en losruimte
          </p>
        </footer>
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </TooltipProvider>
  );
}
