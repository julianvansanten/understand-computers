import type { VisualizationMeta } from '#lib/platform/visualization.ts';

export default {
	order: 2,
	level: 2,
	minutes: 30,
	curriculum: ['informatica-2019:B', 'informatica-2019:G'],
	text: {
		nl: {
			title: 'Kortste pad',
			description:
				'Zoek een route door een graaf met BFS, Dijkstra of A*, en zie welke knopen het algoritme bekijkt.',
			concepts: ['graaf', 'gewicht', 'prioriteitsrij', 'heuristiek']
		},
		en: {
			title: 'Pathfinding',
			description:
				'Find a route through a graph with BFS, Dijkstra or A*, and see which nodes the algorithm visits.',
			concepts: ['graph', 'weight', 'priority queue', 'heuristic']
		}
	}
} satisfies VisualizationMeta;
