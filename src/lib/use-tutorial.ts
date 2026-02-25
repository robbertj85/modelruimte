'use client';

import { useState, useCallback, useMemo } from 'react';
import { TUTORIAL_STEPS, type TutorialStep } from './tutorial';

export interface TutorialState {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TutorialStep;
  totalSteps: number;
  start: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  goToStep: (index: number) => void;
}

export function useTutorial(): TutorialState {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsActive(true);
  }, []);

  const stop = useCallback(() => {
    setIsActive(false);
    setCurrentStepIndex(0);
  }, []);

  const next = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= TUTORIAL_STEPS.length - 1) {
        setIsActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const prev = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      setCurrentStepIndex(index);
    }
  }, []);

  const currentStep = TUTORIAL_STEPS[currentStepIndex] ?? TUTORIAL_STEPS[0];

  return useMemo(
    () => ({
      isActive,
      currentStepIndex,
      currentStep,
      totalSteps: TUTORIAL_STEPS.length,
      start,
      stop,
      next,
      prev,
      goToStep,
    }),
    [isActive, currentStepIndex, currentStep, start, stop, next, prev, goToStep],
  );
}
