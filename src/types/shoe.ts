export type FoamClass = 'PEBA' | 'TPEE' | 'TPU' | 'EVA' | 'BLEND';
export type Plate = 'carbon' | 'composite' | 'none';
export type Category = 'race' | 'tempo' | 'daily' | 'max_cushion' | 'stability' | 'budget' | 'trail';
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
  /**
   * Curated forefoot shape (the fit dimension US widths don't capture):
   * 'narrow' — snug, racer-style last (Adidas Adizero, Asics race, Mizuno race,
   *   Nike Streakfly). Performance pickers love this; wide-foot runners suffer.
   * 'roomy' — explicitly wide forefoot (Altra/Topo foot-shaped lasts,
   *   Hoka Gaviota-class wide-fit cruisers, Brooks Ghost Max wide platform).
   * undefined / 'standard' — middle of the road.
   * Absent = standard (back-compat with existing data).
   */
  forefootShape?: 'narrow' | 'standard' | 'roomy';
  /** Trail only — outsole lug depth in mm (grip vs terrain; the biggest trail signal). */
  lugDepthMm?: number;
  /** Trail only — outsole rubber compound, e.g. "Vibram Megagrip", "Contagrip TA". */
  outsoleRubber?: string;
  /** Trail only — dedicated rock shield / plate underfoot for protection. */
  rockPlate?: boolean;
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
