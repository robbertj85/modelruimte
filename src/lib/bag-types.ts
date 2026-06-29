import type { Feature, FeatureCollection, MultiPolygon, Point, Polygon } from 'geojson';

export type BagGebruiksdoel =
  | 'woonfunctie'
  | 'winkelfunctie'
  | 'kantoorfunctie'
  | 'logiesfunctie'
  | 'bijeenkomstfunctie'
  | 'industriefunctie'
  | 'gezondheidszorgfunctie'
  | 'onderwijsfunctie'
  | 'sportfunctie'
  | 'celfunctie'
  | 'overige gebruiksfunctie';

export const BAG_GEBRUIKSDOELEN: BagGebruiksdoel[] = [
  'woonfunctie',
  'winkelfunctie',
  'kantoorfunctie',
  'logiesfunctie',
  'bijeenkomstfunctie',
  'industriefunctie',
  'gezondheidszorgfunctie',
  'onderwijsfunctie',
  'sportfunctie',
  'celfunctie',
  'overige gebruiksfunctie',
];

export interface BagBucket {
  gebruiksdoel: BagGebruiksdoel;
  count: number;
  totalOppervlakte: number;
  oppervlakten: number[];
}

export interface BagVboOsmTags {
  shop?: string;
  amenity?: string;
  brand?: string;
  name?: string;
  cuisine?: string;
}

export interface BagVboProperties {
  id?: string;
  gebruiksdoel: BagGebruiksdoel;
  oppervlakte: number;
  osm?: BagVboOsmTags;
}

export interface BagQueryResult {
  totalVerblijfsobjecten: number;
  buckets: Partial<Record<BagGebruiksdoel, BagBucket>>;
  polygon: Feature<Polygon | MultiPolygon>;
  features: FeatureCollection<Point, BagVboProperties>;
  queriedAt: string;
  truncated: boolean;
  multiUseCount: number;
}

export interface BagMappingEntry {
  from: BagGebruiksdoel;
  toFuncId: string;
  toFuncName: string;
  count: number;
  totalBvo: number;
}

export interface BagApplyPlan {
  functionCounts: Record<string, number>;
  functionBvo: Record<string, number>;
  functionInputMode: Record<string, 'count' | 'bvo'>;
  bvoPerUnit: Record<string, number>;
  mapping: BagMappingEntry[];
  unmappedBuckets: BagBucket[];
}
