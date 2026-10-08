import { test, expect } from 'playwright-test-coverage';

const menu = [
  { id: '1', title: 'Veggie', description: 'A garden of delight', image: 'pizza1.png', price: 0.0038 },
  { id: '2', title: 'Pepperoni', description: 'Spicy treat', image: 'pizza2.png', price: 0.0042 },
];

const franchises = {
  franchises: [
    {
      id: 'f1',
      name: 'LotaPizza',
      stores: [
        { id: 's1', name: 'Lehi' },
        { id: 's2', name: 'Springville' },
      ],
    },
  ],
  more: false,
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/order/menu', async (route) => {
    await route.fulfill({ json: menu });
  });
  await page.route('**/api/franchise**', async (route) => {
    await route.fulfill({ json: franchises });
  });
});

test('menu lists pizzas from the API', async ({ page }) => {
  await page.goto('/menu');

  await expect(page.getByText('Veggie')).toBeVisible();
  await expect(page.getByText('Pepperoni')).toBeVisible();
});

test('checkout is disabled until a store and a pizza are chosen', async ({ page }) => {
  await page.goto('/menu');

  const checkout = page.getByRole('button', { name: 'Checkout' });
  await expect(checkout).toBeDisabled();

  await page.getByText('Veggie').click();
  await expect(checkout).toBeDisabled();

  await page.getByRole('combobox').selectOption({ label: 'Lehi' });
  await expect(checkout).toBeEnabled();
});

test('checking out while logged out sends the diner to login', async ({ page }) => {
  await page.goto('/menu');

  await page.getByText('Veggie').click();
  await page.getByRole('combobox').selectOption({ label: 'Lehi' });
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Payment requires a logged-in diner, so an anonymous checkout is bounced to login.
  await expect(page).toHaveURL(/\/payment\/login$/);
});
