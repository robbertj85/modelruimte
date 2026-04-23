import { DISTRIBUTIONS } from '@/lib/model-data';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors({ distributions: DISTRIBUTIONS });
}

export function OPTIONS() {
  return corsPreflight();
}
