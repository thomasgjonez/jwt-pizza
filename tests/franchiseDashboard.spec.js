import { test, expect } from 'playwright-test-coverage';

const franchiseeUser = {
  id: '9',
  name: 'Fran Chisee',
  email: 'fran@jwt.com',
  roles: [{ role: 'franchisee', objectId: '5' }],
};

const franchise = {
  id: '5',
  name: 'LotaPizza',
  admins: [{ name: 'Fran Chisee' }],
  stores: [
    { id: 's1', name: 'Lehi', totalRevenue: 100.1234 },
    { id: 's2', name: 'Springville', totalRevenue: 50 },
  ],
};

function seedAuthToken(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}

test('anonymous visitors see the franchise pitch page with a login link', async ({ page }) => {
  await page.goto('/franchise-dashboard');

  await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();

  await page.getByRole('link', { name: 'login', exact: true }).click();
  await expect(page).toHaveURL(/\/franchise-dashboard\/login$/);
});

test.describe('as a franchisee', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthToken(page);
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({ json: franchiseeUser });
    });
  });

  test('a franchisee with no franchise still sees the pitch page', async ({ page }) => {
    await page.route(`**/api/franchise/${franchiseeUser.id}`, async (route) => {
      await route.fulfill({ json: [] });
    });

    await page.goto('/franchise-dashboard');

    await expect(page.getByRole('heading', { name: 'So you want a piece of the pie?' })).toBeVisible();
  });

  test('shows the franchise stores and revenue', async ({ page }) => {
    await page.route(`**/api/franchise/${franchiseeUser.id}`, async (route) => {
      await route.fulfill({ json: [franchise] });
    });

    await page.goto('/franchise-dashboard');

    await expect(page.getByRole('heading', { name: 'LotaPizza' })).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();
    await expect(page.getByText('Springville')).toBeVisible();
    await expect(page.getByText('100.123 ₿')).toBeVisible();
  });

  test('create store button navigates to the create store form', async ({ page }) => {
    await page.route(`**/api/franchise/${franchiseeUser.id}`, async (route) => {
      await route.fulfill({ json: [franchise] });
    });

    await page.goto('/franchise-dashboard');
    await page.getByRole('button', { name: 'Create store' }).click();

    await expect(page).toHaveURL(/\/create-store$/);
    await expect(page.getByPlaceholder('store name')).toBeVisible();
  });

  test('closing a store navigates to the confirmation page', async ({ page }) => {
    await page.route(`**/api/franchise/${franchiseeUser.id}`, async (route) => {
      await route.fulfill({ json: [franchise] });
    });

    await page.goto('/franchise-dashboard');
    await page.getByRole('button', { name: 'Close' }).first().click();

    await expect(page).toHaveURL(/\/close-store$/);
    await expect(page.getByText('close the')).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();
  });
});
