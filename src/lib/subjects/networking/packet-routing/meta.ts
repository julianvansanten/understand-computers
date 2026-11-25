import type { VisualizationMeta } from '#lib/platform/visualization.ts';

export default {
	order: 1,
	level: 2,
	minutes: 30,
	curriculum: ['informatica-2019:E'],
	text: {
		nl: {
			title: 'Pakketten routeren',
			description:
				'Volg pakketten door een netwerk van routers. Maak een verbinding stuk en kijk hoe het netwerk een andere weg vindt.',
			concepts: ['router', 'routeringstabel', 'TTL', 'wachtrij', 'pakketverlies']
		},
		en: {
			title: 'Packet routing',
			description:
				'Follow packets through a network of routers. Break a link and watch the network find another way.',
			concepts: ['router', 'routing table', 'TTL', 'queue', 'packet loss']
		}
	}
} satisfies VisualizationMeta;
