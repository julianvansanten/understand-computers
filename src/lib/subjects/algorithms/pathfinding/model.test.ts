import { describe, expect, it } from 'vitest';
import { collectFrames } from '#lib/platform/engine/model.ts';
import { nodeIds, type NodeId } from './graphs.ts';
import { buildGraph, model, pathWeight, pseudocode, type Edge } from './model.ts';
import { parameters, type PathfindingValues } from './parameters.ts';

const last = (params: PathfindingValues, seed = 1) =>
	collectFrames(model, { params, seed, actions: [] }).frames.at(-1)!.state;

/** Cheapest cost by trying every path without repeated nodes. */
function bruteForce(edges: Edge[], from: NodeId, goal: NodeId, seen: NodeId[] = []): number {
	if (from === goal) return 0;
	let best = Infinity;
	for (const edge of edges) {
		if (edge.a !== from && edge.b !== from) continue;
		const to = edge.a === from ? edge.b : edge.a;
		if (seen.includes(to)) continue;
		best = Math.min(best, edge.weight + bruteForce(edges, to, goal, [...seen, from]));
	}
	return best;
}

const base = { start: 'A', goal: 'L' } as const;

describe.each(parameters.graph.options)('%s', (graph) => {
	describe.each(parameters.weights.options)('%s weights', (weights) => {
		it.each([1, 2, 3])('Dijkstra and A* are optimal, BFS has the fewest hops (seed %i)', (seed) => {
			const { edges } = buildGraph({ graph, weights }, seed);
			const unweighted = edges.map((edge) => ({ ...edge, weight: 1 }));
			for (const start of ['A', 'F'] as const) {
				for (const goal of ['L', 'E', 'A'] as const) {
					const best = bruteForce(edges, start, goal);
					for (const heuristic of ['straight-line', 'zero'] as const) {
						for (const algorithm of ['dijkstra', 'astar'] as const) {
							const { path } = last({ algorithm, heuristic, graph, weights, start, goal }, seed);
							expect([path[0], path.at(-1)]).toEqual([start, goal]);
							expect(pathWeight(path, edges)).toBe(best);
						}
					}
					const bfs = last(
						{ algorithm: 'bfs', heuristic: 'zero', graph, weights, start, goal },
						seed
					);
					expect(bfs.path.length - 1).toBe(bruteForce(unweighted, start, goal));
				}
			}
		});
	});
});

it('reaches every node from every node', () => {
	for (const graph of parameters.graph.options) {
		for (const goal of nodeIds) {
			const params = { algorithm: 'bfs', heuristic: 'zero', weights: 'equal', graph } as const;
			expect(last({ ...params, ...base, goal }).path.at(-1)).toBe(goal);
		}
	}
});

it('A* visits no more nodes than Dijkstra', () => {
	const params = {
		heuristic: 'straight-line',
		graph: 'city',
		weights: 'distance',
		...base
	} as const;
	expect(last({ ...params, algorithm: 'astar' }).visited.length).toBeLessThanOrEqual(
		last({ ...params, algorithm: 'dijkstra' }).visited.length
	);
});

it('only highlights existing pseudocode lines', () => {
	for (const algorithm of parameters.algorithm.options) {
		const params = {
			algorithm,
			heuristic: 'straight-line',
			graph: 'city',
			weights: 'random',
			...base
		} as const;
		const ids = pseudocode(params).map((line) => line.id);
		for (const { codeLine } of collectFrames(model, { params, seed: 1, actions: [] }).frames) {
			if (codeLine) expect(ids).toContain(codeLine);
		}
	}
});
