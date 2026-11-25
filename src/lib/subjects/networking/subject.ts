import type { SubjectInfo } from '#lib/platform/visualization.ts';

export default {
	order: 2,
	accent: 'green',
	icon: 'M8 6h8M7 8l4 8M17 8l-4 8M8 6a2 2 0 1 1-4 0a2 2 0 1 1 4 0M20 6a2 2 0 1 1-4 0a2 2 0 1 1 4 0M14 18a2 2 0 1 1-4 0a2 2 0 1 1 4 0',
	text: {
		nl: {
			title: 'Netwerken',
			description: 'Volg pakketjes onderweg, en zie wat er gebeurt als er iets kapotgaat.'
		},
		en: {
			title: 'Networking',
			description: 'Follow packets on their way, and see what happens when something breaks.'
		}
	}
} satisfies SubjectInfo;
