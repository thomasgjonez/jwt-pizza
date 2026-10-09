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
  // Index 0 is the franchise-level close button; index 1 is the store row's close button.
  await page.getByRole('button', { name: 'Close' }).nth(1).click();
  await expect(page).toHaveURL(/\/close-store$/);
});

test('shows a confirmation naming the franchise and store to be closed', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByText('close the')).toBeVisible();
  await expect(page.getByText('LotaPizza')).toBeVisible();
  await expect(page.getByText('Lehi')).toBeVisible();
});

test('confirming closes the store and returns to the dashboard', async ({ page }) => {
  let deleteRequest;
  await page.route('**/api/franchise/f1/store/s1', async (route) => {
    deleteRequest = route.request();
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Close' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteRequest.method()).toBe('DELETE');
});

test('cancel returns to the dashboard without closing the store', async ({ page }) => {
  let deleteWasCalled = false;
  await page.route('**/api/franchise/f1/store/s1', async (route) => {
    deleteWasCalled = true;
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteWasCalled).toBe(false);
});
