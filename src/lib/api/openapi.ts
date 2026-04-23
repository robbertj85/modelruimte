import { MAX_NUM_SIMULATIONS } from './validate';

/**
 * OpenAPI 3.0.3 specification for the Ruimtemodel Stadslogistiek REST API.
 *
 * This is the source of truth — served at /api/v1/openapi.json and rendered
 * at /api-docs via ReDoc. Any schema change should land here.
 */
export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Ruimtemodel Stadslogistiek API',
    version: '1.0.0',
    description: [
      'JSON REST API for the Ruimtemodel Stadslogistiek (Urban Logistics Space Model).',
      '',
      'The model is a Monte Carlo simulation that estimates the loading/unloading',
      "space required by a mix of urban functions. It replicates the logic of Rebel Group's",
      'original Excel workbook.',
      '',
      '## Quick start',
      '',
      '```bash',
      'curl -X POST https://your-host/api/v1/simulate \\',
      "  -H 'Content-Type: application/json' \\",
      '  -d \'{"functionCounts": {"F1": 362, "F2": 2}, "numSimulations": 1000}\'',
      '```',
      '',
      '## IDs',
      '',
      '- **Vehicles** — `V1`..`V6`. Fetch `/api/v1/model/vehicles`.',
      '- **Functions** — `F1`..`F12`. Fetch `/api/v1/model/functions`.',
      '- **Distributions** — `D1`..`D15`. Fetch `/api/v1/model/distributions`.',
      '',
      '## No authentication',
      '',
      'The API is read-only or bounded (simulation capped at ' + MAX_NUM_SIMULATIONS + ' Monte Carlo iterations).',
      'CORS is permissive so browser clients from any origin may call it.',
      '',
      'For AI agents, an [MCP server](https://modelcontextprotocol.io/) is also available at `/api/mcp`.',
      '',
      '## Contact',
      '',
      '- Rebel: [info@Rebelgroup.com](mailto:info@Rebelgroup.com)',
      '- DMI: [dmiteam@minienw.nl](mailto:dmiteam@minienw.nl)',
    ].join('\n'),
    contact: {
      name: 'Ruimtemodel team',
      email: 'info@Rebelgroup.com',
    },
    license: {
      name: 'EUPL-1.2',
      url: 'https://eupl.eu/1.2/en/',
    },
    'x-logo': {
      url: '/dmi-logo.png',
      altText: 'DMI Ecosysteem',
      href: '/',
    },
  },
  servers: [
    { url: '/', description: 'Current host' },
  ],
  security: [],
  tags: [
    { name: 'System', description: 'Liveness and service metadata.' },
    { name: 'Model', description: 'Static catalog of vehicles, functions, distributions, and delivery profiles.' },
    { name: 'Simulation', description: 'Run the Monte Carlo simulation.' },
  ],
  paths: {
    '/api/v1/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Liveness probe. Returns a tiny JSON object with service metadata.',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Health' },
                example: {
                  status: 'ok',
                  service: 'ruimtemodel-api',
                  version: '1.0.0',
                  timestamp: '2026-04-23T11:44:56.542Z',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/model': {
      get: {
        tags: ['Model'],
        summary: 'Full model catalog',
        description:
          'Return vehicles, functions, distributions, periods, service levels, default cluster assignments, simulation parameters, and all delivery profiles in a single payload.',
        operationId: 'getModel',
        responses: {
          '200': {
            description: 'Full model catalog.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ModelCatalog' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/model/vehicles': {
      get: {
        tags: ['Model'],
        summary: 'List vehicles',
        description: 'Return the six vehicle types, each with its ID, name, and length in meters.',
        operationId: 'getVehicles',
        responses: {
          '200': {
            description: 'List of vehicles.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['vehicles'],
                  properties: {
                    vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/model/functions': {
      get: {
        tags: ['Model'],
        summary: 'List functions',
        description: 'Return the twelve urban function types.',
        operationId: 'getFunctions',
        responses: {
          '200': {
            description: 'List of functions.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['functions'],
                  properties: {
                    functions: { type: 'array', items: { $ref: '#/components/schemas/Function' } },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/model/distributions': {
      get: {
        tags: ['Model'],
        summary: 'List distributions',
        description: 'Return the fifteen distribution types (delivery profiles).',
        operationId: 'getDistributions',
        responses: {
          '200': {
            description: 'List of distributions.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['distributions'],
                  properties: {
                    distributions: { type: 'array', items: { $ref: '#/components/schemas/Distribution' } },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/v1/model/profiles': {
      get: {
        tags: ['Model'],
        summary: 'List delivery profiles',
        description: [
          'Return delivery profiles. Profiles encode stops-per-week-per-unit, stop duration, and period distribution per vehicle type.',
          '',
          '- Without parameters: every profile keyed by `"{functionId}_{distributionId}"`.',
          '- With a single filter (`function` *or* `distribution`): the filtered subset.',
          '- With both filters: a single profile returned as `{ key, profile }`.',
        ].join('\n'),
        operationId: 'getProfiles',
        parameters: [
          {
            name: 'function',
            in: 'query',
            required: false,
            description: 'Filter by function ID (e.g. `F1`).',
            schema: { type: 'string', pattern: '^F[0-9]+$' },
          },
          {
            name: 'distribution',
            in: 'query',
            required: false,
            description: 'Filter by distribution ID (e.g. `D7`).',
            schema: { type: 'string', pattern: '^D[0-9]+$' },
          },
        ],
        responses: {
          '200': {
            description: 'Delivery profiles.',
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      type: 'object',
                      required: ['profiles'],
                      properties: {
                        profiles: {
                          type: 'object',
                          additionalProperties: { $ref: '#/components/schemas/DeliveryProfile' },
                        },
                      },
                    },
                    {
                      type: 'object',
                      required: ['key', 'profile'],
                      properties: {
                        key: { type: 'string', example: 'F1_D7' },
                        profile: { $ref: '#/components/schemas/DeliveryProfile' },
                      },
                    },
                  ],
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
          '404': {
            description: 'No profile for the requested function+distribution pair.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Error' } },
            },
          },
        },
      },
    },
    '/api/v1/simulate': {
      post: {
        tags: ['Simulation'],
        summary: 'Run Monte Carlo simulation',
        description: [
          'Run the Monte Carlo simulation for a given set of function counts.',
          '',
          'At minimum, supply `functionCounts` — the number of units per function ID.',
          'All other fields fall back to sensible defaults pulled from the model catalog.',
          '',
          '`numSimulations` is capped at **' + MAX_NUM_SIMULATIONS + '** to bound response time.',
        ].join('\n'),
        operationId: 'runSimulation',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SimulationInput' },
              examples: {
                units: {
                  summary: 'Units input',
                  value: { functionCounts: { F1: 362, F2: 2, F10: 5 } },
                },
                bvo: {
                  summary: 'BVO (m²) input',
                  value: { functionBvoM2: { F1: 32580, F10: 6250 } },
                },
                mixed: {
                  summary: 'Mixed units + BVO',
                  value: {
                    functionCounts: { F2: 2 },
                    functionBvoM2: { F1: 32580, F10: 6250 },
                  },
                },
                withOverrides: {
                  summary: 'With cluster + sim overrides',
                  value: {
                    functionCounts: { F1: 500 },
                    clusterAssignments: { V1: 1, V2: 1, V3: 2, V4: 2, V5: 2, V6: 3 },
                    clusterServiceLevels: { '1': 0.95, '2': 0.9, '3': 0.75 },
                    numSimulations: 1000,
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Simulation result.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SimulationResponse' },
              },
            },
          },
          '400': { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
  },
  components: {
    responses: {
      BadRequest: {
        description: 'Invalid request.',
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/Error' } },
        },
      },
    },
    schemas: {
      Health: {
        type: 'object',
        required: ['status', 'service', 'version', 'timestamp'],
        properties: {
          status: { type: 'string', enum: ['ok'] },
          service: { type: 'string' },
          version: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string', description: 'Human-readable error message.' },
        },
      },
      Vehicle: {
        type: 'object',
        required: ['id', 'name', 'length'],
        properties: {
          id: { type: 'string', example: 'V1', description: 'Vehicle ID (V1..V6).' },
          name: { type: 'string', example: 'Fiets, cargobike, scooter' },
          length: { type: 'number', example: 2, description: 'Vehicle length in meters.' },
        },
      },
      Function: {
        type: 'object',
        required: ['id', 'name', 'unit', 'description'],
        properties: {
          id: { type: 'string', example: 'F1', description: 'Function ID (F1..F12).' },
          name: { type: 'string', example: 'Woningen' },
          unit: { type: 'string', example: 'woningen' },
          description: { type: 'string' },
        },
      },
      Distribution: {
        type: 'object',
        required: ['id', 'name', 'deliveryDays'],
        properties: {
          id: { type: 'string', example: 'D7', description: 'Distribution ID (D1..D15).' },
          name: { type: 'string', example: 'Pakket' },
          deliveryDays: { type: 'integer', example: 6, description: 'Delivery days per week.' },
        },
      },
      Period: {
        type: 'object',
        required: ['id', 'name', 'hours'],
        properties: {
          id: { type: 'string', example: 'P1' },
          name: { type: 'string', example: '0:00 - 6:00' },
          hours: { type: 'integer', example: 6 },
        },
      },
      DeliveryProfile: {
        type: 'object',
        description:
          'Delivery profile for one (function, distribution) pair. Each array has six entries corresponding to vehicles V1..V6.',
        required: ['stopsPerWeekPerUnit', 'duration', 'periodDistribution'],
        properties: {
          stopsPerWeekPerUnit: {
            type: 'array',
            description: 'Stops per week per unit, per vehicle type.',
            minItems: 6,
            maxItems: 6,
            items: { type: 'number' },
          },
          duration: {
            type: 'array',
            description: 'Stop duration in minutes, per vehicle type.',
            minItems: 6,
            maxItems: 6,
            items: { type: 'number' },
          },
          periodDistribution: {
            type: 'array',
            description:
              'For each vehicle (V1..V6), a 4-element array giving the fraction of arrivals in periods P1..P4.',
            minItems: 6,
            maxItems: 6,
            items: {
              type: 'array',
              minItems: 4,
              maxItems: 4,
              items: { type: 'number' },
            },
          },
        },
      },
      SimParams: {
        type: 'object',
        required: ['intervalMinutes', 'minutesPerHour', 'hoursPerDay', 'numSimulations'],
        properties: {
          intervalMinutes: { type: 'integer', example: 10 },
          minutesPerHour: { type: 'integer', example: 60 },
          hoursPerDay: { type: 'integer', example: 24 },
          numSimulations: { type: 'integer', example: 2500 },
        },
      },
      ModelCatalog: {
        type: 'object',
        required: [
          'vehicles',
          'functions',
          'distributions',
          'periods',
          'serviceLevels',
          'defaultClusters',
          'defaultClusterServiceLevels',
          'simParams',
          'loadingBayWidthM',
          'deliveryProfiles',
        ],
        properties: {
          vehicles: { type: 'array', items: { $ref: '#/components/schemas/Vehicle' } },
          functions: { type: 'array', items: { $ref: '#/components/schemas/Function' } },
          distributions: { type: 'array', items: { $ref: '#/components/schemas/Distribution' } },
          periods: { type: 'array', items: { $ref: '#/components/schemas/Period' } },
          serviceLevels: { type: 'array', items: { type: 'number' } },
          defaultClusters: {
            type: 'object',
            additionalProperties: { type: 'integer' },
            description: 'Mapping of vehicle ID to default cluster ID.',
          },
          defaultClusterServiceLevels: {
            type: 'object',
            additionalProperties: { type: 'number' },
            description: 'Mapping of cluster ID (as string key) to default service level.',
          },
          defaultBvoPerUnit: {
            type: 'object',
            additionalProperties: { type: 'number' },
            description:
              'Indicative gemiddelde BVO in m² per unit per function, used for BVO→units conversion when callers submit `functionBvoM2`.',
            example: { F1: 90, F2: 1500, F10: 1250 },
          },
          simParams: { $ref: '#/components/schemas/SimParams' },
          loadingBayWidthM: { type: 'number', example: 3 },
          deliveryProfiles: {
            type: 'object',
            additionalProperties: { $ref: '#/components/schemas/DeliveryProfile' },
          },
        },
      },
      SimulationInput: {
        type: 'object',
        description:
          'Either `functionCounts`, `functionBvoM2`, or both must be supplied. A single function may not appear in both. All other fields fall back to model defaults.',
        properties: {
          functionCounts: {
            type: 'object',
            description: 'Number of units per function ID (F1..F12).',
            additionalProperties: { type: 'number', minimum: 0 },
            example: { F1: 362, F2: 2, F10: 5 },
          },
          functionBvoM2: {
            type: 'object',
            description:
              'Alternative to `functionCounts`: BVO (gross floor area) in m² per function. Converted to unit counts via `bvoPerUnit`.',
            additionalProperties: { type: 'number', minimum: 0 },
            example: { F1: 32580, F10: 6250 },
          },
          bvoPerUnit: {
            type: 'object',
            description:
              'Optional. m² BVO per unit, used for BVO→units conversion. Defaults are available from `/api/v1/model` (`defaultClusters` sibling key).',
            additionalProperties: { type: 'number', minimum: 0.01 },
          },
          clusterAssignments: {
            type: 'object',
            description: 'Optional. Vehicle ID → cluster ID. Defaults to DEFAULT_CLUSTERS.',
            additionalProperties: { type: 'integer', minimum: 1 },
          },
          clusterServiceLevels: {
            type: 'object',
            description: 'Optional. Cluster ID (as string key) → service level in [0.5, 1.0]. Defaults to 0.95 per cluster.',
            additionalProperties: { type: 'number', minimum: 0.5, maximum: 1 },
          },
          numSimulations: {
            type: 'integer',
            description: 'Optional. Number of Monte Carlo iterations. Default 2500.',
            minimum: 1,
            maximum: MAX_NUM_SIMULATIONS,
          },
          vehicles: {
            type: 'array',
            description: 'Optional. Override the built-in vehicle list.',
            items: { $ref: '#/components/schemas/Vehicle' },
          },
          functions: {
            type: 'array',
            description: 'Optional. Override the built-in function list.',
            items: { $ref: '#/components/schemas/Function' },
          },
          distributions: {
            type: 'array',
            description: 'Optional. Override the built-in distribution list.',
            items: { $ref: '#/components/schemas/Distribution' },
          },
          vehicleLengths: {
            type: 'object',
            description: 'Optional. Override vehicle length (m) by vehicle ID.',
            additionalProperties: { type: 'number', minimum: 0 },
          },
          deliveryDays: {
            type: 'object',
            description: 'Optional. Override delivery days by distribution ID.',
            additionalProperties: { type: 'integer', minimum: 1, maximum: 7 },
          },
          deliveryProfiles: {
            type: 'object',
            description: 'Optional. Override/merge delivery profiles by key (e.g. "F1_D7").',
            additionalProperties: { $ref: '#/components/schemas/DeliveryProfile' },
          },
          intervalMinutes: {
            type: 'number',
            description: 'Optional. Override simulation interval in minutes (0 < x <= 60).',
            minimum: 0,
            exclusiveMinimum: true,
            maximum: 60,
          },
        },
      },
      VehicleResult: {
        type: 'object',
        required: [
          'vehicleId',
          'vehicleName',
          'vehicleLength',
          'totalArrivalsPerDay',
          'maxVehiclesPerServiceLevel',
          'requiredSpaceM2',
          'clusterId',
        ],
        properties: {
          vehicleId: { type: 'string' },
          vehicleName: { type: 'string' },
          vehicleLength: { type: 'number' },
          totalArrivalsPerDay: { type: 'number' },
          maxVehiclesPerServiceLevel: {
            type: 'object',
            description: 'Peak simultaneous vehicles at each service level (as integer percent key).',
            additionalProperties: { type: 'number' },
          },
          requiredSpaceM2: { type: 'number' },
          clusterId: { type: 'integer' },
        },
      },
      ClusterResult: {
        type: 'object',
        required: ['clusterId', 'serviceLevel', 'totalSpaceM2', 'vehicleIds', 'maxVehiclesPerServiceLevel'],
        properties: {
          clusterId: { type: 'integer' },
          serviceLevel: { type: 'number' },
          totalSpaceM2: { type: 'number' },
          vehicleIds: { type: 'array', items: { type: 'string' } },
          maxVehiclesPerServiceLevel: {
            type: 'object',
            additionalProperties: { type: 'number' },
          },
        },
      },
      SimulationResult: {
        type: 'object',
        description:
          'Raw simulation output. Legacy field names `totalSpaceM2` and `requiredSpaceM2` actually hold **length in meters**, not area — multiply by `loadingBayWidthM` for m². Prefer the top-level `summary` in the response for clearly-labeled values.',
        required: ['vehicleResults', 'clusterResults', 'totalSpaceM2', 'peakByPeriod', 'serviceLevelCurve'],
        properties: {
          vehicleResults: { type: 'array', items: { $ref: '#/components/schemas/VehicleResult' } },
          clusterResults: { type: 'array', items: { $ref: '#/components/schemas/ClusterResult' } },
          totalSpaceM2: {
            type: 'number',
            description: 'Total required length in meters. Misleading legacy name — not actually m².',
          },
          peakByPeriod: {
            type: 'array',
            items: {
              type: 'object',
              required: ['period', 'space'],
              properties: {
                period: { type: 'string' },
                space: { type: 'number', description: 'Required length in meters during this period.' },
              },
            },
          },
          serviceLevelCurve: {
            type: 'array',
            items: {
              type: 'object',
              required: ['serviceLevel', 'space'],
              properties: {
                serviceLevel: { type: 'number' },
                space: { type: 'number', description: 'Required length in meters at this service level.' },
              },
            },
          },
        },
      },
      SimulationSummary: {
        type: 'object',
        description:
          'Clearly-labeled summary of the simulation result. Lengths are in meters; areas are in m² (= length × loadingBayWidthM).',
        required: ['loadingBayWidthM', 'totalLengthM', 'totalAreaM2', 'vehicles', 'clusters'],
        properties: {
          loadingBayWidthM: { type: 'number', example: 3, description: 'Assumed bay width in meters (currently 3).' },
          totalLengthM: { type: 'number', example: 27.4, description: 'Total required length across all clusters.' },
          totalAreaM2: { type: 'number', example: 82.2, description: 'Total required area = totalLengthM × loadingBayWidthM.' },
          vehicles: {
            type: 'array',
            items: {
              type: 'object',
              required: [
                'vehicleId',
                'vehicleName',
                'vehicleLengthM',
                'clusterId',
                'totalArrivalsPerDay',
                'requiredLengthM',
                'requiredAreaM2',
              ],
              properties: {
                vehicleId: { type: 'string' },
                vehicleName: { type: 'string' },
                vehicleLengthM: { type: 'number', description: 'Length of a single vehicle of this type.' },
                clusterId: { type: 'integer' },
                totalArrivalsPerDay: { type: 'number' },
                requiredLengthM: { type: 'number' },
                requiredAreaM2: { type: 'number' },
              },
            },
          },
          clusters: {
            type: 'array',
            items: {
              type: 'object',
              required: ['clusterId', 'serviceLevel', 'vehicleIds', 'requiredLengthM', 'requiredAreaM2'],
              properties: {
                clusterId: { type: 'integer' },
                serviceLevel: { type: 'number' },
                vehicleIds: { type: 'array', items: { type: 'string' } },
                requiredLengthM: { type: 'number' },
                requiredAreaM2: { type: 'number' },
              },
            },
          },
        },
      },
      SimulationResponseMeta: {
        type: 'object',
        required: ['numSimulations', 'inputCounts', 'durationMs'],
        properties: {
          numSimulations: {
            type: 'integer',
            description: 'Number of Monte Carlo iterations actually run (default 2500).',
          },
          inputCounts: {
            type: 'object',
            description:
              'Function counts actually fed to the simulation after any BVO→units conversion. Useful for verifying what was simulated.',
            additionalProperties: { type: 'number' },
            example: { F1: 362, F10: 5 },
          },
          durationMs: { type: 'integer', description: 'Server-side simulation duration in milliseconds.' },
        },
      },
      SimulationResponse: {
        type: 'object',
        required: ['summary', 'result', 'meta'],
        properties: {
          summary: { $ref: '#/components/schemas/SimulationSummary' },
          result: { $ref: '#/components/schemas/SimulationResult' },
          meta: { $ref: '#/components/schemas/SimulationResponseMeta' },
        },
      },
    },
  },
} as const;
