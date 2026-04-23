# Ruimtemodel Stadslogistiek — REST API

External systems can drive the Monte Carlo simulation engine and read the
model catalog via a JSON REST API.

All endpoints:
- Return `application/json`.
- Send permissive CORS headers (`Access-Control-Allow-Origin: *`), so browser
  clients on any origin may call them.
- Are read-only or idempotent — no authentication is required. The simulation
  endpoint caps `numSimulations` at 5000 to bound cost.

Base path: `/api/v1`

**Machine-readable spec:** [`/api/v1/openapi.json`](../src/lib/api/openapi.ts) (OpenAPI 3.0.3)
**Rendered reference:** `/api-docs` (ReDoc) — also works in Redocly's hosted service and `redocly preview-docs` against the JSON URL.

---

## Health

```
GET /api/v1/health
```

Response:
```json
{ "status": "ok", "service": "ruimtemodel-api", "version": "1.0.0", "timestamp": "…" }
```

---

## Model catalog

### Full catalog

```
GET /api/v1/model
```

Returns vehicles, functions, distributions, periods, service levels, default
cluster assignments, default cluster service levels, simulation parameters,
loading-bay width, and all delivery profiles.

### Individual resources

```
GET /api/v1/model/vehicles       → { vehicles: [...] }
GET /api/v1/model/functions      → { functions: [...] }
GET /api/v1/model/distributions  → { distributions: [...] }
GET /api/v1/model/profiles       → { profiles: { "F1_D7": {...}, … } }
```

The `profiles` endpoint also accepts query parameters:

```
GET /api/v1/model/profiles?function=F1                      # filter by function
GET /api/v1/model/profiles?distribution=D7                  # filter by distribution
GET /api/v1/model/profiles?function=F1&distribution=D7      # exact match → { key, profile }
```

---

## Run simulation

```
POST /api/v1/simulate
Content-Type: application/json
```

Supply either **number of units** or **BVO in m²** per function (or mix the two
— one mode per function). The simulation runs **2500 Monte Carlo iterations by
default**. Every other field has a sensible default.

Minimal body (units):
```json
{ "functionCounts": { "F1": 362, "F2": 2, "F10": 5 } }
```

Minimal body (BVO):
```json
{ "functionBvoM2": { "F1": 32580, "F10": 6250 } }
```

All fields:
```json
{
  "functionCounts":        { "F1": 362 },                // units per function
  "functionBvoM2":         { "F10": 6250 },              // OR BVO (m²) per function
  "bvoPerUnit":            { "F1": 90 },                 // optional override for BVO→units conversion
  "clusterAssignments":    { "V1": 1, "V2": 1, "V3": 2 }, // optional, defaults to DEFAULT_CLUSTERS
  "clusterServiceLevels":  { "1": 0.95, "2": 0.95 },     // optional, defaults to 0.95 per cluster
  "numSimulations":        2500,                          // optional, default 2500, max 5000
  "vehicles":              [...],                         // optional override
  "functions":             [...],                         // optional override
  "distributions":         [...],                         // optional override
  "vehicleLengths":        { "V1": 2 },                   // optional override
  "deliveryDays":          { "D7": 6 },                   // optional override
  "deliveryProfiles":      { "F1_D7": {...} },            // optional override/merge
  "intervalMinutes":       10                             // optional override
}
```

At least one of `functionCounts` or `functionBvoM2` must be provided. A single
function may **not** appear in both — choose one mode per function.

Response:
```json
{
  "summary": {
    "loadingBayWidthM": 3,
    "totalLengthM":     27.4,
    "totalAreaM2":      82.2,
    "vehicles": [
      {
        "vehicleId":           "V3",
        "vehicleName":         "Bestelwagen <3,5 ton (N1)",
        "vehicleLengthM":      8,
        "clusterId":           2,
        "totalArrivalsPerDay": 86.1,
        "requiredLengthM":     16,
        "requiredAreaM2":      48
      }
    ],
    "clusters": [
      { "clusterId": 1, "serviceLevel": 0.95, "vehicleIds": ["V1","V2"], "requiredLengthM": 0, "requiredAreaM2": 0 },
      { "clusterId": 2, "serviceLevel": 0.95, "vehicleIds": ["V3","V4","V5"], "requiredLengthM": 24, "requiredAreaM2": 72 }
    ]
  },
  "result": {
    "vehicleResults":    [ { "vehicleId": "V1", "requiredSpaceM2": 4.0, … } ],
    "clusterResults":    [ { "clusterId": 1, "totalSpaceM2": 14.2, … } ],
    "totalSpaceM2":      27.4,
    "peakByPeriod":      [ { "period": "0:00 - 6:00", "space": 0 }, … ],
    "serviceLevelCurve": [ { "serviceLevel": 0.5, "space": 8.1 }, … ]
  },
  "meta": {
    "numSimulations": 2500,
    "inputCounts":    { "F1": 362, "F10": 5 },
    "durationMs":     312
  }
}
```

`summary` is the recommended consumer field — lengths and areas are clearly
labeled. The `result` block preserves the raw engine output for callers that
need it. Note: the field names `totalSpaceM2` and `requiredSpaceM2` inside
`result` are legacy — they hold **length in meters**, not area. Multiply by
`summary.loadingBayWidthM` (3) for actual m².

Errors:
- `400` — invalid input, with `{ "error": "…" }` describing what was wrong.
- `500` — internal error (should not happen; file a bug).

### Example

```bash
curl -X POST https://your-host/api/v1/simulate \
  -H 'Content-Type: application/json' \
  -d '{ "functionBvoM2": { "F1": 32580, "F2": 3000 } }'
```

---

## Notes on IDs

- Vehicles: `V1` (fiets/cargobike) … `V6` (service bestelwagen) — see
  `/api/v1/model/vehicles`.
- Functions: `F1` (woningen) … `F12` (kantoor groot) — see
  `/api/v1/model/functions`.
- Distributions: `D1` (afval bedrijven) … `D15` (verhuizingen) — see
  `/api/v1/model/distributions`.
- Cluster IDs are integers ≥ 1 chosen by the caller. Vehicles sharing a
  cluster share physical space; each cluster has its own service level.

## Notes on the model

See `CLAUDE.md` and `src/lib/simulation.ts` for an in-depth description of
the Monte Carlo model, including how arrival probabilities are computed and
how percentile analysis converts per-iteration peaks into a required space.
