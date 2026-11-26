<script lang="ts">
	import Breadcrumb from '#lib/platform/ui/Breadcrumb.svelte';
	import { currentLocale, link, t } from '#lib/platform/i18n/context.ts';
	let { data } = $props();
	const subject = $derived(data.subject);
	const text = $derived(subject.text[currentLocale()]);
</script>

<svelte:head><title>{text.title}</title></svelte:head>

<Breadcrumb items={[{ title: t('nav.subjects'), path: 'subjects' }]} />
<h1>{text.title}</h1>
<p>{text.description}</p>

<!-- Explicit roles keep the table a table when small screens change its display. -->
<!-- svelte-ignore a11y_no_redundant_roles -->
<table role="table">
	<caption class="visually-hidden">{t('subject.visualizations', { subject: text.title })}</caption>
	<thead role="rowgroup">
		<tr role="row">
			<th role="columnheader" scope="col">{t('table.name')}</th>
			<th role="columnheader" scope="col">{t('table.concepts')}</th>
			<th role="columnheader" scope="col">{t('table.level')}</th>
			<th role="columnheader" scope="col">{t('table.duration')}</th>
		</tr>
	</thead>
	<tbody role="rowgroup">
		{#each subject.visualizations as item (item.id)}
			{@const itemText = item.text[currentLocale()]}
			<tr role="row">
				<th role="rowheader" scope="row">
					<a href={link(`subjects/${subject.id}/${item.id}`)}>{itemText.title}</a>
					<p>{itemText.description}</p>
				</th>
				<td role="cell" data-label={t('table.concepts')}>{itemText.concepts.join(', ')}</td>
				<td role="cell" data-label={t('table.level')}>{t(`level.${item.level}`)}</td>
				<td role="cell" data-label={t('table.duration')}>
					{t('duration.minutes', { count: item.minutes })}
				</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	table {
		width: 100%;
		margin-top: var(--space-6);
		border-collapse: collapse;
		background: var(--paper);
		border: 1.5px solid var(--line);
	}
	th,
	td {
		padding: var(--space-4);
		text-align: left;
		vertical-align: top;
	}
	thead th {
		padding-block: var(--space-2);
		color: var(--ink-soft);
		font-size: var(--text-s);
	}
	tbody tr {
		border-top: 1.5px solid var(--line);
	}
	tbody tr:hover {
		background: var(--desk);
	}
	tbody th {
		width: 45%;
		font-weight: 400;
	}
	tbody a {
		font-size: var(--text-l);
		font-weight: 600;
	}
	td:nth-last-child(-n + 2) {
		white-space: nowrap;
	}
	@media (max-width: 45rem) {
		/* Hidden but still read aloud. Clipping alone keeps its width, which can widen the page. */
		thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
		}
		tbody tr,
		tbody th,
		td {
			display: block;
			width: auto;
		}
		td {
			padding-top: 0;
		}
		td::before {
			content: attr(data-label) ': ';
			color: var(--ink-soft);
		}
	}
</style>
