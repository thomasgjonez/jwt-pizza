import { test, expect } from 'playwright-test-coverage';

test('home page loads with title and hero', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('JWT Pizza');
  await expect(page.getByRole('heading', { name: "The web's best pizza" })).toBeVisible();
});

test('order now button navigates to the menu', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Order now' }).click();

  await expect(page).toHaveURL(/\/menu$/);
  await expect(page.getByText('Pick your store and pizzas from below.')).toBeVisible();
});
