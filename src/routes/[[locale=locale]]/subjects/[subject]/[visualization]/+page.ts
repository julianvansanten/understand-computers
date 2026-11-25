import { error } from '@sveltejs/kit';
import { findSubject, loadVisualization } from '#lib/platform/registry.ts';

export const load = async ({ params }) => {
	const subject = findSubject(params.subject);
	const meta = subject?.visualizations.find((entry) => entry.id === params.visualization);
	const visualization = await loadVisualization(params.subject, params.visualization);
	if (!subject || !meta || !visualization) error(404);
	return { subject, meta, visualization };
};
