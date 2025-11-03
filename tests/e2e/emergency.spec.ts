import { test, expect } from '@playwright/test';

test('emergency button is visible on mobile portal', async ({ page, browserName }) => {
	await page.goto('/portal');
	// Button has aria-label "Emergency"
	await expect(page.getByRole('button', { name: /emergency/i })).toBeVisible();
});


