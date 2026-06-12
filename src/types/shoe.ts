export type FoamClass = 'PEBA' | 'TPEE' | 'TPU' | 'EVA' | 'BLEND';
export type Plate = 'carbon' | 'composite' | 'none';
export type Category = 'race' | 'tempo' | 'daily' | 'max_cushion' | 'stability' | 'budget';
export type Tier = 'ELITE' | 'GOLD' | 'SILVER' | 'BRONZE';

export interface Shoe {
  id: string;
  brand: string;
  model: string;
  version: string;
  slug: string;
  category: Category;
  msrpUsd: number;
  msrpGbp: number;
  priceApprox?: boolean;
  weightG: number;
  dropMm: number;
  stackHeelMm: number;
  stackFfMm: number;
  foamName: string;
  foamClass: FoamClass;
  plate: Plate;
  widths: string[];
  womensLast: boolean;
  /** curated: 1 firm → 5 plush */
  softness: 1 | 2 | 3 | 4 | 5;
  /** curated: 1 unstable → 5 max guidance */
  stability: 1 | 2 | 3 | 4 | 5;
  /** curated rubber coverage/durability */
  outsole: 1 | 2 | 3 | 4 | 5;
  consensus: string;
  athleteNotes?: string;
  sources: string[];
  status: 'current' | 'superseded' | 'upcoming';
  releaseYear: number;
  /** true where stack/etc. estimated pending brand-site verification */
  specEstimated?: boolean;
}

export interface ShoeScores {
  spd: number;
  csh: number;
  stb: number;
  lgt: number;
  dur: number;
  val: number;
  overall: number;
  tier: Tier;
  formulaVersion: 1;
}
