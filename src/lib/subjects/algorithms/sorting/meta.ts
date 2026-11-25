import type { VisualizationMeta } from '#lib/platform/visualization.ts';

export default {
	order: 1,
	level: 1,
	minutes: 20,
	curriculum: ['informatica-2019:B'],
	text: {
		nl: {
			title: 'Sorteren',
			description:
				'Vergelijk vier sorteeralgoritmen en ontdek wanneer de ene veel sneller is dan de andere.',
			concepts: ['vergelijken', 'verwisselen', 'verdeel en heers', 'complexiteit']
		},
		en: {
			title: 'Sorting',
			description:
				'Compare four sorting algorithms and discover when one is much faster than another.',
			concepts: ['comparing', 'swapping', 'divide and conquer', 'complexity']
		}
	}
} satisfies VisualizationMeta;
