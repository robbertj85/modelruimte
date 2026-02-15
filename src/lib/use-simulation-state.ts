'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  VEHICLES,
  FUNCTIONS,
  DISTRIBUTIONS,
  DEFAULT_FUNCTION_COUNTS,
  DEFAULT_CLUSTERS,
  DEFAULT_CLUSTER_SERVICE_LEVELS,
  SIM_PARAMS,
  DELIVERY_PROFILES,
  MAX_FUNCTIONS,
  MAX_VEHICLES,
  MAX_DISTRIBUTIONS,
  getDefaultVehicleLengths,
  getDefaultDeliveryDays,
  getDefaultDeliveryProfiles,
  type DeliveryProfile,
} from '@/lib/model-data';
import {
  type SimulationResult,
  type VehicleDef,
  type FunctionDef,
  type DistributionDef,
} from '@/lib/simulation';

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
  simulationError: string | null;
  expandedClusters: Record<number, boolean>;
  clusterNames: Record<number, string>;

  // Derived
  clusterIds: number[];
  totalFunctions: number;
  computedTotalVehicles: number | null;

  // Advanced parameter state
  vehicleLengths: Record<string, number>;
  deliveryDays: Record<string, number>;
  deliveryProfiles: Record<string, DeliveryProfile>;
  intervalMinutes: number;
  customFunctions: FunctionDef[];
  customVehicles: VehicleDef[];
  customDistributions: DistributionDef[];
  allFunctions: FunctionDef[];
  allVehicles: VehicleDef[];
  allDistributions: DistributionDef[];
  hasAdvancedOverrides: boolean;

  // Handlers
  handleFunctionCountChange: (funcId: string, value: string) => void;
  handleClusterMatrixChange: (vehicleId: string, clusterId: number) => void;
  handleServiceLevelChange: (clusterId: number, value: string) => void;
  handleClusterNameChange: (clusterId: number, name: string) => void;
  handleRun: () => void;
  toggleCluster: (clusterId: number) => void;
  setNumSimulations: (n: number) => void;
  resetToBlank: () => void;
  resetToGerardDoustraat: () => void;

  // Advanced parameter handlers
  handleVehicleLengthChange: (vehicleId: string, value: number) => void;
  handleDeliveryDaysChange: (distId: string, value: number) => void;
  handleIntervalMinutesChange: (value: number) => void;
  handleProfileFieldChange: (profileKey: string, field: 'stopsPerWeekPerUnit' | 'duration', vehicleIdx: number, value: number) => void;
  handleProfilePeriodDistChange: (profileKey: string, vehicleIdx: number, periodIdx: number, value: number) => void;
  handleResetAdvancedParams: () => void;
  handleAddFunction: () => void;
  handleAddVehicle: () => void;
  handleAddDistribution: () => void;
  handleCustomFunctionNameChange: (funcId: string, name: string) => void;
  handleCustomFunctionUnitChange: (funcId: string, unit: string) => void;
  handleCustomVehicleNameChange: (vehicleId: string, name: string) => void;
  handleCustomDistributionNameChange: (distId: string, name: string) => void;
  handleEnsureProfile: (profileKey: string, numVehicles: number) => void;
}

function getUniqueClusterIds(assignments: Record<string, number>): number[] {
  return [...new Set(Object.values(assignments))].sort((a, b) => a - b);
}

function deepCloneProfiles(profiles: Record<string, DeliveryProfile>): Record<string, DeliveryProfile> {
  const result: Record<string, DeliveryProfile> = {};
  for (const [key, profile] of Object.entries(profiles)) {
    result[key] = {
      stopsPerWeekPerUnit: [...profile.stopsPerWeekPerUnit],
      duration: [...profile.duration],
      periodDistribution: profile.periodDistribution.map((pd) => [...pd]),
    };
  }
  return result;
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
  const [simulationError, setSimulationError] = useState<string | null>(null);
  const [expandedClusters, setExpandedClusters] = useState<Record<number, boolean>>({});
  const [clusterNames, setClusterNames] = useState<Record<number, string>>({});

  // Advanced parameter state
  const [vehicleLengths, setVehicleLengths] = useState<Record<string, number>>(getDefaultVehicleLengths);
  const [deliveryDays, setDeliveryDays] = useState<Record<string, number>>(getDefaultDeliveryDays);
  const [deliveryProfiles, setDeliveryProfiles] = useState<Record<string, DeliveryProfile>>(getDefaultDeliveryProfiles);
  const [intervalMinutes, setIntervalMinutes] = useState(SIM_PARAMS.intervalMinutes);
  const [customFunctions, setCustomFunctions] = useState<FunctionDef[]>([]);
  const [customVehicles, setCustomVehicles] = useState<VehicleDef[]>([]);
  const [customDistributions, setCustomDistributions] = useState<DistributionDef[]>([]);

  // Merged lists
  const allFunctions: FunctionDef[] = useMemo(
    () => [
      ...FUNCTIONS.map((f) => ({ id: f.id, name: f.name, unit: f.unit, description: f.description })),
      ...customFunctions,
    ],
    [customFunctions]
  );

  const allVehicles: VehicleDef[] = useMemo(
    () => [
      ...VEHICLES.map((v) => ({ id: v.id, name: v.name, length: vehicleLengths[v.id] ?? v.length })),
      ...customVehicles.map((v) => ({ ...v, length: vehicleLengths[v.id] ?? v.length })),
    ],
    [customVehicles, vehicleLengths]
  );

  const allDistributions: DistributionDef[] = useMemo(
    () => [
      ...DISTRIBUTIONS.map((d) => ({ id: d.id, name: d.name, deliveryDays: deliveryDays[d.id] ?? d.deliveryDays })),
      ...customDistributions.map((d) => ({ ...d, deliveryDays: deliveryDays[d.id] ?? d.deliveryDays })),
    ],
    [customDistributions, deliveryDays]
  );

  // Check if any advanced parameters differ from defaults
  const hasAdvancedOverrides = useMemo(() => {
    if (intervalMinutes !== SIM_PARAMS.intervalMinutes) return true;
    if (customFunctions.length > 0 || customVehicles.length > 0 || customDistributions.length > 0) return true;
    const defLengths = getDefaultVehicleLengths();
    for (const [k, v] of Object.entries(vehicleLengths)) {
      if (defLengths[k] !== undefined && v !== defLengths[k]) return true;
    }
    const defDays = getDefaultDeliveryDays();
    for (const [k, v] of Object.entries(deliveryDays)) {
      if (defDays[k] !== undefined && v !== defDays[k]) return true;
    }
    const defProfiles = DELIVERY_PROFILES;
    for (const [key, profile] of Object.entries(deliveryProfiles)) {
      const def = defProfiles[key];
      if (!def) {
        // Custom profile that doesn't exist in defaults — check if it has any nonzero values
        const hasValues = profile.stopsPerWeekPerUnit.some((v) => v !== 0) ||
          profile.duration.some((v) => v !== 0);
        if (hasValues) return true;
        continue;
      }
      for (let i = 0; i < profile.stopsPerWeekPerUnit.length; i++) {
        if ((profile.stopsPerWeekPerUnit[i] ?? 0) !== (def.stopsPerWeekPerUnit[i] ?? 0)) return true;
        if ((profile.duration[i] ?? 0) !== (def.duration[i] ?? 0)) return true;
      }
      for (let i = 0; i < profile.periodDistribution.length; i++) {
        for (let j = 0; j < (profile.periodDistribution[i]?.length ?? 0); j++) {
          if ((profile.periodDistribution[i]?.[j] ?? 0) !== (def.periodDistribution[i]?.[j] ?? 0)) return true;
        }
      }
    }
    return false;
  }, [vehicleLengths, deliveryDays, deliveryProfiles, intervalMinutes, customFunctions, customVehicles, customDistributions]);

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

  const handleClusterNameChange = useCallback(
    (clusterId: number, name: string) => {
      setClusterNames((prev) => {
        if (name.trim() === '') {
          const next = { ...prev };
          delete next[clusterId];
          return next;
        }
        return { ...prev, [clusterId]: name };
      });
    },
    []
  );

  const workerRef = useRef<Worker | null>(null);
  const isRunningRef = useRef(false);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const handleRun = useCallback(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    setSimulationError(null);

    // Terminate any previous worker
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(
      new URL('./simulation-worker.ts', import.meta.url)
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{ type: string; data?: SimulationResult; message?: string }>) => {
      if (e.data.type === 'result' && e.data.data) {
        setResults(e.data.data);
      } else if (e.data.type === 'error') {
        setSimulationError(e.data.message ?? 'Simulatie mislukt');
      }
      setIsRunning(false);
      isRunningRef.current = false;
      worker.terminate();
      workerRef.current = null;
    };

    worker.onerror = () => {
      setSimulationError('Simulatie worker is onverwacht gestopt');
      setIsRunning(false);
      isRunningRef.current = false;
      worker.terminate();
      workerRef.current = null;
    };

    worker.postMessage({
      functionCounts,
      clusterAssignments,
      clusterServiceLevels,
      numSimulations,
      vehicles: allVehicles,
      functions: allFunctions,
      distributions: allDistributions,
      vehicleLengths,
      deliveryDays,
      deliveryProfiles,
      intervalMinutes,
    });
  }, [functionCounts, clusterAssignments, clusterServiceLevels, numSimulations, allVehicles, allFunctions, allDistributions, vehicleLengths, deliveryDays, deliveryProfiles, intervalMinutes]);

  const toggleCluster = useCallback((clusterId: number) => {
    setExpandedClusters((prev) => ({
      ...prev,
      [clusterId]: !prev[clusterId],
    }));
  }, []);

  const resetToBlank = useCallback(() => {
    const blank: Record<string, number> = {};
    for (const f of FUNCTIONS) blank[f.id] = 0;
    for (const cf of customFunctions) blank[cf.id] = 0;
    setFunctionCounts(blank);
    setClusterAssignments({ ...DEFAULT_CLUSTERS });
    setClusterServiceLevels({ ...DEFAULT_CLUSTER_SERVICE_LEVELS });
    setResults(null);
  }, [customFunctions]);

  const resetToGerardDoustraat = useCallback(() => {
    setFunctionCounts({ ...DEFAULT_FUNCTION_COUNTS });
    setClusterAssignments({ ...DEFAULT_CLUSTERS });
    setClusterServiceLevels({ ...DEFAULT_CLUSTER_SERVICE_LEVELS });
    setResults(null);
  }, []);

  // --- Advanced parameter handlers ---

  const handleVehicleLengthChange = useCallback((vehicleId: string, value: number) => {
    setVehicleLengths((prev) => ({ ...prev, [vehicleId]: Math.max(0, value) }));
  }, []);

  const handleDeliveryDaysChange = useCallback((distId: string, value: number) => {
    setDeliveryDays((prev) => ({ ...prev, [distId]: Math.max(1, Math.round(value)) }));
  }, []);

  const handleIntervalMinutesChange = useCallback((value: number) => {
    setIntervalMinutes(Math.max(1, Math.min(60, Math.round(value))));
  }, []);

  const handleProfileFieldChange = useCallback(
    (profileKey: string, field: 'stopsPerWeekPerUnit' | 'duration', vehicleIdx: number, value: number) => {
      setDeliveryProfiles((prev) => {
        const existing = prev[profileKey];
        if (!existing) return prev;
        const updated = {
          ...existing,
          [field]: existing[field].map((v, i) => (i === vehicleIdx ? Math.max(0, value) : v)),
        };
        return { ...prev, [profileKey]: updated };
      });
    },
    []
  );

  const handleProfilePeriodDistChange = useCallback(
    (profileKey: string, vehicleIdx: number, periodIdx: number, value: number) => {
      setDeliveryProfiles((prev) => {
        const existing = prev[profileKey];
        if (!existing) return prev;
        const newPeriodDist = existing.periodDistribution.map((pd, vi) =>
          vi === vehicleIdx ? pd.map((v, pi) => (pi === periodIdx ? Math.max(0, value) : v)) : [...pd]
        );
        return {
          ...prev,
          [profileKey]: { ...existing, periodDistribution: newPeriodDist },
        };
      });
    },
    []
  );

  const handleResetAdvancedParams = useCallback(() => {
    setVehicleLengths(getDefaultVehicleLengths());
    setDeliveryDays(getDefaultDeliveryDays());
    setDeliveryProfiles(getDefaultDeliveryProfiles());
    setIntervalMinutes(SIM_PARAMS.intervalMinutes);
    setCustomFunctions([]);
    setCustomVehicles([]);
    setCustomDistributions([]);
  }, []);

  const handleAddFunction = useCallback(() => {
    setCustomFunctions((prev) => {
      const totalCount = FUNCTIONS.length + prev.length;
      if (totalCount >= MAX_FUNCTIONS) return prev;
      const nextId = `F${totalCount + 1}`;
      return [...prev, { id: nextId, name: '<<LEEG>>', unit: 'eenheden', description: '' }];
    });
  }, []);

  const handleAddVehicle = useCallback(() => {
    setCustomVehicles((prev) => {
      const totalCount = VEHICLES.length + prev.length;
      if (totalCount >= MAX_VEHICLES) return prev;
      const nextId = `V${totalCount + 1}`;
      const newVeh: VehicleDef = { id: nextId, name: `Voertuig ${totalCount + 1}`, length: 0 };
      // Set default length for new vehicle
      setVehicleLengths((prevLengths) => ({ ...prevLengths, [nextId]: 0 }));
      // Set default cluster for new vehicle
      setClusterAssignments((prevClusters) => ({ ...prevClusters, [nextId]: 1 }));
      // Extend all existing delivery profiles with a zero entry for the new vehicle
      setDeliveryProfiles((prevProfiles) => {
        const updated = deepCloneProfiles(prevProfiles);
        for (const [, profile] of Object.entries(updated)) {
          profile.stopsPerWeekPerUnit.push(0);
          profile.duration.push(0);
          profile.periodDistribution.push([0, 0, 0, 0]);
        }
        return updated;
      });
      return [...prev, newVeh];
    });
  }, []);

  const handleAddDistribution = useCallback(() => {
    setCustomDistributions((prev) => {
      const totalCount = DISTRIBUTIONS.length + prev.length;
      if (totalCount >= MAX_DISTRIBUTIONS) return prev;
      const nextId = `D${totalCount + 1}`;
      return [...prev, { id: nextId, name: '<<LEEG>>', deliveryDays: 6 }];
    });
  }, []);

  const handleCustomFunctionNameChange = useCallback((funcId: string, name: string) => {
    setCustomFunctions((prev) => prev.map((f) => (f.id === funcId ? { ...f, name } : f)));
  }, []);

  const handleCustomFunctionUnitChange = useCallback((funcId: string, unit: string) => {
    setCustomFunctions((prev) => prev.map((f) => (f.id === funcId ? { ...f, unit } : f)));
  }, []);

  const handleCustomVehicleNameChange = useCallback((vehicleId: string, name: string) => {
    setCustomVehicles((prev) => prev.map((v) => (v.id === vehicleId ? { ...v, name } : v)));
  }, []);

  const handleCustomDistributionNameChange = useCallback((distId: string, name: string) => {
    setCustomDistributions((prev) => prev.map((d) => (d.id === distId ? { ...d, name } : d)));
  }, []);

  const handleEnsureProfile = useCallback((profileKey: string, numVehicles: number) => {
    setDeliveryProfiles((prev) => {
      if (prev[profileKey]) return prev;
      return {
        ...prev,
        [profileKey]: {
          stopsPerWeekPerUnit: new Array(numVehicles).fill(0),
          duration: new Array(numVehicles).fill(0),
          periodDistribution: Array.from({ length: numVehicles }, () => [0, 0, 0, 0]),
        },
      };
    });
  }, []);

  return {
    functionCounts,
    clusterAssignments,
    clusterServiceLevels,
    numSimulations,
    isRunning,
    results,
    simulationError,
    expandedClusters,
    clusterNames,
    clusterIds,
    totalFunctions,
    computedTotalVehicles,
    vehicleLengths,
    deliveryDays,
    deliveryProfiles,
    intervalMinutes,
    customFunctions,
    customVehicles,
    customDistributions,
    allFunctions,
    allVehicles,
    allDistributions,
    hasAdvancedOverrides,
    handleFunctionCountChange,
    handleClusterMatrixChange,
    handleServiceLevelChange,
    handleClusterNameChange,
    handleRun,
    toggleCluster,
    setNumSimulations,
    resetToBlank,
    resetToGerardDoustraat,
    handleVehicleLengthChange,
    handleDeliveryDaysChange,
    handleIntervalMinutesChange,
    handleProfileFieldChange,
    handleProfilePeriodDistChange,
    handleResetAdvancedParams,
    handleAddFunction,
    handleAddVehicle,
    handleAddDistribution,
    handleCustomFunctionNameChange,
    handleCustomFunctionUnitChange,
    handleCustomVehicleNameChange,
    handleCustomDistributionNameChange,
    handleEnsureProfile,
  };
}
