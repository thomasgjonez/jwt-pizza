import { test, expect } from 'playwright-test-coverage';

test('nav bar links to the main views', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('navigation').getByRole('link', { name: 'Order' }).click();
  await expect(page).toHaveURL(/\/menu$/);

  await page.getByRole('navigation').getByRole('link', { name: 'Login' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole('navigation').getByRole('link', { name: 'Register' }).click();
  await expect(page).toHaveURL(/\/register$/);
});

test('unknown route shows the not found page', async ({ page }) => {
  await page.goto('/this-pizza-does-not-exist');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
  await expect(page.getByText('dropped a pizza on the floor')).toBeVisible();
});
