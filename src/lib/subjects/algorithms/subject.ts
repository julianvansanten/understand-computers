import type { SubjectInfo } from '#lib/platform/visualization.ts';

export default {
	order: 1,
	accent: 'blue',
	icon: 'M4 20V13M9 20V5M14 20V10M19 20V7',
	text: {
		nl: {
			title: 'Algoritmen',
			description: 'Stap voor stap problemen oplossen, en zien welke aanpak minder werk kost.'
		},
		en: {
			title: 'Algorithms',
			description: 'Solve problems step by step, and see which approach takes less work.'
		}
	}
} satisfies SubjectInfo;
