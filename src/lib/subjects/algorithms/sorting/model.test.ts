import { describe, expect, it } from 'vitest';
import { collectFrames } from '#lib/platform/engine/model.ts';
import { model, pseudocode } from './model.ts';
import { parameters } from './parameters.ts';

const run = (params: Parameters<typeof model.run>[0]['params'], seed = 1) =>
	collectFrames(model, { params, seed, actions: [] }).frames;

describe.each(parameters.algorithm.options)('%s sort', (algorithm) => {
	describe.each(parameters.order.options)('%s', (order) => {
		it.each([4, 5, 16, 64])('sorts %i items without losing any', (size) => {
			for (const pivot of parameters.pivot.options) {
				const frames = run({ algorithm, order, size, pivot }, 3);
				const sorted = (items: { value: number }[]) =>
					items.map((i) => i.value).sort((a, b) => a - b);
				const first = frames[0]!.state.items;
				const last = frames.at(-1)!.state.items;
				expect(last.map((i) => i.value)).toEqual(sorted(first));
				expect(new Set(last.map((i) => i.id)).size).toBe(size);
			}
		});
	});

	it('only highlights existing pseudocode lines', () => {
		const params = { algorithm, order: 'random', size: 12, pivot: 'random' } as const;
		const ids = pseudocode(params).map((line) => line.id);
		for (const frame of run(params)) {
			if (frame.codeLine) expect(ids).toContain(frame.codeLine);
		}
	});
});

it('has the known extremes', () => {
	const base = { size: 10, pivot: 'last' } as const;
	const end = (algorithm: 'bubble' | 'quick' | 'insertion', order: 'reversed') =>
		run({ ...base, algorithm, order }).at(-1)!.stats;
	expect(end('bubble', 'reversed')).toEqual({ comparisons: 45, moves: 45 });
	expect(end('insertion', 'reversed')).toEqual({ comparisons: 45, moves: 45 });
	expect(end('quick', 'reversed')!.comparisons).toBe(45);
});
