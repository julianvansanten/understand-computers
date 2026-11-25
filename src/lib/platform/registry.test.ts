import { describe, expect, it } from 'vitest';
import { collectFrames } from './engine/model.ts';
import { decode, defaults, encode, type Parameter } from './engine/parameters.ts';
import { defaultLocale, locales } from './i18n/locales.ts';
import { platformMessages } from './i18n/messages.ts';
import { placeholders, type Dictionary } from './i18n/translate.ts';
import { loadVisualization, subjects, visualizationFiles } from './registry.ts';

function expectComplete(messages: Dictionary) {
	const base = messages[defaultLocale];
	for (const locale of locales) {
		expect(Object.keys(messages[locale]).sort()).toEqual(Object.keys(base).sort());
		for (const [key, text] of Object.entries(messages[locale])) {
			expect(text.trim(), key).not.toBe('');
			expect(placeholders(text), `${locale} ${key}`).toEqual(placeholders(base[key]!));
		}
	}
}

it('platform messages are complete', () => expectComplete(platformMessages));

it('every visualization folder has a meta.ts and an index.ts', () => {
	const folders = (files: string[]) => files.map((file) => file.replace(/\/\w+\.ts$/, '')).sort();
	expect(folders(visualizationFiles.meta)).toEqual(folders(visualizationFiles.index));
	expect(subjects.flatMap((s) => s.visualizations)).toHaveLength(visualizationFiles.meta.length);
});

it('ids are usable in addresses', () => {
	for (const subject of subjects) {
		for (const id of [subject.id, ...subject.visualizations.map((v) => v.id)]) {
			expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
		}
	}
});

const all = subjects.flatMap((s) => s.visualizations.map((v) => [`${s.id}/${v.id}`, s.id, v.id]));

describe.each(all)('%s', (_, subject, id) => {
	const load = async () => (await loadVisualization(subject!, id!))!;

	it('has all texts in every language', async () => {
		const v = await load();
		expectComplete(v.messages);
		const needed = [
			...Object.entries<Parameter>(v.parameters).flatMap(([key, p]) => [
				`param.${key}`,
				...(p.kind === 'choice' ? p.options.map((option) => `param.${key}.${option}`) : [])
			]),
			...v.stats.map((stat) => `stat.${stat}`),
			...v.legend.map((state) => `legend.${state}`)
		];
		for (const key of needed) expect(v.messages[defaultLocale], key).toHaveProperty([key]);
	});

	it('default values are allowed and survive a link', async () => {
		const v = await load();
		const values = defaults(v.parameters);
		expect(decode(v.parameters, encode(values, 42, v.version))).toEqual({ values, seed: 42 });
	});

	it('runs at every option and extreme, explains every frame, and is reproducible', async () => {
		const v = await load();
		const base = defaults(v.parameters);
		const cases = Object.entries<Parameter>(v.parameters).flatMap(([key, p]) =>
			(p.kind === 'choice' ? [...p.options] : [p.min, p.max]).map((value) => ({
				...base,
				[key]: value
			}))
		);
		for (const params of cases) {
			const input = { params, seed: 5, actions: [] };
			const { frames, truncated } = collectFrames(v.model, input);
			expect(truncated, JSON.stringify(params)).toBe(false);
			expect(frames.length).toBeGreaterThan(1);
			let before = 0;
			for (const frame of frames) {
				expect(frame.t).toBeGreaterThanOrEqual(before);
				before = frame.t;
				const text = v.messages[defaultLocale][frame.explain.key];
				expect(text, frame.explain.key).toBeDefined();
				for (const name of placeholders(text!)) {
					expect(frame.explain.values, frame.explain.key).toHaveProperty(name!);
				}
				for (const stat of Object.keys(frame.stats ?? {})) expect(v.stats).toContain(stat);
			}
			expect(collectFrames(v.model, input).frames).toEqual(frames);
		}
	});
});
