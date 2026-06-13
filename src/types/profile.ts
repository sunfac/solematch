export type Sex = 'M' | 'F' | 'NA';
export type Experience = 'new' | 'regular' | 'high';
/** What the runner cares about most — reweights the match toward that dimension. */
export type Priority = 'speed' | 'comfort' | 'value' | 'durability';
export type Role = 'race' | 'tempo' | 'daily' | 'recovery';
export type InjuryFlag = 'bone_stress' | 'achilles_calf' | 'knee' | 'plantar';
export type Units = 'metric' | 'imperial';

export interface Profile {
  units: Units;
  region: 'UK' | 'US';
  sex: Sex;
  age: number;
  weightKg: number;
  weeklyKm: number;
  easyPaceSecPerKm?: number;
  race?: { distanceKm: number; timeSec: number };
  experience: Experience;
  mode: 'single' | 'rotation';
  primaryIntent: Role | 'everything';
  raceDistanceTargetKm?: 5 | 10 | 21.1 | 42.2;
  budget: { type: 'perShoe' | 'total'; amountGbp: number; stretch: boolean };
  brandBlocks: string[];
  brandLoves: string[];
  fit: { wide: boolean; roomyToe: boolean };
  wantsStability: boolean;
  injuryFlags: InjuryFlag[];
  currentShoeSlug?: string;
  currentShoeVerdict?: 'love' | 'meh' | 'hate';
  /** optional: what matters most to this runner — biases the pick toward it */
  priority?: Priority;
}
