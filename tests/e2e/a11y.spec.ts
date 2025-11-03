import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function axeScan(page: any) {
	const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
	expect(results.violations, JSON.stringify(results.violations, null, 2)).toHaveLength(0);
}

test.describe('Accessibility', () => {
	test('portal home has no critical a11y issues', async ({ page }) => {
		await page.goto('/portal');
		await axeScan(page);
	});

	test('appointments page has no critical a11y issues', async ({ page }) => {
		await page.goto('/portal/appointments');
		await axeScan(page);
	});
});


