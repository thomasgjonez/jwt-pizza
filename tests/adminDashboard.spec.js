import { test, expect } from 'playwright-test-coverage';

const adminUser = {
  id: '1',
  name: 'Kai Chen',
  email: 'admin@jwt.com',
  roles: [{ role: 'admin' }],
};

const dinerUser = {
  id: '2',
  name: 'Dina Diner',
  email: 'diner@jwt.com',
  roles: [{ role: 'diner' }],
};

const franchiseList = {
  franchises: [
    {
      id: 'f1',
      name: 'LotaPizza',
      admins: [{ name: 'Franny Owens' }],
      stores: [
        { id: 's1', name: 'Lehi', totalRevenue: 100.1234 },
        { id: 's2', name: 'Springville', totalRevenue: 50 },
      ],
    },
  ],
  more: true,
};

function seedAuthToken(page) {
  return page.addInitScript(() => {
    window.localStorage.setItem('token', 'test-token');
  });
}

test.describe('as an admin', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthToken(page);
    await page.route('**/api/user/me', async (route) => {
      await route.fulfill({ json: adminUser });
    });
  });

  test('shows the franchise table with stores and revenue', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      await route.fulfill({ json: franchiseList });
    });

    await page.goto('/admin-dashboard');

    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();
    await expect(page.getByText('Franny Owens')).toBeVisible();
    await expect(page.getByText('Lehi')).toBeVisible();
    await expect(page.getByText('Springville')).toBeVisible();
    await expect(page.getByText('100.123 ₿')).toBeVisible();
  });

  test('filtering franchises re-queries the API with the filter text', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get('name') === '*lota*') {
        await route.fulfill({ json: franchiseList });
      } else {
        await route.fulfill({ json: { franchises: [], more: false } });
      }
    });

    await page.goto('/admin-dashboard');
    await expect(page.getByText('LotaPizza')).not.toBeVisible();

    await page.getByPlaceholder('Filter franchises').fill('lota');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByText('LotaPizza')).toBeVisible();
  });

  test('paging is disabled on the first page and enabled when more results exist', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      await route.fulfill({ json: franchiseList });
    });

    await page.goto('/admin-dashboard');

    await expect(page.getByRole('button', { name: '«' })).toBeDisabled();
    await expect(page.getByRole('button', { name: '»' })).toBeEnabled();
  });

  test('closing a franchise navigates to the confirmation page', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      await route.fulfill({ json: franchiseList });
    });

    await page.goto('/admin-dashboard');

    await page.getByRole('button', { name: 'Close' }).first().click();

    await expect(page).toHaveURL(/\/close-franchise$/);
    await expect(page.getByText('close the')).toBeVisible();
    await expect(page.getByText('LotaPizza')).toBeVisible();
  });

  test('closing a store navigates to the confirmation page', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      await route.fulfill({ json: franchiseList });
    });

    await page.goto('/admin-dashboard');

    await page.getByRole('button', { name: 'Close' }).nth(1).click();

    await expect(page).toHaveURL(/\/close-store$/);
  });

  test('add franchise button navigates to the create franchise form', async ({ page }) => {
    await page.route('**/api/franchise**', async (route) => {
      await route.fulfill({ json: { franchises: [], more: false } });
    });

    await page.goto('/admin-dashboard');

    await page.getByRole('button', { name: 'Add Franchise' }).click();

    await expect(page).toHaveURL(/\/create-franchise$/);
    await expect(page.getByText('Want to create franchise?')).toBeVisible();
  });
});

test('non-admin diners are shown the not found page instead of the dashboard', async ({ page }) => {
  await seedAuthToken(page);
  await page.route('**/api/user/me', async (route) => {
    await route.fulfill({ json: dinerUser });
  });

  await page.goto('/admin-dashboard');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});

test('anonymous visitors are shown the not found page instead of the dashboard', async ({ page }) => {
  await page.goto('/admin-dashboard');

  await expect(page.getByRole('heading', { name: 'Oops' })).toBeVisible();
});
