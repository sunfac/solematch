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

  // 1 mode — auto-advances on selection
  await page.getByTestId('choice-rotation').click();
  // 2 about you (sex + age + weight on one screen)
  await expect(page.getByTestId('sex-M')).toBeVisible();
  await page.getByTestId('sex-M').click();
  await page.getByTestId('age-input').last().fill('35');
  await page.getByTestId('weight-input').last().fill('78');
  await next();
  // 3 volume — auto-advances
  await page.getByTestId('volume-32').click();
  // 4 pace (easy 5:30/km)
  await expect(page.getByTestId('choice-easy')).toBeVisible();
  await page.getByTestId('choice-easy').click();
  await page.getByTestId('easy-pace-m').fill('5');
  await page.getByTestId('easy-pace-s').fill('30');
  await next();
  // 5 intent: marathon target
  await page.getByTestId('targeting-race').click();
  await page.getByTestId('target-42.2').click();
  await next();
  // 6 experience
  await page.getByTestId('choice-regular').click();
  await next();
  // 7 fit (optional)
  await next();
  // 8 budget 400
  await page.getByTestId('budget-input').last().fill('400');
  await next();
  // 9 injury (optional) → reveal
  await next();

  // reveal: walk every card until the advance button text becomes "See my
  // rotation" — engine right-sizing depends on the live catalogue, so we
  // can't hard-code card count
  for (let i = 0; i < 4; i++) {
    const stage = page.getByTestId('reveal-stage').last();
    await expect(stage).toBeVisible({ timeout: 15_000 });
    await stage.click();
    const advance = page.getByTestId('reveal-next').last();
    await expect(advance).toBeVisible({ timeout: 10_000 });
    const label = (await advance.textContent()) ?? '';
    await advance.click();
    if (/See my rotation|See my result/i.test(label)) break;
  }

  // results: rotation under budget, evidence visible on the daily row
  await expect(page.getByTestId('role-row-race')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('role-row-daily')).toBeVisible();
  await expect(page.getByText(/of £400 budget/)).toBeVisible();
  await expect(
    page.getByTestId('role-row-daily').getByText(/STRONG|MODERATE|EMERGING|FIT & FEEL/).first(),
  ).toBeVisible();

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
