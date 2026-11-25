<script lang="ts" module>
	export const icons = {
		play: 'M7 4v16l13-8z',
		pause: 'M7 4h3v16H7zM14 4h3v16h-3z',
		back: 'M15 5l-8 7 8 7',
		forward: 'M9 5l8 7-8 7',
		start: 'M6 5v14M18 5l-9 7 9 7',
		reset: 'M4 12a8 8 0 1 0 3-6.2M4 4v5h5'
	};
</script>

<script lang="ts">
	let { path, filled = false }: { path: string; filled?: boolean } = $props();
</script>

<svg viewBox="0 0 24 24" aria-hidden="true" class:filled><path d={path} /></svg>

<style>
	svg {
		width: 1.4em;
		height: 1.4em;
		flex: none;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.filled {
		fill: currentColor;
	}
</style>
