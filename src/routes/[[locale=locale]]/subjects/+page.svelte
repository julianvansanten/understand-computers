<script lang="ts">
	import Icon from '#lib/platform/ui/Icon.svelte';
	import { subjects } from '#lib/platform/registry.ts';
	import { currentLocale, link, t } from '#lib/platform/i18n/context.ts';
</script>

<svelte:head><title>{t('subjects.title')}</title></svelte:head>

<h1>{t('subjects.title')}</h1>
<p>{t('subjects.intro')}</p>

<ul>
	{#each subjects as subject (subject.id)}
		{@const text = subject.text[currentLocale()]}
		{@const count = subject.visualizations.length}
		<li style="--accent: var(--accent-{subject.accent})">
			<span class="icon"><Icon path={subject.icon} /></span>
			<h2><a href={link(`subjects/${subject.id}`)}>{text.title}</a></h2>
			<p>{text.description}</p>
			<p class="count">
				{count === 1 ? t('subjects.count.one') : t('subjects.count.other', { count })}
			</p>
		</li>
	{/each}
</ul>

<style>
	ul {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
		gap: var(--space-4);
		margin: var(--space-6) 0 0;
		padding: 0;
		list-style: none;
	}
	li {
		position: relative;
		display: grid;
		grid-template-rows: auto auto 1fr auto;
		gap: var(--space-2);
		padding: var(--space-6);
		background: var(--paper);
		border: 1.5px solid var(--line);
		border-left: 6px solid var(--accent);
		border-radius: var(--radius);
	}
	li:hover {
		border-color: var(--accent);
	}
	.icon {
		color: var(--accent);
		font-size: 2rem;
		line-height: 1;
	}
	h2 a {
		color: inherit;
	}
	/* The whole card is clickable, with one link for keyboard and screen reader. */
	h2 a::after {
		content: '';
		position: absolute;
		inset: 0;
	}
	.count {
		color: var(--ink-soft);
		font-size: var(--text-s);
	}
</style>
