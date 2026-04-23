import { FUNCTIONS } from '@/lib/model-data';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors({ functions: FUNCTIONS });
}

export function OPTIONS() {
  return corsPreflight();
}
