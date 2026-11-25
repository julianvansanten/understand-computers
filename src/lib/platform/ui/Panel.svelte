<script lang="ts">
	import type { Snippet } from 'svelte';
	let { title, children }: { title: string; children: Snippet } = $props();
	const id = $props.id();
</script>

<section aria-labelledby={id}>
	<h2 {id}>{title}</h2>
	{@render children()}
</section>

<style>
	section {
		padding: var(--space-4);
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-radius: var(--radius);
	}
	h2 {
		margin-bottom: var(--space-3);
		font-size: var(--text-m);
	}
</style>
