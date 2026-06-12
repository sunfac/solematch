import { RULES } from '@/data/rules';
import { COMMUNITY_BONUS, COMMUNITY_DARLINGS, SCORED } from '@/scores/formulas';
import type { Reason } from '@/types/match';
import type { Profile, Role } from '@/types/profile';
import type { Shoe } from '@/types/shoe';
import { bySlug } from '@/data/catalogue';

export interface ScoreCtx {
  /** marathon-equivalent pace, s/km (undefined = unknown ability) */
  mp?: number;
  /** plate-benefit taper 0.3-1 (paces.plateFactor) */
  factor: number;
  /** single-shoe "one for everything" mode */
  versatility: boolean;
}

export interface Contribution {
  delta: number;
  reason?: Reason;
}

type Modifier = (s: Shoe, p: Profile, role: Role, ctx: ScoreCtx) => Contribution | null;

const r = (ruleId: keyof typeof RULES & string, text: string): Reason => ({
  text,
  ruleId,
  evidence: RULES[ruleId].confidence,
});

const stats = (s: Shoe) => {
  const sc = SCORED.get(s.slug);
  if (!sc) throw new Error(`no scores for ${s.slug}`);
  return sc;
};

/** Race role: plate weighting scaled by pace; slow paces promote non-carbon options. */
const plateByPace: Modifier = (s, _p, role, ctx) => {
  if (role !== 'race') return null;
  if (s.plate === 'carbon') {
    const delta = 30 * ctx.factor - 30 * (1 - ctx.factor);
    const text =
      ctx.factor >= 0.85
        ? 'Carbon plate + race foam: studied ~3% economy gain at your race pace'
        : ctx.factor >= 0.55
          ? 'Carbon plate still helps at your pace, with a reduced studied benefit'
          : 'Rigid plates show little studied benefit at your pace — weighted down accordingly';
    return { delta, reason: r('plate-pace-scaling', text) };
  }
  if (s.plate === 'composite') {
    return {
      delta: 15 * ctx.factor,
      reason: r('plate-pace-scaling', 'Flexible plate gives a measured assist without full carbon stiffness'),
    };
  }
  if (ctx.factor < 0.6 && stats(s).spd >= 70) {
    return {
      delta: (0.6 - ctx.factor) * 60,
      reason: r('plate-pace-scaling', 'Light, bouncy and plate-free — the studied better bet at your race pace'),
    };
  }
  return null;
};

/** Race distance shaping: short races favour low mass/stack, marathons favour max stack. */
const raceDistance: Modifier = (s, p, role) => {
  if (role !== 'race' || p.raceDistanceTargetKm === undefined) return null;
  if (p.raceDistanceTargetKm <= 10) {
    const delta = 0.15 * stats(s).lgt - 0.1 * (s.stackHeelMm - 30);
    return {
      delta,
      reason:
        delta > 6
          ? r('mass-economy', 'Low mass counts double over 5K-10K — every 100 g costs ~1% energy')
          : undefined,
    };
  }
  if (p.raceDistanceTargetKm >= 42 && s.stackHeelMm >= 38) {
    return { delta: 8, reason: r('foam-energy-return', 'Max-legal stack of race foam protects your legs late in a marathon') };
  }
  return null;
};

/** Daily role: durability pays, plates cost mass without easy-pace benefit. */
const dailyDurability: Modifier = (s, _p, role) => {
  if (role !== 'daily') return null;
  const base = 0.25 * stats(s).dur;
  if (s.plate !== 'none') {
    return { delta: base - 10, reason: r('mass-economy', 'Plates add mass and stiffness without studied benefit at easy paces') };
  }
  return {
    delta: base,
    reason:
      stats(s).dur >= 75
        ? r('foam-energy-return', 'Durable foam platform holds its ride across high mileage')
        : undefined,
  };
};

/** Recovery role: softness/comfort leads; rigid plates mildly penalised. */
const recoverySoftness: Modifier = (s, _p, role) => {
  if (role !== 'recovery') return null;
  const base = 0.3 * stats(s).csh;
  if (s.plate === 'carbon') {
    return { delta: base - 12, reason: r('plate-bone-stress', 'Rigid plates are best kept out of recovery days') };
  }
  return {
    delta: base,
    reason: stats(s).csh >= 85 ? r('comfort-tiebreak', 'Deep, soft cushioning for genuinely easy days') : undefined,
  };
};

/** Tempo role: speed counts, flexible/no plates get a small durability-of-platform nod. */
const tempoFit: Modifier = (s, _p, role) => {
  if (role !== 'tempo') return null;
  const base = 0.2 * stats(s).spd;
  const plateBonus = s.plate !== 'carbon' ? 5 : 0;
  return {
    delta: base + plateBonus,
    reason:
      stats(s).spd >= 75
        ? r('foam-energy-return', 'High-return foam holds tempo pace without race-day fragility')
        : undefined,
  };
};

/**
 * Body mass: CONTINUOUS durability lean for heavier runners (durability/feel,
 * never injury) and softness lean for lighter runners — no dead zones, so a
 * changed answer always registers (the old thresholds ignored 61-85 kg entirely).
 */
const bodyMass: Modifier = (s, p, role) => {
  const heavyLean = Math.max(0, Math.min(1, (p.weightKg - 72) / 28)); // 0 at ≤72 kg → 1 at 100 kg
  const lightLean = Math.max(0, Math.min(1, (65 - p.weightKg) / 20)); // 0 at ≥65 kg → 1 at 45 kg
  if (heavyLean > 0 && role !== 'race') {
    // DIFFERENTIAL around dur 65: durable platforms rise, fragile foams sink —
    // reorders without inflating every score (an additive boost let starved
    // budget combos sneak past the right-sizing quality bar).
    const delta = heavyLean * 0.25 * (stats(s).dur - 65);
    return {
      delta,
      reason:
        delta >= 2.5 && stats(s).dur >= 75
          ? r('durable-foam-heavier', 'Durable foam and outsole keep their ride longer at higher body mass')
          : undefined,
    };
  }
  if (lightLean > 0) {
    const delta = lightLean * 0.12 * (stats(s).csh - 72);
    return {
      delta,
      reason:
        delta >= 1 && s.softness >= 4
          ? r('soft-midsole-light-runners', 'Softer midsoles showed modestly lower injury risk for lighter runners')
          : undefined,
    };
  }
  return null;
};

/** Drop × experience interaction (Malisoux 2016). */
const experienceDrop: Modifier = (s, p) => {
  if (p.experience !== 'new' && s.dropMm < 6) {
    const habituallyLow = p.currentShoeSlug
      ? (bySlug.get(p.currentShoeSlug)?.dropMm ?? 10) < 6
      : false;
    if (!habituallyLow) {
      return { delta: -8, reason: r('drop-experience', 'Low drop raised injury risk in experienced runners not used to it') };
    }
  }
  return null;
};

/** Masters lean: ramps continuously from 45 to 65 (no cliff at 50) toward rockered, cushioned rides (EMERGING). */
const age: Modifier = (s, p) => {
  const lean = Math.max(0, Math.min(1, (p.age - 45) / 20));
  if (lean === 0) return null;
  const rocker = s.stackFfMm >= 30 ? 1 : s.stackFfMm >= 26 ? 0.5 : 0;
  const cushion = stats(s).csh >= 75 ? 1 : stats(s).csh >= 65 ? 0.5 : 0;
  const delta = lean * 6 * rocker * cushion;
  if (delta === 0) return null;
  return {
    delta,
    reason: delta >= 3 ? r('masters-rocker', 'Rockered, cushioned ride offloads the calf-ankle complex') : undefined,
  };
};

/** Injury flags — bone-stress excludes carbon outside race; Achilles steers drop. */
const injuryFlags: Modifier = (s, p, role) => {
  if (p.injuryFlags.includes('bone_stress') && s.plate === 'carbon' && role !== 'race') {
    return { delta: -100, reason: r('plate-bone-stress', 'With bone-stress history, rigid carbon is capped to race day only') };
  }
  if (p.injuryFlags.includes('achilles_calf')) {
    const habituallyLow = p.currentShoeSlug
      ? (bySlug.get(p.currentShoeSlug)?.dropMm ?? 10) < 6
      : false;
    if (s.dropMm < 6 && !habituallyLow) {
      return { delta: -12, reason: r('achilles-drop', 'Low drops mechanically load the calf and Achilles harder') };
    }
    if (s.dropMm >= 8) {
      return { delta: 4, reason: r('achilles-drop', 'Higher drop eases calf and Achilles load') };
    }
  }
  return null;
};

/** Stability is a preference, never a prescription (Nielsen 2014). */
const stabilityPref: Modifier = (s, p, role) => {
  if (p.wantsStability) {
    return {
      delta: 0.2 * stats(s).stb,
      reason: stats(s).stb >= 76 ? r('no-pronation-matching', 'Supported feel because you prefer it — not because foot type demands it') : undefined,
    };
  }
  if (s.category === 'stability' && role !== 'daily') {
    return { delta: -6 };
  }
  return null;
};

/** Women's-specific last surfaces as a fit note for female users. */
const womensFit: Modifier = (s, p) => {
  if (p.sex === 'F' && s.womensLast) {
    return { delta: 3, reason: r('womens-last', 'Built on a women-specific last — narrower heel, roomier forefoot') };
  }
  return null;
};

/** Brand preference (FIT & FEEL). */
const brandLove: Modifier = (s, p) => {
  if (p.brandLoves.some((b) => b.toLowerCase() === s.brand.toLowerCase())) {
    return { delta: 3, reason: r('comfort-tiebreak', 'A brand you already get on with') };
  }
  return null;
};

/** Community consensus — visible, capped, never dominant. */
const consensusBoost: Modifier = (s) => {
  if (COMMUNITY_DARLINGS.has(s.slug)) {
    return { delta: COMMUNITY_BONUS, reason: r('community-consensus', 'Reviewer and community consensus pick of 2025-26') };
  }
  return null;
};

/** Single-shoe "everything" mode: versatile categories rise, pure racers sink. */
const versatility: Modifier = (s, _p, _role, ctx) => {
  if (!ctx.versatility) return null;
  if (s.category === 'daily' || s.category === 'tempo') {
    return { delta: 8, reason: r('rotation-injury', 'Versatile enough to cover most of your week in one shoe') };
  }
  if (s.category === 'race') return { delta: -15 };
  return null;
};

export const MODIFIERS: Modifier[] = [
  plateByPace,
  raceDistance,
  dailyDurability,
  recoverySoftness,
  tempoFit,
  bodyMass,
  experienceDrop,
  age,
  injuryFlags,
  stabilityPref,
  womensFit,
  brandLove,
  consensusBoost,
  versatility,
];
