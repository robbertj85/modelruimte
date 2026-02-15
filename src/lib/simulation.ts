/**
 * Monte Carlo Simulation Engine
 *
 * Replicates the Excel model logic for estimating required loading/unloading
 * space based on stochastic vehicle arrivals. The simulation determines peak
 * simultaneous vehicle presence across many random trials, then uses percentile
 * analysis (service levels) to size the required space.
 *
 * How it works:
 *   1. The day is split into 4 periods of 6 hours each, each period subdivided
 *      into 10-minute intervals (36 intervals per period, 144 total per day).
 *   2. For every Function x Distribution x Vehicle combination, we compute the
 *      probability that a vehicle arrives in any single interval.
 *   3. In each Monte Carlo iteration we walk through all 144 intervals. For each
 *      interval we draw random numbers against each F×D×V probability to decide
 *      if a vehicle arrives. Arrived vehicles stay for ceil(duration / intervalMinutes)
 *      intervals.
 *   4. We track the peak number of simultaneously present vehicles per type per
 *      iteration.
 *   5. After all iterations we sort the peaks and read off percentile values to
 *      determine required capacity at each service level.
 *   6. Space = peak vehicles × vehicle length. Clusters aggregate vehicles and
 *      each cluster uses its own service level.
 */

import {
  VEHICLES,
  FUNCTIONS,
  DISTRIBUTIONS,
  PERIODS,
  SIM_PARAMS,
  SERVICE_LEVELS,
  DELIVERY_PROFILES,
  type DeliveryProfile,
} from './model-data';

// ---------------------------------------------------------------------------
// Types for custom entries
// ---------------------------------------------------------------------------

export interface VehicleDef {
  id: string;
  name: string;
  length: number;
}

export interface FunctionDef {
  id: string;
  name: string;
  unit: string;
  description: string;
}

export interface DistributionDef {
  id: string;
  name: string;
  deliveryDays: number;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SimulationInput {
  /** Number of units per function, e.g. { F1: 362, F2: 0, ... } */
  functionCounts: Record<string, number>;
  /** Which cluster each vehicle type belongs to, e.g. { V1: 1, V2: 1, V3: 2 } */
  clusterAssignments: Record<string, number>;
  /** Service level per cluster, e.g. { 1: 0.95, 2: 0.95, 3: 0.95 } */
  clusterServiceLevels: Record<number, number>;
  /** Number of Monte Carlo iterations (default 1000) */
  numSimulations?: number;

  // --- Advanced overrides ---
  /** Full list of vehicles (built-in + custom). If provided, replaces VEHICLES. */
  vehicles?: VehicleDef[];
  /** Full list of functions (built-in + custom). If provided, replaces FUNCTIONS. */
  functions?: FunctionDef[];
  /** Full list of distributions (built-in + custom). If provided, replaces DISTRIBUTIONS. */
  distributions?: DistributionDef[];
  /** Override vehicle lengths by vehicle ID */
  vehicleLengths?: Record<string, number>;
  /** Override delivery days by distribution ID */
  deliveryDays?: Record<string, number>;
  /** Override delivery profiles (merged with defaults) */
  deliveryProfiles?: Record<string, DeliveryProfile>;
  /** Override simulation interval in minutes */
  intervalMinutes?: number;
}

export interface SimulationResult {
  vehicleResults: {
    vehicleId: string;
    vehicleName: string;
    vehicleLength: number;
    /** Expected total arrivals per day (deterministic mean) */
    totalArrivalsPerDay: number;
    /** For each service-level percentage, the peak simultaneous vehicles */
    maxVehiclesPerServiceLevel: Record<number, number>;
    /** Required space in metres at the cluster's service level */
    requiredSpaceM2: number;
    clusterId: number;
  }[];
  clusterResults: {
    clusterId: number;
    serviceLevel: number;
    totalSpaceM2: number;
    vehicleIds: string[];
    /** Aggregate peak vehicles at various service levels */
    maxVehiclesPerServiceLevel: Record<number, number>;
  }[];
  /** Grand total space across all clusters (metres) */
  totalSpaceM2: number;
  /** Peak space needed per time period (aggregated across all vehicle types) */
  peakByPeriod: { period: string; space: number }[];
  /** Service-level curve: space as a function of service level (for graphing) */
  serviceLevelCurve: { serviceLevel: number; space: number }[];
}

// ---------------------------------------------------------------------------
// Internal helper types
// ---------------------------------------------------------------------------

/**
 * One F×D×V combination with its pre-computed arrival probabilities per period
 * and occupancy duration in intervals.
 */
interface ArrivalSpec {
  /** Probability of arrival in a single interval, indexed by period (0-3) */
  kansPerInterval: number[];
  /** How many intervals this vehicle occupies after arrival */
  stayIntervals: number;
}

// ---------------------------------------------------------------------------
// Core simulation
// ---------------------------------------------------------------------------

export function runSimulation(input: SimulationInput): SimulationResult {
  const {
    functionCounts,
    clusterAssignments,
    clusterServiceLevels,
    numSimulations = SIM_PARAMS.numSimulations,
  } = input;

  // --- Merge overrides with defaults ---
  const localVehicles: VehicleDef[] = (input.vehicles ?? VEHICLES).map((v) => ({
    id: v.id,
    name: v.name,
    length: input.vehicleLengths?.[v.id] ?? v.length,
  }));
  const localFunctions: FunctionDef[] = (input.functions ?? FUNCTIONS).map((f) => ({
    id: f.id,
    name: f.name,
    unit: f.unit,
    description: f.description,
  }));
  const localDistributions: DistributionDef[] = (input.distributions ?? DISTRIBUTIONS).map((d) => ({
    id: d.id,
    name: d.name,
    deliveryDays: input.deliveryDays?.[d.id] ?? d.deliveryDays,
  }));
  const localProfiles: Record<string, DeliveryProfile> = {
    ...DELIVERY_PROFILES,
    ...input.deliveryProfiles,
  };
  const intervalMinutes = input.intervalMinutes ?? SIM_PARAMS.intervalMinutes;
  const numVehicles = localVehicles.length;

  // Total intervals in a day: sum of intervals per period
  // Each period has (periodHours * 60 / intervalMinutes) intervals
  const intervalsPerPeriod = PERIODS.map(
    (p) => (p.hours * SIM_PARAMS.minutesPerHour) / intervalMinutes
  );
  const totalIntervals = intervalsPerPeriod.reduce((s, v) => s + v, 0); // 144

  // Build a mapping: period index for each interval in the day (0..143 → 0..3)
  const intervalToPeriod: number[] = [];
  for (let p = 0; p < PERIODS.length; p++) {
    for (let i = 0; i < intervalsPerPeriod[p]; i++) {
      intervalToPeriod.push(p);
    }
  }

  // -----------------------------------------------------------------------
  // Step 1: Pre-compute arrival specs per vehicle type
  // -----------------------------------------------------------------------
  // For each vehicle index (0..5), collect all F×D combinations that produce
  // arrivals for that vehicle type.

  const vehicleArrivalSpecs: ArrivalSpec[][] = localVehicles.map(() => []);
  /** Deterministic expected arrivals per day per vehicle type */
  const expectedArrivalsPerDay: number[] = new Array(numVehicles).fill(0);

  for (const func of localFunctions) {
    const numUnits = functionCounts[func.id] ?? 0;
    if (numUnits === 0) continue;

    for (const dist of localDistributions) {
      const profileKey = `${func.id}_${dist.id}`;
      const profile: DeliveryProfile | undefined = localProfiles[profileKey];
      if (!profile) continue;

      for (let v = 0; v < numVehicles; v++) {
        const stopsPerWeekPerUnit = profile.stopsPerWeekPerUnit[v] ?? 0;
        if (stopsPerWeekPerUnit === 0) continue;

        const periodDist = profile.periodDistribution[v];
        // Check that this vehicle actually has activity in at least one period
        const hasActivity = periodDist.some((d) => d > 0);
        if (!hasActivity) continue;

        const durationMinutes = profile.duration[v];
        const stayIntervals = durationMinutes > 0 ? Math.ceil(durationMinutes / intervalMinutes) : 1;
        // If duration is 0 the vehicle still occupies 1 interval (it "passes through")

        // Compute probability per interval for each period
        // NOTE: The Excel model uses an absolute reference ($F$24) for deliveryDays,
        // always dividing by 6 regardless of distribution type. We match this behavior.
        const kansDeliveryDays = 6;
        const kansPerInterval: number[] = [];
        for (let p = 0; p < PERIODS.length; p++) {
          // kans = (stopsPerWeekPerUnit * numUnits / 6) * periodDist[p] / intervalsInPeriod
          const arrivalsPerDayTotal =
            (stopsPerWeekPerUnit * numUnits) / kansDeliveryDays;
          const kans =
            (arrivalsPerDayTotal * periodDist[p]) / intervalsPerPeriod[p];
          kansPerInterval.push(kans);

          // Accumulate deterministic expected arrivals for reporting
          expectedArrivalsPerDay[v] += arrivalsPerDayTotal * periodDist[p];
        }

        vehicleArrivalSpecs[v].push({ kansPerInterval, stayIntervals });
      }
    }
  }

  // Correct expectedArrivalsPerDay: the inner loop above accumulates across
  // all F×D combos which is what we want — the total expected arrivals per day
  // for this vehicle type. But note we summed across periods already so it is
  // the full-day total. However the loop adds once per F×D per period, and the
  // arrivalsPerDayTotal * periodDist already factors in the period fraction, so
  // the result is correct (sum across all F×D combos and all periods).

  // -----------------------------------------------------------------------
  // Step 2: Run Monte Carlo simulation
  // -----------------------------------------------------------------------

  // For each vehicle type, store the peak simultaneous vehicles per iteration.
  const peakPerIteration: number[][] = localVehicles.map(() => new Array(numSimulations));

  // Pre-compute cluster mapping and vehicle indices per cluster
  const clusterMap = new Map<number, { vehicleIds: string[], vehicleIndices: number[] }>();
  for (let vi = 0; vi < numVehicles; vi++) {
    const veh = localVehicles[vi];
    const cid = clusterAssignments[veh.id] ?? 1;
    if (!clusterMap.has(cid)) clusterMap.set(cid, { vehicleIds: [], vehicleIndices: [] });
    const cluster = clusterMap.get(cid)!;
    cluster.vehicleIds.push(veh.id);
    cluster.vehicleIndices.push(vi);
  }

  // Flat arrays for percentile computation (Excel-matching approach):
  // The Excel computes PERCENTILE.INC over (simulations × intervals) per period,
  // then takes MAX across periods for the final cluster space.
  const clusterPeriodSpace: Map<number, number[][]> = new Map();
  const clusterPeriodVehicles: Map<number, number[][]> = new Map();
  for (const [clusterId] of clusterMap) {
    clusterPeriodSpace.set(clusterId, PERIODS.map(() => []));
    clusterPeriodVehicles.set(clusterId, PERIODS.map(() => []));
  }
  const overallPeriodSpace: number[][] = PERIODS.map(() => []);

  for (let sim = 0; sim < numSimulations; sim++) {
    // Track present vehicles per type at each interval for cluster aggregation
    const vehiclePresentAtInterval: number[][] = localVehicles.map(() => new Array(totalIntervals).fill(0));

    for (let v = 0; v < numVehicles; v++) {
      const specs = vehicleArrivalSpecs[v];
      if (specs.length === 0) {
        peakPerIteration[v][sim] = 0;
        continue;
      }

      const departures = new Array(totalIntervals + 20).fill(0);
      let present = 0;
      let peakVehicles = 0;

      for (let t = 0; t < totalIntervals; t++) {
        const period = intervalToPeriod[t];
        present -= departures[t];

        let arrivals = 0;
        for (let s = 0; s < specs.length; s++) {
          const spec = specs[s];
          const prob = spec.kansPerInterval[period];
          if (prob <= 0) continue;

          if (Math.random() < prob) {
            arrivals++;
            departures[t + spec.stayIntervals] += 1;
          }
        }

        present += arrivals;
        vehiclePresentAtInterval[v][t] = present;

        if (present > peakVehicles) {
          peakVehicles = present;
        }
      }

      peakPerIteration[v][sim] = peakVehicles;
    }

    // Compute per-interval cluster and overall space totals
    for (let t = 0; t < totalIntervals; t++) {
      const period = intervalToPeriod[t];

      for (const [clusterId, { vehicleIndices }] of clusterMap) {
        let space = 0;
        let vehicles = 0;
        for (const vi of vehicleIndices) {
          space += vehiclePresentAtInterval[vi][t] * localVehicles[vi].length;
          vehicles += vehiclePresentAtInterval[vi][t];
        }
        clusterPeriodSpace.get(clusterId)![period].push(space);
        clusterPeriodVehicles.get(clusterId)![period].push(vehicles);
      }

      let overallSpace = 0;
      for (let v = 0; v < numVehicles; v++) {
        overallSpace += vehiclePresentAtInterval[v][t] * localVehicles[v].length;
      }
      overallPeriodSpace[period].push(overallSpace);
    }
  }

  // -----------------------------------------------------------------------
  // Step 3: Analyse results — percentiles per vehicle type
  // -----------------------------------------------------------------------

  // Sort peaks for each vehicle type to enable percentile lookup
  const sortedPeaks: number[][] = peakPerIteration.map((peaks) => {
    const sorted = [...peaks];
    sorted.sort((a, b) => a - b);
    return sorted;
  });

  /**
   * Get the value at a given percentile (service level) from a sorted array.
   * Matches Excel's PERCENTILE.INC which uses linear interpolation:
   *   rank = k * (n - 1)   (0-based)
   *   result = sorted[floor(rank)] + frac * (sorted[ceil(rank)] - sorted[floor(rank)])
   */
  function percentile(sorted: number[], sl: number): number {
    if (sorted.length === 0) return 0;
    if (sorted.length === 1) return sorted[0];
    const rank = sl * (sorted.length - 1);
    const lo = Math.floor(rank);
    const hi = Math.min(lo + 1, sorted.length - 1);
    const frac = rank - lo;
    return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
  }

  // All service levels we want to report on (including those from clusters)
  const allServiceLevels = new Set<number>(SERVICE_LEVELS as unknown as number[]);
  for (const sl of Object.values(clusterServiceLevels)) {
    allServiceLevels.add(sl);
  }
  const serviceLevelsArray = Array.from(allServiceLevels).sort((a, b) => a - b);

  // Build vehicle results
  const vehicleResults: SimulationResult['vehicleResults'] = localVehicles.map((veh, v) => {
    const clusterId = clusterAssignments[veh.id] ?? 1;
    const clusterSL = clusterServiceLevels[clusterId] ?? 0.95;

    const maxVehiclesPerServiceLevel: Record<number, number> = {};
    for (const sl of serviceLevelsArray) {
      maxVehiclesPerServiceLevel[Math.round(sl * 100)] = percentile(sortedPeaks[v], sl);
    }

    const peakAtClusterSL = percentile(sortedPeaks[v], clusterSL);

    return {
      vehicleId: veh.id,
      vehicleName: veh.name,
      vehicleLength: veh.length,
      totalArrivalsPerDay: Math.round(expectedArrivalsPerDay[v] * 100) / 100,
      maxVehiclesPerServiceLevel,
      requiredSpaceM2: peakAtClusterSL * veh.length,
      clusterId,
    };
  });

  // -----------------------------------------------------------------------
  // Step 4: Cluster results
  // -----------------------------------------------------------------------

  // Sort flat arrays for percentile computation
  for (const [, periodArrays] of clusterPeriodSpace) {
    for (const arr of periodArrays) arr.sort((a, b) => a - b);
  }
  for (const [, periodArrays] of clusterPeriodVehicles) {
    for (const arr of periodArrays) arr.sort((a, b) => a - b);
  }
  for (const arr of overallPeriodSpace) arr.sort((a, b) => a - b);

  // Cluster results: Excel uses PERCENTILE.INC over (simulations × intervals)
  // per period, then takes MAX across periods for the final cluster space.
  const clusterResults: SimulationResult['clusterResults'] = [];

  for (const [clusterId, { vehicleIds }] of Array.from(clusterMap.entries())) {
    const sl = clusterServiceLevels[clusterId] ?? 0.95;
    const periodSpaceArrays = clusterPeriodSpace.get(clusterId)!;
    const periodVehicleArrays = clusterPeriodVehicles.get(clusterId)!;

    // For each service level, compute max across periods
    const maxVehiclesPerServiceLevel: Record<number, number> = {};
    for (const s of serviceLevelsArray) {
      let maxVehicles = 0;
      for (let p = 0; p < PERIODS.length; p++) {
        const val = percentile(periodVehicleArrays[p], s);
        if (val > maxVehicles) maxVehicles = val;
      }
      maxVehiclesPerServiceLevel[Math.round(s * 100)] = maxVehicles;
    }

    // Total space at the cluster's service level: max across periods
    let clusterSpace = 0;
    for (let p = 0; p < PERIODS.length; p++) {
      const space = percentile(periodSpaceArrays[p], sl);
      if (space > clusterSpace) clusterSpace = space;
    }

    clusterResults.push({
      clusterId,
      serviceLevel: sl,
      totalSpaceM2: clusterSpace,
      vehicleIds,
      maxVehiclesPerServiceLevel,
    });
  }

  // Sort clusters by ID for consistent output
  clusterResults.sort((a, b) => a.clusterId - b.clusterId);

  // -----------------------------------------------------------------------
  // Step 5: Total space
  // -----------------------------------------------------------------------

  const totalSpaceM2 = clusterResults.reduce((sum, c) => sum + c.totalSpaceM2, 0);

  // -----------------------------------------------------------------------
  // Step 6: Peak by period (for the chart)
  // -----------------------------------------------------------------------

  // Peak by period: use PERCENTILE over flat (simulations × intervals) values
  const peakByPeriod = PERIODS.map((p, i) => ({
    period: p.name,
    space: percentile(overallPeriodSpace[i], 0.95),
  }));

  // -----------------------------------------------------------------------
  // Step 7: Service level curve (for graphing)
  // -----------------------------------------------------------------------

  // Service level curve: for each SL, compute total space = sum of per-cluster spaces.
  // Each cluster's space = max over periods of PERCENTILE over flat interval values.
  const serviceLevelCurve: { serviceLevel: number; space: number }[] = [];
  for (let pct = 50; pct <= 100; pct++) {
    const sl = pct / 100;
    let totalSpace = 0;
    for (const [clusterId] of clusterMap) {
      const periodArrays = clusterPeriodSpace.get(clusterId)!;
      let maxPeriodSpace = 0;
      for (let p = 0; p < PERIODS.length; p++) {
        const space = percentile(periodArrays[p], sl);
        if (space > maxPeriodSpace) maxPeriodSpace = space;
      }
      totalSpace += maxPeriodSpace;
    }
    serviceLevelCurve.push({
      serviceLevel: sl,
      space: totalSpace,
    });
  }

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    vehicleResults,
    clusterResults,
    totalSpaceM2,
    peakByPeriod,
    serviceLevelCurve,
  };
}
