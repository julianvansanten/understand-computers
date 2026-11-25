<script lang="ts">
	import { t } from '#lib/platform/i18n/context.ts';
</script>

<svelte:head><title>{t('about.title')}</title></svelte:head>

<article>
	<h1>{t('about.title')}</h1>
	<p>{t('about.purpose')}</p>
	<h2>{t('about.shareTitle')}</h2>
	<p>{t('about.share')}</p>
	<h2>{t('about.privacyTitle')}</h2>
	<p>{t('about.privacy')}</p>
	<h2>{t('about.licenseTitle')}</h2>
	<p>{t('about.license')}</p>
	<p>
		<a href="https://www.gnu.org/licenses/agpl-3.0.html" hreflang="en">{t('about.licenseLink')}</a>
	</p>
</article>

<style>
	article {
		display: grid;
		gap: var(--space-3);
		max-width: 65ch;
	}
	h2 {
		margin-top: var(--space-4);
	}
</style>
