<script lang="ts">
	import type { Snippet } from 'svelte';
	let {
		width = 960,
		height = 440,
		label,
		children
	}: { width?: number; height?: number; label: string; children: Snippet } = $props();
	const id = $props.id();
</script>

<!-- role="group": drawings may contain focusable parts. -->
<svg viewBox="0 0 {width} {height}" role="group" aria-label={label}>
	<defs>
		<pattern id="grid-{id}" width="20" height="20" patternUnits="userSpaceOnUse">
			<path d="M20 0H0V20" />
		</pattern>
	</defs>
	<!-- Wider than the drawing: the paper also fills the space beside it. -->
	<rect
		x={-2 * width}
		y={-2 * height}
		width={5 * width}
		height={5 * height}
		fill="url(#grid-{id})"
	/>
	<path class="margin" d="M40 {-2 * height}V{3 * height}" />
	{@render children()}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		max-height: var(--stage-height, 62dvh);
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-radius: var(--radius);
		font-family: var(--font);
		touch-action: manipulation;
		/* Every text in a drawing is its base size times this. */
		--stage-text: 1.15;
	}
	/* On a phone the drawing is shown at about a third of its size; its text must grow more. */
	@media (max-width: 40rem) {
		svg {
			--stage-text: 1.5;
			border-inline: 0;
			border-radius: 0;
		}
	}
	pattern path {
		fill: none;
		stroke: var(--grid);
	}
	.margin {
		stroke: var(--margin-line);
		stroke-width: 1.5;
	}
	svg :global(text) {
		fill: var(--ink);
		text-anchor: middle;
		dominant-baseline: central;
	}
</style>
