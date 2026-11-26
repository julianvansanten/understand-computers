import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const useTheme = (page: Page, css: string) =>
	page.route('**/theme.css', (route) => route.fulfill({ contentType: 'text/css', body: css }));
const theme = (light: string, dark: string) => `:root{--theme-light:${light};--theme-dark:${dark}}`;
const tokens = (page: Page, names: string[]) =>
	page.evaluate((list) => {
		const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
		const probe = document.body.appendChild(document.createElement('i'));
		const result = list.map((name) => {
			probe.style.color = `var(--${name})`;
			canvas.fillStyle = getComputedStyle(probe).color;
			canvas.fillRect(0, 0, 1, 1);
			return [...canvas.getImageData(0, 0, 1, 1).data].slice(0, 3);
		});
		probe.remove();
		return result;
	}, names);
const hex = (rgb: number[]) => '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
const schemes = ['light', 'dark'] as const;

function contrast(a: number[], b: number[]) {
	const luminance = (rgb: number[]) => {
		const [r, g, bl] = rgb.map((c) =>
			c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4
		);
		return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
	};
	const [x, y] = [luminance(a), luminance(b)];
	return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

test('without school colors, the standard ones are used', async ({ page }) => {
	await useTheme(page, '');
	const names = ['desk', 'paper', 'ink', 'pen', 'main', 'on-main', 'header', 'on-header', 'idle'];
	const expected = {
		light: '#e8edf7 #ffffff #16224f #1d3fbb #1d3fbb #ffffff #ffffff #16224f #c9d3ea',
		dark: '#10241f #18342c #f2f5ec #ffe27a #ffe27a #10241f #18342c #f2f5ec #3b5f54'
	};
	for (const colorScheme of schemes) {
		await page.emulateMedia({ colorScheme });
		await page.goto('./');
		expect((await tokens(page, names)).map(hex).join(' ')).toBe(expected[colorScheme]);
	}
});

test('every page loads theme.css next to the build', async ({ page, request }) => {
	expect((await request.get('./theme.css')).headers()['content-type']).toContain('text/css');
	for (const path of ['', 'en/subjects/networking/packet-routing/', 'nope/deeper/']) {
		const loaded = page.waitForResponse('**/theme.css');
		await page.goto(`./${path}`);
		expect((await loaded).status(), path).toBe(200);
	}
});

test('one color can be set on its own, and subjects keep their colors', async ({ page }) => {
	await useTheme(page, ':root{--theme-light:#b3131b}');
	await page.emulateMedia({ colorScheme: 'light' });
	await page.goto('./subjects/');
	const names = ['header', 'accent-blue', 'accent-green', 'failed'];
	expect((await tokens(page, names)).map(hex)).toEqual([
		'#b3131b',
		'#1d3fbb',
		'#0d6b3c',
		'#ff9aa1'
	]);
	await page.emulateMedia({ colorScheme: 'dark' });
	expect((await tokens(page, names)).map(hex)).toEqual([
		'#18342c',
		'#9fc0ff',
		'#8fdcae',
		'#ff9ea3'
	]);
});

test('every school color gives readable text and visible controls', async ({ page }) => {
	const levels = ['00', '33', '80', 'cc', 'ff'];
	const colors = levels.flatMap((r) => levels.flatMap((g) => levels.map((b) => `#${r}${g}${b}`)));
	const pairs: [text: string, ground: string, ratio: number][] = [
		['ink', 'desk', 4.5],
		['ink', 'paper', 4.5],
		['ink', 'idle', 4.5],
		['idle-text', 'idle', 4.5],
		['ink-soft', 'desk', 4.5],
		['ink-soft', 'paper', 4.5],
		['pen', 'desk', 4.5],
		['pen', 'paper', 4.5],
		['on-main', 'main', 4.5],
		['on-header', 'header', 4.5],
		['line-strong', 'paper', 3],
		['idle-edge', 'paper', 3],
		['accent-blue', 'paper', 3],
		['accent-green', 'paper', 3],
		['accent-purple', 'paper', 3],
		['accent-orange', 'paper', 3]
	];
	const names = [...new Set(pairs.flatMap(([a, b]) => [a, b]))];
	await useTheme(page, '');
	await page.goto('./about/');
	const problems: string[] = [];
	for (const colorScheme of schemes) {
		await page.emulateMedia({ colorScheme });
		for (const color of colors) {
			await page.evaluate(
				(c) =>
					['light', 'dark'].forEach((mode) =>
						document.documentElement.style.setProperty(`--theme-${mode}`, c)
					),
				color
			);
			const values = await tokens(page, names);
			for (const [text, ground, ratio] of pairs) {
				const actual = contrast(values[names.indexOf(text)]!, values[names.indexOf(ground)]!);
				// Colors are rounded to whole steps of 1/255 on screen.
				if (actual < ratio - 0.05) {
					problems.push(`${colorScheme} ${color}: ${text} on ${ground} ${actual.toFixed(2)}`);
				}
			}
		}
	}
	expect(problems).toEqual([]);
});

for (const [name, css] of [
	['red and amber', theme('#b3131b', '#ffb000')],
	['yellow and navy', theme('#ffd500', '#0a1a5c')],
	['black and white', theme('#000', '#fff')]
] as const) {
	test(`pages are accessible in ${name}`, async ({ page }) => {
		await useTheme(page, css);
		for (const colorScheme of schemes) {
			await page.emulateMedia({ colorScheme });
			for (const path of ['', 'subjects/', 'subjects/networking/packet-routing/']) {
				await page.goto(`./${path}`);
				const { violations } = await new AxeBuilder({ page })
					.withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
					.analyze();
				expect(
					violations.map((v) => `${v.id}: ${v.nodes.map((node) => node.target).join(' | ')}`)
				).toEqual([]);
			}
		}
	});
}
