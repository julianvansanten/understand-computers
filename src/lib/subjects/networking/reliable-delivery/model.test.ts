import { describe, expect, it } from 'vitest';
import { collectFrames } from '#lib/platform/engine/model.ts';
import { model } from './model.ts';
import { parameters, type DeliveryValues } from './parameters.ts';

const base: DeliveryValues = {
	protocol: 'go-back-n',
	window: 4,
	packets: 10,
	loss: 20,
	latency: 300,
	timeout: 1200
};
const run = (change: Partial<DeliveryValues> = {}, seed = 1) =>
	collectFrames(model, { params: { ...base, ...change }, seed, actions: [] });
const end = (change: Partial<DeliveryValues> = {}, seed = 1) => run(change, seed).frames.at(-1)!;
const numbers = (count: number) => Array.from({ length: count }, (_, i) => i);

describe.each(parameters.protocol.options)('%s', (protocol) => {
	it('delivers everything in order, whatever is lost', () => {
		for (const loss of [0, 20, 50]) {
			for (const timeout of [200, 1200, 4000]) {
				for (const seed of [1, 2, 3, 4, 5]) {
					const { frames, truncated } = run({ protocol, loss, timeout }, seed);
					const { state } = frames.at(-1)!;
					expect(truncated).toBe(false);
					expect(state.delivered).toEqual(numbers(10));
					expect(state.base).toBe(10);
				}
			}
		}
	});

	it('never has more than a window of packets outstanding', () => {
		for (const { state } of run({ protocol, loss: 40 }).frames) {
			expect(state.highest - state.base).toBeLessThanOrEqual(protocol === 'go-back-n' ? 4 : 1);
		}
	});

	it('resends nothing without loss and with enough patience', () => {
		expect(end({ protocol, loss: 0, timeout: 2000 }).stats).toMatchObject({
			sent: 10,
			resent: 0,
			lost: 0
		});
	});

	it('resends needlessly when the timeout is shorter than the round trip', () => {
		const { stats } = end({ protocol, loss: 0, latency: 1000, timeout: 500 });
		expect(stats!.resent).toBeGreaterThan(0);
	});
});

it('gives every message its own id within a frame', () => {
	for (const { state } of run({ loss: 50 }).frames) {
		expect(new Set(state.messages.map((m) => m.id)).size).toBe(state.messages.length);
	}
});

it('a window is faster than stop-and-wait', () => {
	const throughput = (protocol: DeliveryValues['protocol']) =>
		end({ protocol, loss: 0 }).stats!.throughput!;
	expect(throughput('go-back-n')).toBeGreaterThan(2 * throughput('stop-and-wait'));
});

it('the most demanding settings still end', () => {
	const extreme = { window: 8, packets: 24, loss: 50, latency: 1000, timeout: 200 };
	for (const seed of [1, 2, 3]) {
		expect(run(extreme, seed).truncated).toBe(false);
	}
});
