import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const visualizations = [
	'algorithms/sorting',
	'algorithms/pathfinding',
	'networking/packet-routing',
	'networking/reliable-delivery'
];
const open = async (page: Page, path: string) => {
	await page.goto(path);
	// Hydrated: before this, clicks would do nothing.
	await page.waitForFunction(() => document.querySelector('input[type=range].timeline, main'));
	await page.waitForLoadState('networkidle');
};
const explanation = (page: Page) => page.locator('.explanation p');
const step = (page: Page) => page.locator('.position');
const timeline = (page: Page) => page.locator('input.timeline');
const seek = (page: Page, value: number) =>
	timeline(page).evaluate((input: HTMLInputElement, v) => {
		input.value = String(v);
		input.dispatchEvent(new Event('input', { bubbles: true }));
	}, value);

test.beforeEach(async ({ page }) => {
	// Anything going wrong in the console or leaving the site fails the test.
	page.on('pageerror', (error) => expect(error.message).toBe(''));
	page.on('request', (request) => expect(new URL(request.url()).hostname).toBe('127.0.0.1'));
});

test('from welcome page to a visualization', async ({ page }) => {
	await open(page, './');
	await page.getByRole('link', { name: 'Kies een onderwerp' }).click();
	await expect(page).toHaveURL(/\/subjects\/$/);
	await page.getByRole('link', { name: 'Netwerken' }).click();
	await expect(page).toHaveURL(/\/subjects\/networking\/$/);
	await expect(page.getByRole('table').getByRole('row')).toHaveCount(3);
	await page.getByRole('link', { name: 'Pakketten routeren' }).click();
	await expect(page).toHaveURL(/\/subjects\/networking\/packet-routing\/$/);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pakketten routeren');
});

test('step, step back, play', async ({ page }) => {
	await open(page, 'subjects/algorithms/sorting/');
	const first = await explanation(page).textContent();
	await page.getByRole('button', { name: 'Stap vooruit' }).click();
	await expect(explanation(page)).not.toHaveText(first!);
	await page.getByRole('button', { name: 'Stap terug' }).click();
	await expect(explanation(page)).toHaveText(first!);
	await page.getByLabel('Snelheid').selectOption('8');
	await page.locator('.controls').getByRole('button', { name: 'Afspelen' }).click();
	await expect(explanation(page)).toContainText('Gesorteerd', { timeout: 20_000 });
});

test('changing a setting restarts the run and ends up in the address', async ({ page }) => {
	await open(page, 'subjects/algorithms/sorting/');
	await page.getByRole('button', { name: 'Stap vooruit' }).click();
	await page.getByLabel('Algoritme').selectOption('quick');
	await expect(step(page)).toContainText('Stap 1 van');
	await expect(page.getByLabel('Keuze van de pivot')).toBeVisible();
	await expect(page).toHaveURL(/algorithm=quick/);
	await page.reload();
	await expect(page.getByLabel('Algoritme')).toHaveValue('quick');
});

test('a shared link gives everyone the same situation; nonsense is corrected', async ({
	page,
	browser
}) => {
	const link = 'subjects/algorithms/sorting/?algorithm=merge&size=20&seed=77';
	await open(page, link);
	const other = await browser.newPage();
	await other.goto(page.url());
	await expect(other.getByLabel('Aantal getallen')).toHaveValue('20');
	const bars = (p: Page) => p.locator('.main svg text').allTextContents();
	expect(await bars(page)).toEqual(await bars(other));

	await open(page, 'subjects/algorithms/sorting/?algorithm=<script>&size=9e9&seed=-1');
	await expect(page.getByLabel('Algoritme')).toHaveValue('bubble');
	await expect(page.getByLabel('Aantal getallen')).toHaveValue('64');
});

test('switching language keeps the run and the settings', async ({ page }) => {
	await open(page, 'subjects/algorithms/sorting/');
	await page.getByLabel('Aantal getallen').fill('10');
	await expect(page).toHaveURL(/size=10/);
	for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Stap vooruit' }).click();
	await expect(step(page)).toContainText('Stap 5 van');
	await page.getByRole('link', { name: 'English' }).click();
	await expect(page).toHaveURL(/\/en\/subjects\/algorithms\/sorting\/\?.*size=10/);
	await expect(step(page)).toContainText('Step 5 of');
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	await page.reload();
	await expect(page.getByLabel('Amount of numbers')).toHaveValue('10');
});

test('breaking a link loses packets, and the timeline can be rewound', async ({ page }) => {
	await open(page, 'subjects/networking/packet-routing/');
	await seek(page, 1500);
	await page.getByRole('button', { name: 'Verbreek de verbinding tussen R5 en R6' }).click();
	await expect(page.getByRole('button', { name: /Herstel.*R5 en R6/ })).toBeAttached();
	const lost = page.locator('dl div', { hasText: 'Verloren' }).locator('dd');
	await expect(lost).not.toHaveText('0');
	await seek(page, 500);
	await expect(lost).toHaveText('0');
	await page.getByRole('button', { name: 'Opnieuw' }).click();
	await seek(page, 1e9);
	await expect(explanation(page)).toContainText('20 aangekomen, 0 verloren');
});

test('works with the keyboard alone', async ({ page }) => {
	await open(page, 'subjects/networking/packet-routing/');
	await page.keyboard.press('ArrowRight');
	await expect(step(page)).toContainText('Stap 2 van');
	await page.keyboard.press('ArrowLeft');
	await expect(step(page)).toContainText('Stap 1 van');
	await page.getByRole('button', { name: /Verbreek.*S en R1/ }).focus();
	await page.keyboard.press('Enter');
	await expect(page.getByRole('button', { name: /Herstel.*S en R1/ })).toBeFocused();
	// Space on a focused button presses it once, and does not also start playing.
	await page.getByRole('button', { name: 'Stap vooruit' }).focus();
	const before = await step(page).textContent();
	await page.keyboard.press(' ');
	await expect(step(page)).not.toHaveText(before!);
	await expect(page.locator('.controls').getByRole('button', { name: 'Pauze' })).toHaveCount(0);
});

test('presentation mode on a digiboard', async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 1080 });
	await open(page, 'subjects/algorithms/pathfinding/');
	await page.getByRole('button', { name: 'Presenteren', exact: true }).click();
	await expect(page.getByLabel('Algoritme')).toHaveCount(0);
	await page.keyboard.press('PageDown');
	await expect(step(page)).toContainText('Stap 2 van');
	for (const button of await page.locator('.shell button').all()) {
		const box = (await button.boundingBox())!;
		expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(48);
		expect(box.y + box.height).toBeLessThanOrEqual(1080);
	}
	await page.getByRole('button', { name: 'Toon zijpaneel' }).click();
	await expect(page.getByLabel('Algoritme')).toBeVisible();
	await page.getByRole('button', { name: 'Stop presenteren' }).click();
	await expect(page.locator('html')).not.toHaveAttribute('data-present');
});

test('unknown pages explain themselves in the right language', async ({ page }) => {
	for (const path of ['en/subjects/nope/', 'en/nope/deeper/still/', 'nl/subjects/']) {
		const response = await page.goto(path);
		expect(response!.status()).toBe(404);
		const expected = path.startsWith('en/')
			? 'This page does not exist'
			: 'Deze pagina bestaat niet';
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(expected);
	}
});

for (const size of [
	{ width: 1366, height: 768 },
	{ width: 390, height: 844 }
]) {
	for (const path of ['', 'about/', 'subjects/', 'subjects/algorithms/', ...visualizations]) {
		const url = visualizations.includes(path) ? `subjects/${path}/` : path;
		test(`/${url} fits ${size.width}px and is accessible in both themes`, async ({ page }) => {
			await page.setViewportSize(size);
			for (const colorScheme of ['light', 'dark'] as const) {
				await page.emulateMedia({ colorScheme });
				await open(page, `./${url}`);
				if (visualizations.includes(path)) {
					for (let i = 0; i < 12; i++) {
						await page.getByRole('button', { name: 'Stap vooruit' }).click();
					}
				}
				const overflow = await page.evaluate(
					() => document.documentElement.scrollWidth - window.innerWidth
				);
				expect(overflow).toBeLessThanOrEqual(0);
				const { violations } = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
					.analyze();
				expect(
					violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target).join(' | ')}`)
				).toEqual([]);
			}
		});
	}
}

for (const path of visualizations) {
	test(`${path}: playback controls are visible without scrolling on a laptop`, async ({ page }) => {
		await open(page, `subjects/${path}/`);
		const box = (await page.locator('.controls').boundingBox())!;
		expect(box.y + box.height).toBeLessThanOrEqual(768);
	});
}
