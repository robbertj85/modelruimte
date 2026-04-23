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
import { corsPreflight, withCors } from '@/lib/api/cors';

export const runtime = 'nodejs';

export function GET() {
  return withCors({
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
    deliveryProfiles: DELIVERY_PROFILES,
  });
}

export function OPTIONS() {
  return corsPreflight();
}
