import { DELIVERY_PROFILES } from '@/lib/model-data';
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET(request: Request) {
  const url = new URL(request.url);
  const functionId = url.searchParams.get('function');
  const distributionId = url.searchParams.get('distribution');

  if (functionId && distributionId) {
    const key = `${functionId}_${distributionId}`;
    const profile = DELIVERY_PROFILES[key];
    if (!profile) {
      return withCors({ error: `No delivery profile for ${key}` }, { status: 404 });
    }
    return withCors({ key, profile });
  }

  let filtered: Record<string, typeof DELIVERY_PROFILES[string]> = DELIVERY_PROFILES;
  if (functionId || distributionId) {
    filtered = {};
    for (const [key, profile] of Object.entries(DELIVERY_PROFILES)) {
      const [f, d] = key.split('_');
      if (functionId && f !== functionId) continue;
      if (distributionId && d !== distributionId) continue;
      filtered[key] = profile;
    }
  }

  return withCors({ profiles: filtered });
}

export function OPTIONS() {
  return corsPreflight();
}
