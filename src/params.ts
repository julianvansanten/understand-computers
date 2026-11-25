import { defineParams } from '@sveltejs/kit/params';
import { isPrefixedLocale } from '#lib/platform/i18n/locales.ts';

export const params = defineParams({
	locale: (param) => (isPrefixedLocale(param) ? param : undefined)
});
