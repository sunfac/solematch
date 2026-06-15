import type { Shoe } from '@/types/shoe';

/**
 * Honest "who it's NOT for" caveats, derived deterministically from a shoe's
 * own specs — the counterweight to the match reasons. An independent matcher
 * should say who should walk away, not just who should buy; doing it from the
 * catalogue (not hand-written marketing) keeps it consistent across all shoes
 * and unit-testable. Returns the 1–2 most salient caveats, or [] when a shoe is
 * a genuine all-rounder. Pure.
 */
export function avoidIf(s: Shoe): string[] {
  const c: { p: number; t: string }[] = [];

  if (s.category === 'race')
    c.push({ p: 9, t: 'You want an everyday trainer — this is a firm, aggressive race tool, best saved for fast days and racing.' });
  if (s.plate === 'carbon' && s.category !== 'trail')
    c.push({ p: 6, t: "You're new to carbon-plated shoes — the propulsion rewards a quick midfoot turnover and can feel tippy at easy paces." });
  if (s.msrpGbp >= 240)
    c.push({ p: 7, t: `You're on a budget — at £${s.msrpGbp} this is flagship money, and there's strong value lower down the list.` });
  if (s.category === 'max_cushion' || s.stackHeelMm >= 42)
    c.push({ p: 5, t: 'You want ground feel or a low, connected ride — this is a tall, soft, protective platform.' });
  if (s.stackHeelMm <= 26 && s.category !== 'race')
    c.push({ p: 5, t: 'You want plush cushioning for long, slow miles — this rides firm and close to the ground.' });
  if (s.stability >= 4)
    c.push({ p: 4, t: 'You run neutral and find medial posts or guidance rails intrusive.' });
  if (s.stability <= 2 && s.category !== 'race' && s.category !== 'trail')
    c.push({ p: 3, t: 'You overpronate and want structured support — this is a neutral ride.' });
  if (s.weightG >= 290)
    c.push({ p: 4, t: `You want a light, quick-feeling shoe — at ${s.weightG} g this is a substantial trainer.` });
  if (s.dropMm <= 4)
    c.push({ p: 3, t: "You've tight calves or Achilles, or you're used to a higher drop — a low drop loads the lower leg more." });
  if (s.category === 'trail')
    c.push({ p: 6, t: 'You mostly run on road — the aggressive lugs feel draggy and wear quickly on pavement.' });
  if (s.category === 'budget')
    c.push({ p: 5, t: 'You want top-end propulsion or plush max-cushion — this prioritises value over peak performance.' });
  if (s.widths.length === 1 && s.widths[0] === 'standard')
    c.push({ p: 2, t: 'You need a wide or narrow fit — this comes in standard width only.' });

  return c
    .sort((a, b) => b.p - a.p)
    .slice(0, 2)
    .map((x) => x.t);
}
