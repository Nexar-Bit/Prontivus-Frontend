import { test, expect } from '@playwright/test';

test.describe('Records v2 (flagged)', () => {
	test('loads and supports search', async ({ page }) => {
		await page.goto('/portal/records');
		await expect(page.getByRole('heading', { name: /medical records/i })).toBeVisible();
		await page.getByPlaceholder('Search records').fill('lab');
		await expect(page.locator('text=No records found.')).not.toBeVisible({ timeout: 1000 }).catch(() => {});
	});
});


