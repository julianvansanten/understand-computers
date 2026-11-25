<script lang="ts">
	import Preview from '#lib/platform/shell/Preview.svelte';
	import { link, t } from '#lib/platform/i18n/context.ts';
	let { data } = $props();
</script>

<svelte:head>
	<title>{t('site.name')}</title>
	<meta name="description" content={t('home.intro')} />
</svelte:head>

<div class="hero">
	<div class="words">
		<h1>{t('home.title')}</h1>
		<p>{t('home.intro')}</p>
		<a class="cta" href={link('subjects')}>{t('home.cta')}</a>
	</div>
	{#if data.demo}
		<section aria-labelledby="demo">
			<h2 id="demo">{t('home.demo')}</h2>
			<Preview visualization={data.demo} values={{ algorithm: 'insertion', size: 12 }} />
			<a href={link('subjects/algorithms/sorting')}>{t('home.demoLink')}</a>
		</section>
	{/if}
</div>

<style>
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
		gap: var(--space-12);
		align-items: center;
		padding-block: var(--space-12);
	}
	.words {
		display: grid;
		gap: var(--space-6);
		justify-items: start;
	}
	h1 {
		font-size: var(--text-xxl);
		line-height: 1.02;
		letter-spacing: -0.02em;
	}
	.words p {
		max-width: 38ch;
		font-size: var(--text-l);
	}
	.cta {
		padding: var(--space-3) var(--space-6);
		border-radius: var(--radius);
		background: var(--pen);
		color: var(--on-pen);
		font-size: var(--text-l);
		text-decoration: none;
	}
	section {
		display: grid;
		gap: var(--space-3);
	}
	h2 {
		font-size: var(--text-m);
	}
	@media (max-width: 60rem) {
		.hero {
			grid-template-columns: minmax(0, 1fr);
			gap: var(--space-8);
			padding-block: var(--space-6);
		}
	}
</style>
