import { expect, test } from '@playwright/test';

/**
 * The plan's Task-18 happy path: a 32 km/wk marathon-targeting runner with a
 * GBP 400 total budget walks the 11-step quiz, skips the reveal animations,
 * lands on a 3-shoe rotation with a carbon race slot, checks the detail page
 * offers + evidence, and the methodology page renders the full rule set.
 *
 * Note: expo-router keeps previous stack screens mounted on web, so controls
 * that repeat across quiz steps are selected with .last() (topmost screen).
 */
test('quiz to reveal to rotation results to detail', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('SOLEMATCH', { exact: true })).toBeVisible();

  await page.getByTestId('cta-start').click();

  const next = () => page.getByTestId('quiz-next').last().click();

  // 1 mode
  await page.getByTestId('choice-rotation').click();
  await next();
  // 2 sex
  await page.getByTestId('choice-M').click();
  await next();
  // 3 age
  await page.getByTestId('age-input').fill('35');
  await next();
  // 4 weight
  await page.getByTestId('weight-input').fill('78');
  await next();
  // 5 volume
  await page.getByTestId('volume-32').click();
  await next();
  // 6 pace (easy 5:30/km)
  await page.getByTestId('choice-easy').click();
  await page.getByTestId('easy-pace-m').fill('5');
  await page.getByTestId('easy-pace-s').fill('30');
  await next();
  // 7 intent: marathon target
  await page.getByTestId('targeting-race').click();
  await page.getByTestId('target-42.2').click();
  await next();
  // 8 experience
  await page.getByTestId('choice-regular').click();
  await next();
  // 9 fit (optional)
  await next();
  // 10 budget 400
  await page.getByTestId('budget-input').fill('400');
  await next();
  // 11 injury (optional) → reveal
  await next();

  // reveal: 3 cards (daily, tempo, race) — skip each animation, advance
  for (let card = 0; card < 3; card++) {
    const stage = page.getByTestId('reveal-stage').last();
    await expect(stage).toBeVisible({ timeout: 15_000 });
    await stage.click(); // skip animation
    const advance = page.getByTestId('reveal-next').last();
    await expect(advance).toBeVisible({ timeout: 10_000 });
    await advance.click();
  }

  // results: 3 role rows, race present, budget respected, evidence badge visible
  await expect(page.getByTestId('role-row-race')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('role-row-daily')).toBeVisible();
  await expect(page.getByTestId('role-row-tempo')).toBeVisible();
  await expect(page.getByText(/of £400 budget/)).toBeVisible();
  await expect(page.getByText('STRONG').first()).toBeVisible();

  // detail: offers with disclosure + cited reasons
  await page.getByTestId('role-row-race').click();
  await expect(page.getByText('Why this shoe, for you')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('Where to buy')).toBeVisible();
  await expect(page.getByText('SportsShoes').first()).toBeVisible();
  await expect(page.getByText('We may earn commission on retailer links.').last()).toBeVisible();
});

test('methodology page publishes the full rule set', async ({ page }) => {
  await page.goto('/methodology');
  await expect(page.getByText('Methodology')).toBeVisible();
  const rules = page.locator('[data-testid^="rule-"]');
  await expect(rules.nth(13)).toBeVisible({ timeout: 10_000 });
  expect(await rules.count()).toBeGreaterThanOrEqual(14);
  await expect(page.getByText(/percentile/i).first()).toBeVisible();
});

test('browse renders the catalogue grid with tiers', async ({ page }) => {
  await page.goto('/browse');
  await expect(page.getByTestId('browse-nike-vaporfly-4')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('ELITE').first()).toBeVisible();
});
