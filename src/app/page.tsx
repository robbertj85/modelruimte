'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimulationState, type LayoutType } from '@/lib/use-simulation-state';
import { useTutorial } from '@/lib/use-tutorial';

const DmiCockpitLayout = dynamic(() => import('@/components/layouts/DmiCockpitLayout'), { ssr: false });
const RebelExcelLayout = dynamic(() => import('@/components/layouts/RebelExcelLayout'), { ssr: false });
const WebappLayout = dynamic(() => import('@/components/layouts/WebappLayout'), { ssr: false });

export default function Home() {
  const [layout, setLayout] = useState<LayoutType>('dmi');
  const state = useSimulationState();
  const tutorial = useTutorial();

  // Stop tutorial on layout switch
  const handleLayoutChange = (newLayout: LayoutType) => {
    if (tutorial.isActive) tutorial.stop();
    setLayout(newLayout);
  };

  return (
    <>
      {layout === 'rebel' && <RebelExcelLayout state={state} layout={layout} onLayoutChange={handleLayoutChange} tutorial={tutorial} />}
      {layout === 'dmi' && <DmiCockpitLayout state={state} layout={layout} onLayoutChange={handleLayoutChange} tutorial={tutorial} />}
      {layout === 'webapp' && <WebappLayout state={state} layout={layout} onLayoutChange={handleLayoutChange} tutorial={tutorial} />}
    </>
  );
}
