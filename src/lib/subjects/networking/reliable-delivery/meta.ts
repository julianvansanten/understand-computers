import type { VisualizationMeta } from '#lib/platform/visualization.ts';

export default {
	order: 2,
	level: 3,
	minutes: 30,
	curriculum: ['informatica-2019:E'],
	text: {
		nl: {
			title: 'Betrouwbaar bezorgen',
			description:
				'Stuur genummerde pakketten over een onbetrouwbare verbinding, en zie hoe bevestigingen en timeouts alles toch laten aankomen.',
			concepts: ['ACK', 'timeout', 'venster', 'Go-Back-N', 'doorvoer']
		},
		en: {
			title: 'Reliable delivery',
			description:
				'Send numbered packets over an unreliable link, and see how acknowledgements and timeouts still get everything across.',
			concepts: ['ACK', 'timeout', 'window', 'Go-Back-N', 'throughput']
		}
	}
} satisfies VisualizationMeta;
