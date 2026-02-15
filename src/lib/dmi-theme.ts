export const DMI = {
  darkBlue: '#0a3660',
  yellow: '#ffba08',
  mediumBlue: '#115491',
  blueTint1: '#a3cdf4',
  blueTint2: '#daebfb',
  blueTint3: '#f6f9fd',
  darkGray: '#565656',
  lightGray: '#efefef',
  white: '#ffffff',
  themeLogistics: '#ffd493',
  themeAreaDev: '#9ce4a3',
  themeMobility: '#b3edeb',
  themeDigitalTwins: '#dfbdf9',
} as const;

export const PERIOD_COLORS = [DMI.blueTint1, DMI.mediumBlue, DMI.yellow, DMI.themeLogistics];

export const FUNCTION_COLORS = [
  '#0a3660', '#115491', '#a3cdf4', '#ffba08',
  '#ffd493', '#9ce4a3', '#b3edeb', '#dfbdf9',
  '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b',
];

export const CLUSTER_COLORS: Record<number, string> = {
  1: DMI.mediumBlue,
  2: DMI.yellow,
  3: DMI.themeAreaDev,
  4: DMI.themeMobility,
  5: DMI.themeDigitalTwins,
  6: DMI.themeLogistics,
  7: DMI.blueTint1,
};

export const SERVICE_LEVEL_OPTIONS = [
  { value: '0.75', label: '75%' },
  { value: '0.80', label: '80%' },
  { value: '0.85', label: '85%' },
  { value: '0.90', label: '90%' },
  { value: '0.95', label: '95%' },
];

export const MAX_CLUSTERS = 7;

export const heading: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-sans-condensed), sans-serif',
  fontWeight: 700,
  color: DMI.darkBlue,
};

export const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-sans), sans-serif',
  fontWeight: 400,
  color: DMI.darkGray,
};

export const labelMono: React.CSSProperties = {
  fontFamily: 'var(--font-ibm-plex-mono), monospace',
  textTransform: 'uppercase' as const,
  fontSize: '0.65rem',
  letterSpacing: '0.05em',
  color: DMI.mediumBlue,
  fontWeight: 500,
};
