'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimulationState, type LayoutType } from '@/lib/use-simulation-state';

const DmiCockpitLayout = dynamic(() => import('@/components/layouts/DmiCockpitLayout'), { ssr: false });
const RebelExcelLayout = dynamic(() => import('@/components/layouts/RebelExcelLayout'), { ssr: false });
const WebappLayout = dynamic(() => import('@/components/layouts/WebappLayout'), { ssr: false });

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
