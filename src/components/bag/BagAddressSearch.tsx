'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { DMI, labelMono } from '@/lib/dmi-theme';
import type { LocatieserverSuggestion } from '@/app/api/pdok/suggest/route';
import type { LocatieserverLookupResult } from '@/app/api/pdok/lookup/route';

interface Props {
  onSelect: (lookup: LocatieserverLookupResult) => void;
  disabled?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  weg: 'straat',
  adres: 'adres',
  woonplaats: 'plaats',
  buurt: 'buurt',
  wijk: 'wijk',
};

export default function BagAddressSearch({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocatieserverSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const resp = await fetch(`/api/pdok/suggest?q=${encodeURIComponent(query)}`, {
          signal: ctrl.signal,
        });
        if (!resp.ok) return;
        const data = (await resp.json()) as { suggestions: LocatieserverSuggestion[] };
        setSuggestions(data.suggestions);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.error(err);
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const pick = useCallback(
    async (s: LocatieserverSuggestion) => {
      setSelecting(true);
      setOpen(false);
      setQuery(s.weergavenaam);
      try {
        const resp = await fetch(`/api/pdok/lookup?id=${encodeURIComponent(s.id)}`);
        if (!resp.ok) return;
        const result = (await resp.json()) as LocatieserverLookupResult;
        onSelect(result);
      } finally {
        setSelecting(false);
      }
    },
    [onSelect]
  );

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 12px',
          backgroundColor: DMI.white,
          border: `1px solid ${DMI.blueTint2}`,
          borderRadius: 6,
        }}
      >
        {loading || selecting ? (
          <Loader2 size={14} className="animate-spin" style={{ color: DMI.darkGray }} />
        ) : (
          <Search size={14} style={{ color: DMI.darkGray }} />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Zoek adres of straat…"
          disabled={disabled}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 13,
            fontFamily: 'inherit',
            color: DMI.darkBlue,
          }}
        />
      </div>
      {open && suggestions.length > 0 && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            backgroundColor: DMI.white,
            border: `1px solid ${DMI.blueTint2}`,
            borderRadius: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            listStyle: 'none',
            padding: 0,
            maxHeight: 280,
            overflowY: 'auto',
            zIndex: 30,
          }}
        >
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => pick(s)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${DMI.blueTint2}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  fontSize: 13,
                  color: DMI.darkBlue,
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <span
                  style={{
                    ...labelMono,
                    fontSize: 9,
                    backgroundColor: DMI.blueTint2,
                    color: DMI.darkBlue,
                    padding: '2px 6px',
                    borderRadius: 3,
                    minWidth: 48,
                    textAlign: 'center',
                  }}
                >
                  {TYPE_LABELS[s.type] ?? s.type}
                </span>
                <span>{s.weergavenaam}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
