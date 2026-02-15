import { runSimulation, type SimulationInput } from './simulation';

self.onmessage = (e: MessageEvent<SimulationInput>) => {
  try {
    const result = runSimulation(e.data);
    self.postMessage({ type: 'result', data: result });
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
