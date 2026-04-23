import { openApiSpec } from '@/lib/api/openapi';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors(openApiSpec);
}

export function OPTIONS() {
  return corsPreflight();
}
