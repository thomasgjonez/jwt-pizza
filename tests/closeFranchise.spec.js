import { test, expect } from 'playwright-test-coverage';

const adminUser = {
  id: '1',
  name: 'Kai Chen',
  email: 'admin@jwt.com',
  roles: [{ role: 'admin' }],
};

const franchiseList = {
  franchises: [
    {
      id: 'f1',
      name: 'LotaPizza',
      admins: [{ name: 'Franny Owens' }],
      stores: [{ id: 's1', name: 'Lehi', totalRevenue: 100 }],
    },
  ],
  more: false,
};

function seedAuthToken(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}

test.beforeEach(async ({ page }) => {
  await seedAuthToken(page);
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: adminUser });
  });
  await page.route('**/api/franchise**', async (route) => {
    await route.fulfill({ json: franchiseList });
  });

  await page.goto('/admin-dashboard');
  await page.getByRole('button', { name: 'Close' }).first().click();
  await expect(page).toHaveURL(/\/close-franchise$/);
});

test('shows a confirmation naming the franchise to be closed', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByText('close the')).toBeVisible();
  await expect(page.getByText('LotaPizza')).toBeVisible();
});

test('confirming closes the franchise and returns to the dashboard', async ({ page }) => {
  let deleteRequest;
  await page.route('**/api/franchise/f1', async (route) => {
    deleteRequest = route.request();
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteRequest.method()).toBe('DELETE');
});

test('cancel returns to the dashboard without closing the franchise', async ({ page }) => {
  let deleteWasCalled = false;
  await page.route('**/api/franchise/f1', async (route) => {
    deleteWasCalled = true;
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteWasCalled).toBe(false);
});
