import { create } from 'zustand';
import type { Experience, InjuryFlag, Profile, Role, Sex, Units } from '@/types/profile';

/**
 * Quiz draft state. In-memory only in MVP (no persistence): settings changes
 * mutate session defaults; reset() clears everything including injury flags.
 * The privacy page documents this — nothing is stored server-side.
 */
export interface QuizDraft {
  units: Units;
  region: 'UK' | 'US';
  mode?: 'single' | 'rotation';
  sex?: Sex;
  age?: number;
  weightKg?: number;
  weeklyKm?: number;
  paceKind?: 'race' | 'easy' | 'unsure';
  raceDistanceKm?: 5 | 10 | 21.1 | 42.2;
  raceTimeSec?: number;
  easyPaceSecPerKm?: number;
  primaryIntent?: Role | 'everything';
  targetingRace?: boolean;
  raceDistanceTargetKm?: 5 | 10 | 21.1 | 42.2;
  experience?: Experience;
  currentShoeSlug?: string;
  currentShoeVerdict?: 'love' | 'meh' | 'hate';
  wide: boolean;
  roomyToe: boolean;
  wantsStability: boolean;
  brandLoves: string[];
  brandBlocks: string[];
  budgetType: 'perShoe' | 'total';
  budgetAmountGbp: number;
  budgetStretch: boolean;
  injuryConsent: boolean;
  injuryFlags: InjuryFlag[];
}

interface QuizState extends QuizDraft {
  set: <K extends keyof QuizDraft>(key: K, value: QuizDraft[K]) => void;
  toggleBrand: (list: 'brandLoves' | 'brandBlocks', brand: string) => void;
  toggleFlag: (flag: InjuryFlag) => void;
  reset: () => void;
  toProfile: () => Profile;
}

const initial: QuizDraft = {
  units: 'metric',
  region: 'UK',
  wide: false,
  roomyToe: false,
  wantsStability: false,
  brandLoves: [],
  brandBlocks: [],
  budgetType: 'total',
  budgetAmountGbp: 350,
  budgetStretch: false,
  injuryConsent: false,
  injuryFlags: [],
};

export const useQuizStore = create<QuizState>((set, get) => ({
  ...initial,
  set: (key, value) => set({ [key]: value } as Pick<QuizDraft, typeof key>),
  toggleBrand: (list, brand) =>
    set((s) => {
      const other = list === 'brandLoves' ? 'brandBlocks' : 'brandLoves';
      const has = s[list].includes(brand);
      return {
        [list]: has ? s[list].filter((b) => b !== brand) : [...s[list], brand],
        [other]: s[other].filter((b) => b !== brand),
      } as Partial<QuizState>;
    }),
  toggleFlag: (flag) =>
    set((s) => ({
      injuryFlags: s.injuryFlags.includes(flag)
        ? s.injuryFlags.filter((f) => f !== flag)
        : [...s.injuryFlags, flag],
    })),
  reset: () => set({ ...initial }),
  toProfile: () => {
    const s = get();
    return {
      units: s.units,
      region: s.region,
      sex: s.sex ?? 'NA',
      age: s.age ?? 35,
      weightKg: s.weightKg ?? 75,
      weeklyKm: s.weeklyKm ?? 25,
      easyPaceSecPerKm: s.paceKind === 'easy' ? s.easyPaceSecPerKm : undefined,
      race:
        s.paceKind === 'race' && s.raceDistanceKm && s.raceTimeSec
          ? { distanceKm: s.raceDistanceKm === 42.2 ? 42.195 : s.raceDistanceKm, timeSec: s.raceTimeSec }
          : undefined,
      experience: s.experience ?? 'regular',
      mode: s.mode ?? 'single',
      primaryIntent: s.primaryIntent ?? 'everything',
      raceDistanceTargetKm: s.targetingRace ? (s.raceDistanceTargetKm ?? 42.2) : undefined,
      budget: { type: s.budgetType, amountGbp: s.budgetAmountGbp, stretch: s.budgetStretch },
      brandBlocks: s.brandBlocks,
      brandLoves: s.brandLoves,
      fit: { wide: s.wide, roomyToe: s.roomyToe },
      wantsStability: s.wantsStability,
      // GDPR: special-category inputs only used with explicit consent (quiz step 11)
      injuryFlags: s.injuryConsent ? s.injuryFlags : [],
      currentShoeSlug: s.currentShoeSlug,
      currentShoeVerdict: s.currentShoeVerdict,
    };
  },
}));
