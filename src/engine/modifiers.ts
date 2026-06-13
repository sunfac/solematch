import { RULES } from '@/data/rules';
import { COMMUNITY_DARLINGS, COMMUNITY_NUDGE, SCORED } from '@/scores/formulas';
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
  /** profile-derived seed for the published dead-heat rotation */
  seed: string;
  /**
   * Multi-shoe rotation context. When true, scoreRole applies the dead-heat
   * rotation to the ranking pool so different runners see different tied picks;
   * a single-shoe recommendation leaves it false and gets the precise best fit.
   */
  rotate?: boolean;
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
    // Marathon: max-legal stack PLUS the best race foam wins — over 42 km the
    // energy return of a premier supershoe (PEBA, top plate) outweighs a gram
    // or two. Rewarding foam/plate quality (spd) here, not a flat bonus, lets
    // the iconic marathon shoes (Alphafly-class) rank where elites actually
    // race them, instead of losing to a lighter short-course racer.
    // floor at the old flat +8 so conservative max-stack shoes are unchanged;
    // only the premier race foams (high spd) earn the extra, lifting the
    // Alphafly-class to where elites actually race them.
    const delta = 8 + Math.max(0, 0.2 * (stats(s).spd - 82));
    return {
      delta,
      reason: r('foam-energy-return', 'Max-legal stack of premier race foam — propulsion that holds deep into a marathon'),
    };
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
    // Surface the evidence whenever the pick IS a soft shoe — gating the
    // reason on a csh-based delta threshold meant lighter runners were
    // never told why a soft pick was chosen for them unless they landed
    // on the absolute plushest shoe in the catalogue.
    return {
      delta,
      reason:
        s.softness >= 4 && lightLean >= 0.3
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

/**
 * Current-shoe anchoring — the fitter's first question. Similarity = shared
 * brand last + foam class + drop band + category; loving your current shoe
 * boosts its close cousins, disliking it steers away from the same formula.
 */
const currentShoeAffinity: Modifier = (s, p) => {
  if (!p.currentShoeSlug || !p.currentShoeVerdict || p.currentShoeVerdict === 'meh') return null;
  const cur = bySlug.get(p.currentShoeSlug);
  if (!cur || cur.slug === s.slug) return null;
  const similar =
    (s.brand === cur.brand ? 1 : 0) +
    (s.foamClass === cur.foamClass ? 1 : 0) +
    (Math.abs(s.dropMm - cur.dropMm) <= 2 ? 1 : 0) +
    (s.category === cur.category ? 1 : 0);
  if (similar < 2) return null;
  if (p.currentShoeVerdict === 'love') {
    return {
      delta: similar * 1.8,
      reason:
        similar >= 3
          ? r('fit-continuity', `Close cousin of the ${cur.model} you love — same fit DNA`)
          : undefined,
    };
  }
  return {
    delta: -similar * 2.2,
    reason:
      similar >= 3
        ? r('fit-continuity', `Different formula to the ${cur.model} that didn't work for you`)
        : undefined,
  };
};

/**
 * Forefoot-shape match — the fit dimension US widths don't capture.
 * Three signals stack:
 *  - roomy-seeker on a roomy shoe = strong positive (Altra/Topo/Hoka wide
 *    cruisers, Brooks Ghost Max, NB More — the actual foot-shape lasts)
 *  - roomy-seeker on a narrow shoe = strong negative (Adizero, Asics race,
 *    Streakfly — won't fit a wide forefoot honestly)
 *  - no roomy ask + narrow shoe in race/tempo slot = small positive (the
 *    performance-fit preference of users not signalling foot-width issues)
 * Falls back to brand+consensus heuristics when explicit shape data absent.
 */
const forefootFit: Modifier = (s, p, role) => {
  const explicit = s.forefootShape;
  const hint =
    explicit ??
    (s.brand === 'Altra' || s.brand === 'Topo' || /toe box|foot-shaped|roomy/i.test(s.consensus)
      ? 'roomy'
      : undefined);
  if (p.fit.roomyToe) {
    if (hint === 'roomy') {
      return {
        delta: 6,
        reason: r('fit-continuity', 'Known roomy forefoot for a wide-foot fit'),
      };
    }
    if (hint === 'narrow') {
      return {
        delta: -8,
        reason: r('fit-continuity', 'Narrow racer last — likely too snug for a wide-foot fit'),
      };
    }
    return null;
  }
  // No width preference expressed → forefoot shape is neutral. (A previous
  // blanket +2 for narrow racers silently re-ranked the supershoe hierarchy by
  // width — pushing roomier-fitting icons like the Alphafly below narrower
  // rivals. Race order should be decided by evidence — plate, foam, mass,
  // distance — not forefoot width nobody asked about.)
  return null;
};

/**
 * Stated priority — what the runner told us matters most. A differential around
 * 70 on the chosen dimension: shoes that excel at your priority rise, weak ones
 * sink, so two runners with the same body/pace but different priorities get
 * genuinely different (personalised, not random) picks. Bounded ~±4 — enough to
 * decide a dead heat, never enough to override an evidence-led or budget signal.
 */
export const PRIORITY_STAT: Record<NonNullable<Profile['priority']>, 'spd' | 'csh' | 'val' | 'dur'> = {
  speed: 'spd',
  comfort: 'csh',
  value: 'val',
  durability: 'dur',
};
export const PRIORITY_LABEL: Record<NonNullable<Profile['priority']>, string> = {
  speed: 'speed',
  comfort: 'cushioning',
  value: 'value',
  durability: 'durability',
};

/**
 * The runner's stated-priority stat for a shoe (0 when no priority). Shared by
 * the slot-level and combo-level dead-heat tiebreaks (scoring.ts / rotation.ts)
 * so a stated preference breaks statistical ties deterministically toward what
 * the runner actually cares about, instead of a blind profile-seeded shuffle.
 */
export function priorityAffinity(slug: string, priority: Profile['priority']): number {
  if (!priority) return 0;
  const sc = SCORED.get(slug);
  return sc ? (sc[PRIORITY_STAT[priority]] as number) : 0;
}

const priorityBoost: Modifier = (s, p) => {
  if (!p.priority) return null;
  const dim = stats(s)[PRIORITY_STAT[p.priority]] as number;
  // Differential around 68, capped at ±4.5: strong enough to pull a priority-
  // leaning shoe INTO the dead-heat band (where the directed tiebreaks then
  // surface it), never enough to close an evidence- or role-fit gap on its own.
  const delta = Math.max(-4.5, Math.min(4.5, 0.18 * (dim - 68)));
  return {
    delta,
    // Surface the lean whenever the shoe genuinely excels at the chosen
    // dimension — not only when the (deliberately small) delta clears a bar —
    // so the runner is actually told their pick leans toward what they picked.
    reason:
      dim >= 70
        ? r('comfort-tiebreak', `Leans into the ${PRIORITY_LABEL[p.priority]} you told us matters most`)
        : undefined,
  };
};

/** Brand preference (FIT & FEEL). */
const brandLove: Modifier = (s, p) => {
  if (p.brandLoves.some((b) => b.toLowerCase() === s.brand.toLowerCase())) {
    return { delta: 3, reason: r('comfort-tiebreak', 'A brand you already get on with') };
  }
  return null;
};

/** Community consensus — a gentle per-user nudge (+2), never a decider; fit leads. */
const consensusBoost: Modifier = (s) => {
  if (COMMUNITY_DARLINGS.has(s.slug)) {
    return { delta: COMMUNITY_NUDGE, reason: r('community-consensus', 'Reviewer and community consensus pick of 2025-26') };
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
  currentShoeAffinity,
  forefootFit,
  priorityBoost,
  brandLove,
  consensusBoost,
  versatility,
];
