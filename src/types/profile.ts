export type Sex = 'M' | 'F' | 'NA';
export type Experience = 'new' | 'regular' | 'high';
/** What the runner cares about most — reweights the match toward that dimension. */
export type Priority = 'speed' | 'comfort' | 'value' | 'durability';
export type Role = 'race' | 'tempo' | 'daily' | 'recovery' | 'trail';
/**
 * Where the runner actually runs — gates the trail category in/out and sets the
 * grip target. 'road' (or unset) keeps the road-only behaviour; off-road values
 * add a trail slot and match lug depth / rubber / rock protection to the ground.
 */
export type Terrain = 'road' | 'road-trail' | 'trail' | 'technical';
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
  /** optional: where they run — gates trail shoes in and sets the grip target */
  terrain?: Terrain;
}
