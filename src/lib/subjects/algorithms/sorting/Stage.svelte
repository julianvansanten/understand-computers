<script lang="ts">
	import Stage from '#lib/platform/primitives/Stage.svelte';
	import StateGlyph from '#lib/platform/primitives/StateGlyph.svelte';
	import type { StageProps } from '#lib/platform/visualization.ts';
	import type { SortingState } from './model.ts';
	import type { SortingValues } from './parameters.ts';

	let { frame, next, progress, t }: StageProps<SortingState, SortingValues> = $props();

	const LEFT = 60;
	const WIDTH = 880;
	const BASE = 400;
	const TOP = 60;

	const items = $derived(frame.state.items);
	const slot = $derived(WIDTH / items.length);
	const nextPosition = $derived(
		new Map((next?.state.items ?? items).map((item, position) => [item.id, position]))
	);
	const highest = $derived(Math.max(...items.map((item) => item.value)));
	const height = (value: number) => (value / highest) * (BASE - TOP);
	// Keyed by identity, in a fixed order, so bars move instead of being redrawn.
	const bars = $derived(
		items
			.map((item, position) => {
				const target = nextPosition.get(item.id) ?? position;
				return {
					...item,
					x: LEFT + (position + (target - position) * progress) * slot,
					state: frame.state.marks[item.id] ?? ('idle' as const)
				};
			})
			.sort((a, b) => a.id - b.id)
	);
	const roomy = $derived(items.length <= 24);
</script>

<Stage label={t('stage.label', { count: items.length })}>
	{#if frame.state.part}
		{@const [from, to] = frame.state.part}
		<path class="part" d="M{LEFT + from * slot + 3} 414V422H{LEFT + (to + 1) * slot - 3}V414" />
	{/if}
	{#each bars as bar (bar.id)}
		{@const top = BASE - height(bar.value)}
		<rect
			x={bar.x + slot * 0.08}
			y={top}
			width={slot * 0.84}
			height={height(bar.value)}
			style="fill: var(--{bar.state}); stroke: var(--{bar.state}-edge)"
			stroke-width={bar.state === 'idle' ? 1.5 : 2.5}
		/>
		<StateGlyph state={bar.state} x={bar.x + slot / 2} y={top - 12} size={roomy ? 1.6 : 0.9} />
		{#if roomy}
			<text
				x={bar.x + slot / 2}
				y={BASE - 12}
				style:font-size="calc(16px * var(--stage-text))"
				style="fill: var(--{bar.state}-text)"
			>
				{bar.value}
			</text>
		{/if}
	{/each}
</Stage>

<style>
	.part {
		fill: none;
		stroke: var(--ink);
		stroke-width: 2;
	}
</style>
