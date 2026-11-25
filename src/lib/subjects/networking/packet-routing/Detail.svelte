<script lang="ts">
	import type { StageProps } from '#lib/platform/visualization.ts';
	import type { RoutingState, ToggleLink } from './model.ts';
	import type { RoutingValues } from './parameters.ts';

	let { frame, t, selection, select }: StageProps<RoutingState, RoutingValues, ToggleLink> =
		$props();
	const ids = $derived(frame.state.topology.nodes.map((node) => node.id));
	// The selected node may not exist in a newly chosen topology.
	const node = $derived(selection && ids.includes(selection) ? selection : 'R1');
	const id = $props.id();
</script>

<label for="{id}-node">{t('detail.table')}</label>
<select id="{id}-node" value={node} onchange={(event) => select(event.currentTarget.value)}>
	{#each ids as option (option)}<option value={option}>{option}</option>{/each}
</select>
<table>
	<thead>
		<tr>
			<th scope="col">{t('detail.destination')}</th>
			<th scope="col">{t('detail.next')}</th>
			<th scope="col">{t('detail.cost')}</th>
		</tr>
	</thead>
	<tbody>
		{#each ids.filter((other) => other !== node) as destination (destination)}
			{@const route = frame.state.tables[node]![destination]!}
			<tr>
				<th scope="row">{destination}</th>
				<td>{route.next ?? t('detail.none')}</td>
				<td>{route.next ? route.cost : '∞'}</td>
			</tr>
		{/each}
	</tbody>
</table>

<style>
	label {
		font-size: var(--text-s);
	}
	select {
		width: 100%;
		min-height: var(--target);
		margin-bottom: var(--space-2);
		padding: 0 var(--space-2);
		border: 1.5px solid var(--line-strong);
		border-radius: var(--radius);
		background: var(--paper);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--text-s);
		font-variant-numeric: tabular-nums;
	}
	th,
	td {
		padding: 0 var(--space-2);
		border-bottom: 1px solid var(--line);
		text-align: left;
	}
</style>
