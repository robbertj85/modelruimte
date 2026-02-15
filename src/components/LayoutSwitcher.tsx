'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type { LayoutType } from '@/lib/use-simulation-state';
import { DMI } from '@/lib/dmi-theme';

const LAYOUTS: { id: LayoutType; label: string; description: string }[] = [
  { id: 'rebel', label: 'Excel (Rebel)', description: 'Originele Excel layout' },
  { id: 'dmi', label: 'Cockpit (DMI)', description: 'DMI-gestylede cockpit' },
  { id: 'webapp', label: 'Webapp', description: 'Geoptimaliseerde webapp' },
];

export default function LayoutSwitcher({
  current,
  onChange,
}: {
  current: LayoutType;
  onChange: (layout: LayoutType) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 12, y: 12 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const didDrag = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag from the grip handle area
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') return;
    e.preventDefault();
    setDragging(true);
    didDrag.current = false;
    const rect = containerRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

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
    setDragging(false);
  }, []);

  // Initialize position to top-right
  useEffect(() => {
    setPosition({ x: window.innerWidth - 280, y: 12 });
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: 'rgba(10, 54, 96, 0.95)',
        borderRadius: '8px',
        padding: '3px',
        boxShadow: dragging
          ? '0 8px 24px rgba(0,0,0,0.4)'
          : '0 4px 12px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)',
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        touchAction: 'none',
        transition: dragging ? 'none' : 'box-shadow 0.2s ease',
      }}
    >
      {/* Drag grip */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          padding: '0 6px 0 4px',
          cursor: dragging ? 'grabbing' : 'grab',
        }}
        title="Drag to move"
      >
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
        </div>
        <div style={{ display: 'flex', gap: '2px' }}>
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
          <div style={{ width: 3, height: 3, borderRadius: '50%', backgroundColor: '#ffffff66' }} />
        </div>
      </div>
      {LAYOUTS.map((layout) => (
        <button
          key={layout.id}
          onClick={() => onChange(layout.id)}
          title={layout.description}
          style={{
            padding: '6px 14px',
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
            fontWeight: current === layout.id ? 700 : 500,
            backgroundColor: current === layout.id ? DMI.yellow : 'transparent',
            color: current === layout.id ? DMI.darkBlue : '#ffffffcc',
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
