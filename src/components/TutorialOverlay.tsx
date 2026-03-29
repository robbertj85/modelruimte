'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { TutorialState } from '@/lib/use-tutorial';
import type { TutorialPlacement } from '@/lib/tutorial';
import { DMI, heading, bodyText } from '@/lib/dmi-theme';
import { ChevronLeft, ChevronRight, X, GraduationCap, BookOpen } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 12;
const TOOLTIP_WIDTH = 360;
const TOOLTIP_GAP = 16;
const FIND_DELAY_MS = 350;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeTooltipPosition(
  rect: TargetRect,
  placement: TutorialPlacement,
  viewW: number,
  viewH: number,
): TooltipPosition {
  const pad = SPOTLIGHT_PADDING;
  const gap = TOOLTIP_GAP;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = rect.top + rect.height + pad + gap;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      top = rect.top - pad - gap - 200; // estimated tooltip height
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - 100;
      left = rect.left - pad - gap - TOOLTIP_WIDTH;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - 100;
      left = rect.left + rect.width + pad + gap;
      break;
    default:
      top = viewH / 2 - 100;
      left = viewW / 2 - TOOLTIP_WIDTH / 2;
  }

  // Clamp within viewport
  left = Math.max(16, Math.min(left, viewW - TOOLTIP_WIDTH - 16));
  top = Math.max(16, Math.min(top, viewH - 260));

  return { top, left };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TutorialOverlay({
  tutorial,
  onGoToCasus,
}: {
  tutorial: TutorialState;
  onGoToCasus?: () => void;
}) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);
  const findTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mount portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Find and track target element
  const trackTarget = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    const step = tutorial.currentStep;
    if (!tutorial.isActive || !step.target) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(`[data-tutorial="${step.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }

    const update = () => {
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    update();
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    // Re-measure after scroll
    setTimeout(update, 400);

    observerRef.current = new ResizeObserver(update);
    observerRef.current.observe(el);

    // Also update on scroll
    const onScroll = () => update();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => {
      window.removeEventListener('scroll', onScroll, true);
      observerRef.current?.disconnect();
    };
  }, [tutorial.isActive, tutorial.currentStep]);

  // When step changes, wait for tab switch to render, then find target
  useEffect(() => {
    if (!tutorial.isActive) {
      setTargetRect(null);
      return;
    }

    if (findTimerRef.current) clearTimeout(findTimerRef.current);
    findTimerRef.current = setTimeout(() => {
      trackTarget();
    }, FIND_DELAY_MS);

    return () => {
      if (findTimerRef.current) clearTimeout(findTimerRef.current);
    };
  }, [tutorial.isActive, tutorial.currentStepIndex, trackTarget]);

  // Keyboard navigation
  useEffect(() => {
    if (!tutorial.isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        tutorial.stop();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        tutorial.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        tutorial.prev();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [tutorial]);

  if (!mounted || !tutorial.isActive) return null;

  const step = tutorial.currentStep;
  const isModal = !step.target || !targetRect;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  // Spotlight rect with padding
  const spot = targetRect
    ? {
        x: targetRect.left - SPOTLIGHT_PADDING,
        y: targetRect.top - SPOTLIGHT_PADDING,
        w: targetRect.width + SPOTLIGHT_PADDING * 2,
        h: targetRect.height + SPOTLIGHT_PADDING * 2,
      }
    : null;

  // Tooltip position
  const tooltipPos = isModal
    ? { top: viewH / 2 - 140, left: viewW / 2 - TOOLTIP_WIDTH / 2 }
    : computeTooltipPosition(targetRect!, step.placement, viewW, viewH);

  const overlay = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        pointerEvents: 'auto',
      }}
    >
      {/* SVG overlay with spotlight cutout */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onClick={(e) => {
          // Close if clicking overlay (not tooltip)
          if (e.target === e.currentTarget || (e.target as SVGElement).tagName === 'rect') {
            tutorial.stop();
          }
        }}
      >
        <defs>
          <mask id="tutorial-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spot && (
              <rect
                x={spot.x}
                y={spot.y}
                width={spot.w}
                height={spot.h}
                rx={SPOTLIGHT_RADIUS}
                ry={SPOTLIGHT_RADIUS}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(10, 54, 96, 0.65)"
          mask="url(#tutorial-spotlight-mask)"
        />
      </svg>

      {/* Spotlight border ring (when targeting an element) */}
      {spot && (
        <div
          style={{
            position: 'absolute',
            top: spot.y,
            left: spot.x,
            width: spot.w,
            height: spot.h,
            borderRadius: SPOTLIGHT_RADIUS,
            border: `2px solid ${DMI.yellow}`,
            pointerEvents: 'none',
            boxShadow: `0 0 0 4px rgba(255, 186, 8, 0.25)`,
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{
          position: 'absolute',
          top: tooltipPos.top,
          left: Math.max(16, Math.min(tooltipPos.left, viewW - TOOLTIP_WIDTH - 16)),
          width: TOOLTIP_WIDTH,
          maxWidth: 'calc(100vw - 32px)',
          backgroundColor: DMI.white,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          animation: 'tutorial-fade-in 0.25s ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px 12px',
            borderBottom: `3px solid ${DMI.yellow}`,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <GraduationCap size={20} color={DMI.yellow} style={{ flexShrink: 0 }} />
          <h3
            style={{
              ...heading,
              fontSize: '1rem',
              margin: 0,
              flex: 1,
            }}
          >
            {step.title}
          </h3>
          <button
            onClick={tutorial.stop}
            aria-label="Sluit tutorial"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              color: DMI.darkGray,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <p
            style={{
              ...bodyText,
              fontSize: '0.87rem',
              lineHeight: 1.65,
              margin: 0,
              color: DMI.darkGray,
            }}
          >
            {step.description}
          </p>

          {/* Go to Casus button on completion step */}
          {step.id === 'completion' && onGoToCasus && (
            <button
              onClick={() => {
                tutorial.stop();
                onGoToCasus();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '16px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: `2px solid ${DMI.yellow}`,
                backgroundColor: `${DMI.yellow}15`,
                color: DMI.darkBlue,
                fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                width: '100%',
                justifyContent: 'center',
              }}
            >
              <BookOpen size={16} />
              Bekijk Casus Gerard Doustraat
            </button>
          )}

          {/* Missing target hint */}
          {step.target && !targetRect && (
            <p
              style={{
                ...bodyText,
                fontSize: '0.8rem',
                color: DMI.mediumBlue,
                marginTop: '12px',
                fontStyle: 'italic',
              }}
            >
              Dit element is momenteel niet zichtbaar. Voer eerst de simulatie uit om het te bekijken.
            </p>
          )}
        </div>

        {/* Footer: navigation */}
        <div
          style={{
            padding: '12px 20px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `1px solid ${DMI.blueTint2}`,
          }}
        >
          {/* Progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {Array.from({ length: tutorial.totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i === tutorial.currentStepIndex ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor:
                    i === tutorial.currentStepIndex
                      ? DMI.yellow
                      : i < tutorial.currentStepIndex
                        ? DMI.mediumBlue
                        : DMI.blueTint2,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {tutorial.currentStepIndex > 0 && (
              <button
                onClick={tutorial.prev}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '10px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${DMI.blueTint2}`,
                  backgroundColor: 'transparent',
                  color: DMI.darkBlue,
                  fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  minHeight: '44px',
                }}
              >
                <ChevronLeft size={14} /> Vorige
              </button>
            )}
            <button
              onClick={tutorial.next}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: DMI.darkBlue,
                color: DMI.white,
                fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                minHeight: '44px',
              }}
            >
              {tutorial.currentStepIndex < tutorial.totalSteps - 1 ? (
                <>
                  Volgende <ChevronRight size={14} />
                </>
              ) : (
                'Afsluiten'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes tutorial-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}
