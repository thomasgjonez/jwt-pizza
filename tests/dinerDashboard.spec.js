import { test, expect } from 'playwright-test-coverage';

const dinerUser = {
  id: '7',
  name: 'Dina Smith',
  email: 'dina@jwt.com',
  roles: [{ role: 'diner' }, { role: 'franchisee', objectId: '3' }],
};

function seedAuthToken(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}

test.beforeEach(async ({ page }) => {
  await seedAuthToken(page);
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: dinerUser });
  });
});

test('shows the diner profile and roles', async ({ page }) => {
  await page.route('**/api/order', async (route) => {
    await route.fulfill({ json: { id: 'h1', dinerId: dinerUser.id, orders: [] } });
  });

  await page.goto('/diner-dashboard');

  await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();
  await expect(page.getByText('Dina Smith')).toBeVisible();
  await expect(page.getByText('dina@jwt.com')).toBeVisible();
  await expect(page.getByText('diner', { exact: true })).toBeVisible();
  await expect(page.getByText('Franchisee on 3')).toBeVisible();
});

test('prompts an empty-history diner to buy a pizza', async ({ page }) => {
  await page.route('**/api/order', async (route) => {
    await route.fulfill({ json: { id: 'h1', dinerId: dinerUser.id, orders: [] } });
  });

  await page.goto('/diner-dashboard');

  await expect(page.getByText('How have you lived this long without having a pizza?')).toBeVisible();
  await page.getByRole('link', { name: 'Buy one' }).click();
  await expect(page).toHaveURL(/\/menu$/);
});

test('shows order history when past orders exist', async ({ page }) => {
  await page.route('**/api/order', async (route) => {
    await route.fulfill({
      json: {
        id: 'h1',
        dinerId: dinerUser.id,
        orders: [
          { id: '101', franchiseId: 'f1', storeId: 's1', date: '2024-05-01T10:00:00Z', items: [{ menuId: '1', description: 'Veggie', price: 0.0038 }] },
          {
            id: '102',
            franchiseId: 'f1',
            storeId: 's1',
            date: '2024-05-02T10:00:00Z',
            items: [
              { menuId: '2', description: 'Pepperoni', price: 0.0042 },
              { menuId: '1', description: 'Veggie', price: 0.0038 },
            ],
          },
        ],
      },
    });
  });

  await page.goto('/diner-dashboard');

  await expect(page.getByText('Here is your history of all the good times.')).toBeVisible();
  const rows = page.locator('tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText('101');
  await expect(rows.nth(0)).toContainText('0.004 ₿');
  await expect(rows.nth(1)).toContainText('102');
  await expect(rows.nth(1)).toContainText('0.008 ₿');
});
