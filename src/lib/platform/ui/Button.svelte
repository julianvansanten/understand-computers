<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	let {
		primary = false,
		children,
		...rest
	}: { primary?: boolean; children: Snippet } & HTMLButtonAttributes = $props();
</script>

<button type="button" class:primary {...rest}>{@render children()}</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-2);
		min-width: var(--target);
		min-height: var(--target);
		padding: 0 var(--space-3);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--paper);
		color: var(--ink);
		cursor: pointer;
	}
	button:hover:not(:disabled) {
		border-color: var(--pen);
	}
	button:disabled {
		opacity: 0.45;
		cursor: default;
	}
	.primary {
		border-color: var(--pen);
		background: var(--main);
		color: var(--on-main);
	}
</style>
