import { test, expect } from 'playwright-test-coverage';

const adminUser = {
  id: '1',
  name: 'Kai Chen',
  email: 'admin@jwt.com',
  roles: [{ role: 'admin' }],
};

const userList = {
  users: [
    { id: '3', name: 'Kai Chen', email: 'd@jwt.com', roles: [{ role: 'diner' }] },
    { id: '5', name: 'Buddy', email: 'b@jwt.com', roles: [{ role: 'admin' }] },
  ],
  more: true,
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
});

test('shows the user list with name, email, and role', async ({ page }) => {
  await page.route('**/api/user?**', async (route) => {
    await route.fulfill({ json: userList });
  });

  await page.goto('/admin-dashboard');

  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible();
  await expect(page.getByText('Kai Chen')).toBeVisible();
  await expect(page.getByText('d@jwt.com')).toBeVisible();
  await expect(page.getByText('Buddy')).toBeVisible();
  await expect(page.getByText('b@jwt.com')).toBeVisible();
});

test('filtering users re-queries the API with the filter text', async ({ page }) => {
  await page.route('**/api/user?**', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('name') === '*buddy*') {
      await route.fulfill({ json: userList });
    } else {
      await route.fulfill({ json: { users: [], more: false } });
    }
  });

  await page.goto('/admin-dashboard');
  await expect(page.getByText('Buddy')).not.toBeVisible();

  await page.getByPlaceholder('Filter users').fill('buddy');
  await page.getByRole('button', { name: 'Search' }).click();

  await expect(page.getByText('Buddy')).toBeVisible();
});

test('paging is disabled on the first page and enabled when more results exist', async ({ page }) => {
  await page.route('**/api/user?**', async (route) => {
    await route.fulfill({ json: userList });
  });

  await page.goto('/admin-dashboard');

  await expect(page.getByRole('button', { name: 'Previous users page' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next users page' })).toBeEnabled();
});

test('delete button navigates to the user deletion confirmation page', async ({ page }) => {
  await page.route('**/api/user?**', async (route) => {
    await route.fulfill({ json: userList });
  });

  await page.goto('/admin-dashboard');

  await page.getByRole('row', { name: /Buddy/ }).getByRole('button', { name: 'Delete' }).click();

  await expect(page).toHaveURL(/\/close-user$/);
  await expect(page.getByText('Buddy')).toBeVisible();
});
