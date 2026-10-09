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
  stores: [{ id: 's1', name: 'Lehi', totalRevenue: 100 }],
};

function seedAuthToken(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}

test.beforeEach(async ({ page }) => {
  await seedAuthToken(page);
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: franchiseeUser });
  });
  await page.route(`**/api/franchise/${franchiseeUser.id}`, async (route) => {
    await route.fulfill({ json: [franchise] });
  });

  await page.goto('/franchise-dashboard');
  await page.getByRole('button', { name: 'Create store' }).click();
  await expect(page).toHaveURL(/\/create-store$/);
});

test('renders the create store form', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Create store' })).toBeVisible();
  await expect(page.getByPlaceholder('store name')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
});

test('submitting the form creates a store for the franchise and returns to the dashboard', async ({ page }) => {
  let createRequestBody;
  await page.route(`**/api/franchise/${franchise.id}/store`, async (route) => {
    createRequestBody = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { id: 's2', name: createRequestBody.name } });
  });

  await page.getByPlaceholder('store name').fill('Orem');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  expect(createRequestBody).toMatchObject({ name: 'Orem' });
});

test('cancel returns to the dashboard without creating a store', async ({ page }) => {
  let createWasCalled = false;
  await page.route(`**/api/franchise/${franchise.id}/store`, async (route) => {
    createWasCalled = true;
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/franchise-dashboard$/);
  expect(createWasCalled).toBe(false);
});
