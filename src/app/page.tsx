'use client';

import dynamic from 'next/dynamic';
import { useApp } from '@/lib/app-context';

const DmiCockpitLayout = dynamic(() => import('@/components/layouts/DmiCockpitLayout'), { ssr: false });
const WebappLayout = dynamic(() => import('@/components/layouts/WebappLayout'), { ssr: false });

export default function Home() {
  const { simulation, tutorial, layout, setLayout } = useApp();

  return (
    <>
      {layout === 'dmi' && (
        <DmiCockpitLayout state={simulation} layout={layout} onLayoutChange={setLayout} tutorial={tutorial} />
      )}
      {layout === 'webapp' && (
        <WebappLayout state={simulation} layout={layout} onLayoutChange={setLayout} tutorial={tutorial} />
      )}
    </>
  );
}
