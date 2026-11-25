<script lang="ts">
	import { link, t } from '../i18n/context.ts';
	/** Ancestors only; the page's own heading says where you are. */
	let { items }: { items: { title: string; path: string }[] } = $props();
</script>

<nav aria-label={t('nav.breadcrumb')}>
	<ol>
		{#each items as item (item.path)}
			<li><a href={link(item.path)}>{item.title}</a></li>
		{/each}
	</ol>
</nav>

<style>
	ol {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-2);
		margin: 0 0 var(--space-2);
		padding: 0;
		list-style: none;
		font-size: var(--text-s);
	}
	li + li::before {
		content: '›';
		margin-right: var(--space-2);
		color: var(--ink-soft);
	}
</style>
