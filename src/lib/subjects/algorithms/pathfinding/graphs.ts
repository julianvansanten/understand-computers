export const nodeIds = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const;
export type NodeId = (typeof nodeIds)[number];

interface Layout {
	/** Positions in the order of nodeIds. */
	positions: [x: number, y: number][];
	/** Pairs of node ids. */
	edges: string[];
}

export const layouts: Record<'city' | 'grid' | 'bridge', Layout> = {
	city: {
		positions: [
			[110, 220],
			[230, 90],
			[260, 330],
			[380, 190],
			[400, 60],
			[430, 370],
			[540, 260],
			[570, 120],
			[630, 380],
			[720, 220],
			[760, 70],
			[860, 320]
		],
		edges: 'AB AC BD BE CD CF DG DH EH FG FI GH GJ GI HJ HK IJ IL JL KJ KL'.split(' ')
	},
	grid: {
		positions: [90, 220, 350].flatMap((y) =>
			[150, 370, 590, 810].map((x): [number, number] => [x, y])
		),
		edges: 'AB BC CD EF FG GH IJ JK KL AE BF CG DH EI FJ GK HL'.split(' ')
	},
	bridge: {
		positions: [
			[110, 220],
			[220, 90],
			[220, 350],
			[330, 220],
			[380, 80],
			[380, 360],
			[560, 220],
			[640, 90],
			[640, 350],
			[740, 220],
			[820, 90],
			[860, 340]
		],
		edges: 'AB AC BD CD BE CF DE DF DG GH GI HJ IJ HK IL JK JL'.split(' ')
	}
};
