'use client';

import { useState } from 'react';
import { useSimulationState, type LayoutType } from '@/lib/use-simulation-state';
import DmiCockpitLayout from '@/components/layouts/DmiCockpitLayout';
import RebelExcelLayout from '@/components/layouts/RebelExcelLayout';
import WebappLayout from '@/components/layouts/WebappLayout';

export default function Home() {
  const [layout, setLayout] = useState<LayoutType>('dmi');
  const state = useSimulationState();

  return (
    <>
      {layout === 'rebel' && <RebelExcelLayout state={state} layout={layout} onLayoutChange={setLayout} />}
      {layout === 'dmi' && <DmiCockpitLayout state={state} layout={layout} onLayoutChange={setLayout} />}
      {layout === 'webapp' && <WebappLayout state={state} layout={layout} onLayoutChange={setLayout} />}
    </>
  );
}
