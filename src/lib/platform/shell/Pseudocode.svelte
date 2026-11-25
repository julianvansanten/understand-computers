<script lang="ts">
	import type { CodeLine } from '../visualization.ts';
	let { lines, current }: { lines: CodeLine[]; current: string | undefined } = $props();
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (scrolls sideways, so must be reachable by keyboard) -->
<ol tabindex="0">
	{#each lines as line (line.id)}
		<li aria-current={line.id === current ? 'step' : undefined}><code>{line.text}</code></li>
	{/each}
</ol>

<style>
	ol {
		margin: 0;
		padding: 0;
		overflow-x: auto;
		list-style: none;
		font-size: var(--text-s);
	}
	li {
		width: max-content;
		min-width: 100%;
		padding: 0.1rem var(--space-2);
		border-left: 4px solid transparent;
	}
	li[aria-current] {
		border-color: var(--active-edge);
		background: var(--active);
		color: var(--active-text);
	}
	code {
		font-family: var(--font-code);
		white-space: pre;
	}
</style>
