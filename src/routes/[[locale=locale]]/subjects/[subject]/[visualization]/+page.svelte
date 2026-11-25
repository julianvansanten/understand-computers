<script lang="ts">
	import Breadcrumb from '#lib/platform/ui/Breadcrumb.svelte';
	import VisualizationShell from '#lib/platform/shell/VisualizationShell.svelte';
	import { currentLocale, t } from '#lib/platform/i18n/context.ts';
	let { data } = $props();
	const locale = $derived(currentLocale());
</script>

<svelte:head>
	<title>{data.meta.text[locale].title}</title>
	<meta name="description" content={data.meta.text[locale].description} />
</svelte:head>

<div class="crumbs">
	<Breadcrumb
		items={[
			{ title: t('nav.subjects'), path: 'subjects' },
			{ title: data.subject.text[locale].title, path: `subjects/${data.subject.id}` }
		]}
	/>
</div>
<!-- Not keyed on language: switching it keeps the run going. -->
{#key `${data.subject.id}/${data.meta.id}`}
	<VisualizationShell visualization={data.visualization} meta={data.meta} />
{/key}

<style>
	:global([data-present]) .crumbs {
		display: none;
	}
</style>
