<script lang="ts">
	import '#lib/platform/design/school-theme.css';
	import '#lib/platform/design/tokens.css';
	import '#lib/platform/design/base.css';
	import type { Snippet } from 'svelte';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import ThemeToggle from '#lib/platform/ui/ThemeToggle.svelte';
	import { currentLocale, href, link, t } from '#lib/platform/i18n/context.ts';
	import { localeNames, locales } from '#lib/platform/i18n/locales.ts';

	let { children }: { children: Snippet } = $props();

	// The root layout's params are typed without those of the pages below it.
	const params = $derived(page.params as Record<string, string | undefined>);
	// Path below the locale, so the language links keep the student on the same page.
	const path = $derived(
		[
			...(page.route.id
				?.split('/')
				.filter((part) => part && !/^[[(]/.test(part))
				.slice(0, 1) ?? []),
			params.subject,
			params.visualization
		]
			.filter(Boolean)
			.join('/')
	);
	// The query is unknown while prerendering; it is added once in the browser.
	let query = $state('');
	// Also runs for shallow navigation, which does not change page.url.
	afterNavigate(({ to }) => {
		query = to?.url.search ?? '';
	});
	$effect(() => {
		document.documentElement.lang = currentLocale();
	});
</script>

<svelte:head>
	{#each locales as locale (locale)}
		<link rel="alternate" hreflang={locale} href={href(locale, path)} />
	{/each}
</svelte:head>

<a class="skip" href="#content">{t('site.skip')}</a>
<header>
	<nav aria-label={t('nav.main')}>
		<a class="brand" href={link()}>{t('site.name')}</a>
		<a href={link('subjects')} aria-current={path.startsWith('subjects') ? 'true' : undefined}>
			{t('nav.subjects')}
		</a>
		<a href={link('about')} aria-current={path === 'about' ? 'page' : undefined}>
			{t('nav.about')}
		</a>
	</nav>
	<div class="tools">
		<nav class="languages" aria-label={t('nav.language')}>
			{#each locales as locale (locale)}
				<a
					href={href(locale, path) + query}
					hreflang={locale}
					lang={locale}
					data-sveltekit-noscroll
					aria-current={locale === currentLocale() ? 'true' : undefined}
				>
					{locale.toUpperCase()}<span class="visually-hidden">&nbsp;{localeNames[locale]}</span>
				</a>
			{/each}
		</nav>
		<ThemeToggle />
	</div>
</header>
<main id="content" tabindex="-1">{@render children()}</main>

<style>
	header {
		display: flex;
		flex-wrap: wrap;
		justify-content: space-between;
		align-items: center;
		gap: var(--space-2) var(--space-6);
		padding: var(--space-2) var(--space-6);
		background: var(--header);
		color: var(--on-header);
		border-bottom: 1.5px solid var(--line);
	}
	nav,
	.tools {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: var(--space-2) var(--space-6);
	}
	nav a {
		display: inline-flex;
		align-items: center;
		min-height: var(--target);
		color: inherit;
		text-decoration: none;
	}
	header :global(:focus-visible) {
		outline-color: var(--on-header);
	}
	nav a:hover {
		text-decoration: underline;
	}
	nav a[aria-current] {
		text-decoration: underline;
		text-decoration-thickness: 3px;
	}
	.brand {
		font-size: var(--text-l);
		font-weight: 700;
	}
	.languages {
		gap: var(--space-2);
	}
	.languages a {
		min-width: var(--target);
		justify-content: center;
	}
	.skip {
		position: absolute;
		left: var(--space-4);
		top: -10rem;
		z-index: 1;
		padding: var(--space-3);
		background: var(--paper);
	}
	.skip:focus {
		top: var(--space-2);
	}
	main {
		max-width: var(--page);
		margin: 0 auto;
		padding: var(--space-6);
	}
	main:focus {
		outline: none;
	}
	:global([data-present]) header {
		display: none;
	}
	:global([data-present]) main {
		max-width: none;
		padding: var(--space-3);
	}
	@media (max-width: 40rem) {
		header,
		main {
			padding-inline: var(--space-4);
		}
	}
</style>
