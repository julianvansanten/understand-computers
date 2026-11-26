import { defineConfig } from '@playwright/test';

// Tests the built site. BASE_PATH must be the one it was built with.
const base = process.env.BASE_PATH ?? '';

export default defineConfig({
	testDir: 'tests',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: 'list',
	use: {
		baseURL: `http://127.0.0.1:4174${base}/`,
		viewport: { width: 1366, height: 768 },
		trace: 'retain-on-failure',
		launchOptions: { executablePath: process.env.CHROMIUM_PATH }
	},
	webServer: {
		command: 'node scripts/serve-build.mjs 4174',
		url: `http://127.0.0.1:4174${base}/`,
		reuseExistingServer: false
	}
});
