import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors({
    status: 'ok',
    service: 'ruimtemodel-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
}

export function OPTIONS() {
  return corsPreflight();
}
