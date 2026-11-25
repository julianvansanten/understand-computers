export const locales = ['nl', 'en'] as const;
export type Locale = (typeof locales)[number];

/** Served without a prefix: /subjects. Other locales live under /<locale>/subjects. */
export const defaultLocale: Locale = 'nl';

export const localeNames: Record<Locale, string> = { nl: 'Nederlands', en: 'English' };

export const isPrefixedLocale = (value: string): value is Locale =>
	value !== defaultLocale && (locales as readonly string[]).includes(value);
