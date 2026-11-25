import {
	choice,
	defineParameters,
	range,
	type ParameterValues
} from '#lib/platform/engine/parameters.ts';

export const parameters = defineParameters({
	algorithm: choice(['bubble', 'insertion', 'merge', 'quick'], 'bubble'),
	pivot: choice(['last', 'middle', 'random'], 'last', { when: (v) => v.algorithm === 'quick' }),
	size: range({ min: 4, max: 64, step: 1, default: 16 }),
	order: choice(['random', 'nearly-sorted', 'reversed', 'few-unique'], 'random')
});
export type SortingValues = ParameterValues<typeof parameters>;
