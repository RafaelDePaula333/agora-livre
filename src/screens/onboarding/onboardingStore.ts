// src/screens/onboarding/onboardingStore.ts
// Zustand store to carry onboarding answers across steps
// Install: npm install zustand

import { create } from 'zustand';
import type {
  AddictionType,
  CopingStrategy,
  TriggerCause,
  TriggerTime,
} from '../../types';

interface OnboardingState {
  addictionType:    AddictionType | null;
  triggerTimes:     TriggerTime[];
  triggerCauses:    TriggerCause[];
  copingStrategies: CopingStrategy[];

  setAddictionType:    (v: AddictionType)    => void;
  toggleTriggerTime:   (v: TriggerTime)      => void;
  toggleTriggerCause:  (v: TriggerCause)     => void;
  toggleCoping:        (v: CopingStrategy)   => void;
  reset:               ()                    => void;
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  addictionType:    null,
  triggerTimes:     [],
  triggerCauses:    [],
  copingStrategies: [],

  setAddictionType:    (v) => set({ addictionType: v }),
  toggleTriggerTime:   (v) => set(s => ({ triggerTimes:     toggle(s.triggerTimes, v)     })),
  toggleTriggerCause:  (v) => set(s => ({ triggerCauses:    toggle(s.triggerCauses, v)    })),
  toggleCoping:        (v) => set(s => ({ copingStrategies: toggle(s.copingStrategies, v) })),
  reset:               ()  => set({ addictionType: null, triggerTimes: [], triggerCauses: [], copingStrategies: [] }),
}));
