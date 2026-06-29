'use client';

import { AppProvider } from './app-context';
import { BagProvider } from './bag-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <BagProvider>{children}</BagProvider>
    </AppProvider>
  );
}
