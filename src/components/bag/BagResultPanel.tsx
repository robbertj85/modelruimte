'use client';

import { useMemo } from 'react';
import { AlertTriangle, Check, Info, Loader2, XCircle } from 'lucide-react';
import { DMI, heading, bodyText, labelMono } from '@/lib/dmi-theme';
import { BAG_ICONS } from '@/lib/bag-icons';
import { mapBagToApplyPlan } from '@/lib/bag-mapping';
import type { BagQueryResult } from '@/lib/bag-types';

interface Props {
  result: BagQueryResult | null;
  isQuerying: boolean;
  error: string | null;
  onApply: (plan: ReturnType<typeof mapBagToApplyPlan>) => void;
  onReset: () => void;
}

export default function BagResultPanel({ result, isQuerying, error, onApply, onReset }: Props) {
  const plan = useMemo(() => (result ? mapBagToApplyPlan(result) : null), [result]);

  if (isQuerying) {
    return (
      <Empty>
        <Loader2 size={18} className="animate-spin" />
        <span>BAG wordt opgehaald…</span>
      </Empty>
    );
  }

  if (error) {
    return (
      <Empty>
        <XCircle size={20} color={DMI.yellow} />
        <span style={{ ...bodyText, fontSize: 13 }}>{error}</span>
      </Empty>
    );
  }

  if (!result || !plan) {
    return (
      <Empty>
        <Info size={20} color={DMI.mediumBlue} />
        <div style={{ ...bodyText, fontSize: 13, maxWidth: 260, textAlign: 'center' }}>
          Zoek een straat of teken een polygon op de kaart en klik <strong>BAG ophalen</strong>.
        </div>
      </Empty>
    );
  }

  const totalMapped = plan.mapping.reduce((sum, m) => sum + m.count, 0);

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' }}>
      <div>
        <h3 style={{ ...heading, fontSize: 15, margin: 0 }}>BAG-resultaat</h3>
        <p style={{ ...bodyText, fontSize: 12, color: DMI.darkGray, margin: '2px 0 0' }}>
          {result.totalVerblijfsobjecten} verblijfsobjecten in geselecteerd gebied
        </p>
      </div>

      {result.truncated && (
        <Banner tone="warn" icon={<AlertTriangle size={14} />}>
          Gebied te groot — resultaten afgekapt. Maak het gebied kleiner.
        </Banner>
      )}
      {result.multiUseCount > 0 && (
        <Banner tone="info">
          {result.multiUseCount} panden met meerdere gebruiksdoelen — eerste geteld.
        </Banner>
      )}

      <Section title="Verdeling per gebruiksdoel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {Object.values(result.buckets)
            .filter((b): b is NonNullable<typeof b> => !!b)
            .sort((a, b) => b.count - a.count)
            .map((bucket) => {
              const cfg = BAG_ICONS[bucket.gebruiksdoel];
              const Icon = cfg.icon;
              return (
                <div
                  key={bucket.gebruiksdoel}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px',
                    borderRadius: 4,
                    backgroundColor: DMI.blueTint2,
                  }}
                >
                  <Icon size={14} color={cfg.color} />
                  <span style={{ fontSize: 12, flex: 1 }}>{cfg.label}</span>
                  <span style={{ ...labelMono, fontSize: 11 }}>
                    {bucket.count} · {Math.round(bucket.totalOppervlakte).toLocaleString('nl-NL')} m²
                  </span>
                </div>
              );
            })}
        </div>
      </Section>

      <Section title="Overnemen in model">
        {plan.mapping.length === 0 ? (
          <p style={{ ...bodyText, color: DMI.darkGray, margin: 0, fontSize: 12 }}>
            Geen gebruiksdoelen konden worden gemapt op de 12 functies.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: `1px solid ${DMI.blueTint2}` }}>
                <Th>Functie</Th>
                <Th align="right">Aantal</Th>
                <Th align="right">m²</Th>
              </tr>
            </thead>
            <tbody>
              {plan.mapping.map((m, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${DMI.blueTint2}` }}>
                  <Td>
                    <strong>{m.toFuncId}</strong> {m.toFuncName}
                    <div style={{ ...labelMono, fontSize: 9, color: DMI.darkGray, marginTop: 1 }}>
                      ← {m.from}
                    </div>
                  </Td>
                  <Td align="right">{m.count}</Td>
                  <Td align="right">{m.totalBvo.toLocaleString('nl-NL')}</Td>
                </tr>
              ))}
              <tr style={{ fontWeight: 600 }}>
                <Td>Totaal</Td>
                <Td align="right">{totalMapped}</Td>
                <Td align="right">
                  {plan.mapping.reduce((s, m) => s + m.totalBvo, 0).toLocaleString('nl-NL')}
                </Td>
              </tr>
            </tbody>
          </table>
        )}
      </Section>

      {plan.unmappedBuckets.length > 0 && (
        <Section title="Niet gemapt">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {plan.unmappedBuckets.map((b) => {
              const cfg = BAG_ICONS[b.gebruiksdoel];
              const Icon = cfg.icon;
              return (
                <div key={b.gebruiksdoel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <Icon size={12} color={cfg.color} />
                  <span style={{ flex: 1 }}>{cfg.label}</span>
                  <span style={{ ...labelMono, fontSize: 10 }}>
                    {b.count} · {Math.round(b.totalOppervlakte).toLocaleString('nl-NL')} m²
                  </span>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
        <button
          onClick={() => plan && onApply(plan)}
          disabled={plan.mapping.length === 0}
          style={{
            padding: '10px 16px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: plan.mapping.length === 0 ? DMI.darkGray : DMI.yellow,
            color: DMI.darkBlue,
            fontWeight: 600,
            cursor: plan.mapping.length === 0 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontFamily: 'inherit',
            opacity: plan.mapping.length === 0 ? 0.5 : 1,
            fontSize: 13,
          }}
        >
          <Check size={14} /> Overnemen in Ruimtemodel
        </button>
        <button
          onClick={onReset}
          style={{
            padding: '8px 16px',
            borderRadius: 6,
            border: `1px solid ${DMI.blueTint2}`,
            backgroundColor: DMI.white,
            color: DMI.darkBlue,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 12,
          }}
        >
          Opnieuw
        </button>
      </div>

      <p style={{ ...labelMono, fontSize: 9, color: DMI.darkGray, textAlign: 'right', marginTop: 4 }}>
        {new Date(result.queriedAt).toLocaleString('nl-NL')} · PDOK BAG WFS
      </p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
        color: DMI.darkGray,
      }}
    >
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 style={{ ...labelMono, fontSize: 10, margin: '0 0 6px', color: DMI.darkBlue }}>{title}</h4>
      {children}
    </div>
  );
}

function Banner({ tone, icon, children }: { tone: 'info' | 'warn'; icon?: React.ReactNode; children: React.ReactNode }) {
  const bg = tone === 'warn' ? '#fff7e6' : DMI.blueTint2;
  const border = tone === 'warn' ? DMI.yellow : DMI.mediumBlue;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        backgroundColor: bg,
        borderLeft: `3px solid ${border}`,
        borderRadius: 3,
        fontSize: 11,
        ...bodyText,
      }}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th style={{ padding: '6px 8px', textAlign: align ?? 'left', ...labelMono, fontSize: 10 }}>
      {children}
    </th>
  );
}

function Td({ children, align }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td style={{ padding: '6px 8px', textAlign: align ?? 'left', verticalAlign: 'top' }}>
      {children}
    </td>
  );
}
