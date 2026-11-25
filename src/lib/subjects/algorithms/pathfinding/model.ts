import type { Frame, Model } from '#lib/platform/engine/model.ts';
import { createRng } from '#lib/platform/engine/rng.ts';
import type { MessageValues } from '#lib/platform/i18n/translate.ts';
import type { CodeLine } from '#lib/platform/visualization.ts';
import { layouts, nodeIds, type NodeId } from './graphs.ts';
import type { PathfindingValues } from './parameters.ts';

export interface Node {
	id: NodeId;
	x: number;
	y: number;
}
export interface Edge {
	id: string;
	a: NodeId;
	b: NodeId;
	weight: number;
}
export interface Known {
	cost: number;
	via: NodeId | null;
}
export interface PathfindingState {
	nodes: Node[];
	edges: Edge[];
	known: Partial<Record<NodeId, Known>>;
	frontier: NodeId[];
	visited: NodeId[];
	current: NodeId | null;
	/** The edge being looked at, and whether it helped. */
	looking: { edge: string; to: NodeId; useful: boolean } | null;
	path: NodeId[];
}

export function buildGraph(params: Pick<PathfindingValues, 'graph' | 'weights'>, seed: number) {
	const rng = createRng(seed);
	const { positions, edges: pairs } = layouts[params.graph];
	const nodes: Node[] = nodeIds.map((id, i) => ({ id, x: positions[i]![0], y: positions[i]![1] }));
	const find = (id: string) => nodes.find((node) => node.id === id)!;
	const edges: Edge[] = pairs.map((id) => {
		const [a, b] = [find(id[0]!), find(id[1]!)];
		const length = distance(a, b) / 40;
		const weight =
			params.weights === 'equal'
				? 1
				: Math.max(1, Math.round(params.weights === 'random' ? length * (1 + 2 * rng()) : length));
		return { id, a: a.id, b: b.id, weight };
	});
	return { nodes, edges };
}

const distance = (a: Node, b: Node) => Math.hypot(a.x - b.x, a.y - b.y);

export const model: Model<PathfindingValues, PathfindingState> = {
	*run({ params, seed }) {
		const { nodes, edges } = buildGraph(params, seed);
		const node = (id: NodeId) => nodes.find((n) => n.id === id)!;
		// Cheapest cost per unit of distance: scaled by this, a straight line never overestimates.
		const scale = Math.min(...edges.map((e) => e.weight / distance(node(e.a), node(e.b))));
		const factor = { 'straight-line': scale, zero: 0, overestimate: scale * 4 }[params.heuristic];
		const estimate = (id: NodeId) => distance(node(id), node(params.goal)) * factor;

		const known: PathfindingState['known'] = { [params.start]: { cost: 0, via: null } };
		let frontier: NodeId[] = [params.start];
		const visited: NodeId[] = [];
		let current: NodeId | null = null;
		let edgesChecked = 0;
		let path: NodeId[] = [];
		let t = 0;

		const frame = (
			key: string,
			values: MessageValues,
			codeLine?: string,
			looking: PathfindingState['looking'] = null
		): Frame<PathfindingState> => ({
			t: t++,
			state: {
				nodes,
				edges,
				known: { ...known },
				frontier,
				visited: [...visited],
				current,
				looking,
				path
			},
			explain: { key, values },
			codeLine,
			stats: {
				visited: visited.length,
				frontier: frontier.length,
				edgesChecked,
				pathCost: path.length ? pathWeight(path, edges) : 0,
				pathHops: Math.max(0, path.length - 1)
			}
		});

		const priority = (id: NodeId) => {
			const cost = known[id]!.cost;
			// BFS takes the frontier in order of arrival: every priority is equal.
			if (params.algorithm === 'bfs') return 0;
			return params.algorithm === 'astar' ? cost + estimate(id) : cost;
		};

		yield frame('start', { start: params.start, goal: params.goal }, 'init');
		while (frontier.length) {
			const best = frontier.reduce((a, b) => (priority(b) < priority(a) ? b : a));
			frontier = frontier.filter((id) => id !== best);
			current = best;
			visited.push(best);
			const value = Math.round(priority(best) * 10) / 10;
			yield frame(`take.${params.algorithm}`, { node: best, value }, 'take');

			if (best === params.goal) {
				for (let id: NodeId | null = best; id; id = known[id]!.via) path = [id, ...path];
				current = null;
				const result = { cost: pathWeight(path, edges), hops: path.length - 1 };
				yield frame('found', { path: path.join(' '), ...result }, 'goal');
				return;
			}
			for (const edge of edges) {
				if (edge.a !== best && edge.b !== best) continue;
				const to = edge.a === best ? edge.b : edge.a;
				if (visited.includes(to)) continue;
				edgesChecked++;
				const cost = known[best]!.cost + (params.algorithm === 'bfs' ? 1 : edge.weight);
				const before = known[to];
				const useful = !before || cost < before.cost;
				if (useful) {
					known[to] = { cost, via: best };
					if (!before) frontier = [...frontier, to];
				}
				const key = !before ? 'look.new' : useful ? 'look.better' : 'look.worse';
				yield frame(
					key,
					{ node: best, to, cost, before: before?.cost ?? 0 },
					useful ? 'update' : 'neighbors',
					{ edge: edge.id, to, useful }
				);
			}
		}
		current = null;
		yield frame('unreachable', { goal: params.goal });
	}
};

export function pathWeight(path: NodeId[], edges: Edge[]): number {
	let total = 0;
	for (let i = 1; i < path.length; i++) {
		const [a, b] = [path[i - 1], path[i]];
		total += edges.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a))!.weight;
	}
	return total;
}

const take = {
	bfs: '  node = first in frontier',
	dijkstra: '  node = lowest cost in frontier',
	astar: '  node = lowest cost + estimate'
};
export const pseudocode = ({ algorithm }: PathfindingValues): CodeLine[] => [
	{ id: 'init', text: 'frontier = [start]' },
	{ id: 'loop', text: 'while frontier is not empty:' },
	{ id: 'take', text: take[algorithm] },
	{ id: 'goal', text: '  if node is goal: done' },
	{ id: 'neighbors', text: '  for each unvisited neighbor:' },
	{ id: 'update', text: '    if cheaper: store cost, via' }
];
