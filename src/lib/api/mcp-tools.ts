import {
  VEHICLES,
  FUNCTIONS,
  DISTRIBUTIONS,
  PERIODS,
  SIM_PARAMS,
  SERVICE_LEVELS,
  DEFAULT_CLUSTERS,
  DEFAULT_CLUSTER_SERVICE_LEVELS,
  DEFAULT_BVO_PER_UNIT,
  DELIVERY_PROFILES,
  LOADING_BAY_WIDTH_M,
} from '@/lib/model-data';
import { runSimulation } from '@/lib/simulation';
import { parseSimulationInput, ValidationError } from '@/lib/api/validate';
import { buildSummary } from '@/lib/api/summary';

/**
 * MCP tool definitions + handlers for the Ruimtemodel Stadslogistiek.
 *
 * Each tool entry supplies the schema used by `tools/list` and a handler
 * used by `tools/call`. Handlers may throw — the caller wraps thrown
 * errors into MCP `isError` responses.
 */

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => unknown;
}

const simulationInputSchema = {
  type: 'object',
  description:
    'Either functionCounts, functionBvoM2, or both must be provided. A single function may not appear in both objects.',
  properties: {
    functionCounts: {
      type: 'object',
      description:
        'Number of units per function ID (e.g. {"F1": 362, "F2": 2}). Function IDs are F1..F12 — see list_functions.',
      additionalProperties: { type: 'number', minimum: 0 },
    },
    functionBvoM2: {
      type: 'object',
      description:
        'Alternative to functionCounts: BVO (gross floor area) in m² per function. Converted to unit counts via bvoPerUnit (defaults to DEFAULT_BVO_PER_UNIT).',
      additionalProperties: { type: 'number', minimum: 0 },
    },
    bvoPerUnit: {
      type: 'object',
      description:
        'Optional. m² BVO per unit for BVO→units conversion. Defaults to DEFAULT_BVO_PER_UNIT (see get_model_info).',
      additionalProperties: { type: 'number', minimum: 0.01 },
    },
    clusterAssignments: {
      type: 'object',
      description:
        'Optional. Maps vehicle ID (V1..V6) to cluster ID (integer >= 1). Defaults to DEFAULT_CLUSTERS from get_model_info.',
      additionalProperties: { type: 'integer', minimum: 1 },
    },
    clusterServiceLevels: {
      type: 'object',
      description:
        'Optional. Maps cluster ID to service level in [0.5, 1.0]. Defaults to 0.95 per cluster.',
      additionalProperties: { type: 'number', minimum: 0.5, maximum: 1 },
    },
    numSimulations: {
      type: 'integer',
      description: 'Optional. Number of Monte Carlo iterations (default 2500, max 5000).',
      minimum: 1,
      maximum: 5000,
    },
  },
  additionalProperties: true,
} as const;

export const MCP_TOOLS: McpTool[] = [
  {
    name: 'get_model_info',
    description:
      'Get all model metadata at once: vehicles, functions, distributions, periods, service levels, default cluster assignments, simulation parameters, and default BVO-per-unit values for BVO→count conversion.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => ({
      vehicles: VEHICLES,
      functions: FUNCTIONS,
      distributions: DISTRIBUTIONS,
      periods: PERIODS,
      serviceLevels: SERVICE_LEVELS,
      defaultClusters: DEFAULT_CLUSTERS,
      defaultClusterServiceLevels: DEFAULT_CLUSTER_SERVICE_LEVELS,
      defaultBvoPerUnit: DEFAULT_BVO_PER_UNIT,
      simParams: SIM_PARAMS,
      loadingBayWidthM: LOADING_BAY_WIDTH_M,
    }),
  },
  {
    name: 'list_vehicles',
    description:
      'List the 6 vehicle types used in the model (V1..V6): fietskoerier, LEVV, bestelwagen, vrachtwagen N2, vrachtwagen N3, service bestelwagen. Each has an id, name, and length in meters.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => ({ vehicles: VEHICLES }),
  },
  {
    name: 'list_functions',
    description:
      'List the 12 urban function types (F1..F12): woningen, supermarkt, retail food, retail keten/onafh., restaurant high/basis, café, hotel, kantoor klein/middel/groot. Each has an id, name, unit, and description.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => ({ functions: FUNCTIONS }),
  },
  {
    name: 'list_distributions',
    description:
      'List the 15 distribution types (delivery profiles) D1..D15: afval, bouw, facilitair, horeca, pakket, retail, service, specialisten, supermarkt, thuisbezorging, verhuizing.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    handler: () => ({ distributions: DISTRIBUTIONS }),
  },
  {
    name: 'get_delivery_profile',
    description:
      'Get a single delivery profile by function and distribution ID. Returns stopsPerWeekPerUnit, duration, and periodDistribution for each of the 6 vehicle types, or an error if the combination has no profile.',
    inputSchema: {
      type: 'object',
      required: ['functionId', 'distributionId'],
      properties: {
        functionId: { type: 'string', description: 'Function ID like F1' },
        distributionId: { type: 'string', description: 'Distribution ID like D7' },
      },
      additionalProperties: false,
    },
    handler: (args) => {
      const fid = args.functionId;
      const did = args.distributionId;
      if (typeof fid !== 'string' || typeof did !== 'string') {
        throw new Error('functionId and distributionId must be strings');
      }
      const key = `${fid}_${did}`;
      const profile = DELIVERY_PROFILES[key];
      if (!profile) {
        throw new Error(`No delivery profile for ${key}`);
      }
      return { key, profile };
    },
  },
  {
    name: 'run_simulation',
    description:
      'Run the Monte Carlo simulation for urban logistics loading/unloading space. Supply counts of each function type (functionCounts) and/or BVO in m² (functionBvoM2); 2500 iterations by default. Returns a labeled summary (total length in meters, total area in m²) plus the full SimulationResult.',
    inputSchema: simulationInputSchema,
    handler: (args) => {
      let parsed;
      try {
        parsed = parseSimulationInput(args);
      } catch (err) {
        if (err instanceof ValidationError) {
          throw new Error(err.message);
        }
        throw err;
      }
      const startedAt = Date.now();
      const result = runSimulation(parsed.input);
      return {
        summary: buildSummary(result),
        result,
        meta: {
          numSimulations: parsed.input.numSimulations ?? SIM_PARAMS.numSimulations,
          inputCounts: parsed.resolvedCounts,
          durationMs: Date.now() - startedAt,
        },
      };
    },
  },
];

export const MCP_TOOLS_BY_NAME: Record<string, McpTool> = Object.fromEntries(
  MCP_TOOLS.map((t) => [t.name, t]),
);
