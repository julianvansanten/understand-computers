import { page } from '$app/state';
import { resolve } from '$app/paths';
import { defaultLocale, isPrefixedLocale, type Locale } from './locales.ts';
import { formatNumber, translate, type Dictionary, type MessageValues } from './translate.ts';
import { platformMessages } from './messages.ts';

// SvelteKit types this per known route; our paths are built from registry ids.
const resolvePath = resolve as (path: string) => string;

/** Every internal link goes through here: adds locale and hosting sub-path. `path` is like "subjects/networking". */
export function href(locale: Locale, path = ''): string {
	const prefix = locale === defaultLocale ? '' : `${locale}/`;
	return resolvePath(`${prefix}${path}${path && '/'}`);
}

/** The page's locale. Unmatched URLs (404) have no route params, so there it is read from the path. */
export function currentLocale(): Locale {
	const fromRoute = page.params.locale;
	if (fromRoute) return fromRoute as Locale;
	if (page.error && typeof window !== 'undefined') {
		const first = page.url.pathname.slice(resolvePath('').length).split('/')[0] ?? '';
		if (isPrefixedLocale(first)) return first;
	}
	return defaultLocale;
}

/** Call in component templates or $derived: results follow the current locale. */
export const t = (key: keyof (typeof platformMessages)['nl'], values?: MessageValues) =>
	translate(platformMessages as Dictionary, currentLocale(), key, values);

export const n = (value: number) => formatNumber(value, currentLocale());

export const link = (path = '') => href(currentLocale(), path);
