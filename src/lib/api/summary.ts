import type { SimulationResult } from '@/lib/simulation';
import { LOADING_BAY_WIDTH_M } from '@/lib/model-data';

/**
 * Clean, clearly-labeled summary of a SimulationResult.
 *
 * Historical note: `SimulationResult.totalSpaceM2` and `requiredSpaceM2` hold
 * length in meters, not area — the Excel model and UI always multiply by
 * `LOADING_BAY_WIDTH_M` to get m². The `SimulationResult` shape is frozen for
 * backwards compatibility with the UI's state store. At the API boundary we
 * expose this richer summary so external clients don't have to learn that
 * quirk.
 */
export interface SimulationSummary {
  loadingBayWidthM: number;
  totalLengthM: number;
  totalAreaM2: number;
  vehicles: Array<{
    vehicleId: string;
    vehicleName: string;
    vehicleLengthM: number;
    clusterId: number;
    totalArrivalsPerDay: number;
    requiredLengthM: number;
    requiredAreaM2: number;
  }>;
  clusters: Array<{
    clusterId: number;
    serviceLevel: number;
    vehicleIds: string[];
    requiredLengthM: number;
    requiredAreaM2: number;
  }>;
}

export function buildSummary(result: SimulationResult): SimulationSummary {
  const width = LOADING_BAY_WIDTH_M;
  return {
    loadingBayWidthM: width,
    totalLengthM: result.totalSpaceM2,
    totalAreaM2: result.totalSpaceM2 * width,
    vehicles: result.vehicleResults.map((vr) => ({
      vehicleId: vr.vehicleId,
      vehicleName: vr.vehicleName,
      vehicleLengthM: vr.vehicleLength,
      clusterId: vr.clusterId,
      totalArrivalsPerDay: vr.totalArrivalsPerDay,
      requiredLengthM: vr.requiredSpaceM2,
      requiredAreaM2: vr.requiredSpaceM2 * width,
    })),
    clusters: result.clusterResults.map((cr) => ({
      clusterId: cr.clusterId,
      serviceLevel: cr.serviceLevel,
      vehicleIds: cr.vehicleIds,
      requiredLengthM: cr.totalSpaceM2,
      requiredAreaM2: cr.totalSpaceM2 * width,
    })),
  };
}
