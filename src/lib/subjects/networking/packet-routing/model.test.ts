import { describe, expect, it } from 'vitest';
import { collectFrames, type TimedAction } from '#lib/platform/engine/model.ts';
import { computeTable, model, type ToggleLink } from './model.ts';
import { parameters, type RoutingValues } from './parameters.ts';
import { RECEIVER, SENDER, topologies } from './topologies.ts';

const base: RoutingValues = {
	topology: 'ladder',
	metric: 'latency',
	packets: 20,
	interval: 300,
	ttl: 8,
	queueSize: 3,
	convergence: 800
};
const run = (change: Partial<RoutingValues> = {}, actions: TimedAction<ToggleLink>[] = []) =>
	collectFrames(model, { params: { ...base, ...change }, seed: 1, actions }).frames;
const reasons = (frames: ReturnType<typeof run>) =>
	new Set(frames.at(-1)!.state.packets.flatMap((packet) => packet.reason ?? []));

function expectAccountedFor(frames: ReturnType<typeof run>) {
	for (const { stats, state } of frames) {
		const count = (status: string) => state.packets.filter((p) => p.status === status).length;
		expect(stats!.sent).toBe(stats!.delivered! + stats!.dropped! + stats!.inNetwork!);
		expect(count('delivered')).toBe(stats!.delivered);
		expect(count('dropped')).toBe(stats!.dropped);
	}
	expect(frames.at(-1)!.stats!.inNetwork).toBe(0);
}

describe.each(parameters.topology.options)('%s', (topology) => {
	it.each(parameters.metric.options)('delivers everything while nothing breaks (%s)', (metric) => {
		const frames = run({ topology, metric });
		expectAccountedFor(frames);
		expect(frames.at(-1)!.stats!.delivered).toBe(20);
	});

	it('chooses a different route for hops than for latency', () => {
		const path = (metric: RoutingValues['metric']) => {
			const tables = run({ topology, metric })[0]!.state.tables;
			const nodes = [SENDER];
			while (nodes.at(-1) !== RECEIVER) nodes.push(tables[nodes.at(-1)!]![RECEIVER]!.next!);
			return nodes;
		};
		expect(path('hops')).not.toEqual(path('latency'));
		expect(path('hops').length).toBeLessThanOrEqual(path('latency').length);
	});

	it('accounts for every packet whichever link breaks and returns, whenever', () => {
		for (const { id } of topologies[topology].links) {
			for (const t of [0, 250, 1234, 4000]) {
				expectAccountedFor(run({ topology }, [{ t, action: { toggle: id } }]));
				expectAccountedFor(
					run({ topology, packets: 60, interval: 50 }, [
						{ t, action: { toggle: id } },
						{ t: t + 900, action: { toggle: id } }
					])
				);
			}
		}
	});
});

it('finds another way after a link breaks', () => {
	const frames = run({}, [{ t: 1000, action: { toggle: 'R5-R6' } }]);
	const { delivered, dropped } = frames.at(-1)!.stats!;
	expect(dropped).toBeGreaterThan(0);
	expect(delivered).toBeGreaterThan(0);
	expect(frames.at(-1)!.state.tables.R5![RECEIVER]!.next).toBe('R2');
	expect(frames.at(-1)!.state.packets.at(-1)!.status).toBe('delivered');
});

it('slower convergence loses more packets', () => {
	const lost = (convergence: number) =>
		run({ convergence }, [{ t: 1000, action: { toggle: 'R5-R6' } }]).at(-1)!.stats!.dropped!;
	expect(lost(3000)).toBeGreaterThan(lost(0));
});

it('gives each reason for loss', () => {
	expect(reasons(run({ ttl: 2 }))).toEqual(new Set(['ttl']));
	expect(reasons(run({ interval: 50, queueSize: 0 }))).toEqual(new Set(['queueFull']));
	expect(reasons(run({ convergence: 0 }, [{ t: 0, action: { toggle: 'S-R1' } }]))).toEqual(
		new Set(['linkDown', 'noRoute'])
	);
});

it('an action does not change what happened before it', () => {
	const t = 1500;
	const before = (frames: ReturnType<typeof run>) => frames.filter((frame) => frame.t < t);
	expect(before(run({}, [{ t, action: { toggle: 'R1-R4' } }]))).toEqual(before(run()));
});

it('ignores unknown links', () => {
	expect(run({}, [{ t: 10, action: { toggle: 'nope' } }])).toEqual(run());
});

it('computes a table over working links only', () => {
	const table = computeTable(topologies.ladder, 'S', new Set(['S-R1']), 'hops');
	expect(table[RECEIVER]).toEqual({ next: null, cost: Infinity });
});
