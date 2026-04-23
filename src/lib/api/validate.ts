import type { SimulationInput } from '@/lib/simulation';
import {
  VEHICLES,
  FUNCTIONS,
  DEFAULT_CLUSTERS,
  DEFAULT_CLUSTER_SERVICE_LEVELS,
  DEFAULT_BVO_PER_UNIT,
} from '@/lib/model-data';

export const MAX_NUM_SIMULATIONS = 5000;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Return value of parseSimulationInput — includes the simulation input plus
 * diagnostic info about how the input was normalized (e.g. BVO → counts).
 */
export interface ParsedSimulationInput {
  input: SimulationInput;
  /** Function counts after any BVO→units conversion. Matches input.functionCounts. */
  resolvedCounts: Record<string, number>;
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function assertNumberRecord(
  value: unknown,
  field: string,
  { min = -Infinity, max = Infinity }: { min?: number; max?: number } = {},
): Record<string, number> {
  if (!isPlainObject(value)) {
    throw new ValidationError(`${field} must be an object mapping IDs to numbers`);
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
      throw new ValidationError(`${field}.${k} must be a finite number`);
    }
    if (v < min || v > max) {
      throw new ValidationError(`${field}.${k} must be between ${min} and ${max}`);
    }
    out[k] = v;
  }
  return out;
}

/**
 * Parse + validate a raw JSON body into a SimulationInput.
 * Throws ValidationError with a user-friendly message on invalid input.
 *
 * Accepts either `functionCounts` (number of units per function), or
 * `functionBvoM2` (BVO in m² per function), or both — but a single function
 * may not appear in both. BVO values are converted to unit counts using
 * `bvoPerUnit[funcId]` if supplied, otherwise `DEFAULT_BVO_PER_UNIT[funcId]`.
 */
export function parseSimulationInput(raw: unknown): ParsedSimulationInput {
  if (!isPlainObject(raw)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const hasCounts = 'functionCounts' in raw && raw.functionCounts !== undefined;
  const hasBvo = 'functionBvoM2' in raw && raw.functionBvoM2 !== undefined;
  if (!hasCounts && !hasBvo) {
    throw new ValidationError('At least one of functionCounts or functionBvoM2 is required');
  }

  const countsFromInput = hasCounts
    ? assertNumberRecord(raw.functionCounts, 'functionCounts', { min: 0 })
    : {};
  const bvoInput = hasBvo
    ? assertNumberRecord(raw.functionBvoM2, 'functionBvoM2', { min: 0 })
    : {};

  // Per-unit BVO overrides (optional). Start with defaults, layer overrides.
  const bvoPerUnit: Record<string, number> = { ...DEFAULT_BVO_PER_UNIT };
  if ('bvoPerUnit' in raw && raw.bvoPerUnit !== undefined) {
    const overrides = assertNumberRecord(raw.bvoPerUnit, 'bvoPerUnit', { min: 0.01 });
    Object.assign(bvoPerUnit, overrides);
  }

  const knownFunctionIds = new Set([
    ...FUNCTIONS.map((f) => f.id),
    ...(Array.isArray(raw.functions) ? (raw.functions as Array<{ id?: string }>).map((f) => f?.id).filter((x): x is string => typeof x === 'string') : []),
  ]);
  for (const id of Object.keys(countsFromInput)) {
    if (!knownFunctionIds.has(id)) {
      throw new ValidationError(
        `functionCounts contains unknown function ID "${id}". Pass a custom functions[] array to use non-standard IDs.`,
      );
    }
  }
  for (const id of Object.keys(bvoInput)) {
    if (!knownFunctionIds.has(id)) {
      throw new ValidationError(
        `functionBvoM2 contains unknown function ID "${id}". Pass a custom functions[] array to use non-standard IDs.`,
      );
    }
    if (id in countsFromInput) {
      throw new ValidationError(
        `Function "${id}" appears in both functionCounts and functionBvoM2. Choose one input mode per function.`,
      );
    }
    if (!(id in bvoPerUnit) || bvoPerUnit[id] <= 0) {
      throw new ValidationError(
        `No bvoPerUnit available for "${id}". Supply bvoPerUnit.${id} explicitly when converting BVO for custom functions.`,
      );
    }
  }

  // Convert BVO → units, round to nearest whole unit.
  const functionCounts: Record<string, number> = { ...countsFromInput };
  for (const [id, bvo] of Object.entries(bvoInput)) {
    functionCounts[id] = Math.round(bvo / bvoPerUnit[id]);
  }

  // clusterAssignments: optional, defaults to DEFAULT_CLUSTERS
  let clusterAssignments: Record<string, number>;
  if ('clusterAssignments' in raw && raw.clusterAssignments !== undefined) {
    clusterAssignments = assertNumberRecord(raw.clusterAssignments, 'clusterAssignments', {
      min: 1,
      max: 100,
    });
    // Ensure integers
    for (const [k, v] of Object.entries(clusterAssignments)) {
      if (!Number.isInteger(v)) {
        throw new ValidationError(`clusterAssignments.${k} must be an integer cluster ID`);
      }
    }
  } else {
    clusterAssignments = { ...DEFAULT_CLUSTERS };
  }

  // Ensure every vehicle is assigned to a cluster
  const knownVehicleIds = new Set([
    ...VEHICLES.map((v) => v.id),
    ...(Array.isArray(raw.vehicles) ? (raw.vehicles as Array<{ id?: string }>).map((v) => v?.id).filter((x): x is string => typeof x === 'string') : []),
  ]);
  for (const vid of knownVehicleIds) {
    if (!(vid in clusterAssignments)) {
      clusterAssignments[vid] = DEFAULT_CLUSTERS[vid] ?? 1;
    }
  }

  // clusterServiceLevels: optional, defaults to DEFAULT_CLUSTER_SERVICE_LEVELS
  let clusterServiceLevels: Record<number, number>;
  if ('clusterServiceLevels' in raw && raw.clusterServiceLevels !== undefined) {
    const parsed = assertNumberRecord(raw.clusterServiceLevels, 'clusterServiceLevels', {
      min: 0.5,
      max: 1,
    });
    clusterServiceLevels = {};
    for (const [k, v] of Object.entries(parsed)) {
      const clusterId = Number(k);
      if (!Number.isInteger(clusterId)) {
        throw new ValidationError(`clusterServiceLevels keys must be integer cluster IDs (got "${k}")`);
      }
      clusterServiceLevels[clusterId] = v;
    }
  } else {
    clusterServiceLevels = { ...DEFAULT_CLUSTER_SERVICE_LEVELS };
  }

  // numSimulations: optional, capped
  let numSimulations: number | undefined;
  if ('numSimulations' in raw && raw.numSimulations !== undefined) {
    if (typeof raw.numSimulations !== 'number' || !Number.isInteger(raw.numSimulations)) {
      throw new ValidationError('numSimulations must be an integer');
    }
    if (raw.numSimulations < 1) {
      throw new ValidationError('numSimulations must be >= 1');
    }
    if (raw.numSimulations > MAX_NUM_SIMULATIONS) {
      throw new ValidationError(
        `numSimulations must be <= ${MAX_NUM_SIMULATIONS} (got ${raw.numSimulations})`,
      );
    }
    numSimulations = raw.numSimulations;
  }

  // Advanced overrides — passed through with shallow validation
  const input: SimulationInput = {
    functionCounts,
    clusterAssignments,
    clusterServiceLevels,
    ...(numSimulations !== undefined && { numSimulations }),
  };

  if (Array.isArray(raw.vehicles)) {
    for (const v of raw.vehicles as unknown[]) {
      if (!isPlainObject(v) || typeof v.id !== 'string' || typeof v.name !== 'string' || typeof v.length !== 'number') {
        throw new ValidationError('vehicles[] entries must have {id: string, name: string, length: number}');
      }
    }
    input.vehicles = raw.vehicles as SimulationInput['vehicles'];
  }
  if (Array.isArray(raw.functions)) {
    for (const f of raw.functions as unknown[]) {
      if (!isPlainObject(f) || typeof f.id !== 'string' || typeof f.name !== 'string' || typeof f.unit !== 'string') {
        throw new ValidationError('functions[] entries must have {id, name, unit, description}');
      }
    }
    input.functions = raw.functions as SimulationInput['functions'];
  }
  if (Array.isArray(raw.distributions)) {
    for (const d of raw.distributions as unknown[]) {
      if (!isPlainObject(d) || typeof d.id !== 'string' || typeof d.name !== 'string' || typeof d.deliveryDays !== 'number') {
        throw new ValidationError('distributions[] entries must have {id, name, deliveryDays}');
      }
    }
    input.distributions = raw.distributions as SimulationInput['distributions'];
  }
  if ('vehicleLengths' in raw && raw.vehicleLengths !== undefined) {
    input.vehicleLengths = assertNumberRecord(raw.vehicleLengths, 'vehicleLengths', { min: 0, max: 100 });
  }
  if ('deliveryDays' in raw && raw.deliveryDays !== undefined) {
    input.deliveryDays = assertNumberRecord(raw.deliveryDays, 'deliveryDays', { min: 1, max: 7 });
  }
  if ('deliveryProfiles' in raw && raw.deliveryProfiles !== undefined) {
    if (!isPlainObject(raw.deliveryProfiles)) {
      throw new ValidationError('deliveryProfiles must be an object');
    }
    input.deliveryProfiles = raw.deliveryProfiles as SimulationInput['deliveryProfiles'];
  }
  if ('intervalMinutes' in raw && raw.intervalMinutes !== undefined) {
    if (typeof raw.intervalMinutes !== 'number' || raw.intervalMinutes <= 0 || raw.intervalMinutes > 60) {
      throw new ValidationError('intervalMinutes must be a number in (0, 60]');
    }
    input.intervalMinutes = raw.intervalMinutes;
  }

  return { input, resolvedCounts: functionCounts };
}
