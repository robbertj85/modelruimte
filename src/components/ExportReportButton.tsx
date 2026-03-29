'use client';

import { useState, useRef, useEffect } from 'react';
import { FileDown, FileText, Printer } from 'lucide-react';
import {
  generateReportMarkdown,
  downloadMarkdown,
  downloadPdf,
  type ReportInput,
} from '@/lib/report-export';

interface ExportReportButtonProps {
  reportInput: ReportInput;
  variant: 'webapp' | 'dmi';
}

export default function ExportReportButton({ reportInput, variant }: ExportReportButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  function handleExportMd() {
    const md = generateReportMarkdown(reportInput);
    downloadMarkdown(md);
    setOpen(false);
  }

  function handleExportPdf() {
    downloadPdf(reportInput);
    setOpen(false);
  }

  // Variant-specific styles
  const styles = getStyles(variant);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen((p) => !p)} style={styles.trigger}>
        <FileDown size={styles.iconSize} />
        Export Rapport
      </button>

      {open && (
        <div style={styles.dropdown}>
          <button onClick={handleExportMd} style={styles.item}>
            <FileText size={14} />
            Download .md
          </button>
          <button onClick={handleExportPdf} style={styles.item}>
            <Printer size={14} />
            Opslaan als .pdf
          </button>
        </div>
      )}
    </div>
  );
}

function getStyles(variant: 'webapp' | 'dmi') {
  const dropdownBase: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    zIndex: 50,
    minWidth: '180px',
    overflow: 'hidden',
  };

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '100%',
    padding: '8px 14px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.8rem',
    textAlign: 'left',
  };

  if (variant === 'dmi') {
    return {
      iconSize: 14,
      trigger: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: '6px',
        border: '1px solid rgba(255,255,255,0.3)',
        backgroundColor: 'transparent',
        color: '#ffffff',
        fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
        fontWeight: 600,
        fontSize: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      } as React.CSSProperties,
      dropdown: {
        ...dropdownBase,
        backgroundColor: '#1a3a5c',
        border: '1px solid rgba(255,255,255,0.2)',
      } as React.CSSProperties,
      item: {
        ...itemBase,
        backgroundColor: 'transparent',
        color: '#ffffff',
        fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
      } as React.CSSProperties,
    };
  }

  // webapp
  return {
    iconSize: 16,
    trigger: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      backgroundColor: '#ffffff',
      color: '#334155',
      fontSize: '0.8rem',
      fontWeight: 500,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
    } as React.CSSProperties,
    dropdown: {
      ...dropdownBase,
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
    } as React.CSSProperties,
    item: {
      ...itemBase,
      backgroundColor: 'transparent',
      color: '#334155',
    } as React.CSSProperties,
  };
}
