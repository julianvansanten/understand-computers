<script lang="ts">
	import type { StateName } from '../visualization.ts';
	let { x, y, label, state }: { x: number; y: number; label: string; state: StateName } = $props();
</script>

<g transform="translate({x} {y})" style="--fill: var(--{state}); --edge: var(--{state}-edge)">
	<rect rx="3" />
	{#if state === 'failed'}<path d="M-1 -1L1 1M1 -1L-1 1" />{/if}
	<text style="fill: var(--{state}-text)">{label}</text>
</g>

<style>
	/* Sized in CSS, so a packet grows with its number. */
	rect {
		x: calc(-15px * var(--stage-text));
		y: calc(-11px * var(--stage-text));
		width: calc(30px * var(--stage-text));
		height: calc(22px * var(--stage-text));
		fill: var(--fill);
		stroke: var(--edge);
		stroke-width: 2;
	}
	path {
		scale: calc(15 * var(--stage-text)) calc(11 * var(--stage-text));
		vector-effect: non-scaling-stroke;
		stroke: var(--edge);
		stroke-width: 2;
	}
	text {
		font-size: calc(14px * var(--stage-text));
		font-weight: 600;
	}
</style>
