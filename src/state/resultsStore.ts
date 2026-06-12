import { create } from 'zustand';
import type { MatchResult } from '@/types/match';

interface ResultsState {
  result: MatchResult | null;
  matchId: string | null;
  setResult: (r: MatchResult) => void;
  clear: () => void;
}

/** Holds the last MatchResult for reveal/results/detail screens. Session-only. */
export const useResultsStore = create<ResultsState>((set) => ({
  result: null,
  matchId: null,
  setResult: (result) =>
    set({ result, matchId: `m-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}` }),
  clear: () => set({ result: null, matchId: null }),
}));
