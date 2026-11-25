import { defineVisualization } from '#lib/platform/visualization.ts';
import Detail from './Detail.svelte';
import { messages } from './messages.ts';
import { model } from './model.ts';
import { parameters } from './parameters.ts';
import Stage from './Stage.svelte';

export default defineVisualization({
	version: 1,
	pace: 300,
	parameters,
	model,
	Stage,
	Detail,
	messages,
	legend: ['candidate', 'active', 'done', 'failed'],
	stats: ['sent', 'delivered', 'dropped', 'inNetwork']
});
