import { test, expect } from 'playwright-test-coverage';

const user = {
  id: '42',
  name: 'Kai Chen',
  email: 'kai@jwt.com',
  roles: [{ role: 'diner' }],
};

test('logging in shows the diner dashboard link and user avatar', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    expect(route.request().method()).toBe('PUT');
    await route.fulfill({ json: { user, token: 'fake-jwt-token' } });
  });

  await page.goto('/login');

  await page.getByPlaceholder('Email address').fill(user.email);
  await page.getByPlaceholder('Password').fill('secret123');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('KC')).toBeVisible();
});

test('shows an error message when login fails', async ({ page }) => {
  await page.route('**/api/auth', async (route) => {
    await route.fulfill({ status: 404, json: { message: 'unknown user' } });
  });

  await page.goto('/login');

  await page.getByPlaceholder('Email address').fill('nope@jwt.com');
  await page.getByPlaceholder('Password').fill('wrong');
  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page.getByText('unknown user')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});
