'use client';

import type { HandleidingTable } from '@/lib/content';

export type TableTheme = 'rebel' | 'dmi';

const THEMES = {
  rebel: {
    headerBg: '#c0504d',
    headerColor: '#ffffff',
    borderColor: '#e0e0e0',
    stripeBg: '#faf5f5',
    captionColor: '#666666',
    font: 'Calibri, Arial, sans-serif',
  },
  dmi: {
    headerBg: '#0a3660',
    headerColor: '#ffffff',
    borderColor: '#daebfb',
    stripeBg: '#f6f9fd',
    captionColor: '#565656',
    font: 'var(--font-ibm-plex-sans), sans-serif',
  },
} as const;

export function HandleidingTableRenderer({
  table,
  theme = 'dmi',
}: {
  table: HandleidingTable;
  theme?: TableTheme;
}) {
  const t = THEMES[theme];

  return (
    <div style={{ margin: '16px 0', overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8rem',
          fontFamily: t.font,
        }}
      >
        <thead>
          <tr>
            {table.headers.map((h) => (
              <th
                key={h}
                style={{
                  backgroundColor: t.headerBg,
                  color: t.headerColor,
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  borderBottom: `2px solid ${t.headerBg}`,
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                backgroundColor: ri % 2 === 1 ? t.stripeBg : 'transparent',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '6px 12px',
                    borderBottom: `1px solid ${t.borderColor}`,
                    verticalAlign: 'top',
                    lineHeight: 1.5,
                  }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {table.caption && (
        <p
          style={{
            fontSize: '0.72rem',
            fontStyle: 'italic',
            color: t.captionColor,
            marginTop: '8px',
            lineHeight: 1.5,
            fontFamily: t.font,
          }}
        >
          {table.caption}
        </p>
      )}
    </div>
  );
}
