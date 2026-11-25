<script lang="ts">
	import type { StateName } from '../visualization.ts';
	let { x, y, label, state }: { x: number; y: number; label: string; state: StateName } = $props();
</script>

<g transform="translate({x} {y})" style="--fill: var(--{state}); --edge: var(--{state}-edge)">
	<rect x="-15" y="-11" width="30" height="22" rx="3" />
	{#if state === 'failed'}<path d="M-15 -11L15 11M15 -11L-15 11" />{/if}
	<text style="fill: var(--{state}-text)">{label}</text>
</g>

<style>
	rect {
		fill: var(--fill);
		stroke: var(--edge);
		stroke-width: 2;
	}
	path {
		stroke: var(--edge);
		stroke-width: 2;
	}
	text {
		font-size: 14px;
		font-weight: 600;
	}
</style>
