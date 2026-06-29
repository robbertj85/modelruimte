'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { Feature, MultiPolygon, Polygon } from 'geojson';
import type { BagQueryResult } from './bag-types';

export type BagPolygonFeature = Feature<Polygon | MultiPolygon>;

export interface BagContextValue {
  polygon: BagPolygonFeature | null;
  setPolygon: (poly: BagPolygonFeature | null) => void;
  queryResult: BagQueryResult | null;
  setQueryResult: (result: BagQueryResult | null) => void;
  isQuerying: boolean;
  setQuerying: (flag: boolean) => void;
  queryError: string | null;
  setQueryError: (err: string | null) => void;
  hasVisitedBagTab: boolean;
  markBagTabVisited: () => void;
  reset: () => void;
}

const BagContext = createContext<BagContextValue | null>(null);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [polygon, setPolygon] = useState<BagPolygonFeature | null>(null);
  const [queryResult, setQueryResult] = useState<BagQueryResult | null>(null);
  const [isQuerying, setQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [hasVisitedBagTab, setHasVisitedBagTab] = useState(false);

  const markBagTabVisited = useCallback(() => setHasVisitedBagTab(true), []);

  const reset = useCallback(() => {
    setPolygon(null);
    setQueryResult(null);
    setQueryError(null);
  }, []);

  return (
    <BagContext.Provider
      value={{
        polygon,
        setPolygon,
        queryResult,
        setQueryResult,
        isQuerying,
        setQuerying,
        queryError,
        setQueryError,
        hasVisitedBagTab,
        markBagTabVisited,
        reset,
      }}
    >
      {children}
    </BagContext.Provider>
  );
}

export function useBag(): BagContextValue {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('useBag must be used within BagProvider');
  return ctx;
}
