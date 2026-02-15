'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  VEHICLES,
  FUNCTIONS,
  DEFAULT_FUNCTION_COUNTS,
  DEFAULT_CLUSTERS,
  DEFAULT_CLUSTER_SERVICE_LEVELS,
  SIM_PARAMS,
} from '@/lib/model-data';
import { runSimulation, type SimulationResult } from '@/lib/simulation';

export type LayoutType = 'rebel' | 'dmi' | 'webapp';

export interface SimulationState {
  // Inputs
  functionCounts: Record<string, number>;
  clusterAssignments: Record<string, number>;
  clusterServiceLevels: Record<number, number>;
  numSimulations: number;

  // State
  isRunning: boolean;
  results: SimulationResult | null;
  expandedClusters: Record<number, boolean>;

  // Derived
  clusterIds: number[];
  totalFunctions: number;
  computedTotalVehicles: number | null;

  // Handlers
  handleFunctionCountChange: (funcId: string, value: string) => void;
  handleClusterMatrixChange: (vehicleId: string, clusterId: number) => void;
  handleServiceLevelChange: (clusterId: number, value: string) => void;
  handleRun: () => void;
  toggleCluster: (clusterId: number) => void;
  setNumSimulations: (n: number) => void;
}

function getUniqueClusterIds(assignments: Record<string, number>): number[] {
  return [...new Set(Object.values(assignments))].sort((a, b) => a - b);
}

export function useSimulationState(): SimulationState {
  const [functionCounts, setFunctionCounts] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_FUNCTION_COUNTS })
  );
  const [clusterAssignments, setClusterAssignments] = useState<Record<string, number>>(
    () => ({ ...DEFAULT_CLUSTERS })
  );
  const [clusterServiceLevels, setClusterServiceLevels] = useState<Record<number, number>>(
    () => ({ ...DEFAULT_CLUSTER_SERVICE_LEVELS })
  );
  const [numSimulations, setNumSimulations] = useState(SIM_PARAMS.numSimulations);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);
  const [expandedClusters, setExpandedClusters] = useState<Record<number, boolean>>({});

  const clusterIds = useMemo(
    () => getUniqueClusterIds(clusterAssignments),
    [clusterAssignments]
  );

  const totalFunctions = Object.entries(functionCounts).reduce(
    (sum, [, count]) => sum + count,
    0
  );

  const computedTotalVehicles = useMemo(() => {
    if (results) {
      return results.vehicleResults.reduce((sum, vr) => sum + vr.totalArrivalsPerDay, 0);
    }
    return null;
  }, [results]);

  const handleFunctionCountChange = useCallback(
    (funcId: string, value: string) => {
      const parsed = parseInt(value, 10);
      setFunctionCounts((prev) => ({
        ...prev,
        [funcId]: isNaN(parsed) ? 0 : Math.max(0, parsed),
      }));
    },
    []
  );

  const handleClusterMatrixChange = useCallback(
    (vehicleId: string, clusterId: number) => {
      setClusterAssignments((prev) => ({ ...prev, [vehicleId]: clusterId }));
      setClusterServiceLevels((prev) => {
        if (prev[clusterId] === undefined) {
          return { ...prev, [clusterId]: 0.95 };
        }
        return prev;
      });
    },
    []
  );

  const handleServiceLevelChange = useCallback(
    (clusterId: number, value: string) => {
      setClusterServiceLevels((prev) => ({
        ...prev,
        [clusterId]: parseFloat(value),
      }));
    },
    []
  );

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      try {
        const result = runSimulation({
          functionCounts,
          clusterAssignments,
          clusterServiceLevels,
          numSimulations,
        });
        setResults(result);
      } catch (err) {
        console.error('Simulation error:', err);
      } finally {
        setIsRunning(false);
      }
    }, 50);
  }, [functionCounts, clusterAssignments, clusterServiceLevels, numSimulations]);

  const toggleCluster = useCallback((clusterId: number) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  }, []);

  return {
    functionCounts,
    clusterAssignments,
    clusterServiceLevels,
    numSimulations,
    isRunning,
    results,
    expandedClusters,
    clusterIds,
    totalFunctions,
    computedTotalVehicles,
    handleFunctionCountChange,
    handleClusterMatrixChange,
    handleServiceLevelChange,
    handleRun,
    toggleCluster,
    setNumSimulations,
  };
}
