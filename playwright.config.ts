import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 60_000,
	retries: 1,
	use: {
		baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
		trace: 'on-first-retry',
		headless: true,
	},
	projects: [
		{ name: 'Chromium', use: { ...devices['Desktop Chrome'] } },
		{ name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
		{ name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
	],
});


