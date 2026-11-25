import { defineVisualization } from '#lib/platform/visualization.ts';
import { messages } from './messages.ts';
import { model, pseudocode } from './model.ts';
import { parameters } from './parameters.ts';
import Stage from './Stage.svelte';

export default defineVisualization({
	version: 1,
	pace: 3,
	parameters,
	model,
	Stage,
	messages,
	legend: ['idle', 'candidate', 'active', 'done'],
	stats: ['comparisons', 'moves'],
	pseudocode
});
