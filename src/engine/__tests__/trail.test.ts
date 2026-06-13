/**
 * Trail: terrain gates the trail category in/out, and grip (lug depth + rubber +
 * rock protection) is matched to the ground — the dominant trail signal, with
 * carbon plates deliberately NOT rewarded off-road.
 */
import { SHOES } from '@/data/catalogue';
import { SCORED } from '@/scores/formulas';
import type { Profile, Terrain } from '@/types/profile';
import { runMatch } from '../index';
import { hardFilter } from '../filters';
import { planRoles } from '../rolePlan';
import { baseProfile } from './filtersRolePlan.test';

const trailProfile = (terrain: Terrain, over: Partial<Profile> = {}): Profile =>
  baseProfile({
    mode: 'single',
    primaryIntent: 'daily',
    terrain,
    budget: { type: 'perShoe', amountGbp: 250, stretch: false },
    ...over,
  });

const pick = (terrain: Terrain) => runMatch(trailProfile(terrain)).roles[0].pick.shoe;

describe('trail terrain gating', () => {
  test('a road runner (no terrain) never sees trail shoes', () => {
    const { eligible } = hardFilter(SHOES, baseProfile());
    expect(eligible.some((s) => s.category === 'trail')).toBe(false);
  });

  test('an off-road runner gets trail shoes eligible and a trail role', () => {
    const p = trailProfile('trail');
    const { eligible } = hardFilter(SHOES, p);
    expect(eligible.some((s) => s.category === 'trail')).toBe(true);
    expect(planRoles(p)).toContain('trail');
  });

  test('a single off-road pick is a real trail shoe', () => {
    const r = runMatch(trailProfile('trail'));
    expect(r.roles[0].role).toBe('trail');
    expect(r.roles[0].pick.shoe.category).toBe('trail');
  });
});

describe('trail grip matched to terrain', () => {
  test('technical terrain picks deeper, grippier lugs than door-to-trail', () => {
    const tech = pick('technical');
    const door = pick('road-trail');
    expect((tech.lugDepthMm ?? 0)).toBeGreaterThan(door.lugDepthMm ?? 0);
  });

  test('the door-to-trail pick is a shallow-lug shoe (not a mud spike)', () => {
    expect(pick('road-trail').lugDepthMm ?? 0).toBeLessThanOrEqual(4.5);
  });

  test('the technical pick has a sticky outsole compound', () => {
    expect(/vibram|frixion|contagrip|megagrip|sticky/i.test(pick('technical').outsoleRubber ?? '')).toBe(true);
  });

  test('different terrains can land on different shoes', () => {
    expect(pick('road-trail').slug).not.toBe(pick('technical').slug);
  });

  test('trail matching is deterministic', () => {
    expect(pick('trail').slug).toBe(pick('trail').slug);
  });
});
