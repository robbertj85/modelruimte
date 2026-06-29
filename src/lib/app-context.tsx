'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useSimulationState, type SimulationState, type LayoutType } from './use-simulation-state';
import { useTutorial, type TutorialState } from './use-tutorial';

export interface AppContextValue {
  simulation: SimulationState;
  tutorial: TutorialState;
  layout: LayoutType;
  setLayout: (layout: LayoutType) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const simulation = useSimulationState();
  const tutorial = useTutorial();
  const [layout, setLayoutState] = useState<LayoutType>('dmi');

  const setLayout = useCallback(
    (next: LayoutType) => {
      if (tutorial.isActive) tutorial.stop();
      setLayoutState(next);
    },
    [tutorial]
  );

  return (
    <AppContext.Provider value={{ simulation, tutorial, layout, setLayout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
