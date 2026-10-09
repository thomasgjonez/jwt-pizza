import { test, expect } from 'playwright-test-coverage';

const adminUser = {
  id: '1',
  name: 'Kai Chen',
  email: 'admin@jwt.com',
  roles: [{ role: 'admin' }],
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
    await route.fulfill({ json: { franchises: [], more: false } });
  });

  await page.goto('/admin-dashboard');
  await page.getByRole('button', { name: 'Add Franchise' }).click();
  await expect(page).toHaveURL(/\/create-franchise$/);
});

test('renders the create franchise form', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Create franchise' })).toBeVisible();
  await expect(page.getByText('Want to create franchise?')).toBeVisible();
  await expect(page.getByPlaceholder('franchise name')).toBeVisible();
  await expect(page.getByPlaceholder('franchisee admin email')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
});

test('submitting the form creates a franchise and returns to the dashboard', async ({ page }) => {
  let createRequestBody;
  await page.route('**/api/franchise', async (route) => {
    createRequestBody = route.request().postDataJSON();
    expect(route.request().method()).toBe('POST');
    await route.fulfill({ json: { id: 'f9', ...createRequestBody } });
  });

  await page.getByPlaceholder('franchise name').fill('PizzaPocket');
  await page.getByPlaceholder('franchisee admin email').fill('owner@jwt.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(createRequestBody).toMatchObject({ name: 'PizzaPocket', admins: [{ email: 'owner@jwt.com' }] });
});

test('cancel returns to the dashboard without creating a franchise', async ({ page }) => {
  let createWasCalled = false;
  await page.route('**/api/franchise', async (route) => {
    createWasCalled = true;
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(createWasCalled).toBe(false);
});
