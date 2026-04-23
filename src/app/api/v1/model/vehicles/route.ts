import { VEHICLES } from '@/lib/model-data';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors({ vehicles: VEHICLES });
}

export function OPTIONS() {
  return corsPreflight();
}
