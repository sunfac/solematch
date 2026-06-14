import type { MatchResult } from '@/types/match';

/** Live host — solematch.app is only the SEO canonical and may not resolve. */
export const SHARE_URL = 'https://solematch-production.up.railway.app';

const ROLE_LABEL: Record<string, string> = {
  race: 'Race day',
  tempo: 'Tempo',
  daily: 'Daily',
  long_run: 'Long run',
  recovery: 'Recovery',
  easy: 'Easy',
  trail: 'Trail',
  stability: 'Stability',
};

const name = (s: { brand: string; model: string; version: string }) =>
  `${s.brand} ${s.model} ${s.version}`.trim();

/**
 * The text users copy to share their result — the referral surface. Leads with
 * a hook (the standout pick + its match%) so a glance sells it, keeps the clean
 * breakdown, and ends with a clickable CTA on the LIVE host so recipients can
 * act. Pure + exported so the format is unit-tested, not asserted through DOM.
 */
export function buildShareLines(result: MatchResult): string[] {
  const tag = 'independent, science-backed matching';
  const cta = `Match yours → ${SHARE_URL}`;

  if (result.roles.length === 1) {
    const r = result.roles[0];
    return [
      `My ${r.pick.match}% SoleMatch pick: ${name(r.pick.shoe)}`,
      `£${result.totals.costGbp} · ${tag}`,
      cta,
    ];
  }

  const strongest = result.roles.reduce((a, b) => (b.pick.match > a.pick.match ? b : a));
  return [
    `My top SoleMatch pick: ${strongest.pick.match}% ${name(strongest.pick.shoe)}`,
    ...result.roles.map((r) => `${ROLE_LABEL[r.role] ?? r.role}: ${name(r.pick.shoe)} — ${r.pick.match}%`),
    `Total £${result.totals.costGbp} · ${tag}`,
    cta,
  ];
}

export const buildShareText = (result: MatchResult): string => buildShareLines(result).join('\n');
