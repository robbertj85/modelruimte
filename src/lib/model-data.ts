// Vehicle types
export const VEHICLES = [
  { id: 'V1', name: 'Fiets, cargobike, scooter', length: 2 },
  { id: 'V2', name: 'LEVV / personenwagen', length: 6 },
  { id: 'V3', name: 'Bestelwagen <3,5 ton (N1)', length: 8 },
  { id: 'V4', name: 'Vrachtwagen (N2)', length: 11 },
  { id: 'V5', name: 'Grote vrachtwagen (N3)', length: 16 },
  { id: 'V6', name: 'Service bestelwagen', length: 8 },
] as const;

// Function types (building/land uses)
export const FUNCTIONS = [
  { id: 'F1', name: 'Woningen', unit: 'woningen', description: 'Consumenten die samen een woning en huishouding delen en die als 1 afleveradres worden geteld.' },
  { id: 'F2', name: 'Supermarkt', unit: 'vestigingen', description: 'Standaard supermarkt zonder laad- en losruimte op eigen terrein.' },
  { id: 'F3', name: 'Retail Food', unit: 'vestigingen', description: 'Winkels zoals bakkerijen, viswinkels, kaaswinkels, natuurvoeding.' },
  { id: 'F4', name: 'Retail Winkels (Keten)', unit: 'vestigingen', description: 'Retail keten voor mode, huishoudelijke artikelen, electronica.' },
  { id: 'F5', name: 'Retail Winkels (Onafh.)', unit: 'vestigingen', description: 'Onafhankelijke boekenwinkel, electronicazaak, etc.' },
  { id: 'F6', name: 'Restaurant (High-end)', unit: 'vestigingen', description: 'Gastronomisch restaurant (high en middle class).' },
  { id: 'F7', name: 'Restaurant (Basis)', unit: 'vestigingen', description: 'Basis restaurant.' },
  { id: 'F8', name: 'Caf\u00e9', unit: 'vestigingen', description: 'Caf\u00e9.' },
  { id: 'F9', name: 'Hotel', unit: 'vestigingen', description: 'Hotel (met of zonder restaurant).' },
  { id: 'F10', name: 'Kantoor (Klein)', unit: 'vestigingen', description: 'Kantoren tot 2500 m\u00b2 BVO.' },
  { id: 'F11', name: 'Kantoor (Middel)', unit: 'vestigingen', description: 'Kantoren tussen 2500 m\u00b2 en 10.000 m\u00b2 BVO.' },
  { id: 'F12', name: 'Kantoor (Groot)', unit: 'vestigingen', description: 'Kantoren vanaf 10.000 m\u00b2 met meerdere huurders.' },
] as const;

// Distribution types
export const DISTRIBUTIONS = [
  { id: 'D1', name: 'Afval - Bedrijven', deliveryDays: 6 },
  { id: 'D2', name: 'Afval - Huishoudens', deliveryDays: 5 },
  { id: 'D3', name: 'Bouw - Renovatie', deliveryDays: 6 },
  { id: 'D4', name: 'Bouw - Nieuwbouw', deliveryDays: 6 },
  { id: 'D5', name: 'Facilitair (bevoorrading)', deliveryDays: 5 },
  { id: 'D6', name: 'Horeca / Groothandel', deliveryDays: 6 },
  { id: 'D7', name: 'Pakket', deliveryDays: 6 },
  { id: 'D8', name: 'Retail (keten)', deliveryDays: 6 },
  { id: 'D9', name: 'Retail (onafhankelijk)', deliveryDays: 5 },
  { id: 'D10', name: 'Service & Onderhoud', deliveryDays: 5 },
  { id: 'D11', name: 'Specialisten', deliveryDays: 6 },
  { id: 'D12', name: 'Supermarktleveringen', deliveryDays: 5 },
  { id: 'D13', name: 'Thuisbezorging boodschappen', deliveryDays: 7 },
  { id: 'D14', name: 'Tweemans thuisbelevering', deliveryDays: 6 },
  { id: 'D15', name: 'Verhuizingen', deliveryDays: 7 },
] as const;

// Time periods
export const PERIODS = [
  { id: 'P1', name: '0:00 - 6:00', hours: 6 },
  { id: 'P2', name: '6:00 - 12:00', hours: 6 },
  { id: 'P3', name: '12:00 - 18:00', hours: 6 },
  { id: 'P4', name: '18:00 - 0:00', hours: 6 },
] as const;

// Simulation parameters
export const SIM_PARAMS = {
  intervalMinutes: 10,
  minutesPerHour: 60,
  hoursPerDay: 24,
  numSimulations: 1000,
};

// Service levels
export const SERVICE_LEVELS = [0.95, 0.90, 0.85, 0.80, 0.75] as const;

// Default cluster assignments (which vehicle belongs to which cluster)
export const DEFAULT_CLUSTERS: Record<string, number> = {
  V1: 1,
  V2: 1,
  V3: 2,
  V4: 2,
  V5: 2,
  V6: 3,
};

// Default service levels per cluster
export const DEFAULT_CLUSTER_SERVICE_LEVELS: Record<number, number> = {
  1: 0.95,
  2: 0.95,
  3: 0.95,
};

// Delivery profiles: key is "F{func}_D{dist}", value has stopsPerWeekPerUnit per vehicle and other params
// stopsPerWeekPerUnit: array of 6 values (V1-V6)
// duration: stop duration in minutes per vehicle (array of 6)
// periodDistribution: 4 values for each vehicle that has activity (array of 6 arrays of 4 values)
export interface DeliveryProfile {
  stopsPerWeekPerUnit: number[];  // per vehicle [V1..V6]
  duration: number[];  // minutes per stop per vehicle [V1..V6]
  periodDistribution: number[][];  // per vehicle, per period [V1..V6][P1..P4]
}

export const DELIVERY_PROFILES: Record<string, DeliveryProfile> = {
  // Woningen
  'F1_D7': {  // Woningen - Pakket
    stopsPerWeekPerUnit: [0, 0, 1.426282, 0, 0, 0],
    duration: [0, 0, 2, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.4, 0.4, 0.2], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F1_D10': {  // Woningen - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.038462],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F1_D13': {  // Woningen - Thuisbezorging boodschappen
    stopsPerWeekPerUnit: [0, 0, 0.06, 0, 0, 0],
    duration: [0, 0, 8, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.3, 0.3, 0.4], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F1_D14': {  // Woningen - Tweemans thuisbelevering
    stopsPerWeekPerUnit: [0, 0, 0.013736, 0.013736, 0, 0],
    duration: [0, 0, 20, 20, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.4, 0.4, 0.2], [0, 0.4, 0.4, 0.2],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Supermarkt
  'F2_D10': {  // Supermarkt - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 1, 0, 0, 0, 1],
    duration: [0, 15, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F2_D12': {  // Supermarkt - Supermarktleveringen
    stopsPerWeekPerUnit: [0, 0, 0, 4.25, 12.75, 0],
    duration: [0, 0, 0, 30, 45, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.2, 0.1],
      [0, 0.7, 0.2, 0.1], [0, 0, 0, 0],
    ],
  },
  // Retail Food
  'F3_D10': {  // Retail Food - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.038462],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F3_D11': {  // Retail Food - Specialisten
    stopsPerWeekPerUnit: [0, 2.5, 2.5, 2.5, 0, 0],
    duration: [0, 15, 15, 15, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0.7, 0.3, 0],
      [0, 0.7, 0.3, 0], [0, 0.7, 0.3, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Retail Winkels (Keten)
  'F4_D8': {  // Retail Keten - Retail (keten) — V3 confirmed zero in BP sheet
    stopsPerWeekPerUnit: [0, 0, 0, 3.6, 0.9, 0],
    duration: [0, 0, 0, 40, 40, 0],  // V4=40, V5=40 per Excel BP Retail Keten
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.2, 0.1],
      [0, 0.7, 0.2, 0.1], [0, 0, 0, 0],
    ],
  },
  'F4_D10': {  // Retail Keten - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 1],
    duration: [0, 0, 0, 0, 0, 45],  // V6=45 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  // Retail Winkels (Onafh.)
  'F5_D7': {  // Retail Onafh - Pakket — V3 periodDist confirmed all-zero in BP sheet
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0],
    duration: [0, 0, 0, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F5_D9': {  // Retail Onafh - Retail (onafhankelijk)
    stopsPerWeekPerUnit: [0, 0, 5, 4, 1, 0],
    duration: [0, 0, 15, 15, 15, 0],  // V4=15, V5=15 per Excel BP Retail Onafh
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.7, 0.2, 0.1], [0, 0.7, 0.2, 0.1],
      [0, 0.7, 0.2, 0.1], [0, 0, 0, 0],
    ],
  },
  'F5_D10': {  // Retail Onafh - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.038462],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  // Restaurant (High)
  'F6_D6': {  // Restaurant High - Horeca/Groothandel
    stopsPerWeekPerUnit: [0, 0, 0, 11.5, 0, 0],
    duration: [0, 0, 0, 15, 0, 0],  // V4=15 per Excel BP Restaurant (HE)
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.3, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F6_D10': {  // Restaurant High - Service & Onderhoud
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.346154],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F6_D11': {  // Restaurant High - Specialisten
    stopsPerWeekPerUnit: [0, 0, 11.5, 0, 0, 0],
    duration: [0, 0, 15, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.7, 0.3, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Restaurant (Basis)
  'F7_D6': {
    stopsPerWeekPerUnit: [0, 0, 0, 4.8, 0, 0],
    duration: [0, 0, 0, 15, 0, 0],  // V4=15 per Excel BP Restaurant (Basis)
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.3, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F7_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.346154],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F7_D11': {  // V3 confirmed zero in BP Restaurant (Basis) sheet
    stopsPerWeekPerUnit: [0, 0, 0, 0.8, 0, 0],
    duration: [0, 0, 0, 15, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.3, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Caf\u00e9
  'F8_D6': {
    stopsPerWeekPerUnit: [0, 0, 0, 4, 0, 0],
    duration: [0, 0, 0, 30, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.7, 0.3, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F8_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.346154],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F8_D11': {  // V3 confirmed zero in BP Café sheet — profile has no active vehicles
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0],
    duration: [0, 0, 0, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Hotel
  'F9_D6': {
    stopsPerWeekPerUnit: [0, 0, 0, 3.4, 0, 0],
    duration: [0, 0, 0, 15, 0, 0],  // V4=15 per Excel BP Hotel
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.4, 0.1],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F9_D7': {
    stopsPerWeekPerUnit: [0, 0, 10, 0, 0, 0],
    duration: [0, 0, 2, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.4, 0.4, 0.2], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F9_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 2],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F9_D11': {
    stopsPerWeekPerUnit: [0, 0.425, 13.175, 2, 0, 0],
    duration: [0, 15, 10, 30, 0, 0],  // V4=30 per Excel BP Hotel
    periodDistribution: [
      [0, 0, 0, 0], [0, 0.5, 0.4, 0.1],
      [0, 0.5, 0.4, 0.1], [0, 0.5, 0.4, 0.1],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Kantoor Klein
  'F10_D5': {
    stopsPerWeekPerUnit: [0, 0, 2.1, 0, 0, 0],
    duration: [0, 0, 5, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F10_D7': {
    stopsPerWeekPerUnit: [0, 0, 5.7, 0, 0, 0],
    duration: [0, 0, 2, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F10_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 0, 0, 0.038462],
    duration: [0, 0, 0, 0, 0, 60],  // V6=60 per Excel Kansen V6
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F10_D11': {
    stopsPerWeekPerUnit: [0, 0, 2.75, 0, 0, 0],
    duration: [0, 0, 5, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Kantoor Middel
  'F11_D5': {
    stopsPerWeekPerUnit: [0, 0, 2.52, 1.68, 0, 0],
    duration: [0, 0, 10, 10, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F11_D6': {
    stopsPerWeekPerUnit: [0, 0, 0, 3.68, 0, 0],
    duration: [0, 0, 0, 10, 0, 0],  // V4=10 per Excel BP Kantoor (Middel)
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F11_D7': {
    stopsPerWeekPerUnit: [0, 0, 11.4, 0, 0, 0],
    duration: [0, 0, 5, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F11_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 1.3, 0, 3.7],
    duration: [0, 0, 0, 30, 0, 30],  // V4=30, V6=30 per Excel
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F11_D11': {
    stopsPerWeekPerUnit: [0, 0, 5.52, 0, 0, 0],
    duration: [0, 0, 10, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  // Kantoor Groot
  'F12_D5': {
    stopsPerWeekPerUnit: [0, 0, 13.26, 8.84, 0, 0],
    duration: [0, 0, 15, 20, 0, 0],  // V4=20 per Excel BP Kantoor (Groot)
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F12_D6': {
    stopsPerWeekPerUnit: [0, 0, 0, 16.16, 0, 0],
    duration: [0, 0, 0, 20, 0, 0],  // V4=20 per Excel BP Kantoor (Groot)
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F12_D7': {
    stopsPerWeekPerUnit: [0, 0, 41.9, 0, 0, 0],
    duration: [0, 0, 5, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
  'F12_D10': {
    stopsPerWeekPerUnit: [0, 0, 0, 3.28, 0, 9],
    duration: [0, 0, 0, 30, 0, 30],  // V4=30, V6=30 per Excel
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
      [0, 0, 0, 0], [0, 0.5, 0.5, 0],
    ],
  },
  'F12_D11': {
    stopsPerWeekPerUnit: [0, 0, 24.24, 0, 0, 0],
    duration: [0, 0, 15, 0, 0, 0],
    periodDistribution: [
      [0, 0, 0, 0], [0, 0, 0, 0],
      [0, 0.5, 0.5, 0], [0, 0, 0, 0],
      [0, 0, 0, 0], [0, 0, 0, 0],
    ],
  },
};

// Capacity limits (matching Excel)
export const MAX_FUNCTIONS = 15;
export const MAX_VEHICLES = 7;
export const MAX_DISTRIBUTIONS = 18;

// Default-value getters for reset capability
export function getDefaultVehicleLengths(): Record<string, number> {
  const lengths: Record<string, number> = {};
  for (const v of VEHICLES) lengths[v.id] = v.length;
  return lengths;
}

export function getDefaultDeliveryDays(): Record<string, number> {
  const days: Record<string, number> = {};
  for (const d of DISTRIBUTIONS) days[d.id] = d.deliveryDays;
  return days;
}

export function getDefaultDeliveryProfiles(): Record<string, DeliveryProfile> {
  const result: Record<string, DeliveryProfile> = {};
  for (const [key, profile] of Object.entries(DELIVERY_PROFILES)) {
    result[key] = {
      stopsPerWeekPerUnit: [...profile.stopsPerWeekPerUnit],
      duration: [...profile.duration],
      periodDistribution: profile.periodDistribution.map((pd) => [...pd]),
    };
  }
  return result;
}

// Profile metadata: description and remarks per F×D profile (extracted from xlsm BP sheets)
export const PROFILE_METADATA: Record<string, { description: string; remarks: string }> = {
  'F1_D7': { description: 'Pakketleveringen aan woningen', remarks: 'Eén bestelwagen per afleveradres.' },
  'F1_D10': { description: 'Service & onderhoud aan woningen', remarks: 'Loodgieter, elektricien, etc.' },
  'F1_D13': { description: 'Thuisbezorging boodschappen', remarks: 'Online supermarkt bestellingen.' },
  'F1_D14': { description: 'Tweemans thuisbelevering', remarks: 'Grote items (meubels, witgoed).' },
  'F2_D10': { description: 'Service & onderhoud supermarkt', remarks: '' },
  'F2_D12': { description: 'Supermarktleveringen', remarks: 'Reguliere bevoorrading.' },
  'F3_D10': { description: 'Service & onderhoud retail food', remarks: '' },
  'F3_D11': { description: 'Specialisten retail food', remarks: 'Versproducten, bakkerij, etc.' },
  'F4_D8': { description: 'Retail keten bevoorrading', remarks: '' },
  'F4_D10': { description: 'Service & onderhoud retail keten', remarks: '' },
  'F5_D7': { description: 'Pakketleveringen retail onafh.', remarks: 'Profiel zonder actieve voertuigen.' },
  'F5_D9': { description: 'Retail onafhankelijk bevoorrading', remarks: '' },
  'F5_D10': { description: 'Service & onderhoud retail onafh.', remarks: '' },
  'F6_D6': { description: 'Horeca/groothandel restaurant high-end', remarks: '' },
  'F6_D10': { description: 'Service & onderhoud restaurant high-end', remarks: '' },
  'F6_D11': { description: 'Specialisten restaurant high-end', remarks: '' },
  'F7_D6': { description: 'Horeca/groothandel restaurant basis', remarks: '' },
  'F7_D10': { description: 'Service & onderhoud restaurant basis', remarks: '' },
  'F7_D11': { description: 'Specialisten restaurant basis', remarks: '' },
  'F8_D6': { description: 'Horeca/groothandel café', remarks: '' },
  'F8_D10': { description: 'Service & onderhoud café', remarks: '' },
  'F8_D11': { description: 'Specialisten café', remarks: 'Profiel zonder actieve voertuigen.' },
  'F9_D6': { description: 'Horeca/groothandel hotel', remarks: '' },
  'F9_D7': { description: 'Pakketleveringen hotel', remarks: '' },
  'F9_D10': { description: 'Service & onderhoud hotel', remarks: '' },
  'F9_D11': { description: 'Specialisten hotel', remarks: '' },
  'F10_D5': { description: 'Facilitair kantoor klein', remarks: '' },
  'F10_D7': { description: 'Pakketleveringen kantoor klein', remarks: '' },
  'F10_D10': { description: 'Service & onderhoud kantoor klein', remarks: '' },
  'F10_D11': { description: 'Specialisten kantoor klein', remarks: '' },
  'F11_D5': { description: 'Facilitair kantoor middel', remarks: '' },
  'F11_D6': { description: 'Horeca/groothandel kantoor middel', remarks: '' },
  'F11_D7': { description: 'Pakketleveringen kantoor middel', remarks: '' },
  'F11_D10': { description: 'Service & onderhoud kantoor middel', remarks: '' },
  'F11_D11': { description: 'Specialisten kantoor middel', remarks: '' },
  'F12_D5': { description: 'Facilitair kantoor groot', remarks: '' },
  'F12_D6': { description: 'Horeca/groothandel kantoor groot', remarks: '' },
  'F12_D7': { description: 'Pakketleveringen kantoor groot', remarks: '' },
  'F12_D10': { description: 'Service & onderhoud kantoor groot', remarks: '' },
  'F12_D11': { description: 'Specialisten kantoor groot', remarks: '' },
};

// Default function counts (from the example scenario in the Excel)
export const DEFAULT_FUNCTION_COUNTS: Record<string, number> = {
  F1: 362,  // Woningen
  F2: 0,    // Supermarkt
  F3: 9,    // Retail Food
  F4: 2,    // Retail Winkels (Keten)
  F5: 27,   // Retail Winkels (Onafh.)
  F6: 0,    // Restaurant (High-end)
  F7: 8,    // Restaurant (Basis)
  F8: 7,    // Caf\u00e9
  F9: 0,    // Hotel
  F10: 0,   // Kantoor (Klein)
  F11: 0,   // Kantoor (Middel)
  F12: 0,   // Kantoor (Groot)
};
