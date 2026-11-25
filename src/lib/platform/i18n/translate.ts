import type { Locale } from './locales.ts';

export type MessageValues = Record<string, string | number>;
/** What models emit instead of text, so that a run can be shown in any language. */
export interface MessageRef {
	key: string;
	values?: MessageValues;
}
export type Dictionary<K extends string = string> = Record<Locale, Record<K, string>>;
export type Translate = (key: string, values?: MessageValues) => string;

/** Every locale must define exactly the same keys, or this does not compile. */
export const defineMessages = <K extends string>(messages: Dictionary<K>) => messages;

export function translate(
	dictionary: Dictionary,
	locale: Locale,
	key: string,
	values: MessageValues = {}
): string {
	const text = dictionary[locale][key];
	if (text === undefined) return key;
	return text.replace(/\{(\w+)\}/g, (placeholder, name: string) => {
		const value = values[name];
		if (value === undefined) return placeholder;
		return typeof value === 'number' ? formatNumber(value, locale) : value;
	});
}

export const formatNumber = (value: number, locale: Locale) =>
	new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value);

export const placeholders = (text: string) =>
	[...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
