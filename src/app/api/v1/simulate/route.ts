import { runSimulation } from '@/lib/simulation';
import { SIM_PARAMS } from '@/lib/model-data';
import { parseSimulationInput, ValidationError } from '@/lib/api/validate';
import { buildSummary } from '@/lib/api/summary';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return withCors({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseSimulationInput(rawBody);
  } catch (err) {
    if (err instanceof ValidationError) {
      return withCors({ error: err.message }, { status: 400 });
    }
    throw err;
  }

  const startedAt = Date.now();
  const result = runSimulation(parsed.input);
  const durationMs = Date.now() - startedAt;

  return withCors({
    summary: buildSummary(result),
    result,
    meta: {
      numSimulations: parsed.input.numSimulations ?? SIM_PARAMS.numSimulations,
      inputCounts: parsed.resolvedCounts,
      durationMs,
    },
  });
}

export function OPTIONS() {
  return corsPreflight();
}
