import type { Handle } from '@sveltejs/kit/hooks';
import { defaultLocale } from '#lib/platform/i18n/locales.ts';

// Runs only while prerendering; the deployed site has no server.
export const handle: Handle = ({ event, resolve }) =>
	resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', event.params.locale ?? defaultLocale)
	});
