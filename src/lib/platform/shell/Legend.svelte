<script lang="ts">
	import StateGlyph from '../primitives/StateGlyph.svelte';
	import type { StateName } from '../visualization.ts';
	import type { Translate } from '../i18n/translate.ts';
	let { states, translate }: { states: StateName[]; translate: Translate } = $props();
</script>

<ul>
	{#each states as state (state)}
		<li>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				<rect
					x="2"
					y="2"
					width="20"
					height="20"
					rx="2"
					style="fill: var(--{state}); stroke: var(--{state}-edge)"
				/>
				<StateGlyph {state} x={12} y={12} size={1.3} />
			</svg>
			{translate(`legend.${state}`)}
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		gap: var(--space-1);
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: var(--text-s);
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
	svg {
		width: 1.5rem;
		height: 1.5rem;
		flex: none;
	}
</style>
