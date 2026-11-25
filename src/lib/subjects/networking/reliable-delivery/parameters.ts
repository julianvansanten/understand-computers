import {
	choice,
	defineParameters,
	range,
	type ParameterValues
} from '#lib/platform/engine/parameters.ts';

export const parameters = defineParameters({
	protocol: choice(['stop-and-wait', 'go-back-n'], 'stop-and-wait'),
	window: range({
		min: 2,
		max: 8,
		step: 1,
		default: 4,
		when: (v) => v.protocol === 'go-back-n'
	}),
	packets: range({ min: 4, max: 24, step: 1, default: 10 }),
	loss: range({ min: 0, max: 50, step: 5, default: 20, unit: '%' }),
	latency: range({ min: 100, max: 1000, step: 50, default: 300, unit: ' ms' }),
	timeout: range({ min: 200, max: 4000, step: 100, default: 1200, unit: ' ms' })
});
export type DeliveryValues = ParameterValues<typeof parameters>;
