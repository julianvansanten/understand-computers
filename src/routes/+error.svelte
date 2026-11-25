<script lang="ts">
	import { page } from '$app/state';
	import { link, t } from '#lib/platform/i18n/context.ts';
	const missing = $derived(page.status === 404);
</script>

<svelte:head><title>{missing ? t('error.notFound') : t('error.other')}</title></svelte:head>

<h1>{missing ? t('error.notFound') : t('error.other')}</h1>
<p>{missing ? t('error.notFoundHelp') : t('error.otherHelp')}</p>
<p><a href={link('subjects')}>{t('home.cta')}</a></p>
