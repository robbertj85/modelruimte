'use client';

import { useMemo, useState } from 'react';
import {
  VEHICLES,
  DISTRIBUTIONS,
  FUNCTIONS,
  DELIVERY_PROFILES,
  PROFILE_METADATA,
  PERIODS,
  SIM_PARAMS,
  getDefaultVehicleLengths,
  getDefaultDeliveryDays,
  getDefaultDeliveryProfiles,
} from '@/lib/model-data';
import type { SimulationState } from '@/lib/use-simulation-state';

// ---------------------------------------------------------------------------
// Theme types
// ---------------------------------------------------------------------------

export type ParameterTheme = 'rebel' | 'dmi' | 'webapp';

interface ThemeColors {
  bg: string;
  cardBg: string;
  headerBg: string;
  headerColor: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  inputBorder: string;
  inputBg: string;
  changedBg: string;
  warningBg: string;
  warningBorder: string;
  fontFamily: string;
}

function getThemeColors(theme: ParameterTheme): ThemeColors {
  if (theme === 'rebel') {
    return {
      bg: '#2d2d2d',
      cardBg: '#ffffff',
      headerBg: '#c0504d',
      headerColor: '#ffffff',
      border: '#e0e0e0',
      text: '#333333',
      textMuted: '#666666',
      accent: '#c0504d',
      accentText: '#ffffff',
      inputBorder: '#e0e0e0',
      inputBg: '#ffffff',
      changedBg: '#fff8e1',
      warningBg: '#fff3e0',
      warningBorder: '#ff9800',
      fontFamily: 'Calibri, Arial, sans-serif',
    };
  }
  // dmi / webapp share DMI palette
  return {
    bg: '#f5f7fa',
    cardBg: '#ffffff',
    headerBg: '#003366',
    headerColor: '#ffffff',
    border: '#d4dce8',
    text: '#1a1a2e',
    textMuted: '#6b7b8d',
    accent: '#003366',
    accentText: '#ffffff',
    inputBorder: '#d4dce8',
    inputBg: '#ffffff',
    changedBg: '#fffde7',
    warningBg: '#fff3e0',
    warningBorder: '#ff9800',
    fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultLengths = getDefaultVehicleLengths();
const defaultDays = getDefaultDeliveryDays();
const defaultProfiles = getDefaultDeliveryProfiles();

function isChanged(current: number, defaultVal: number | undefined): boolean {
  return defaultVal !== undefined && current !== defaultVal;
}

function periodDistSum(dist: number[]): number {
  return dist.reduce((s, v) => s + v, 0);
}

// ---------------------------------------------------------------------------
// AlgemeenEditor
// ---------------------------------------------------------------------------

export function AlgemeenEditor({
  state,
  theme,
}: {
  state: SimulationState;
  theme: ParameterTheme;
}) {
  const tc = getThemeColors(theme);

  const cellStyle: React.CSSProperties = {
    padding: '6px 10px',
    borderBottom: `1px solid ${tc.border}`,
    fontFamily: tc.fontFamily,
    fontSize: '0.8rem',
    color: tc.text,
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 700,
    fontSize: '0.7rem',
    textTransform: 'uppercase' as const,
    backgroundColor: tc.headerBg,
    color: tc.headerColor,
    borderBottom: 'none',
  };

  const inputStyle = (changed: boolean): React.CSSProperties => ({
    width: '80px',
    padding: '4px 8px',
    border: `1px solid ${tc.inputBorder}`,
    borderRadius: '3px',
    fontSize: '0.8rem',
    fontFamily: tc.fontFamily,
    color: tc.text,
    textAlign: 'center' as const,
    outline: 'none',
    backgroundColor: changed ? tc.changedBg : tc.inputBg,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Vehicle Lengths */}
      <div>
        <h4 style={{ fontFamily: tc.fontFamily, fontWeight: 700, fontSize: '0.85rem', color: tc.text, marginBottom: '8px' }}>
          Voertuigtypen & Lengte
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Voertuigtype</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Lengte (m)</th>
            </tr>
          </thead>
          <tbody>
            {state.allVehicles.map((v) => {
              const isCustom = !VEHICLES.find((dv) => dv.id === v.id);
              const changed = isChanged(state.vehicleLengths[v.id] ?? v.length, defaultLengths[v.id]);
              return (
                <tr key={v.id}>
                  <td style={cellStyle}>
                    {isCustom ? (
                      <input
                        type="text"
                        value={v.name}
                        onChange={(e) => state.handleCustomVehicleNameChange(v.id, e.target.value)}
                        style={{ ...inputStyle(false), width: '200px', textAlign: 'left' }}
                      />
                    ) : (
                      v.name
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={state.vehicleLengths[v.id] ?? v.length}
                      onChange={(e) => state.handleVehicleLengthChange(v.id, parseFloat(e.target.value) || 0)}
                      style={inputStyle(changed)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.allVehicles.length < 7 && (
          <button
            onClick={state.handleAddVehicle}
            style={{
              marginTop: '8px',
              padding: '5px 14px',
              border: `1px dashed ${tc.border}`,
              backgroundColor: 'transparent',
              color: tc.textMuted,
              fontFamily: tc.fontFamily,
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            + Voertuigtype toevoegen
          </button>
        )}
      </div>

      {/* Distribution Delivery Days */}
      <div>
        <h4 style={{ fontFamily: tc.fontFamily, fontWeight: 700, fontSize: '0.85rem', color: tc.text, marginBottom: '8px' }}>
          Distributietypen & Leveringsdagen
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Distributietype</th>
              <th style={{ ...headerCellStyle, textAlign: 'center' }}>Leveringsdagen/week</th>
            </tr>
          </thead>
          <tbody>
            {state.allDistributions.map((d) => {
              const isCustom = !DISTRIBUTIONS.find((dd) => dd.id === d.id);
              const changed = isChanged(state.deliveryDays[d.id] ?? d.deliveryDays, defaultDays[d.id]);
              return (
                <tr key={d.id}>
                  <td style={cellStyle}>
                    {isCustom ? (
                      <input
                        type="text"
                        value={d.name}
                        onChange={(e) => state.handleCustomDistributionNameChange(d.id, e.target.value)}
                        style={{ ...inputStyle(false), width: '200px', textAlign: 'left' }}
                      />
                    ) : (
                      d.name
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'center' }}>
                    <input
                      type="number"
                      min={1}
                      max={7}
                      value={state.deliveryDays[d.id] ?? d.deliveryDays}
                      onChange={(e) => state.handleDeliveryDaysChange(d.id, parseInt(e.target.value, 10) || 1)}
                      style={inputStyle(changed)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.allDistributions.length < 18 && (
          <button
            onClick={state.handleAddDistribution}
            style={{
              marginTop: '8px',
              padding: '5px 14px',
              border: `1px dashed ${tc.border}`,
              backgroundColor: 'transparent',
              color: tc.textMuted,
              fontFamily: tc.fontFamily,
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            + Distributietype toevoegen
          </button>
        )}
      </div>

      {/* Simulation Interval */}
      <div>
        <h4 style={{ fontFamily: tc.fontFamily, fontWeight: 700, fontSize: '0.85rem', color: tc.text, marginBottom: '8px' }}>
          Simulatie-interval
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="number"
            min={1}
            max={60}
            value={state.intervalMinutes}
            onChange={(e) => state.handleIntervalMinutesChange(parseInt(e.target.value, 10) || 10)}
            style={inputStyle(state.intervalMinutes !== SIM_PARAMS.intervalMinutes)}
          />
          <span style={{ fontFamily: tc.fontFamily, fontSize: '0.8rem', color: tc.textMuted }}>minuten</span>
        </div>
      </div>

      {/* Functions list with add button */}
      <div>
        <h4 style={{ fontFamily: tc.fontFamily, fontWeight: 700, fontSize: '0.85rem', color: tc.text, marginBottom: '8px' }}>
          Functies
        </h4>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Functie</th>
              <th style={{ ...headerCellStyle, textAlign: 'left' }}>Eenheid</th>
            </tr>
          </thead>
          <tbody>
            {state.allFunctions.map((f) => {
              const isCustom = !FUNCTIONS.find((df) => df.id === f.id);
              return (
                <tr key={f.id}>
                  <td style={cellStyle}>
                    {isCustom ? (
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => state.handleCustomFunctionNameChange(f.id, e.target.value)}
                        style={{ ...inputStyle(false), width: '200px', textAlign: 'left' }}
                      />
                    ) : (
                      f.name
                    )}
                  </td>
                  <td style={cellStyle}>
                    {isCustom ? (
                      <select
                        value={f.unit}
                        onChange={(e) => state.handleCustomFunctionUnitChange(f.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          border: `1px solid ${tc.inputBorder}`,
                          borderRadius: '3px',
                          fontSize: '0.8rem',
                          fontFamily: tc.fontFamily,
                          color: tc.text,
                          backgroundColor: tc.inputBg,
                          outline: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="vestigingen">vestigingen</option>
                        <option value="woningen">woningen</option>
                        <option value="eenheden">eenheden</option>
                      </select>
                    ) : (
                      f.unit
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {state.allFunctions.length < 15 && (
          <button
            onClick={state.handleAddFunction}
            style={{
              marginTop: '8px',
              padding: '5px 14px',
              border: `1px dashed ${tc.border}`,
              backgroundColor: 'transparent',
              color: tc.textMuted,
              fontFamily: tc.fontFamily,
              fontSize: '0.75rem',
              cursor: 'pointer',
              borderRadius: '3px',
            }}
          >
            + Functie toevoegen
          </button>
        )}
      </div>

      {/* Reset button */}
      {state.hasAdvancedOverrides && (
        <button
          onClick={state.handleResetAdvancedParams}
          style={{
            padding: '8px 20px',
            backgroundColor: tc.accent,
            color: tc.accentText,
            border: 'none',
            borderRadius: '4px',
            fontFamily: tc.fontFamily,
            fontWeight: 700,
            fontSize: '0.8rem',
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          Reset naar standaardwaarden
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// DeliveryProfileEditor
// ---------------------------------------------------------------------------

export function DeliveryProfileEditor({
  state,
  theme,
  functionId,
  onBack,
}: {
  state: SimulationState;
  theme: ParameterTheme;
  functionId: string;
  onBack: () => void;
}) {
  const tc = getThemeColors(theme);
  const func = state.allFunctions.find((f) => f.id === functionId);
  if (!func) return null;

  const vehicles = state.allVehicles;
  const numVehicles = vehicles.length;

  // Find all profile keys for this function (existing + potential for all distributions)
  const profileEntries = useMemo(() => {
    const entries: { profileKey: string; distName: string; distId: string }[] = [];
    for (const dist of state.allDistributions) {
      const key = `${functionId}_${dist.id}`;
      const profile = state.deliveryProfiles[key];
      // Show if profile exists (has data) or is in default set
      if (profile || DELIVERY_PROFILES[key]) {
        entries.push({ profileKey: key, distName: dist.name, distId: dist.id });
      }
    }
    return entries;
  }, [functionId, state.allDistributions, state.deliveryProfiles]);

  // Distributions that don't have a profile yet (for "add" button)
  const availableDistributions = useMemo(() => {
    return state.allDistributions.filter((d) => {
      const key = `${functionId}_${d.id}`;
      return !state.deliveryProfiles[key] && !DELIVERY_PROFILES[key];
    });
  }, [functionId, state.allDistributions, state.deliveryProfiles]);

  const cellStyle: React.CSSProperties = {
    padding: '4px 6px',
    borderBottom: `1px solid ${tc.border}`,
    fontFamily: tc.fontFamily,
    fontSize: '0.75rem',
    color: tc.text,
    verticalAlign: 'middle',
  };

  const headerCellStyle: React.CSSProperties = {
    ...cellStyle,
    fontWeight: 700,
    fontSize: '0.65rem',
    textTransform: 'uppercase' as const,
    backgroundColor: tc.headerBg,
    color: tc.headerColor,
    borderBottom: 'none',
    whiteSpace: 'nowrap' as const,
  };

  const smallInputStyle = (changed: boolean): React.CSSProperties => ({
    width: '65px',
    padding: '3px 5px',
    border: `1px solid ${tc.inputBorder}`,
    borderRadius: '2px',
    fontSize: '0.75rem',
    fontFamily: tc.fontFamily,
    color: tc.text,
    textAlign: 'center' as const,
    outline: 'none',
    backgroundColor: changed ? tc.changedBg : tc.inputBg,
  });

  const periodHeaders = PERIODS.map((p) => p.name);

  return (
    <div>
      {/* Back button + title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          onClick={onBack}
          style={{
            padding: '5px 12px',
            border: `1px solid ${tc.border}`,
            backgroundColor: tc.cardBg,
            color: tc.text,
            fontFamily: tc.fontFamily,
            fontSize: '0.75rem',
            cursor: 'pointer',
            borderRadius: '3px',
          }}
        >
          &larr; Terug
        </button>
        <h4 style={{ fontFamily: tc.fontFamily, fontWeight: 700, fontSize: '1rem', color: tc.text, margin: 0 }}>
          Beleveringsprofiel: {func.name}
        </h4>
      </div>

      {profileEntries.length === 0 && (
        <p style={{ fontFamily: tc.fontFamily, fontSize: '0.8rem', color: tc.textMuted }}>
          Geen beleveringsprofielen voor deze functie.
        </p>
      )}

      {profileEntries.map(({ profileKey, distName }) => {
        const profile = state.deliveryProfiles[profileKey] ?? DELIVERY_PROFILES[profileKey];
        if (!profile) return null;

        const defaultProfile = defaultProfiles[profileKey];
        const meta = PROFILE_METADATA[profileKey];

        return (
          <div key={profileKey} style={{ marginBottom: '24px' }}>
            {/* Distribution section header */}
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: tc.accent,
                color: tc.accentText,
                fontFamily: tc.fontFamily,
                fontWeight: 700,
                fontSize: '0.8rem',
                marginBottom: '2px',
              }}
            >
              {distName}
            </div>

            {/* Description + remarks */}
            {meta && (meta.description || meta.remarks) && (
              <div
                style={{
                  padding: '6px 12px',
                  backgroundColor: theme === 'rebel' ? '#f0f8ff' : '#f0f4ff',
                  borderLeft: `3px solid ${tc.accent}`,
                  marginBottom: '8px',
                  fontFamily: tc.fontFamily,
                  fontSize: '0.75rem',
                  color: tc.textMuted,
                }}
              >
                {meta.description && <span>{meta.description}</span>}
                {meta.remarks && <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>({meta.remarks})</span>}
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ ...headerCellStyle, textAlign: 'left', minWidth: '140px' }}>Voertuigtype</th>
                  <th style={{ ...headerCellStyle, textAlign: 'center' }}>Stops/week</th>
                  <th style={{ ...headerCellStyle, textAlign: 'center' }}>Duur (min)</th>
                  {periodHeaders.map((ph) => (
                    <th key={ph} style={{ ...headerCellStyle, textAlign: 'center' }}>{ph}</th>
                  ))}
                  <th style={{ ...headerCellStyle, textAlign: 'center' }}>Totaal %</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v, vi) => {
                  const stops = profile.stopsPerWeekPerUnit[vi] ?? 0;
                  const dur = profile.duration[vi] ?? 0;
                  const pDist = profile.periodDistribution[vi] ?? [0, 0, 0, 0];
                  const isInactive = stops === 0 && dur === 0 && pDist.every((p) => p === 0);

                  const defStops = defaultProfile?.stopsPerWeekPerUnit[vi] ?? 0;
                  const defDur = defaultProfile?.duration[vi] ?? 0;
                  const defPDist = defaultProfile?.periodDistribution[vi] ?? [0, 0, 0, 0];

                  const pDistPercent = pDist.map((p) => Math.round(p * 100 * 100) / 100);
                  const pDistSum = periodDistSum(pDist);
                  const pDistSumPct = Math.round(pDistSum * 100 * 100) / 100;
                  const hasWarning = !isInactive && pDistSum > 0 && Math.abs(pDistSum - 1) > 0.02;

                  if (isInactive) {
                    return (
                      <tr key={v.id}>
                        <td style={{ ...cellStyle, color: tc.textMuted }}>{v.name}</td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={stops}
                            onChange={(e) => state.handleProfileFieldChange(profileKey, 'stopsPerWeekPerUnit', vi, parseFloat(e.target.value) || 0)}
                            style={smallInputStyle(false)}
                          />
                        </td>
                        <td style={{ ...cellStyle, textAlign: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            value={dur}
                            onChange={(e) => state.handleProfileFieldChange(profileKey, 'duration', vi, parseFloat(e.target.value) || 0)}
                            style={smallInputStyle(false)}
                          />
                        </td>
                        {[0, 1, 2, 3].map((pi) => (
                          <td key={pi} style={{ ...cellStyle, textAlign: 'center', color: tc.textMuted }}>-</td>
                        ))}
                        <td style={{ ...cellStyle, textAlign: 'center', color: tc.textMuted }}>-</td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={v.id}>
                      <td style={cellStyle}>{v.name}</td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={stops}
                          onChange={(e) => state.handleProfileFieldChange(profileKey, 'stopsPerWeekPerUnit', vi, parseFloat(e.target.value) || 0)}
                          style={smallInputStyle(isChanged(stops, defStops))}
                        />
                      </td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          value={dur}
                          onChange={(e) => state.handleProfileFieldChange(profileKey, 'duration', vi, parseFloat(e.target.value) || 0)}
                          style={smallInputStyle(isChanged(dur, defDur))}
                        />
                      </td>
                      {[0, 1, 2, 3].map((pi) => (
                        <td key={pi} style={{ ...cellStyle, textAlign: 'center' }}>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step={1}
                            value={pDistPercent[pi]}
                            onChange={(e) => {
                              const pctVal = parseFloat(e.target.value) || 0;
                              state.handleProfilePeriodDistChange(profileKey, vi, pi, pctVal / 100);
                            }}
                            style={{
                              ...smallInputStyle(isChanged(pDist[pi], defPDist[pi])),
                              width: '55px',
                            }}
                          />
                        </td>
                      ))}
                      <td
                        style={{
                          ...cellStyle,
                          textAlign: 'center',
                          fontWeight: 600,
                          color: hasWarning ? '#e65100' : tc.text,
                          backgroundColor: hasWarning ? tc.warningBg : 'transparent',
                        }}
                      >
                        {pDistSumPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Warning */}
            {vehicles.some((_, vi) => {
              const pDist = profile.periodDistribution[vi] ?? [0, 0, 0, 0];
              const isInactive = (profile.stopsPerWeekPerUnit[vi] ?? 0) === 0;
              const sum = periodDistSum(pDist);
              return !isInactive && sum > 0 && Math.abs(sum - 1) > 0.02;
            }) && (
              <div
                style={{
                  padding: '6px 12px',
                  backgroundColor: tc.warningBg,
                  borderLeft: `3px solid ${tc.warningBorder}`,
                  marginTop: '4px',
                  fontFamily: tc.fontFamily,
                  fontSize: '0.75rem',
                  color: '#e65100',
                }}
              >
                Let op: periodeVerdeling telt niet op tot 100%. Controleer de percentages.
              </div>
            )}
          </div>
        );
      })}

      {/* Add profile for another distribution */}
      {availableDistributions.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <AddProfileButton
            availableDistributions={availableDistributions}
            functionId={functionId}
            numVehicles={numVehicles}
            state={state}
            tc={tc}
          />
        </div>
      )}
    </div>
  );
}

function AddProfileButton({
  availableDistributions,
  functionId,
  numVehicles,
  state,
  tc,
}: {
  availableDistributions: { id: string; name: string }[];
  functionId: string;
  numVehicles: number;
  state: SimulationState;
  tc: ThemeColors;
}) {
  const [showSelect, setShowSelect] = useState(false);

  if (!showSelect) {
    return (
      <button
        onClick={() => setShowSelect(true)}
        style={{
          padding: '5px 14px',
          border: `1px dashed ${tc.border}`,
          backgroundColor: 'transparent',
          color: tc.textMuted,
          fontFamily: tc.fontFamily,
          fontSize: '0.75rem',
          cursor: 'pointer',
          borderRadius: '3px',
        }}
      >
        + Profiel toevoegen voor andere distributie
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select
        onChange={(e) => {
          if (e.target.value) {
            state.handleEnsureProfile(`${functionId}_${e.target.value}`, numVehicles);
            setShowSelect(false);
          }
        }}
        defaultValue=""
        style={{
          padding: '4px 8px',
          border: `1px solid ${tc.inputBorder}`,
          borderRadius: '3px',
          fontFamily: tc.fontFamily,
          fontSize: '0.75rem',
        }}
      >
        <option value="" disabled>Kies distributie...</option>
        {availableDistributions.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <button
        onClick={() => setShowSelect(false)}
        style={{
          padding: '4px 8px',
          border: `1px solid ${tc.border}`,
          backgroundColor: 'transparent',
          color: tc.textMuted,
          fontFamily: tc.fontFamily,
          fontSize: '0.75rem',
          cursor: 'pointer',
          borderRadius: '3px',
        }}
      >
        Annuleren
      </button>
    </div>
  );
}
