import { test, expect } from '@playwright/test';

test.describe('Appointments v2 (flagged)', () => {
	test('loads and shows header, allows opening booking', async ({ page }) => {
		await page.goto('/portal/appointments');
		await expect(page.getByRole('heading', { name: /appointments/i })).toBeVisible();
		await page.getByRole('button', { name: /book/i }).click();
		await expect(page.getByRole('heading', { name: /book appointment/i })).toBeVisible();
	});
});


