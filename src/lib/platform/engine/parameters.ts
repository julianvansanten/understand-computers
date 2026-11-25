interface Common {
	/** Hide the control when it has no effect, e.g. a heuristic for an algorithm without one. */
	when?: (values: Record<string, unknown>) => boolean;
}
export interface Range extends Common {
	kind: 'range';
	min: number;
	max: number;
	step: number;
	default: number;
	unit?: string;
}
export interface Choice<T extends string = string> extends Common {
	kind: 'choice';
	options: readonly T[];
	default: T;
}
export type Parameter = Range | Choice;
export type Parameters = Record<string, Parameter>;
export type ParameterValues<P extends Parameters> = {
	[K in keyof P]: P[K] extends Choice<infer T> ? T : number;
};
export type AnyValues = Record<string, string | number>;

export const range = (spec: Omit<Range, 'kind'>): Range => ({ kind: 'range', ...spec });
export const choice = <const T extends string>(
	options: readonly T[],
	defaultOption: NoInfer<T>,
	extra: Common = {}
): Choice<T> => ({ kind: 'choice', options, default: defaultOption, ...extra });
export const defineParameters = <P extends Parameters>(parameters: P) => parameters;

export const MAX_SEED = 9999;

export const defaults = (parameters: Parameters): AnyValues =>
	Object.fromEntries(Object.entries(parameters).map(([key, p]) => [key, p.default]));

/** Reads values from a link. Links are untrusted: unknown options fall back, numbers are clamped. */
export function decode(parameters: Parameters, query: URLSearchParams) {
	const values = defaults(parameters);
	for (const [key, p] of Object.entries(parameters)) {
		const raw = query.get(key);
		if (raw === null) continue;
		if (p.kind === 'choice') {
			if (p.options.includes(raw)) values[key] = raw;
		} else {
			values[key] = snap(p, raw);
		}
	}
	const seed = { min: 1, max: MAX_SEED, step: 1, default: 1 };
	return { values, seed: snap(seed, query.get('seed') ?? '') };
}

function snap(p: Omit<Range, 'kind'>, raw: string): number {
	const value = raw.trim() === '' ? NaN : Number(raw);
	if (!Number.isFinite(value)) return p.default;
	const snapped = p.min + Math.round((value - p.min) / p.step) * p.step;
	return Math.min(p.max, Math.max(p.min, snapped));
}

export function encode(values: AnyValues, seed: number, version: number): URLSearchParams {
	const query = new URLSearchParams({ v: String(version), seed: String(seed) });
	for (const [key, value] of Object.entries(values)) query.set(key, String(value));
	return query;
}
