<script lang="ts" module>
	import type { StateName } from '../visualization.ts';
	/** Color never carries meaning alone: every state also has a shape. */
	const shapes: Record<StateName, string> = {
		idle: '',
		candidate: 'M0 -4L4 0L0 4L-4 0Z',
		active: 'M-4.5 -4H4.5L0 4Z',
		done: 'M-4 0L-1 3.5L4.5 -3.5',
		failed: 'M-3.5 -3.5L3.5 3.5M3.5 -3.5L-3.5 3.5'
	};
</script>

<script lang="ts">
	let {
		state,
		x = 0,
		y = 0,
		size = 1
	}: { state: StateName; x?: number; y?: number; size?: number } = $props();
</script>

{#if shapes[state]}
	<path
		d={shapes[state]}
		transform="translate({x} {y}) scale({size})"
		class:line={state === 'done' || state === 'failed'}
		style:--edge="var(--{state}-edge)"
	/>
{/if}

<style>
	path {
		fill: var(--edge);
		stroke: var(--edge);
		stroke-width: 1;
	}
	.line {
		fill: none;
		stroke-width: 2.2;
		stroke-linecap: round;
	}
</style>
