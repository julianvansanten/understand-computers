import {
	choice,
	defineParameters,
	range,
	type ParameterValues
} from '#lib/platform/engine/parameters.ts';

export const parameters = defineParameters({
	topology: choice(['ladder', 'ring', 'mesh'], 'ladder'),
	metric: choice(['latency', 'hops'], 'latency'),
	packets: range({ min: 1, max: 100, step: 1, default: 20 }),
	interval: range({ min: 50, max: 1000, step: 50, default: 300, unit: ' ms' }),
	ttl: range({ min: 1, max: 16, step: 1, default: 8 }),
	queueSize: range({ min: 0, max: 10, step: 1, default: 3 }),
	convergence: range({ min: 0, max: 3000, step: 100, default: 800, unit: ' ms' })
});
export type RoutingValues = ParameterValues<typeof parameters>;
