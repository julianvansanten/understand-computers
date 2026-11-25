import { error } from '@sveltejs/kit';
import { findSubject } from '#lib/platform/registry.ts';

export const load = ({ params }) => {
	const subject = findSubject(params.subject);
	if (!subject) error(404);
	return { subject };
};
