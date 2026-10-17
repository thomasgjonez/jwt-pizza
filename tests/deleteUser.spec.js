import { test, expect } from 'playwright-test-coverage';

const adminUser = {
  id: '1',
  name: 'Kai Chen',
  email: 'admin@jwt.com',
  roles: [{ role: 'admin' }],
};

const userList = {
  users: [{ id: '5', name: 'Buddy', email: 'b@jwt.com', roles: [{ role: 'diner' }] }],
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
    await route.fulfill({ json: { franchises: [], more: false } });
  });
  await page.route('**/api/user?**', async (route) => {
    await route.fulfill({ json: userList });
  });

  await page.goto('/admin-dashboard');
  await page.getByRole('row', { name: /Buddy/ }).getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/close-user$/);
});

test('shows a confirmation naming the user to be deleted', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Sorry to see you go' })).toBeVisible();
  await expect(page.getByText('Buddy')).toBeVisible();
});

test('confirming deletes the user and returns to the dashboard', async ({ page }) => {
  let deleteRequest;
  await page.route('**/api/user/5', async (route) => {
    deleteRequest = route.request();
    await route.fulfill({ json: { message: 'user deleted' } });
  });

  await page.getByRole('button', { name: 'Delete' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteRequest.method()).toBe('DELETE');
});

test('cancel returns to the dashboard without deleting the user', async ({ page }) => {
  let deleteWasCalled = false;
  await page.route('**/api/user/5', async (route) => {
    deleteWasCalled = true;
    await route.fulfill({ json: {} });
  });

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page).toHaveURL(/\/admin-dashboard$/);
  expect(deleteWasCalled).toBe(false);
});
