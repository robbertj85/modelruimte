# Plan: Advanced Parameter Editing

## Goal

Replicate the Excel "Inputs" sheet functionality in the webapp: users can view and edit all underlying model parameters — general settings, vehicle definitions, and per-function delivery profiles (beleveringsprofielen). Currently these are hardcoded constants in `model-data.ts`; the simulation reads them at import time. We need to make them runtime-editable state.

---

## Current State

### What's already editable
- Function counts (number of units per function)
- Cluster assignments (which vehicle → which cluster)
- Service levels per cluster
- Number of simulations

### What's hardcoded (needs to become editable)
1. **Vehicle lengths** — `VEHICLES[].length` (2, 6, 8, 11, 16, 8 m)
2. **Distribution delivery days** — `DISTRIBUTIONS[].deliveryDays` (5, 6, or 7)
3. **Simulation parameters** — `SIM_PARAMS.intervalMinutes` (10), `minutesPerHour` (60), `hoursPerDay` (24)
4. **Delivery profiles** — `DELIVERY_PROFILES` — the core expert data:
   - Per function × distribution combination (e.g. `F1_D7` = Woningen × Pakket):
     - `stopsPerWeekPerUnit[vehicle]` — stops per week per unit, per vehicle type
     - `duration[vehicle]` — stop duration in minutes, per vehicle type
     - `periodDistribution[vehicle][period]` — % split across 4 time periods, per vehicle type

### How the simulation currently consumes this
`simulation.ts` imports `VEHICLES`, `FUNCTIONS`, `DISTRIBUTIONS`, `PERIODS`, `SIM_PARAMS`, `SERVICE_LEVELS`, `DELIVERY_PROFILES` directly from `model-data.ts` as module-level constants. These are used throughout the `runSimulation()` function.

---

## Architecture Plan

### Step 1: Extend `SimulationInput` to accept overridable parameters

Add optional fields to `SimulationInput` so the simulation can use user-edited values when provided, falling back to the hardcoded defaults otherwise:

```typescript
export interface SimulationInput {
  // Existing
  functionCounts: Record<string, number>;
  clusterAssignments: Record<string, number>;
  clusterServiceLevels: Record<number, number>;
  numSimulations?: number;

  // New: advanced parameter overrides
  vehicleLengths?: Record<string, number>;           // V1→2, V2→6, etc.
  deliveryDays?: Record<string, number>;              // D1→6, D2→5, etc.
  deliveryProfiles?: Record<string, DeliveryProfile>; // full override of DELIVERY_PROFILES
  intervalMinutes?: number;                           // override SIM_PARAMS.intervalMinutes
}
```

### Step 2: Update `simulation.ts` to use overrides

At the top of `runSimulation()`, merge overrides with defaults:

```typescript
const vehicles = VEHICLES.map(v => ({
  ...v,
  length: input.vehicleLengths?.[v.id] ?? v.length,
}));
const profiles = input.deliveryProfiles ?? DELIVERY_PROFILES;
const interval = input.intervalMinutes ?? SIM_PARAMS.intervalMinutes;
// etc.
```

Replace all references to the imported constants with these local merged copies. This is a careful refactor but straightforward — the simulation function is self-contained (~340 lines).

### Step 3: Add advanced state to `useSimulationState`

Extend the hook with new state for the editable parameters:

```typescript
// New state
const [vehicleLengths, setVehicleLengths] = useState<Record<string, number>>(
  () => Object.fromEntries(VEHICLES.map(v => [v.id, v.length]))
);
const [deliveryDays, setDeliveryDays] = useState<Record<string, number>>(
  () => Object.fromEntries(DISTRIBUTIONS.map(d => [d.id, d.deliveryDays]))
);
const [deliveryProfiles, setDeliveryProfiles] = useState<Record<string, DeliveryProfile>>(
  () => ({ ...DELIVERY_PROFILES })
);
const [intervalMinutes, setIntervalMinutes] = useState(SIM_PARAMS.intervalMinutes);
```

Add handler functions for updating individual profile fields:

```typescript
handleVehicleLengthChange(vehicleId: string, length: number)
handleDeliveryDaysChange(distId: string, days: number)
handleProfileStopsChange(profileKey: string, vehicleIndex: number, value: number)
handleProfileDurationChange(profileKey: string, vehicleIndex: number, value: number)
handleProfilePeriodDistChange(profileKey: string, vehicleIndex: number, periodIndex: number, value: number)
handleResetToDefaults()  // reset all advanced params back to hardcoded defaults
```

Pass these overrides to `runSimulation()`:

```typescript
const result = runSimulation({
  functionCounts,
  clusterAssignments,
  clusterServiceLevels,
  numSimulations,
  vehicleLengths,
  deliveryDays,
  deliveryProfiles,
  intervalMinutes,
});
```

### Step 4: Build the UI — shared approach across all 3 layouts

The Excel has an "Inputs" page with two sections:
1. **Algemeen** — general parameters table
2. **Beleveringsprofielen** — one sub-page per function with per-distribution/vehicle editing

#### 4a. Inputs page structure (matching Excel)

**Navigation**: A landing page with buttons:
- "Algemeen" button → shows general parameters
- Per-function buttons (Woningen, Supermarkt, ...) → shows that function's delivery profiles

**Algemeen sub-page** shows editable tables for:
- Vehicle lengths (vehicle name | length in m)
- Distribution delivery days (distribution name | days)
- Simulation interval (single input)

**Per-function sub-page** (e.g. "Beleveringen Woningen") shows:
- Time period headers across the top: 0:00-6:00 | 6:00-12:00 | 12:00-18:00 | 18:00-0:00
- For each distribution that applies to this function (e.g. Pakket, Service & Onderhoud, Thuisbezorging, ...):
  - Distribution name as section header
  - Description text (read-only)
  - Remarks text (read-only)
  - Per vehicle type, 4 rows:
    - **Stops per week per eenheid**: number input (yellow/editable background)
    - **Gemiddelde duurtijd per stop**: number input + "Minuten" label
    - **Verdeling per periode**: 4 percentage inputs across the time period columns (must sum to ~100%)

#### 4b. Where this goes in each layout

| Layout | Location | Tab/Page name |
|--------|----------|---------------|
| **Webapp** | New tab between "Invoer" and "Clustering" called "Parameters" (or expand existing "Invoer" tab with a sub-nav) | "Parameters" tab |
| **Rebel** | Extend existing "Inputs" tab — it already has the button grid and Algemeen, just make values editable | Existing "Inputs" tab |
| **DMI Cockpit** | Add a new nav mode or sub-page accessible from the cockpit | "Parameters" section |

### Step 5: Implementation order

1. **`model-data.ts`** — Add profile descriptions/remarks as data (currently missing; the Excel has description text per distribution-function combo). Add a `PROFILE_METADATA` export with description + remarks per profile key.

2. **`simulation.ts`** — Refactor to accept overrides via `SimulationInput`. Replace all direct constant references with local merged values. Run existing simulation to verify identical output.

3. **`use-simulation-state.ts`** — Add new state fields + handlers. Wire overrides into `handleRun`.

4. **Shared UI component** — Create `src/components/AdvancedInputs.tsx` (or similar) with:
   - `AlgemeenPanel` — general parameters editor
   - `BeleveringsprofielPanel` — per-function delivery profile editor
   These are the reusable data-editing components, layout-agnostic.

5. **Webapp layout** — Add "Parameters" tab, render the shared components with webapp styling.

6. **Rebel layout** — Convert existing read-only Inputs tab to use shared components with editable inputs.

7. **DMI layout** — Add parameters section using shared components with DMI styling.

---

## Data structure for profile metadata

To support the description/remarks shown in the Excel (e.g., "Bezorddienst met korte stoptijden" for Pakket), add to `model-data.ts`:

```typescript
export const PROFILE_METADATA: Record<string, { description: string; remarks: string }> = {
  'F1_D7': {
    description: 'Bezorddienst met korte stoptijden',
    remarks: 'Aanname dat alle pakketten naar woningen gaan...',
  },
  'F1_D10': {
    description: 'Gepland en ongepland onderhoud (uitzondering)...',
    remarks: '',
  },
  // ... etc for all 30+ profiles
};
```

This metadata will be extracted from the xlsm file's BP sheets.

---

## UI mockup — per-function profile editor

```
┌─────────────────────────────────────────────────────────────────┐
│  BELEVERINGEN WONINGEN                          [Terug]         │
├─────────────────────────────────────────────────────────────────┤
│                          0:00-6:00  6:00-12:00  12:00-18:00  18:00-0:00 │
│                                                                 │
│  ▼ Pakket                                                       │
│  Beschrijving: Bezorddienst met korte stoptijden               │
│  Opmerking: Aanname dat alle pakketten naar woningen gaan...    │
│                                                                 │
│  Bestelwagen <3,5 ton (N1)                                      │
│    Stops/week/eenheid    [1.43 ]  #                             │
│    Gem. duurtijd/stop    [  2  ]  # Minuten                     │
│    Verdeling per periode [  -  ]  [40.00%]  [40.00%]  [20.00%] │
│                                                                 │
│  Fiets, cargobike, scooter                                      │
│    Stops/week/eenheid    [  -  ]  #                             │
│    Gem. duurtijd/stop    [  -  ]  # Minuten                     │
│    Verdeling per periode [  -  ]  [  -   ]  [  -   ]  [  -   ] │
│  ... (all 6 vehicle types)                                      │
│                                                                 │
│  ▼ Service & Onderhoud                                          │
│  ... (same structure)                                           │
│                                                                 │
│  ▼ Thuisbezorging boodschappen                                  │
│  ... (same structure)                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Validation & guardrails

- Period distribution per vehicle must sum to ~100% (or 0% if inactive). Show warning if not.
- Stops per week must be >= 0
- Duration must be >= 0
- Vehicle length must be > 0
- A "Reset to defaults" button per section and globally
- Changed values should be visually distinguished (e.g., yellow background like the Excel, or a dot indicator)

---

## Risks & considerations

- **Performance**: The delivery profiles state object is moderately large (~30 profile keys × 6 vehicles × 3 fields). React state updates should be fine — use immutable spread patterns.
- **Simulation consistency**: After refactoring `simulation.ts`, verify output matches the current hardcoded version with a snapshot test or manual comparison.
- **Scope**: The Excel also shows some computed/derived values (e.g., "Leveringsdagen per distributie" shown as constants). These should remain read-only in the Algemeen panel to avoid confusion.
- **Profile metadata**: Extracting all description/remarks from the xlsm is manual work. Can be done incrementally — start with placeholders and fill in from Excel.

---

## File changes summary

| File | Change |
|------|--------|
| `src/lib/simulation.ts` | Accept overrides in `SimulationInput`, use merged local values |
| `src/lib/model-data.ts` | Add `PROFILE_METADATA` export with descriptions/remarks |
| `src/lib/use-simulation-state.ts` | Add advanced parameter state + handlers |
| `src/components/AdvancedInputs.tsx` | **New** — shared Algemeen + Beleveringsprofiel editor components |
| `src/components/layouts/WebappLayout.tsx` | Add "Parameters" tab using shared components |
| `src/components/layouts/RebelExcelLayout.tsx` | Convert existing Inputs tab to use editable shared components |
| `src/components/layouts/DmiCockpitLayout.tsx` | Add parameters section using shared components |
