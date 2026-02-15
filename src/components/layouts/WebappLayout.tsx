'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import type { SimulationState, LayoutType } from '@/lib/use-simulation-state';
import { VEHICLES, FUNCTIONS } from '@/lib/model-data';
import { DMI, PERIOD_COLORS, FUNCTION_COLORS, CLUSTER_COLORS, CLUSTER_NAMES, SERVICE_LEVEL_OPTIONS, MAX_CLUSTERS, heading, bodyText, labelMono } from '@/lib/dmi-theme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { Loader2, Play, LayoutDashboard, ClipboardList, Network, BarChart3, ChevronDown, ChevronUp, Info, BookOpen } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import LayoutSwitcher from '@/components/LayoutSwitcher';
import { COVER, HANDLEIDING_SECTIONS, PARTNER_LOGOS } from '@/lib/content';

type WebappTab = 'info' | 'dashboard' | 'invoer' | 'clustering' | 'resultaten';

const TICK_STYLE = { fontFamily: 'var(--font-ibm-plex-sans), sans-serif', fill: DMI.darkGray } as const;
const TICK_SM = { ...TICK_STYLE, fontSize: 10 } as const;
const TICK_MD = { ...TICK_STYLE, fontSize: 12 } as const;

/* ------------------------------------------------------------------ */
/*  Card component                                                     */
/* ------------------------------------------------------------------ */

function WCard({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        backgroundColor: DMI.white,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {title && (
        <div style={{ padding: '16px 24px', borderBottom: `1px solid ${DMI.blueTint2}` }}>
          <h3 style={{ ...heading, fontSize: '1rem', margin: 0 }}>{title}</h3>
        </div>
      )}
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  KPI Card component                                                 */
/* ------------------------------------------------------------------ */

function KpiCard({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: string }) {
  return (
    <div
      style={{
        backgroundColor: DMI.white,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        padding: '24px',
        borderTop: `4px solid ${accent || DMI.mediumBlue}`,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <span style={{ ...labelMono, fontSize: '0.7rem' }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
        <span style={{ ...heading, fontSize: '2rem', lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ ...bodyText, fontSize: '0.85rem', color: DMI.darkGray }}>{unit}</span>}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main layout                                                        */
/* ------------------------------------------------------------------ */

export default function WebappLayout({
  state,
  layout,
  onLayoutChange,
}: {
  state: SimulationState;
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}) {
  const [activeTab, setActiveTab] = useState<WebappTab>('dashboard');

  const activeFunctionCount = useMemo(() => {
    return Object.entries(state.functionCounts).filter(([, count]) => count > 0).length;
  }, [state.functionCounts]);

  const clusterCount = state.clusterIds.length;

  const functionDonutData = useMemo(() => {
    return FUNCTIONS
      .filter((f) => (state.functionCounts[f.id] ?? 0) > 0)
      .map((f, idx) => ({
        name: f.name,
        value: state.functionCounts[f.id] ?? 0,
        fill: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
      }));
  }, [state.functionCounts]);

  const clusterBarData = useMemo(() => {
    if (!state.results) return [];
    return state.results.clusterResults.map((cr) => ({
      name: CLUSTER_NAMES[cr.clusterId] || `Cluster ${cr.clusterId}`,
      space: Math.round(cr.totalSpaceM2 * 10) / 10,
      fill: CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue,
      clusterId: cr.clusterId,
    }));
  }, [state.results]);

  const vehicleArrivalData = useMemo(() => {
    if (!state.results) return [];
    return state.results.vehicleResults
      .filter((vr) => vr.totalArrivalsPerDay > 0)
      .map((vr) => ({
        name: vr.vehicleName,
        arrivals: Math.round(vr.totalArrivalsPerDay * 100) / 100,
        fill: CLUSTER_COLORS[vr.clusterId] || DMI.mediumBlue,
      }));
  }, [state.results]);

  const vehicleLengthData = useMemo(() => {
    if (!state.results) return [];
    return state.results.vehicleResults
      .filter((vr) => vr.requiredSpaceM2 > 0)
      .map((vr) => ({
        name: vr.vehicleName,
        length: Math.round(vr.requiredSpaceM2 * 10) / 10,
        fill: CLUSTER_COLORS[vr.clusterId] || DMI.mediumBlue,
      }));
  }, [state.results]);

  const tabs: { id: WebappTab; label: string; icon: React.ReactNode }[] = [
    { id: 'info', label: 'Info', icon: <BookOpen size={18} /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'invoer', label: 'Invoer', icon: <ClipboardList size={18} /> },
    { id: 'clustering', label: 'Clustering', icon: <Network size={18} /> },
    { id: 'resultaten', label: 'Resultaten', icon: <BarChart3 size={18} /> },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div style={{ minHeight: '100vh', backgroundColor: DMI.blueTint3 }}>

        {/* ============================================================ */}
        {/*  TOP NAVIGATION BAR                                          */}
        {/* ============================================================ */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backgroundColor: DMI.white,
            borderBottom: `1px solid ${DMI.blueTint2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            height: '64px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          {/* Left: Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '160px' }}>
            <Image src="/dmi-logo.png" alt="DMI" width={120} height={40} style={{ objectFit: 'contain' }} />
          </div>

          {/* Center: Tab buttons */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 20px',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    borderBottom: isActive ? `3px solid ${DMI.yellow}` : '3px solid transparent',
                    color: isActive ? DMI.darkBlue : DMI.darkGray,
                    fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '-1px',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right: Run button + Layout switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={state.handleRun}
              disabled={state.isRunning}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: state.isRunning ? 'not-allowed' : 'pointer',
                backgroundColor: state.isRunning ? DMI.darkGray : DMI.darkBlue,
                color: DMI.white,
                fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(10,54,96,0.3)',
              }}
            >
              {state.isRunning ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {state.isRunning ? 'Bezig...' : 'Run Simulaties'}
            </button>
            <LayoutSwitcher current={layout} onChange={onLayoutChange} />
          </div>
        </nav>

        {/* ============================================================ */}
        {/*  MAIN CONTENT AREA                                           */}
        {/* ============================================================ */}
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px 64px' }}>

          {/* ---------------------------------------------------------- */}
          {/*  INFO TAB (Cover + Handleiding)                             */}
          {/* ---------------------------------------------------------- */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Cover section */}
              <WCard>
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <h1 style={{ ...heading, fontSize: '2rem', marginBottom: '12px' }}>
                    {COVER.title}
                  </h1>
                  <p style={{ ...bodyText, fontSize: '1.05rem', color: DMI.mediumBlue, marginBottom: '20px' }}>
                    {COVER.subtitle}
                  </p>
                  <div
                    style={{
                      width: '60px',
                      height: '3px',
                      backgroundColor: DMI.yellow,
                      margin: '0 auto 20px',
                      borderRadius: '2px',
                    }}
                  />
                  <p
                    style={{
                      ...bodyText,
                      fontSize: '0.9rem',
                      lineHeight: 1.7,
                      maxWidth: '640px',
                      margin: '0 auto 32px',
                    }}
                  >
                    {COVER.description}
                  </p>

                  {/* Partner logos */}
                  <div style={{ borderTop: `1px solid ${DMI.blueTint2}`, paddingTop: '24px' }}>
                    <p style={{ ...labelMono, marginBottom: '16px' }}>Partners</p>
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: '28px',
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
                            gap: '6px',
                          }}
                        >
                          <Image
                            src={logo.src}
                            alt={logo.alt}
                            width={90}
                            height={45}
                            style={{ objectFit: 'contain', maxHeight: '45px' }}
                          />
                          <span style={{ ...bodyText, fontSize: '0.6rem', color: DMI.darkGray }}>
                            {logo.organization}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </WCard>

              {/* Handleiding sections */}
              <div>
                <h2 style={{ ...heading, fontSize: '1.4rem', marginBottom: '16px' }}>
                  Handleiding
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {HANDLEIDING_SECTIONS.map((section) => (
                    <WCard key={section.title} title={section.title}>
                      {section.paragraphs.map((p, i) => (
                        <p
                          key={i}
                          style={{
                            ...bodyText,
                            fontSize: '0.87rem',
                            lineHeight: 1.7,
                            marginBottom: i < section.paragraphs.length - 1 ? '12px' : 0,
                          }}
                        >
                          {p}
                        </p>
                      ))}
                    </WCard>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  DASHBOARD TAB                                              */}
          {/* ---------------------------------------------------------- */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {/* Welcome header */}
              <div>
                <h1 style={{ ...heading, fontSize: '1.8rem', marginBottom: '8px' }}>
                  Ruimtemodel Stadslogistiek
                </h1>
                <p style={{ ...bodyText, fontSize: '1rem', maxWidth: '640px', lineHeight: 1.6 }}>
                  Bereken de benodigde laad- en losruimte voor uw stedelijke logistiek op basis van
                  Monte Carlo simulatie. Configureer functies, stel voertuigclusters in en bekijk de resultaten.
                </p>
              </div>

              {/* KPI Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
                <KpiCard
                  label="Totaal Functies"
                  value={state.totalFunctions}
                  unit="eenheden"
                  accent={DMI.mediumBlue}
                />
                <KpiCard
                  label="Verwachte Voertuigen"
                  value={state.computedTotalVehicles !== null ? Math.round(state.computedTotalVehicles) : '--'}
                  unit="per dag"
                  accent={DMI.yellow}
                />
                <KpiCard
                  label="Benodigde Lengte"
                  value={state.results ? `${Math.round(state.results.totalSpaceM2 * 10) / 10}` : '--'}
                  unit="meter"
                  accent={DMI.themeAreaDev}
                />
                <KpiCard
                  label="Actieve Clusters"
                  value={clusterCount}
                  unit={`van ${MAX_CLUSTERS}`}
                  accent={DMI.themeMobility}
                />
              </div>

              {/* Configuration summary */}
              <WCard title="Huidige Configuratie">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <p style={{ ...labelMono, marginBottom: '12px' }}>Actieve Functies</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {FUNCTIONS.filter((f) => (state.functionCounts[f.id] ?? 0) > 0).map((f) => (
                        <span
                          key={f.id}
                          style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: DMI.blueTint2,
                            color: DMI.darkBlue,
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                            fontWeight: 500,
                          }}
                        >
                          {f.name}: {state.functionCounts[f.id]}
                        </span>
                      ))}
                      {activeFunctionCount === 0 && (
                        <span style={{ ...bodyText, color: DMI.darkGray, fontSize: '0.85rem' }}>
                          Geen functies geconfigureerd
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p style={{ ...labelMono, marginBottom: '12px' }}>Clusters in gebruik</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {state.clusterIds.map((cid) => (
                        <span
                          key={cid}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            backgroundColor: `${CLUSTER_COLORS[cid] || DMI.mediumBlue}20`,
                            color: DMI.darkBlue,
                            fontSize: '0.8rem',
                            fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                            fontWeight: 500,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '10px',
                              height: '10px',
                              borderRadius: '50%',
                              backgroundColor: CLUSTER_COLORS[cid] || DMI.mediumBlue,
                            }}
                          />
                          {CLUSTER_NAMES[cid] || `Cluster ${cid}`}
                          {' '}({(state.clusterServiceLevels[cid] * 100).toFixed(0)}%)
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </WCard>

              {/* Results summary chart (only when results exist) */}
              {state.results && (
                <WCard title="Ruimte per Cluster (samenvatting)">
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={clusterBarData} layout="vertical" margin={{ left: 120, right: 32, top: 8, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                        <XAxis type="number" tick={TICK_MD} unit=" m" />
                        <YAxis
                          type="category"
                          dataKey="name"
                          tick={TICK_MD}
                          width={110}
                        />
                        <RechartsTooltip
                          formatter={(value) => [`${value} m`, 'Benodigde ruimte']}
                          contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                        />
                        <Bar dataKey="space" radius={[0, 6, 6, 0]} barSize={32}>
                          {clusterBarData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </WCard>
              )}

              {/* Call to action when no results */}
              {!state.results && (
                <WCard>
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <p style={{ ...bodyText, fontSize: '1rem', marginBottom: '20px' }}>
                      Er zijn nog geen simulatieresultaten. Begin met het invoeren van functies of voer direct een simulatie uit.
                    </p>
                    <button
                      onClick={() => setActiveTab('invoer')}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '8px',
                        border: `2px solid ${DMI.darkBlue}`,
                        backgroundColor: 'transparent',
                        color: DMI.darkBlue,
                        fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Start met invoer
                    </button>
                  </div>
                </WCard>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  INVOER TAB                                                 */}
          {/* ---------------------------------------------------------- */}
          {activeTab === 'invoer' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h1 style={{ ...heading, fontSize: '1.5rem', marginBottom: '8px' }}>
                  Inventarisatie Functies
                </h1>
                <p style={{ ...bodyText, fontSize: '0.9rem', maxWidth: '640px', lineHeight: 1.6 }}>
                  Geef het aantal eenheden per functie op voor het plangebied. Deze aantallen
                  bepalen het verwachte verkeer en de bijbehorende ruimtebehoefte.
                </p>
              </div>

              {/* Function inputs grid */}
              <WCard title="Functies">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '0' }}>
                  {FUNCTIONS.map((func, idx) => (
                    <div
                      key={func.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 16px',
                        borderBottom: `1px solid ${DMI.blueTint2}`,
                        backgroundColor: idx % 2 === 0 ? 'transparent' : DMI.blueTint3,
                      }}
                    >
                      {/* Color indicator */}
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: FUNCTION_COLORS[idx % FUNCTION_COLORS.length],
                          flexShrink: 0,
                        }}
                      />

                      {/* Function name */}
                      <span style={{ ...bodyText, fontSize: '0.9rem', fontWeight: 500, flex: 1, color: DMI.darkBlue }}>
                        {func.name}
                      </span>

                      {/* Info tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: DMI.blueTint1,
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Info size={16} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          style={{
                            maxWidth: '300px',
                            backgroundColor: DMI.darkBlue,
                            color: DMI.white,
                            borderRadius: '8px',
                            padding: '12px 16px',
                            fontSize: '0.8rem',
                            lineHeight: 1.5,
                          }}
                        >
                          {func.description}
                        </TooltipContent>
                      </Tooltip>

                      {/* Unit label */}
                      <span style={{ ...labelMono, fontSize: '0.65rem', width: '80px', textAlign: 'right' }}>
                        {func.unit}
                      </span>

                      {/* Number input */}
                      <input
                        type="number"
                        min={0}
                        value={state.functionCounts[func.id] ?? 0}
                        onChange={(e) => state.handleFunctionCountChange(func.id, e.target.value)}
                        style={{
                          width: '90px',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          border: `1px solid ${DMI.blueTint2}`,
                          backgroundColor: DMI.white,
                          color: DMI.darkBlue,
                          fontFamily: 'var(--font-ibm-plex-mono), monospace',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          textAlign: 'right',
                          outline: 'none',
                          transition: 'border-color 0.2s ease',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = DMI.mediumBlue; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = DMI.blueTint2; }}
                      />
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px 16px 0',
                    borderTop: `2px solid ${DMI.darkBlue}`,
                    marginTop: '0',
                  }}
                >
                  <span style={{ ...heading, fontSize: '1rem' }}>Totaal</span>
                  <span
                    style={{
                      ...heading,
                      fontSize: '1.2rem',
                      backgroundColor: DMI.blueTint2,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      minWidth: '90px',
                      textAlign: 'right',
                      display: 'inline-block',
                      fontFamily: 'var(--font-ibm-plex-mono), monospace',
                    }}
                  >
                    {state.totalFunctions}
                  </span>
                </div>
              </WCard>

              {/* Donut chart */}
              {functionDonutData.length > 0 && (
                <WCard title="Verdeling Functies">
                  <div style={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={functionDonutData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={120}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                          labelLine={{ stroke: DMI.darkGray, strokeWidth: 1 }}
                          style={{ fontSize: '0.75rem', fontFamily: 'var(--font-ibm-plex-sans), sans-serif' }}
                        >
                          {functionDonutData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [`${value} eenheden`, name]}
                          contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </WCard>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  CLUSTERING TAB                                             */}
          {/* ---------------------------------------------------------- */}
          {activeTab === 'clustering' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div>
                <h1 style={{ ...heading, fontSize: '1.5rem', marginBottom: '8px' }}>
                  Voertuig Clustering & Service Levels
                </h1>
                <p style={{ ...bodyText, fontSize: '0.9rem', maxWidth: '640px', lineHeight: 1.6 }}>
                  Wijs voertuigtypen toe aan clusters en stel per cluster het gewenste serviceniveau in.
                  Voertuigen in hetzelfde cluster delen dezelfde laad-/losruimte.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Left column: Cluster assignment matrix */}
                <WCard title="Cluster Toewijzing">
                  <div style={{ overflowX: 'auto' }}>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                        fontSize: '0.85rem',
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              textAlign: 'left',
                              padding: '10px 12px',
                              borderBottom: `2px solid ${DMI.darkBlue}`,
                              ...labelMono,
                              fontSize: '0.65rem',
                            }}
                          >
                            Voertuig
                          </th>
                          {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => (
                            <th
                              key={cid}
                              style={{
                                textAlign: 'center',
                                padding: '10px 8px',
                                borderBottom: `2px solid ${DMI.darkBlue}`,
                                ...labelMono,
                                fontSize: '0.65rem',
                              }}
                            >
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <span
                                  style={{
                                    display: 'inline-block',
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: CLUSTER_COLORS[cid] || DMI.mediumBlue,
                                  }}
                                />
                                {cid}
                              </span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {VEHICLES.map((veh, vIdx) => (
                          <tr
                            key={veh.id}
                            style={{
                              backgroundColor: vIdx % 2 === 0 ? 'transparent' : DMI.blueTint3,
                            }}
                          >
                            <td
                              style={{
                                padding: '10px 12px',
                                borderBottom: `1px solid ${DMI.blueTint2}`,
                                color: DMI.darkBlue,
                                fontWeight: 500,
                                fontSize: '0.82rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {veh.name}
                            </td>
                            {Array.from({ length: MAX_CLUSTERS }, (_, i) => i + 1).map((cid) => {
                              const isSelected = (state.clusterAssignments[veh.id] ?? 1) === cid;
                              return (
                                <td
                                  key={cid}
                                  style={{
                                    textAlign: 'center',
                                    padding: '10px 8px',
                                    borderBottom: `1px solid ${DMI.blueTint2}`,
                                  }}
                                >
                                  <button
                                    onClick={() => state.handleClusterMatrixChange(veh.id, cid)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '50%',
                                      border: isSelected
                                        ? `3px solid ${CLUSTER_COLORS[cid] || DMI.mediumBlue}`
                                        : `2px solid ${DMI.blueTint2}`,
                                      backgroundColor: isSelected
                                        ? CLUSTER_COLORS[cid] || DMI.mediumBlue
                                        : 'transparent',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {isSelected && (
                                      <span
                                        style={{
                                          width: '8px',
                                          height: '8px',
                                          borderRadius: '50%',
                                          backgroundColor: DMI.white,
                                        }}
                                      />
                                    )}
                                  </button>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </WCard>

                {/* Right column: Service levels */}
                <WCard title="Service Levels per Cluster">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {state.clusterIds.map((cid) => {
                      const vehiclesInCluster = VEHICLES.filter(
                        (v) => (state.clusterAssignments[v.id] ?? 1) === cid
                      );
                      return (
                        <div
                          key={cid}
                          style={{
                            padding: '20px',
                            borderRadius: '10px',
                            border: `1px solid ${DMI.blueTint2}`,
                            backgroundColor: DMI.blueTint3,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                width: '14px',
                                height: '14px',
                                borderRadius: '50%',
                                backgroundColor: CLUSTER_COLORS[cid] || DMI.mediumBlue,
                              }}
                            />
                            <span style={{ ...heading, fontSize: '0.95rem' }}>
                              {CLUSTER_NAMES[cid] || `Cluster ${cid}`}
                            </span>
                          </div>
                          <p style={{ ...bodyText, fontSize: '0.8rem', marginBottom: '12px', color: DMI.darkGray }}>
                            Voertuigen: {vehiclesInCluster.map((v) => v.name).join(', ')}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {SERVICE_LEVEL_OPTIONS.map((opt) => {
                              const isSelected = state.clusterServiceLevels[cid] === parseFloat(opt.value);
                              return (
                                <button
                                  key={opt.value}
                                  onClick={() => state.handleServiceLevelChange(cid, opt.value)}
                                  style={{
                                    padding: '8px 18px',
                                    borderRadius: '8px',
                                    border: isSelected
                                      ? `2px solid ${CLUSTER_COLORS[cid] || DMI.mediumBlue}`
                                      : `1px solid ${DMI.blueTint2}`,
                                    backgroundColor: isSelected
                                      ? `${CLUSTER_COLORS[cid] || DMI.mediumBlue}20`
                                      : DMI.white,
                                    color: isSelected ? DMI.darkBlue : DMI.darkGray,
                                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                    fontWeight: isSelected ? 700 : 500,
                                    fontSize: '0.85rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </WCard>
              </div>

              {/* Simulation parameters + run button */}
              <WCard title="Simulatie Instellingen">
                <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ ...labelMono }}>Aantal Simulaties</span>
                      <span
                        style={{
                          fontFamily: 'var(--font-ibm-plex-mono), monospace',
                          fontWeight: 700,
                          color: DMI.darkBlue,
                          fontSize: '0.9rem',
                        }}
                      >
                        {state.numSimulations}
                      </span>
                    </div>
                    <Slider
                      min={100}
                      max={5000}
                      step={100}
                      value={[state.numSimulations]}
                      onValueChange={([val]) => state.setNumSimulations(val)}
                      style={{ width: '100%' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ ...bodyText, fontSize: '0.7rem', color: DMI.darkGray }}>100</span>
                      <span style={{ ...bodyText, fontSize: '0.7rem', color: DMI.darkGray }}>5000</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      state.handleRun();
                      setActiveTab('resultaten');
                    }}
                    disabled={state.isRunning}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px 40px',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: state.isRunning ? 'not-allowed' : 'pointer',
                      backgroundColor: state.isRunning ? DMI.darkGray : DMI.darkBlue,
                      color: DMI.white,
                      fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                      fontWeight: 700,
                      fontSize: '1rem',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 12px rgba(10,54,96,0.3)',
                    }}
                  >
                    {state.isRunning ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                    {state.isRunning ? 'Simulatie loopt...' : 'Run Simulaties'}
                  </button>
                </div>

                {/* Success message when results exist */}
                {state.results && (
                  <div
                    style={{
                      marginTop: '20px',
                      padding: '16px 20px',
                      borderRadius: '8px',
                      backgroundColor: `${DMI.themeAreaDev}30`,
                      border: `1px solid ${DMI.themeAreaDev}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>&#10003;</span>
                    <span style={{ ...bodyText, fontSize: '0.9rem', color: DMI.darkBlue }}>
                      Simulatie voltooid. Totale benodigde ruimte:{' '}
                      <strong>{Math.round(state.results.totalSpaceM2 * 10) / 10} meter</strong>
                    </span>
                    <button
                      onClick={() => setActiveTab('resultaten')}
                      style={{
                        marginLeft: 'auto',
                        padding: '6px 16px',
                        borderRadius: '6px',
                        border: `1px solid ${DMI.darkBlue}`,
                        backgroundColor: 'transparent',
                        color: DMI.darkBlue,
                        fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Bekijk resultaten
                    </button>
                  </div>
                )}
              </WCard>
            </div>
          )}

          {/* ---------------------------------------------------------- */}
          {/*  RESULTATEN TAB                                             */}
          {/* ---------------------------------------------------------- */}
          {activeTab === 'resultaten' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {!state.results ? (
                /* Empty state */
                <WCard>
                  <div style={{ textAlign: 'center', padding: '64px 0' }}>
                    <BarChart3 size={48} color={DMI.blueTint1} style={{ marginBottom: '16px' }} />
                    <h2 style={{ ...heading, fontSize: '1.3rem', marginBottom: '12px' }}>
                      Voer eerst de simulatie uit
                    </h2>
                    <p style={{ ...bodyText, fontSize: '0.95rem', maxWidth: '400px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                      Ga naar het Clustering-tabblad om de simulatie te configureren en uit te voeren,
                      of gebruik de knop rechtsboven.
                    </p>
                    <button
                      onClick={() => setActiveTab('clustering')}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '8px',
                        border: `2px solid ${DMI.darkBlue}`,
                        backgroundColor: 'transparent',
                        color: DMI.darkBlue,
                        fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Ga naar Clustering
                    </button>
                  </div>
                </WCard>
              ) : (
                <>
                  {/* Results header */}
                  <div>
                    <h1 style={{ ...heading, fontSize: '1.5rem', marginBottom: '8px' }}>
                      Simulatieresultaten
                    </h1>
                    <p style={{ ...bodyText, fontSize: '0.9rem' }}>
                      Resultaten op basis van {state.numSimulations} Monte Carlo simulaties.
                    </p>
                  </div>

                  {/* KPI summary row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    <KpiCard
                      label="Totale Ruimte"
                      value={Math.round(state.results.totalSpaceM2 * 10) / 10}
                      unit="meter"
                      accent={DMI.darkBlue}
                    />
                    <KpiCard
                      label="Voertuigen per Dag"
                      value={state.computedTotalVehicles !== null ? Math.round(state.computedTotalVehicles) : 0}
                      unit="verwacht"
                      accent={DMI.yellow}
                    />
                    <KpiCard
                      label="Aantal Clusters"
                      value={state.results.clusterResults.length}
                      unit="actief"
                      accent={DMI.themeAreaDev}
                    />
                    <KpiCard
                      label="Piek Periode"
                      value={
                        state.results.peakByPeriod.reduce((max, p) => (p.space > max.space ? p : max), state.results.peakByPeriod[0])
                          .period
                      }
                      unit={`${Math.round(
                        state.results.peakByPeriod.reduce((max, p) => (p.space > max.space ? p : max), state.results.peakByPeriod[0])
                          .space * 10
                      ) / 10} m`}
                      accent={DMI.themeMobility}
                    />
                  </div>

                  {/* Ruimte per Cluster section */}
                  <WCard title="Ruimte per Cluster">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      {/* Left: Horizontal bar chart */}
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={clusterBarData} layout="vertical" margin={{ left: 120, right: 24, top: 8, bottom: 8 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                            <XAxis type="number" tick={TICK_MD} unit=" m" />
                            <YAxis
                              type="category"
                              dataKey="name"
                              tick={TICK_MD}
                              width={110}
                            />
                            <RechartsTooltip
                              formatter={(value) => [`${value} m`, 'Benodigde ruimte']}
                              contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                            />
                            <Bar dataKey="space" radius={[0, 6, 6, 0]} barSize={28}>
                              {clusterBarData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Right: Cluster detail cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {state.results.clusterResults.map((cr) => {
                          const vehiclesInCluster = state.results!.vehicleResults.filter(
                            (vr) => vr.clusterId === cr.clusterId
                          );
                          return (
                            <div
                              key={cr.clusterId}
                              style={{
                                padding: '16px 20px',
                                borderRadius: '10px',
                                border: `1px solid ${DMI.blueTint2}`,
                                borderLeft: `4px solid ${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}`,
                                backgroundColor: DMI.white,
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ ...heading, fontSize: '0.9rem' }}>
                                  {CLUSTER_NAMES[cr.clusterId] || `Cluster ${cr.clusterId}`}
                                </span>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: DMI.darkBlue,
                                  }}
                                >
                                  {Math.round(cr.totalSpaceM2 * 10) / 10} m
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <span style={{ ...bodyText, fontSize: '0.78rem' }}>
                                  Service level: <strong>{(cr.serviceLevel * 100).toFixed(0)}%</strong>
                                </span>
                                <span style={{ ...bodyText, fontSize: '0.78rem' }}>
                                  Voertuigen: {vehiclesInCluster.length} types
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </WCard>

                  {/* Voertuiganalyse section */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    {/* Arrivals chart */}
                    <WCard title="Aankomsten per Voertuigtype">
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vehicleArrivalData} margin={{ left: 8, right: 8, top: 8, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                            <XAxis
                              dataKey="name"
                              tick={TICK_SM}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                              height={80}
                            />
                            <YAxis tick={TICK_MD} />
                            <RechartsTooltip
                              formatter={(value) => [`${value}`, 'Aankomsten/dag']}
                              contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                            />
                            <Bar dataKey="arrivals" radius={[6, 6, 0, 0]} barSize={32}>
                              {vehicleArrivalData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </WCard>

                    {/* Required length chart */}
                    <WCard title="Benodigde Lengte per Voertuigtype">
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={vehicleLengthData} margin={{ left: 8, right: 8, top: 8, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                            <XAxis
                              dataKey="name"
                              tick={TICK_SM}
                              angle={-35}
                              textAnchor="end"
                              interval={0}
                              height={80}
                            />
                            <YAxis tick={TICK_MD} unit=" m" />
                            <RechartsTooltip
                              formatter={(value) => [`${value} m`, 'Benodigde lengte']}
                              contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                            />
                            <Bar dataKey="length" radius={[6, 6, 0, 0]} barSize={32}>
                              {vehicleLengthData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </WCard>
                  </div>

                  {/* Piek per Tijdvak */}
                  <WCard title="Piekruimte per Tijdvak">
                    <div style={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={state.results.peakByPeriod} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={DMI.blueTint2} />
                          <XAxis dataKey="period" tick={TICK_MD} />
                          <YAxis tick={TICK_MD} unit=" m" />
                          <RechartsTooltip
                            formatter={(value) => [`${Math.round(Number(value) * 10) / 10} m`, 'Piekruimte']}
                            contentStyle={{ borderRadius: '8px', border: `1px solid ${DMI.blueTint2}` }}
                          />
                          <Bar dataKey="space" radius={[6, 6, 0, 0]} barSize={48}>
                            {state.results.peakByPeriod.map((entry, idx) => (
                              <Cell key={idx} fill={PERIOD_COLORS[idx % PERIOD_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </WCard>

                  {/* Cluster Details (expandable) */}
                  <div>
                    <h2 style={{ ...heading, fontSize: '1.2rem', marginBottom: '16px' }}>Cluster Details</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {state.results.clusterResults.map((cr) => {
                        const isExpanded = state.expandedClusters[cr.clusterId] ?? false;
                        const vehiclesInCluster = state.results!.vehicleResults.filter(
                          (vr) => vr.clusterId === cr.clusterId
                        );
                        return (
                          <div
                            key={cr.clusterId}
                            style={{
                              backgroundColor: DMI.white,
                              borderRadius: '12px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Cluster header (clickable) */}
                            <button
                              onClick={() => state.toggleCluster(cr.clusterId)}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '16px 24px',
                                border: 'none',
                                background: 'none',
                                cursor: 'pointer',
                                borderBottom: isExpanded ? `1px solid ${DMI.blueTint2}` : 'none',
                                borderLeft: `4px solid ${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}`,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ ...heading, fontSize: '1rem' }}>
                                  {CLUSTER_NAMES[cr.clusterId] || `Cluster ${cr.clusterId}`}
                                </span>
                                <span
                                  style={{
                                    padding: '2px 10px',
                                    borderRadius: '12px',
                                    backgroundColor: DMI.blueTint2,
                                    fontSize: '0.75rem',
                                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                    color: DMI.darkBlue,
                                    fontWeight: 600,
                                  }}
                                >
                                  SL {(cr.serviceLevel * 100).toFixed(0)}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span
                                  style={{
                                    fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    color: DMI.darkBlue,
                                  }}
                                >
                                  {Math.round(cr.totalSpaceM2 * 10) / 10} m
                                </span>
                                {isExpanded ? <ChevronUp size={20} color={DMI.darkGray} /> : <ChevronDown size={20} color={DMI.darkGray} />}
                              </div>
                            </button>

                            {/* Expanded content */}
                            {isExpanded && (
                              <div style={{ padding: '24px' }}>
                                {/* Service level breakdown */}
                                <div style={{ marginBottom: '20px' }}>
                                  <p style={{ ...labelMono, marginBottom: '10px' }}>Max Voertuigen per Service Level</p>
                                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {SERVICE_LEVEL_OPTIONS.map((opt) => {
                                      const slKey = Math.round(parseFloat(opt.value) * 100);
                                      const val = cr.maxVehiclesPerServiceLevel[slKey];
                                      const isActive = cr.serviceLevel === parseFloat(opt.value);
                                      return (
                                        <div
                                          key={opt.value}
                                          style={{
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            backgroundColor: isActive ? `${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}20` : DMI.blueTint3,
                                            border: isActive ? `2px solid ${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}` : `1px solid ${DMI.blueTint2}`,
                                            textAlign: 'center',
                                            minWidth: '80px',
                                          }}
                                        >
                                          <div style={{ ...labelMono, fontSize: '0.6rem', marginBottom: '4px' }}>
                                            {opt.label}
                                          </div>
                                          <div
                                            style={{
                                              fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                              fontWeight: 700,
                                              fontSize: '1rem',
                                              color: DMI.darkBlue,
                                            }}
                                          >
                                            {val !== undefined ? Math.round(val * 100) / 100 : '-'}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>

                                {/* Vehicle detail table */}
                                <div>
                                  <p style={{ ...labelMono, marginBottom: '10px' }}>Voertuigen in dit Cluster</p>
                                  <table
                                    style={{
                                      width: '100%',
                                      borderCollapse: 'collapse',
                                      fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    <thead>
                                      <tr style={{ backgroundColor: DMI.blueTint3 }}>
                                        <th
                                          style={{
                                            textAlign: 'left',
                                            padding: '10px 12px',
                                            borderBottom: `2px solid ${DMI.darkBlue}`,
                                            ...labelMono,
                                            fontSize: '0.6rem',
                                          }}
                                        >
                                          Voertuig
                                        </th>
                                        <th
                                          style={{
                                            textAlign: 'right',
                                            padding: '10px 12px',
                                            borderBottom: `2px solid ${DMI.darkBlue}`,
                                            ...labelMono,
                                            fontSize: '0.6rem',
                                          }}
                                        >
                                          Lengte
                                        </th>
                                        <th
                                          style={{
                                            textAlign: 'right',
                                            padding: '10px 12px',
                                            borderBottom: `2px solid ${DMI.darkBlue}`,
                                            ...labelMono,
                                            fontSize: '0.6rem',
                                          }}
                                        >
                                          Aankomsten/dag
                                        </th>
                                        {SERVICE_LEVEL_OPTIONS.map((opt) => (
                                          <th
                                            key={opt.value}
                                            style={{
                                              textAlign: 'right',
                                              padding: '10px 12px',
                                              borderBottom: `2px solid ${DMI.darkBlue}`,
                                              ...labelMono,
                                              fontSize: '0.6rem',
                                              backgroundColor:
                                                cr.serviceLevel === parseFloat(opt.value)
                                                  ? `${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}15`
                                                  : 'transparent',
                                            }}
                                          >
                                            Max @ {opt.label}
                                          </th>
                                        ))}
                                        <th
                                          style={{
                                            textAlign: 'right',
                                            padding: '10px 12px',
                                            borderBottom: `2px solid ${DMI.darkBlue}`,
                                            ...labelMono,
                                            fontSize: '0.6rem',
                                          }}
                                        >
                                          Ruimte (m)
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {vehiclesInCluster.map((vr, vIdx) => (
                                        <tr
                                          key={vr.vehicleId}
                                          style={{
                                            backgroundColor: vIdx % 2 === 0 ? 'transparent' : DMI.blueTint3,
                                          }}
                                        >
                                          <td
                                            style={{
                                              padding: '10px 12px',
                                              borderBottom: `1px solid ${DMI.blueTint2}`,
                                              color: DMI.darkBlue,
                                              fontWeight: 500,
                                            }}
                                          >
                                            {vr.vehicleName}
                                          </td>
                                          <td
                                            style={{
                                              textAlign: 'right',
                                              padding: '10px 12px',
                                              borderBottom: `1px solid ${DMI.blueTint2}`,
                                              fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                              color: DMI.darkGray,
                                            }}
                                          >
                                            {vr.vehicleLength} m
                                          </td>
                                          <td
                                            style={{
                                              textAlign: 'right',
                                              padding: '10px 12px',
                                              borderBottom: `1px solid ${DMI.blueTint2}`,
                                              fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                              color: DMI.darkGray,
                                            }}
                                          >
                                            {vr.totalArrivalsPerDay}
                                          </td>
                                          {SERVICE_LEVEL_OPTIONS.map((opt) => {
                                            const slKey = Math.round(parseFloat(opt.value) * 100);
                                            const val = vr.maxVehiclesPerServiceLevel[slKey];
                                            const isActiveLevel = cr.serviceLevel === parseFloat(opt.value);
                                            return (
                                              <td
                                                key={opt.value}
                                                style={{
                                                  textAlign: 'right',
                                                  padding: '10px 12px',
                                                  borderBottom: `1px solid ${DMI.blueTint2}`,
                                                  fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                                  color: DMI.darkGray,
                                                  fontWeight: isActiveLevel ? 700 : 400,
                                                  backgroundColor: isActiveLevel
                                                    ? `${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}10`
                                                    : 'transparent',
                                                }}
                                              >
                                                {val !== undefined ? Math.round(val * 100) / 100 : '-'}
                                              </td>
                                            );
                                          })}
                                          <td
                                            style={{
                                              textAlign: 'right',
                                              padding: '10px 12px',
                                              borderBottom: `1px solid ${DMI.blueTint2}`,
                                              fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                              fontWeight: 700,
                                              color: DMI.darkBlue,
                                            }}
                                          >
                                            {Math.round(vr.requiredSpaceM2 * 10) / 10}
                                          </td>
                                        </tr>
                                      ))}
                                      {/* Cluster total row */}
                                      <tr style={{ backgroundColor: DMI.blueTint2 }}>
                                        <td
                                          style={{
                                            padding: '10px 12px',
                                            fontWeight: 700,
                                            color: DMI.darkBlue,
                                            borderBottom: 'none',
                                          }}
                                          colSpan={2}
                                        >
                                          Totaal cluster
                                        </td>
                                        <td
                                          style={{
                                            textAlign: 'right',
                                            padding: '10px 12px',
                                            fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                            fontWeight: 700,
                                            color: DMI.darkBlue,
                                            borderBottom: 'none',
                                          }}
                                        >
                                          {Math.round(
                                            vehiclesInCluster.reduce((sum, vr) => sum + vr.totalArrivalsPerDay, 0) * 100
                                          ) / 100}
                                        </td>
                                        {SERVICE_LEVEL_OPTIONS.map((opt) => {
                                          const slKey = Math.round(parseFloat(opt.value) * 100);
                                          const clusterVal = cr.maxVehiclesPerServiceLevel[slKey];
                                          const isActiveLevel = cr.serviceLevel === parseFloat(opt.value);
                                          return (
                                            <td
                                              key={opt.value}
                                              style={{
                                                textAlign: 'right',
                                                padding: '10px 12px',
                                                fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                                fontWeight: 700,
                                                color: DMI.darkBlue,
                                                borderBottom: 'none',
                                                backgroundColor: isActiveLevel
                                                  ? `${CLUSTER_COLORS[cr.clusterId] || DMI.mediumBlue}20`
                                                  : 'transparent',
                                              }}
                                            >
                                              {clusterVal !== undefined ? Math.round(clusterVal * 100) / 100 : '-'}
                                            </td>
                                          );
                                        })}
                                        <td
                                          style={{
                                            textAlign: 'right',
                                            padding: '10px 12px',
                                            fontFamily: 'var(--font-ibm-plex-mono), monospace',
                                            fontWeight: 700,
                                            fontSize: '1rem',
                                            color: DMI.darkBlue,
                                            borderBottom: 'none',
                                          }}
                                        >
                                          {Math.round(cr.totalSpaceM2 * 10) / 10}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Grand total footer */}
                  <WCard>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <span style={{ ...labelMono, fontSize: '0.7rem' }}>Totale Benodigde Ruimte</span>
                        <p style={{ ...bodyText, fontSize: '0.85rem', marginTop: '4px' }}>
                          Som van alle clusters op hun respectievelijke service levels
                        </p>
                      </div>
                      <div
                        style={{
                          padding: '16px 32px',
                          borderRadius: '10px',
                          backgroundColor: DMI.darkBlue,
                          color: DMI.white,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            fontFamily: 'var(--font-ibm-plex-mono), monospace',
                            fontWeight: 700,
                            fontSize: '2rem',
                            lineHeight: 1,
                          }}
                        >
                          {Math.round(state.results.totalSpaceM2 * 10) / 10}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                            fontSize: '0.8rem',
                            marginTop: '4px',
                            opacity: 0.8,
                          }}
                        >
                          meter
                        </div>
                      </div>
                    </div>
                  </WCard>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  );
}
