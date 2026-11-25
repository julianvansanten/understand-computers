import { defineVisualization } from '#lib/platform/visualization.ts';
import Detail from './Detail.svelte';
import { messages } from './messages.ts';
import { model, pseudocode } from './model.ts';
import { parameters } from './parameters.ts';
import Stage from './Stage.svelte';

export default defineVisualization({
	version: 1,
	pace: 1.5,
	parameters,
	model,
	Stage,
	Detail,
	messages,
	legend: ['idle', 'candidate', 'active', 'done', 'failed'],
	stats: ['visited', 'frontier', 'edgesChecked', 'pathCost', 'pathHops'],
	pseudocode
});
