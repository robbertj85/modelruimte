import type {
  BagApplyPlan,
  BagBucket,
  BagGebruiksdoel,
  BagQueryResult,
  BagVboProperties,
} from './bag-types';
import type { Feature, Point } from 'geojson';
import { FUNCTIONS } from './model-data';

const KANTOOR_KLEIN_MAX = 2500;
const KANTOOR_MIDDEL_MAX = 10000;

const RETAIL_FOOD_SHOPS = new Set([
  'bakery',
  'butcher',
  'cheese',
  'seafood',
  'deli',
  'greengrocer',
  'pastry',
  'confectionery',
  'wine',
  'beverages',
  'chocolate',
  'tea',
  'coffee',
  'farm',
  'dairy',
]);

const SUPERMARKT_SHOPS = new Set(['supermarket', 'convenience']);

const FUNC_NAME: Record<string, string> = Object.fromEntries(FUNCTIONS.map((f) => [f.id, f.name]));

function applyBucket(
  plan: BagApplyPlan,
  funcId: string,
  count: number,
  totalBvo: number,
  gebruiksdoel: BagGebruiksdoel
): void {
  if (count <= 0) return;
  plan.functionCounts[funcId] = (plan.functionCounts[funcId] ?? 0) + count;
  plan.functionBvo[funcId] = Math.round((plan.functionBvo[funcId] ?? 0) + totalBvo);
  plan.functionInputMode[funcId] = 'bvo';
  const totalC = plan.functionCounts[funcId];
  const totalB = plan.functionBvo[funcId];
  plan.bvoPerUnit[funcId] = Math.max(1, Math.round(totalB / Math.max(1, totalC)));
  plan.mapping.push({
    from: gebruiksdoel,
    toFuncId: funcId,
    toFuncName: FUNC_NAME[funcId] ?? funcId,
    count,
    totalBvo: Math.round(totalBvo),
  });
}

function splitKantoor(bucket: BagBucket): { klein: BagBucket; middel: BagBucket; groot: BagBucket } {
  const klein: BagBucket = { gebruiksdoel: 'kantoorfunctie', count: 0, totalOppervlakte: 0, oppervlakten: [] };
  const middel: BagBucket = { gebruiksdoel: 'kantoorfunctie', count: 0, totalOppervlakte: 0, oppervlakten: [] };
  const groot: BagBucket = { gebruiksdoel: 'kantoorfunctie', count: 0, totalOppervlakte: 0, oppervlakten: [] };
  for (const opp of bucket.oppervlakten) {
    const target = opp <= KANTOOR_KLEIN_MAX ? klein : opp <= KANTOOR_MIDDEL_MAX ? middel : groot;
    target.count += 1;
    target.totalOppervlakte += opp;
    target.oppervlakten.push(opp);
  }
  return { klein, middel, groot };
}

interface SubBucket {
  count: number;
  totalBvo: number;
}

export function classifyWinkel(props: BagVboProperties): 'F2' | 'F3' | 'F4' | 'F5' {
  const osm = props.osm;
  if (osm?.shop && SUPERMARKT_SHOPS.has(osm.shop)) return 'F2';
  if (osm?.shop && RETAIL_FOOD_SHOPS.has(osm.shop)) return 'F3';
  if (osm?.brand) return 'F4';
  return 'F5';
}

export function classifyHoreca(props: BagVboProperties): 'F6' | 'F7' | 'F8' {
  const osm = props.osm;
  const a = osm?.amenity;
  if (a === 'cafe' || a === 'bar' || a === 'pub' || a === 'biergarten') return 'F8';
  if (a === 'fast_food') return 'F7';
  if (a === 'restaurant') {
    const cuisine = (osm?.cuisine ?? '').toLowerCase();
    if (cuisine === 'fine_dining') return 'F6';
    return 'F7';
  }
  return 'F7';
}

function splitByOsm(
  features: Feature<Point, BagVboProperties>[],
  gebruiksdoel: 'winkelfunctie' | 'bijeenkomstfunctie'
): Record<string, SubBucket> {
  const out: Record<string, SubBucket> = {};
  for (const f of features) {
    if (f.properties.gebruiksdoel !== gebruiksdoel) continue;
    const target =
      gebruiksdoel === 'winkelfunctie'
        ? classifyWinkel(f.properties)
        : classifyHoreca(f.properties);
    if (!out[target]) out[target] = { count: 0, totalBvo: 0 };
    out[target].count += 1;
    out[target].totalBvo += f.properties.oppervlakte;
  }
  return out;
}

export function mapBagToApplyPlan(result: BagQueryResult): BagApplyPlan {
  const plan: BagApplyPlan = {
    functionCounts: {},
    functionBvo: {},
    functionInputMode: {},
    bvoPerUnit: {},
    mapping: [],
    unmappedBuckets: [],
  };

  const woon = result.buckets.woonfunctie;
  if (woon) applyBucket(plan, 'F1', woon.count, woon.totalOppervlakte, 'woonfunctie');

  if (result.buckets.winkelfunctie) {
    const split = splitByOsm(result.features.features, 'winkelfunctie');
    for (const [funcId, sub] of Object.entries(split)) {
      applyBucket(plan, funcId, sub.count, sub.totalBvo, 'winkelfunctie');
    }
  }

  const logies = result.buckets.logiesfunctie;
  if (logies) applyBucket(plan, 'F9', logies.count, logies.totalOppervlakte, 'logiesfunctie');

  if (result.buckets.bijeenkomstfunctie) {
    const split = splitByOsm(result.features.features, 'bijeenkomstfunctie');
    for (const [funcId, sub] of Object.entries(split)) {
      applyBucket(plan, funcId, sub.count, sub.totalBvo, 'bijeenkomstfunctie');
    }
  }

  const kantoor = result.buckets.kantoorfunctie;
  if (kantoor) {
    const { klein, middel, groot } = splitKantoor(kantoor);
    applyBucket(plan, 'F10', klein.count, klein.totalOppervlakte, 'kantoorfunctie');
    applyBucket(plan, 'F11', middel.count, middel.totalOppervlakte, 'kantoorfunctie');
    applyBucket(plan, 'F12', groot.count, groot.totalOppervlakte, 'kantoorfunctie');
  }

  const mappedKeys: BagGebruiksdoel[] = [
    'woonfunctie',
    'winkelfunctie',
    'logiesfunctie',
    'kantoorfunctie',
    'bijeenkomstfunctie',
  ];
  for (const [key, bucket] of Object.entries(result.buckets)) {
    if (!bucket) continue;
    if (!mappedKeys.includes(key as BagGebruiksdoel) && bucket.count > 0) {
      plan.unmappedBuckets.push(bucket);
    }
  }

  return plan;
}
