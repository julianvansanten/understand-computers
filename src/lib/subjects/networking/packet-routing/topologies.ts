export interface NetworkNode {
	id: string;
	x: number;
	y: number;
	host: boolean;
}
export interface Link {
	id: string;
	a: string;
	b: string;
	/** Travel time in virtual ms. */
	latency: number;
}
export interface Topology {
	nodes: NetworkNode[];
	links: Link[];
}

/** Sender and receiver in every topology. */
export const SENDER = 'S';
export const RECEIVER = 'D';

function topology(nodes: [id: string, x: number, y: number][], links: string): Topology {
	return {
		nodes: nodes.map(([id, x, y]) => ({ id, x, y, host: id === SENDER || id === RECEIVER })),
		links: links.split(' ').map((text) => {
			const [a, b, latency] = text.split('-') as [string, string, string];
			return { id: `${a}-${b}`, a, b, latency: Number(latency) };
		})
	};
}

// In each one, the route with the fewest hops is not the fastest.
export const topologies: Record<'ladder' | 'ring' | 'mesh', Topology> = {
	ladder: topology(
		[
			['S', 100, 220],
			['R1', 260, 110],
			['R2', 480, 110],
			['R3', 700, 110],
			['R4', 260, 330],
			['R5', 480, 330],
			['R6', 700, 330],
			['D', 860, 220]
		],
		'S-R1-100 R1-R2-200 R2-R3-200 R3-R6-900 R1-R4-200 R2-R5-200 R4-R5-300 R5-R6-200 R6-D-100'
	),
	ring: topology(
		[
			['S', 100, 220],
			['R1', 250, 220],
			['R2', 400, 80],
			['R3', 590, 80],
			['R4', 730, 220],
			['R5', 590, 360],
			['R6', 400, 360],
			['R7', 250, 360],
			['D', 860, 220]
		],
		'S-R1-100 R1-R2-500 R2-R3-600 R3-R4-500 R1-R7-150 R7-R6-200 R6-R5-250 R5-R4-200 R4-D-100'
	),
	mesh: topology(
		[
			['S', 100, 220],
			['R1', 260, 220],
			['R2', 420, 80],
			['R3', 480, 220],
			['R4', 420, 360],
			['R5', 640, 80],
			['R6', 640, 360],
			['R7', 730, 220],
			['D', 860, 220]
		],
		'S-R1-100 R1-R2-200 R1-R3-600 R1-R4-300 R2-R3-250 R3-R4-250 R2-R5-250 R4-R6-300 R3-R7-700 R5-R7-200 R6-R7-250 R5-R3-300 R7-D-100'
	)
};
