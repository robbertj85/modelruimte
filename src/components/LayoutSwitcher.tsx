'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayoutType } from '@/lib/use-simulation-state';
import { useIsMobile } from '@/lib/useIsMobile';

const LAYOUTS: { id: LayoutType; label: string; shortLabel: string; description: string }[] = [
  { id: 'rebel', label: 'Excel (Rebel)', shortLabel: 'Excel', description: 'Originele Excel layout' },
  { id: 'dmi', label: 'Cockpit (DMI)', shortLabel: 'DMI', description: 'DMI-gestylede cockpit' },
  { id: 'webapp', label: 'Webapp', shortLabel: 'App', description: 'Geoptimaliseerde webapp' },
];

const STORAGE_KEY = 'layout-switcher-position';

function loadPosition(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const pos = JSON.parse(raw);
      if (typeof pos.x === 'number' && typeof pos.y === 'number') return pos;
    }
  } catch { /* ignore */ }
  return null;
}

function savePosition(pos: { x: number; y: number }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch { /* ignore */ }
}

export default function LayoutSwitcher({
  current,
  onChange,
}: {
  current: LayoutType;
  onChange: (layout: LayoutType) => void;
}) {
  const { isMobile } = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 12, y: 12 });
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (isMobile) return; // no dragging on mobile
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') return;
    e.preventDefault();
    setDragging(true);
    didDrag.current = false;
    const rect = containerRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isMobile]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      didDrag.current = true;
      const newX = e.clientX - dragOffset.current.x;
      const newY = e.clientY - dragOffset.current.y;
      setPosition({ x: newX, y: newY });
    },
    [dragging],
  );

  const onPointerUp = useCallback(() => {
    if (dragging) {
      setDragging(false);
      // Persist position after drag ends
      setPosition((pos) => {
        savePosition(pos);
        return pos;
      });
    }
  }, [dragging]);

  // Restore saved position or default to top-right (desktop only)
  useEffect(() => {
    if (isMobile) return;
    const saved = loadPosition();
    if (saved) {
      // Clamp to current viewport so it's never off-screen
      const x = Math.max(0, Math.min(saved.x, window.innerWidth - 200));
      const y = Math.max(0, Math.min(saved.y, window.innerHeight - 40));
      setPosition({ x, y });
    } else {
      setPosition({ x: window.innerWidth - 280, y: 12 });
    }
  }, [isMobile]);

  const isActive = hovered || dragging;

  // On mobile: fixed at bottom-center, no dragging
  if (isMobile) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '48px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          backgroundColor: 'rgba(255, 255, 255, 0.92)',
          borderRadius: '20px',
          padding: '3px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onChange(layout.id)}
            title={layout.description}
            style={{
              padding: '6px 14px',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
              fontWeight: current === layout.id ? 600 : 400,
              backgroundColor: current === layout.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
              color: current === layout.id ? '#333' : '#888',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {layout.shortLabel}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.45)',
        borderRadius: '8px',
        padding: '3px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: dragging
          ? '0 4px 16px rgba(0,0,0,0.15)'
          : '0 1px 4px rgba(0,0,0,0.08)',
        backdropFilter: 'blur(12px)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        opacity: isActive ? 1 : 0.5,
        transition: dragging ? 'none' : 'opacity 0.3s ease, background-color 0.3s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Drag grip */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '0 5px 0 3px',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        title="Drag to move"
      >
        {[0, 1, 2].map((i) => (
          <div key={i} style={{ display: 'flex', gap: '2px' }}>
            <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.2)' }} />
            <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.2)' }} />
          </div>
        ))}
      </div>
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          onClick={() => onChange(layout.id)}
          title={layout.description}
          style={{
            padding: '5px 12px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.7rem',
            fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
            fontWeight: current === layout.id ? 600 : 400,
            backgroundColor: current === layout.id ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
            color: current === layout.id ? '#333' : '#888',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {layout.label}
        </button>
      ))}
    </div>
  );
}
