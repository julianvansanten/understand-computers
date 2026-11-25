import { choice, defineParameters, type ParameterValues } from '#lib/platform/engine/parameters.ts';
import { nodeIds } from './graphs.ts';

export const parameters = defineParameters({
	algorithm: choice(['bfs', 'dijkstra', 'astar'], 'dijkstra'),
	heuristic: choice(['straight-line', 'zero', 'overestimate'], 'straight-line', {
		when: (v) => v.algorithm === 'astar'
	}),
	graph: choice(['city', 'grid', 'bridge'], 'city'),
	weights: choice(['distance', 'random', 'equal'], 'distance'),
	start: choice(nodeIds, 'A'),
	goal: choice(nodeIds, 'L')
});
export type PathfindingValues = ParameterValues<typeof parameters>;
