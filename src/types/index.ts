// src/types/index.ts
// Agora Livre — Type Definitions

// ─── User & Onboarding ──────────────────────────────────────────────
export type AddictionType = 'alcohol' | 'drugs';

export type TriggerTime   = 'night' | 'alone' | 'social' | 'stress';
export type TriggerCause  = 'emotional' | 'habit' | 'tiredness' | 'social';
export type CopingStrategy = 'support' | 'distraction' | 'control' | 'silence';
export type Emotion = 'stress' | 'anxiety' | 'boredom' | 'loneliness';
export type Mood = 'good' | 'neutral' | 'bad';

export interface UserProfile {
  id:              string;
  email:           string;
  name?:           string;
  addictionType:   AddictionType;
  triggerTimes:    TriggerTime[];
  triggerCauses:   TriggerCause[];
  copingStrategies: CopingStrategy[];
  soberSince:      string;          // ISO date string
  createdAt:       string;
  isPremium:       boolean;
  lang:            SupportedLang;
}

// ─── Check-in ───────────────────────────────────────────────────────
export interface CheckIn {
  id:             string;
  userId:         string;
  date:           string;           // ISO date string (date only)
  mood:           Mood;
  emotions:       Emotion[];
  urgeIntensity:  number;           // 0–10
  notes?:         string;
  createdAt:      string;
}

// ─── Crisis Session ─────────────────────────────────────────────────
export type CrisisAction = 'leave_env' | 'drink_water' | 'breathe' | 'wait_10';

export type CrisisStep = 'trigger' | 'action' | 'timer' | 'result';

export interface CrisisSession {
  id:              string;
  userId:          string;
  startedAt:       string;
  endedAt?:        string;
  triggerEmotions: Emotion[];
  intensity:       number;          // 0–10
  actionsUsed:     CrisisAction[];
  urgeDecreased:   boolean;
  timerCompleted:  boolean;
}

// ─── Relapse ────────────────────────────────────────────────────────
export type RelapseLocation = 'home' | 'work' | 'social' | 'other';

export interface Relapse {
  id:          string;
  userId:      string;
  occurredAt:  string;
  location:    RelapseLocation;
  emotion:     Emotion;
  intensity:   number;
  notes?:      string;
  createdAt:   string;
}

// ─── Progress / Analytics ───────────────────────────────────────────
export interface WeeklyProgress {
  date:        string;
  hadRelapse:  boolean;
  urgeLevel:   number;
  checkedIn:   boolean;
}

export interface UserInsights {
  riskDay?:        string;          // e.g. "Thursday"
  riskTime?:       string;          // e.g. "night"
  topTrigger?:     Emotion;
  relapseReduction: number;         // percentage 0–100
  crisesAvoided:   number;
  currentStreak:   number;
  longestStreak:   number;
}

// ─── Subscription ───────────────────────────────────────────────────
export type PlanType = 'monthly' | 'annual';

export interface Subscription {
  userId:       string;
  plan:         PlanType;
  status:       'active' | 'cancelled' | 'expired';
  startedAt:    string;
  expiresAt:    string;
  playStoreSku: string;
  purchaseToken: string;
}

// ─── Navigation ─────────────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding1: undefined;
  Onboarding2: undefined;
  Onboarding3: undefined;
  Main:        undefined;
};

export type MainTabParamList = {
  Home:     undefined;
  CheckIn:  undefined;
  Progress: undefined;
  Premium:  undefined;
};

export type HomeStackParamList = {
  HomeScreen:    undefined;
  CrisisMode:    undefined;
  RelapseRecord: undefined;
};

// ─── i18n ────────────────────────────────────────────────────────────
export type SupportedLang = 'pt' | 'en' | 'es' | 'nl' | 'ro';
