import { describe, expect, it } from 'vitest';
import { collectFrames, frameIndexAt } from './model.ts';
import { choice, decode, defineParameters, encode, range } from './parameters.ts';
import { Player } from './player.svelte.ts';
import { createRng } from './rng.ts';
import { translate } from '../i18n/translate.ts';

const parameters = defineParameters({
	mode: choice(['a', 'b'], 'a'),
	size: range({ min: 4, max: 64, step: 4, default: 16 })
});
const frames = [0, 1, 1, 3].map((t) => ({ t, state: t, explain: { key: 'x' } }));

describe('parameters', () => {
	it('survives a round trip through a link', () => {
		const query = encode({ mode: 'b', size: 24 }, 7, 1);
		expect(decode(parameters, query)).toEqual({ values: { mode: 'b', size: 24 }, seed: 7 });
	});
	it.each([
		['size=9999', 64],
		['size=-3', 4],
		['size=17', 16],
		['size=abc', 16],
		['size=', 16],
		['size=Infinity', 16]
	])('clamps %s', (query, size) => {
		expect(decode(parameters, new URLSearchParams(query)).values.size).toBe(size);
	});
	it('falls back on unknown options and seeds', () => {
		const result = decode(parameters, new URLSearchParams('mode=zzz&seed=-5'));
		expect(result).toEqual({ values: { mode: 'a', size: 16 }, seed: 1 });
	});
});

describe('frames', () => {
	it('finds the last frame at a moment', () => {
		expect([-1, 0, 0.5, 1, 2.9, 3, 9].map((t) => frameIndexAt(frames, t))).toEqual([
			0, 0, 0, 2, 2, 3, 3
		]);
	});
	it('stops an endless model', () => {
		const endless = {
			*run() {
				for (let t = 0; ; t++) yield { t, state: t, explain: { key: 'x' } };
			}
		};
		const result = collectFrames(endless, { params: {}, seed: 1, actions: [] }, 5);
		expect(result.frames).toHaveLength(5);
		expect(result.truncated).toBe(true);
	});
});

describe('player', () => {
	it('steps through frames at the same moment, and back', () => {
		const player = new Player<number>(1);
		player.load(frames);
		const seen = [player.index];
		for (let i = 0; i < 4; i++) {
			player.step(1);
			seen.push(player.index);
		}
		player.step(-1);
		expect([...seen, player.index]).toEqual([0, 1, 2, 3, 3, 2]);
	});
	it('starts at the first of several frames at moment zero', () => {
		const player = new Player<number>(1);
		const together = [0, 0, 5].map((t) => ({ t, state: t, explain: { key: 'x' } }));
		player.load(together);
		expect(player.index).toBe(0);
		player.load(together, 0);
		expect(player.index).toBe(1);
	});
	it('interpolates while playing and stops at the end', () => {
		const player = new Player<number>(1);
		player.load(frames);
		player.toggle();
		player.advance(2);
		expect([player.index, player.progress]).toEqual([2, 0.5]);
		player.step(-1);
		expect([player.index, player.offset]).toEqual([2, 0]);
		player.toggle();
		player.advance(100);
		expect([player.index, player.playing]).toEqual([3, false]);
	});
});

it('random numbers are reproducible', () => {
	const take = (seed: number) => Array.from({ length: 5 }, createRng(seed));
	expect(take(3)).toEqual(take(3));
	expect(take(3)).not.toEqual(take(4));
});

it('formats placeholders per language', () => {
	const dictionary = { nl: { a: '{x} en {y}' }, en: { a: '{x} and {y}' } };
	expect(translate(dictionary, 'nl', 'a', { x: 1.5, y: 'z' })).toBe('1,5 en z');
	expect(translate(dictionary, 'en', 'a', { x: 1.5 })).toBe('1.5 and {y}');
});
