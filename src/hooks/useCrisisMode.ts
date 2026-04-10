// src/hooks/useCrisisMode.ts
// Agora Livre — Crisis Mode Logic (Full TypeScript)

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { CrisisAction, CrisisSession, CrisisStep, Emotion } from '../types';

const TIMER_DURATION_SECONDS = 60; // 1 min demo; change to 600 for 10 min

// ─── State Shape ─────────────────────────────────────────────────────
interface CrisisState {
  step:            CrisisStep;
  sessionId:       string | null;
  emotions:        Emotion[];
  intensity:       number;
  selectedAction:  CrisisAction | null;
  actionsUsed:     CrisisAction[];
  timerSeconds:    number;
  timerRunning:    boolean;
  timerCompleted:  boolean;
  urgeDecreased:   boolean | null;
}

const INITIAL_STATE: CrisisState = {
  step:           'trigger',
  sessionId:      null,
  emotions:       [],
  intensity:      5,
  selectedAction: null,
  actionsUsed:    [],
  timerSeconds:   TIMER_DURATION_SECONDS,
  timerRunning:   false,
  timerCompleted: false,
  urgeDecreased:  null,
};

// ─── Hook ─────────────────────────────────────────────────────────────
export function useCrisisMode(userId: string) {
  const [state, setState] = useState<CrisisState>(INITIAL_STATE);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Cleanup timer on unmount ─────────────────────────────────────
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  // ── Reset everything ──────────────────────────────────────────────
  const reset = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState(INITIAL_STATE);
  }, []);

  // ── Toggle emotion selection ──────────────────────────────────────
  const toggleEmotion = useCallback((emotion: Emotion) => {
    setState(prev => ({
      ...prev,
      emotions: prev.emotions.includes(emotion)
        ? prev.emotions.filter(e => e !== emotion)
        : [...prev.emotions, emotion],
    }));
  }, []);

  // ── Set intensity ─────────────────────────────────────────────────
  const setIntensity = useCallback((value: number) => {
    setState(prev => ({ ...prev, intensity: Math.round(value) }));
  }, []);

  // ── Step 1 → Step 2: save trigger data, create DB session ─────────
  const submitTrigger = useCallback(async () => {
    if (state.emotions.length === 0) return;

    // Create crisis session in Supabase
    const { data, error } = await supabase
      .from('crisis_sessions')
      .insert({
        user_id:          userId,
        trigger_emotions: state.emotions,
        intensity:        state.intensity,
        actions_used:     [],
        ended_at:         null,
        urge_decreased:   false,
        timer_completed:  false,
      })
      .select('id')
      .single();


    if (error) {
      console.error('[CrisisMode] Failed to create session:', error.message);
      // Don't block UX — still advance the step
    }

    setState(prev => ({
      ...prev,
      step:      'action',
      sessionId: data?.id ?? null,
    }));
  }, [state.emotions, state.intensity, userId]);

  // ── Select an action card ─────────────────────────────────────────
  const selectAction = useCallback((action: CrisisAction) => {
    setState(prev => ({ ...prev, selectedAction: action }));
  }, []);

  // ── Step 2 → Step 3: start timer ─────────────────────────────────
  const startTimer = useCallback(async () => {
    if (!state.selectedAction) return;

    const newActionsUsed = [...state.actionsUsed, state.selectedAction];

    // Update actions_used in DB
    if (state.sessionId) {
      await supabase
        .from('crisis_sessions')
        .update({ actions_used: newActionsUsed })
        .eq('id', state.sessionId);
    }

    setState(prev => ({
      ...prev,
      step:         'timer',
      actionsUsed:  newActionsUsed,
      timerSeconds: TIMER_DURATION_SECONDS,
      timerRunning: true,
    }));

    // Start countdown
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setState(prev => {
        const next = prev.timerSeconds - 1;
        if (next <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, timerSeconds: 0, timerRunning: false, timerCompleted: true };
        }
        return { ...prev, timerSeconds: next };
      });
    }, 1000);
  }, [state.selectedAction, state.actionsUsed, state.sessionId]);

  // ── User says urge decreased → Step result ────────────────────────
  const confirmUrgeDecreased = useCallback(async (decreased: boolean) => {
    if (timerRef.current) clearInterval(timerRef.current);

    // If urge NOT decreased → go back to action step (new action)
    if (!decreased) {
      setState(prev => ({
        ...prev,
        step:           'action',
        selectedAction: null,
        timerSeconds:   TIMER_DURATION_SECONDS,
        timerRunning:   false,
      }));
      return;
    }

    // Urge decreased → save result and show success
    if (state.sessionId) {
      await supabase
        .from('crisis_sessions')
        .update({
          ended_at:        new Date().toISOString(),
          urge_decreased:  true,
          timer_completed: state.timerCompleted,
        })
        .eq('id', state.sessionId);
    }

    setState(prev => ({ ...prev, step: 'result', urgeDecreased: true }));
  }, [state.sessionId, state.timerCompleted]);

  // ── Format timer as MM:SS ─────────────────────────────────────────
  const formattedTime = (() => {
    const m = Math.floor(state.timerSeconds / 60);
    const s = state.timerSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  })();

  // ── Timer progress 0→1 (for progress bar) ────────────────────────
  const timerProgress = state.timerSeconds / TIMER_DURATION_SECONDS;

  // ── Personalized message based on user profile ────────────────────
  const getPersonalizedMessage = useCallback(
    (triggerTimes: string[], topEmotion?: Emotion): string => {
      const isNight   = triggerTimes.includes('night');
      const isAlone   = triggerTimes.includes('alone');
      const isStress  = topEmotion === 'stress' || topEmotion === 'anxiety';

      if (isNight && isAlone) {
        return 'Você costuma sentir isso à noite quando está sozinho. Você passou por isso antes — e passou.';
      }
      if (isStress) {
        return 'O estresse dispara esse impulso. Respire. Isso passa em minutos.';
      }
      return 'Você já sentiu isso antes — e passou. Um minuto de cada vez.';
    },
    []
  );

  return {
    // State
    step:           state.step,
    emotions:       state.emotions,
    intensity:      state.intensity,
    selectedAction: state.selectedAction,
    actionsUsed:    state.actionsUsed,
    timerSeconds:   state.timerSeconds,
    timerRunning:   state.timerRunning,
    timerCompleted: state.timerCompleted,
    urgeDecreased:  state.urgeDecreased,

    // Derived
    formattedTime,
    timerProgress,
    canSubmitTrigger: state.emotions.length > 0,
    canStartTimer:    state.selectedAction !== null,

    // Actions
    toggleEmotion,
    setIntensity,
    submitTrigger,
    selectAction,
    startTimer,
    confirmUrgeDecreased,
    getPersonalizedMessage,
    reset,
  };
}

// ─── Action metadata (labels, icons) ─────────────────────────────────
export const CRISIS_ACTIONS: { id: CrisisAction; icon: string; labelKey: string }[] = [
  { id: 'leave_env',   icon: '🚶', labelKey: 'actLeave'   },
  { id: 'drink_water', icon: '💧', labelKey: 'actWater'   },
  { id: 'breathe',     icon: '🫁', labelKey: 'actBreathe' },
  { id: 'wait_10',     icon: '⏳', labelKey: 'actWait'    },
];

export const EMOTIONS: { id: Emotion; icon: string; labelKey: string }[] = [
  { id: 'stress',     icon: '😤', labelKey: 'emoStress'  },
  { id: 'anxiety',    icon: '😰', labelKey: 'emoAnxiety' },
  { id: 'boredom',    icon: '😑', labelKey: 'emoBoredom' },
  { id: 'loneliness', icon: '🥺', labelKey: 'emoLonely'  },
];
